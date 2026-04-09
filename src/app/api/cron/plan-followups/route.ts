import { NextRequest, NextResponse } from 'next/server';
import { Tables, fetchAll, updateRecord, createRecord } from '@/lib/airtable/client';
import { FIELDS } from '@/lib/airtable/tables';
import { renderTemplate } from '@/lib/plan-builder/follow-up-templates';
import type { PlanStatus } from '@/lib/plan-builder/plan-status';
import { Resend } from 'resend';

// ─── Constants ───────────────────────────────────────────────────────
const CLINIC_PHONE = '(425) 539-4440';
const RINA_EMAIL = 'info@ranibeautyclinic.com';

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL || 'https://ranibeautyclinic.com';
}

// ─── Types ───────────────────────────────────────────────────────────
interface TreatmentPlanRecord {
  [key: string]: unknown;
  'Status'?: string;
  'Client Name'?: string;
  'Client Email'?: string;
  'Client Phone'?: string;
  'Plan URL'?: string;
  'Sent At'?: string;
  'Last Viewed At'?: string;
  'View Count'?: number;
  'Follow-Ups Sent'?: string;
  'Financing Clicked At'?: string;
  'Intake Record ID'?: string;
}

interface SentFollowUp {
  templateId: string;
  sentAt: string;
  channel: string;
}

interface FollowUpAction {
  planId: string;
  planFields: TreatmentPlanRecord;
  templateId: string;
  channel: 'email' | 'sms' | 'internal';
  newStatus?: PlanStatus;
  reason: string;
}

// ─── Follow-Up Rule Evaluation ───────────────────────────────────────

function hoursAgo(isoDate: string | undefined): number {
  if (!isoDate) return Infinity;
  const then = new Date(isoDate).getTime();
  const now = Date.now();
  return (now - then) / (1000 * 60 * 60);
}

function daysAgo(isoDate: string | undefined): number {
  return hoursAgo(isoDate) / 24;
}

function parseSentFollowUps(raw: string | undefined): SentFollowUp[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SentFollowUp[];
  } catch {
    return [];
  }
}

function hasAlreadySent(sent: SentFollowUp[], templateId: string): boolean {
  return sent.some((s) => s.templateId === templateId);
}

/**
 * Evaluate all follow-up rules against a single plan and return
 * the actions that should fire (at most one per plan per cron run).
 */
function evaluateFollowUpRules(
  planId: string,
  fields: TreatmentPlanRecord
): FollowUpAction | null {
  const status = (fields['Status'] || 'Sent') as PlanStatus;
  const sent = parseSentFollowUps(fields['Follow-Ups Sent']);
  const sentAt = fields['Sent At'];
  const lastViewedAt = fields['Last Viewed At'];
  const viewCount = (fields['View Count'] as number) || 0;
  const financingClickedAt = fields['Financing Clicked At'];

  // ── Rule 1: Sent, not viewed after 24h → plan_reminder_sms
  if (
    status === 'Sent' &&
    hoursAgo(sentAt) >= 24 &&
    !lastViewedAt &&
    !hasAlreadySent(sent, 'plan_reminder_sms')
  ) {
    return {
      planId,
      planFields: fields,
      templateId: 'plan_reminder_sms',
      channel: 'sms',
      reason: 'Plan sent >24h ago, never viewed',
    };
  }

  // ── Rule 2: Viewed, no action after 48h → confidence_builder email
  if (
    status === 'Viewed' &&
    hoursAgo(lastViewedAt) >= 48 &&
    !financingClickedAt &&
    !hasAlreadySent(sent, 'confidence_builder')
  ) {
    return {
      planId,
      planFields: fields,
      templateId: 'confidence_builder',
      channel: 'email',
      newStatus: 'Needs Follow-Up',
      reason: 'Plan viewed >48h ago with no action',
    };
  }

  // ── Rule 3: Financing clicked, no booking after 24h → financing_followup email
  if (
    status === 'Financing Clicked' &&
    hoursAgo(financingClickedAt) >= 24 &&
    !hasAlreadySent(sent, 'financing_followup')
  ) {
    return {
      planId,
      planFields: fields,
      templateId: 'financing_followup',
      channel: 'email',
      reason: 'Financing clicked >24h ago, no booking',
    };
  }

  // ── Rule 4: Viewed 3+ times with no booking → hot_lead_alert (internal to Rina)
  if (
    (status === 'Viewed' || status === 'Needs Follow-Up') &&
    viewCount >= 3 &&
    !hasAlreadySent(sent, 'hot_lead_alert')
  ) {
    return {
      planId,
      planFields: fields,
      templateId: 'hot_lead_alert',
      channel: 'internal',
      reason: `Client viewed plan ${viewCount} times — hot lead`,
    };
  }

  // ── Rule 5: No activity after 5 days → reengagement + plan_resend
  //    We send reengagement first; plan_resend follows as a second template
  if (
    (status === 'Sent' || status === 'Viewed' || status === 'Needs Follow-Up' || status === 'No Response') &&
    daysAgo(sentAt) >= 5 &&
    !hasAlreadySent(sent, 'reengagement')
  ) {
    // Check that the most recent activity (view or sent) is >5 days ago
    const lastActivity = lastViewedAt || sentAt;
    if (daysAgo(lastActivity) >= 5) {
      return {
        planId,
        planFields: fields,
        templateId: 'reengagement',
        channel: 'email',
        reason: 'No activity for 5+ days — re-engagement',
      };
    }
  }

  // ── Rule 5b: plan_resend — fires after reengagement has already been sent
  if (
    (status === 'Sent' || status === 'Viewed' || status === 'Needs Follow-Up' || status === 'No Response') &&
    hasAlreadySent(sent, 'reengagement') &&
    !hasAlreadySent(sent, 'plan_resend')
  ) {
    // Send plan_resend 24h after reengagement was sent
    const reengagementEntry = sent.find((s) => s.templateId === 'reengagement');
    if (reengagementEntry && hoursAgo(reengagementEntry.sentAt) >= 24) {
      return {
        planId,
        planFields: fields,
        templateId: 'plan_resend',
        channel: 'email',
        reason: 'Follow-up to re-engagement — plan re-send',
      };
    }
  }

  return null;
}

