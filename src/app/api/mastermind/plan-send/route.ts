/**
 * POST /api/mastermind/plan-send
 *
 * Sends (or resends) a patient's plan link via email.
 * If no share token exists yet, generates one first.
 *
 * Body: { sessionId: string }
 * Returns: { success: true, shareUrl: string, sentTo: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getSessionByIdAsync, saveSessionAsync, sessionReducer } from '@/lib/mastermind/session';
import { unauthorized } from '@/lib/auth/middleware';
import { resolveToken } from '../share/route';
import crypto from 'crypto';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const authSession = await getSessionFromRequest(request).catch(() => null);
    if (!authSession && process.env.NODE_ENV !== 'development') {
      return unauthorized();
    }

    const staffName = authSession?.name || 'Staff';

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
    }

    const { sessionId } = body as { sessionId?: string };
    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ success: false, error: 'sessionId required' }, { status: 400 });
    }

    const session = await getSessionByIdAsync(sessionId);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    const email = session.patientEmail || (session.intakeData?.email as string) || '';
    if (!email) {
      return NextResponse.json({ success: false, error: 'No patient email on file' }, { status: 422 });
    }

    // Ensure share token exists (reuse if valid, generate if not)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ranibeautyclinic.com';
    let shareUrl: string;

    if (session.shareToken) {
      const existing = await resolveToken(session.shareToken);
      if (existing) {
        shareUrl = `${siteUrl}/my-plan/${session.shareToken}`;
      } else {
        // Token expired — generate new one
        const newToken = crypto.randomBytes(32).toString('hex');
        const now = new Date();
        const expiresAt = new Date(now.getTime() + SEVEN_DAYS_MS);

        // Persist token via Airtable (same as share/route.ts)
        const { saveTokenToAirtable } = await importTokenPersistence();
        await saveTokenToAirtable({
          token: newToken,
          sessionId,
          createdAt: now.toISOString(),
          expiresAt: expiresAt.toISOString(),
        });

        const updated = sessionReducer(session, { type: 'SET_SHARE_TOKEN', token: newToken, actor: staffName });
        await saveSessionAsync(updated);
        shareUrl = `${siteUrl}/my-plan/${newToken}`;
      }
    } else {
      // No token yet — session must be plan_ready or later
      const shareablePhases = ['plan_ready', 'provider_review', 'approved', 'simulating', 'simulation_ready', 'presenting', 'completed'];
      if (!shareablePhases.includes(session.phase)) {
        return NextResponse.json({
          success: false,
          error: `Session is in "${session.phase}" phase. A plan must be generated before sending.`,
        }, { status: 422 });
      }

      const newToken = crypto.randomBytes(32).toString('hex');
      const now = new Date();
      const expiresAt = new Date(now.getTime() + SEVEN_DAYS_MS);

      const { saveTokenToAirtable } = await importTokenPersistence();
      await saveTokenToAirtable({
        token: newToken,
        sessionId,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      });

      const updated = sessionReducer(session, { type: 'SET_SHARE_TOKEN', token: newToken, actor: staffName });
      await saveSessionAsync(updated);
      shareUrl = `${siteUrl}/my-plan/${newToken}`;
    }

    // Send email via Resend
    const firstName = (session.patientName || 'there').split(' ')[0];

    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: 'Rani Beauty Clinic <noreply@ranibeautyclinic.com>',
        to: email,
        subject: `${firstName}, Your Personalized Treatment Plan is Ready`,
        html: buildPlanEmailHtml(firstName, shareUrl),
      });
    } catch (emailErr) {
      console.error('[Share Send] Email send failed:', emailErr);
      return NextResponse.json({ success: false, error: 'Email delivery failed' }, { status: 502 });
    }

    // Log the send action on the session
    const latestSession = await getSessionByIdAsync(sessionId);
    if (latestSession) {
      const withLog = sessionReducer(latestSession, {
        type: 'SET_CLINIC_NOTES',
        notes: [latestSession.clinicNotes, `Plan sent to ${email} by ${staffName} on ${new Date().toLocaleDateString()}`].filter(Boolean).join('\n'),
        actor: staffName,
      });
      await saveSessionAsync(withLog);
    }

    return NextResponse.json({ success: true, shareUrl, sentTo: email });
  } catch (err) {
    console.error('[Share Send] Error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// ── Token persistence import (avoid circular deps) ──

async function importTokenPersistence() {
  const AIRTABLE_BASE = 'app1SwhSfwe8GKUg4';
  const TABLE_NAME = 'Automation%20Log';
  const SHARE_WORKFLOW_KEY = 'mastermind_share_token';

  const pat = process.env.AIRTABLE_PAT;
  if (!pat) throw new Error('AIRTABLE_PAT not configured');

  return {
    saveTokenToAirtable: async (record: { token: string; sessionId: string; createdAt: string; expiresAt: string }) => {
      await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/${TABLE_NAME}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${pat}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          typecast: true,
          records: [{
            fields: {
              Workflow: SHARE_WORKFLOW_KEY,
              Action: record.token,
              Status: 'active',
              Details: JSON.stringify(record),
              Timestamp: record.createdAt,
            },
          }],
        }),
        signal: AbortSignal.timeout(8000),
      });
    },
  };
}

// ── Branded email HTML ──

function buildPlanEmailHtml(firstName: string, planUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background-color:#F8F6F1;font-family:'Montserrat',Arial,sans-serif;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#F8F6F1;">
<tr><td align="center" style="padding:40px 20px;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<tr><td style="background-color:#0F1D2C;padding:40px 40px 30px;text-align:center;">
  <h1 style="margin:0;font-family:'Playfair Display',Georgia,serif;font-size:28px;color:#C9A96E;letter-spacing:1px;">RANI BEAUTY CLINIC</h1>
  <p style="margin:8px 0 0;font-size:12px;color:#8899AA;letter-spacing:2px;text-transform:uppercase;">Medical Aesthetics & Wellness</p>
</td></tr>
<tr><td style="padding:40px;">
  <h2 style="margin:0 0 16px;font-family:'Playfair Display',Georgia,serif;font-size:22px;color:#0F1D2C;">${firstName}, Your Personalized Treatment Plan is Ready</h2>
  <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4A5568;">We've crafted a customized treatment plan based on your unique skin profile and goals. Our expert team has carefully selected treatments designed to deliver the best possible results for you.</p>
  <p style="margin:0 0 32px;font-size:15px;line-height:1.6;color:#4A5568;">Click below to view your plan, including recommended treatments, timeline, and investment details.</p>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"><tr><td align="center">
    <a href="${planUrl}" target="_blank" style="display:inline-block;padding:16px 48px;background-color:#C9A96E;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;letter-spacing:1px;border-radius:8px;text-transform:uppercase;">View My Treatment Plan</a>
  </td></tr></table>
  <p style="margin:32px 0 0;font-size:13px;line-height:1.5;color:#8899AA;text-align:center;">This link is personalized for you and expires in 7 days. If you have questions, we're here to help.</p>
</td></tr>
<tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #E2E8F0;margin:0;"/></td></tr>
<tr><td style="padding:30px 40px;text-align:center;">
  <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#0F1D2C;">Rani Beauty Clinic</p>
  <p style="margin:0 0 4px;font-size:13px;color:#8899AA;">401 Olympia Ave NE, Suite 101, Renton, WA 98056</p>
  <p style="margin:0 0 4px;font-size:13px;color:#8899AA;">(425) 539-4440 &nbsp;|&nbsp; info@ranibeautyclinic.com</p>
  <p style="margin:16px 0 0;font-size:12px;color:#A0AEC0;">&copy; ${new Date().getFullYear()} Rani Beauty Clinic. All rights reserved.</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}
