/**
 * POST /api/mastermind/follow-up
 *
 * Sends a templated follow-up message for a consultation.
 * Supports email templates from the follow-up library.
 * Logs all sends to the session activity timeline and Messages Log.
 *
 * Body: { sessionId: string, templateId: string, channel?: 'email' | 'sms' }
 * Returns: { success: true, sentTo: string, templateId: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getSessionByIdAsync, saveSessionAsync, sessionReducer } from '@/lib/mastermind/session';
import { unauthorized } from '@/lib/auth/middleware';
import { FOLLOW_UP_TEMPLATES, renderTemplate } from '@/lib/plan-builder/follow-up-templates';
import { resolveToken, saveTokenToAirtable } from '@/lib/mastermind/share-token';
import crypto from 'crypto';
import { z } from 'zod';

import { withSentry } from '@/lib/sentry-utils';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const CLINIC_PHONE = '(425) 539-4440';
const FollowUpBodySchema = z.object({
  sessionId: z.string().min(1),
  templateId: z.string().min(1),
  channel: z.enum(['email', 'sms', 'internal']).optional(),
});

export async function POST(request: NextRequest) {
  return withSentry('mastermind/follow-up', async () => {
    try {
      // Auth check — staff session required (Wave 11 P0: removed NODE_ENV dev bypass)
      const authSession = await getSessionFromRequest(request).catch(() => null);
      if (!authSession) {
        return unauthorized();
      }

      const staffName = authSession?.name || 'Staff';

      const parsed = FollowUpBodySchema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) {
        return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
      }

      const { sessionId, templateId, channel } = parsed.data;

      const template = FOLLOW_UP_TEMPLATES[templateId];
      if (!template) {
        return NextResponse.json(
          {
            success: false,
            error: `Unknown template: ${templateId}`,
            available: Object.keys(FOLLOW_UP_TEMPLATES),
          },
          { status: 400 },
        );
      }

      const session = await getSessionByIdAsync(sessionId);
      if (!session) {
        return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
      }

      const email = session.patientEmail || (session.intakeData?.email as string) || '';
      const phone = (session.intakeData?.phone as string) || '';
      const firstName = (session.patientName || 'there').split(' ')[0];

      // Determine send channel
      const sendChannel = channel || template.channel;
      if (sendChannel === 'email' && !email) {
        return NextResponse.json(
          { success: false, error: 'No patient email on file' },
          { status: 422 },
        );
      }
      if (sendChannel === 'sms' && !phone) {
        return NextResponse.json(
          { success: false, error: 'No patient phone on file' },
          { status: 422 },
        );
      }

      // Ensure share URL exists for plan-related templates
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ranibeautyclinic.com';
      let planUrl = '';

      if (session.shareToken) {
        const existing = await resolveToken(session.shareToken);
        if (existing) {
          planUrl = `${siteUrl}/my-plan/${session.shareToken}`;
        }
      }

      if (!planUrl && session.mastermindPlan) {
        // Generate a share token if plan exists but no valid token
        const newToken = crypto.randomBytes(32).toString('hex');
        const now = new Date();
        const expiresAt = new Date(now.getTime() + SEVEN_DAYS_MS);

        await saveTokenToAirtable({
          token: newToken,
          sessionId,
          createdAt: now.toISOString(),
          expiresAt: expiresAt.toISOString(),
        });

        const updated = sessionReducer(session, {
          type: 'SET_SHARE_TOKEN',
          token: newToken,
          actor: staffName,
        });
        await saveSessionAsync(updated);
        planUrl = `${siteUrl}/my-plan/${newToken}`;
      }

      // Render template
      const rendered = renderTemplate(templateId, {
        clientName: firstName,
        planUrl: planUrl || `${siteUrl}/contact`,
        clinicPhone: CLINIC_PHONE,
        viewCount: '0',
        lastViewedAt: 'N/A',
      });

      if (!rendered) {
        return NextResponse.json(
          { success: false, error: 'Template render failed' },
          { status: 500 },
        );
      }

      // Send via appropriate channel
      let sentTo = '';

      if (sendChannel === 'email' || sendChannel === 'internal') {
        try {
          const { Resend } = await import('resend');
          const resend = new Resend(process.env.RESEND_API_KEY);

          const recipient = sendChannel === 'internal' ? 'info@ranibeautyclinic.com' : email;
          await resend.emails.send({
            from: 'Rani Beauty Clinic <noreply@ranibeautyclinic.com>',
            to: recipient,
            subject: rendered.subject || `Update from Rani Beauty Clinic`,
            html: rendered.body,
          });
          sentTo = recipient;
        } catch (emailErr) {
          console.error('[Follow-Up] Email send failed:', emailErr);
          return NextResponse.json(
            { success: false, error: 'Email delivery failed' },
            { status: 502 },
          );
        }
      } else if (sendChannel === 'sms') {
        // Route SMS through n8n webhook
        const smsWebhookUrl = process.env.N8N_WEBHOOK_URL;
        if (smsWebhookUrl) {
          try {
            await fetch(`${smsWebhookUrl}/webhook/plan-followup-sms`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                phone,
                message: rendered.body,
                planId: sessionId,
                clientName: firstName,
                templateId,
              }),
              signal: AbortSignal.timeout(8000),
            });
            sentTo = phone;
          } catch (smsErr) {
            console.error('[Follow-Up] SMS send failed:', smsErr);
            return NextResponse.json(
              { success: false, error: 'SMS delivery failed' },
              { status: 502 },
            );
          }
        } else {
          return NextResponse.json(
            { success: false, error: 'SMS not configured' },
            { status: 501 },
          );
        }
      }

      // Log to activity timeline via direct activity log append
      const latestSession = await getSessionByIdAsync(sessionId);
      if (latestSession) {
        const channelLabel = sendChannel === 'sms' ? 'SMS' : 'email';
        const logDetail = `${template.name} sent via ${channelLabel} to ${sentTo}`;

        // Append to activity log directly and update notes
        const updatedLog = [
          ...(latestSession.activityLog || []),
          {
            timestamp: new Date().toISOString(),
            action: 'follow_up_sent',
            detail: logDetail,
            actor: staffName,
          },
        ];

        const updatedSession = {
          ...latestSession,
          updatedAt: new Date().toISOString(),
          activityLog: updatedLog,
          clinicNotes: [
            latestSession.clinicNotes,
            `[${new Date().toLocaleDateString()}] ${logDetail} by ${staffName}`,
          ]
            .filter(Boolean)
            .join('\n'),
        };
        await saveSessionAsync(updatedSession);
      }

      // Log to Messages Log table for audit trail
      try {
        const { createRecord } = await import('@/lib/airtable/client');
        const { Tables } = await import('@/lib/airtable/client');
        await createRecord(Tables.messagesLog(), {
          Type: sendChannel === 'sms' ? 'SMS' : 'Email',
          Direction: 'Outbound',
          Subject: `Follow-up: ${template.name}`,
          Body: `Template ${templateId} sent to ${sentTo} for session ${sessionId}`,
          Recipient: sentTo,
          'Sent At': new Date().toISOString(),
          Status: 'Sent',
        });
      } catch (logErr) {
        console.warn('[Follow-Up] Messages Log write failed:', logErr);
      }

      return NextResponse.json({
        success: true,
        sentTo,
        templateId,
        templateName: template.name,
        channel: sendChannel,
      });
    } catch (err) {
      console.error('[Follow-Up] Error:', err);
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  });
}

// ── Available templates endpoint (GET) ──

export async function GET(request: NextRequest) {
  return withSentry('mastermind/follow-up', async () => {
    // Auth check — staff session required (Wave 11 P0: removed NODE_ENV dev bypass)
    const authSession = await getSessionFromRequest(request).catch(() => null);
    if (!authSession) {
      return unauthorized();
    }

    const templates = Object.entries(FOLLOW_UP_TEMPLATES).map(([id, t]) => ({
      id,
      name: t.name,
      channel: t.channel,
      tone: t.tone,
      hasSubject: !!t.subject,
    }));

    return NextResponse.json({ success: true, templates });
  });
}