// ─── Send Functions ──────────────────────────────────────────────────

async function sendEmail(
  resend: Resend,
  to: string,
  subject: string,
  html: string
): Promise<void> {
  await resend.emails.send({
    from: 'Rani Beauty Clinic <noreply@ranibeautyclinic.com>',
    to,
    subject,
    html,
  });
}

async function sendInternalAlert(
  resend: Resend,
  subject: string,
  body: string
): Promise<void> {
  // Internal alerts go to Rina as a plain-text email
  await resend.emails.send({
    from: 'Rani Beauty Clinic <noreply@ranibeautyclinic.com>',
    to: RINA_EMAIL,
    subject,
    html: `<pre style="font-family:monospace;font-size:14px;line-height:1.6;white-space:pre-wrap;">${body}</pre>`,
  });
}

async function logToMessagesLog(
  channel: string,
  recipient: string,
  templateId: string,
  planId: string
): Promise<void> {
  try {
    await createRecord(Tables.messagesLog(), {
      Type: channel === 'internal' ? 'Internal Alert' : channel === 'sms' ? 'SMS' : 'Email',
      Direction: 'Outbound',
      Subject: `Plan follow-up: ${templateId}`,
      Body: `Automated follow-up (${templateId}) for treatment plan ${planId}`,
      Recipient: recipient,
      'Sent At': new Date().toISOString(),
      Status: 'Sent',
    });
  } catch (err) {
    // Non-critical — log but don't fail the follow-up
    console.warn('[Plan Follow-Ups] Failed to log message:', err);
  }
}

// ─── Main Executor ───────────────────────────────────────────────────

async function executeFollowUp(
  resend: Resend,
  action: FollowUpAction
): Promise<{ success: boolean; error?: string }> {
  const { planId, planFields, templateId, channel, newStatus } = action;
  const clientName = (planFields['Client Name'] as string) || 'Valued Client';
  const clientEmail = planFields['Client Email'] as string;
  const clientPhone = planFields['Client Phone'] as string;
  const planUrl =
    (planFields['Plan URL'] as string) ||
    `${getBaseUrl()}/plan/${planFields['Intake Record ID'] || planId}`;
  const viewCount = String((planFields['View Count'] as number) || 0);
  const lastViewedAt = (planFields['Last Viewed At'] as string) || 'Unknown';

  // Check we have a valid recipient
  if (channel === 'email' && !clientEmail) {
    return { success: false, error: `No email for plan ${planId} — skipping ${templateId}` };
  }
  if (channel === 'sms' && !clientPhone) {
    // Fall back: if no phone, skip SMS follow-ups silently
    return { success: false, error: `No phone for plan ${planId} — skipping SMS ${templateId}` };
  }

  // Render template
  const rendered = renderTemplate(templateId, {
    clientName,
    planUrl,
    clinicPhone: CLINIC_PHONE,
    viewCount,
    lastViewedAt,
  });

  if (!rendered) {
    return { success: false, error: `Template "${templateId}" not found` };
  }

  try {
    if (channel === 'email') {
      await sendEmail(resend, clientEmail, rendered.subject || 'Your Treatment Plan', rendered.body);
    } else if (channel === 'internal') {
      await sendInternalAlert(resend, rendered.subject || `[Alert] ${templateId}`, rendered.body);
    } else if (channel === 'sms') {
      // SMS: For now, send as email-to-self notification with SMS body.
      // When Twilio is wired directly, replace this with a Twilio API call.
      // The n8n SMS workflow can also be triggered via webhook as an alternative.
      const smsWebhookUrl = process.env.N8N_WEBHOOK_URL;
      if (smsWebhookUrl) {
        try {
          await fetch(`${smsWebhookUrl}/webhook/plan-followup-sms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: clientPhone,
              message: rendered.body,
              planId,
              clientName,
              templateId,
            }),
          });
        } catch (smsErr) {
          console.warn(`[Plan Follow-Ups] n8n SMS webhook failed for ${planId}, falling back to email alert:`, smsErr);
          // Fallback: alert Rina to send SMS manually
          await sendInternalAlert(
            resend,
            `[SMS NEEDED] Follow-up for ${clientName}`,
            `Could not send automated SMS. Please send manually:\n\nTo: ${clientPhone}\nMessage: ${rendered.body}`
          );
        }
      } else {
        // No n8n webhook — alert Rina
        await sendInternalAlert(
          resend,
          `[SMS NEEDED] Follow-up for ${clientName}`,
          `Automated SMS not configured. Please send manually:\n\nTo: ${clientPhone}\nMessage: ${rendered.body}`
        );
      }
    }

    // Record the follow-up in the plan's Follow-Ups Sent field
    const existingSent = parseSentFollowUps(planFields['Follow-Ups Sent']);
    const updatedSent: SentFollowUp[] = [
      ...existingSent,
      { templateId, sentAt: new Date().toISOString(), channel },
    ];

    const updatePayload: Record<string, unknown> = {
      [FIELDS.treatmentPlans.followUpsSent]: JSON.stringify(updatedSent),
    };

    // Optionally transition status
    if (newStatus) {
      updatePayload[FIELDS.treatmentPlans.status] = newStatus;
    }

    await updateRecord(Tables.treatmentPlans(), planId, updatePayload);

    // Log to Messages Log for audit trail
    const recipient = channel === 'internal' ? RINA_EMAIL : (channel === 'sms' ? clientPhone : clientEmail);
    await logToMessagesLog(channel, recipient, templateId, planId);

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

// ─── GET Handler (Vercel Cron) ───────────────────────────────────────
// Schedule: every hour via vercel.json cron config
// Authorization: CRON_SECRET bearer token

export async function GET(req: NextRequest) {
  // Verify Vercel cron secret
  const auth = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Fetch all treatment plans with actionable statuses
    // OR({Status} = "Sent", {Status} = "Viewed", {Status} = "Financing Clicked",
    //    {Status} = "Needs Follow-Up", {Status} = "No Response")
    const plans = await fetchAll<TreatmentPlanRecord>(
      Tables.treatmentPlans(),
      {
        filterByFormula: `OR(
          {Status} = "Sent",
          {Status} = "Viewed",
          {Status} = "Financing Clicked",
          {Status} = "Needs Follow-Up",
          {Status} = "No Response"
        )`,
        fields: [
          'Status',
          'Client Name',
          'Client Email',
          'Client Phone',
          'Plan URL',
          'Sent At',
          'Last Viewed At',
          'View Count',
          'Follow-Ups Sent',
          'Financing Clicked At',
          'Intake Record ID',
        ],
      },
      true // skip "Is Test" filter — Treatment Plans table doesn't have it
    );

    console.log(`[Plan Follow-Ups] Evaluating ${plans.length} actionable plans`);

    // Evaluate rules for each plan
    const actions: FollowUpAction[] = [];
    for (const plan of plans) {
      const action = evaluateFollowUpRules(plan.id, plan.fields);
      if (action) {
        actions.push(action);
      }
    }

    console.log(`[Plan Follow-Ups] ${actions.length} follow-ups to send`);

    // Execute follow-ups sequentially to respect Airtable rate limits
    const results: { planId: string; templateId: string; success: boolean; error?: string; reason: string }[] = [];

    for (const action of actions) {
      const result = await executeFollowUp(resend, action);
      results.push({
        planId: action.planId,
        templateId: action.templateId,
        success: result.success,
        error: result.error,
        reason: action.reason,
      });

      if (result.success) {
        console.log(`[Plan Follow-Ups] Sent ${action.templateId} for plan ${action.planId}: ${action.reason}`);
      } else {
        console.warn(`[Plan Follow-Ups] Failed ${action.templateId} for plan ${action.planId}: ${result.error}`);
      }
    }

    const sent = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const elapsed = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      summary: {
        plansEvaluated: plans.length,
        followUpsSent: sent,
        followUpsFailed: failed,
        elapsedMs: elapsed,
      },
      results,
    });
  } catch (error) {
    console.error('[Plan Follow-Ups] Cron error:', error);
    return NextResponse.json(
      {
        error: 'Follow-up cron failed',
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
