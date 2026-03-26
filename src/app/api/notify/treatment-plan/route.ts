import { NextRequest, NextResponse } from 'next/server';
import { Tables, createRecord, fetchFirst } from '@/lib/airtable/client';
import { sanitizeFormulaValue } from '@/lib/airtable/sanitize';
import { cache } from '@/lib/cache';
import { rateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import { getSession } from '@/lib/auth/session';

interface TreatmentPlanCreateFields {
  'Client'?: string[];
  'Plan Tier'?: string;
  'Plan Value'?: number;
  'Services Included'?: string;
  'Plan URL'?: string;
  'Status'?: string;
  'Created Date'?: string;
  'Intake Record ID'?: string;
  'Client Name'?: string;
}

interface AlertCreateFields {
  'Type': string;
  'Severity': string;
  'Message': string;
  'Action Recommended': string;
  'Status': string;
  'Created Date': string;
}

interface IntakeFields {
  'Treatment Value (AI)'?: string;
  'Program Plan (AI)'?: string;
  'Cost Breakdown (AI)'?: string;
}

interface ClientFields {
  'Client'?: string;
  'Email'?: string;
}

/**
 * Treatment Plan Notification API
 * Called by n8n after intake AI processing completes.
 * Sends email (via Resend) and optional SMS (via Twilio) with the treatment plan link.
 * Also persists the treatment plan record and creates a follow-up alert.
 */
export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = getClientIP(request);
  const { allowed, resetIn } = rateLimit('notify-treatment-plan', ip, RATE_LIMITS.WEBHOOK);
  if (!allowed) return rateLimitResponse(resetIn);

  // Auth: valid dashboard session OR n8n webhook secret
  const secret = request.headers.get('x-webhook-secret');
  const n8nKey = process.env.N8N_API_KEY;
  const session = await getSession();
  if (!session) {
    if (n8nKey && secret !== n8nKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const {
      intakeRecordId,
      clientEmail,
      clientPhone,
      clientName,
      // Optional fields for plan persistence - can be passed from n8n or inferred
      planTier,
      planValue,
      servicesIncluded,
    } = await request.json();

    if (!intakeRecordId || !clientName) {
      return NextResponse.json({ error: 'intakeRecordId and clientName are required' }, { status: 400 });
    }

    const planUrl = `https://www.ranibeautyclinic.com/plan/${intakeRecordId}`;
    const results: { email: boolean; sms: boolean; planUrl: string; planRecordId: string | null } = {
      email: false,
      sms: false,
      planUrl,
      planRecordId: null,
    };

    // Send email via Resend
    if (clientEmail && process.env.RESEND_API_KEY) {
      try {
        const emailHtml = buildEmailHtml(clientName, planUrl);
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.FROM_EMAIL || 'Rani Beauty Clinic <noreply@ranibeautyclinic.com>',
            to: clientEmail,
            subject: 'Your Personalized Treatment Plan is Ready',
            html: emailHtml,
          }),
        });
        results.email = res.ok;
      } catch (e) {
        console.error('Email send error:', e);
      }
    }

    // Send SMS via Twilio (if configured)
    if (clientPhone && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      try {
        const smsBody = `Hi ${clientName.split(' ')[0]}! Your personalized treatment plan from Rani Beauty Clinic is ready: ${planUrl} Questions? Call (425) 539-4440`;
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
        const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
        
        const params = new URLSearchParams();
        params.append('To', clientPhone);
        params.append('From', process.env.TWILIO_FROM_NUMBER || '+14255394440');
        params.append('Body', smsBody);

        const res = await fetch(twilioUrl, {
          method: 'POST',
          headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        });
        results.sms = res.ok;
      } catch (e) {
        console.error('SMS send error:', e);
      }
    }

    // Log to Airtable Messages Log
    if (process.env.AIRTABLE_PAT && process.env.AIRTABLE_BASE_ID) {
      try {
        await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Messages%20Log`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.AIRTABLE_PAT}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            records: [{
              fields: {
                'Type': 'Treatment Plan Notification',
                'Channel': results.email ? 'Email' : 'SMS',
                'Recipient': clientEmail || clientPhone || clientName,
                'Status': (results.email || results.sms) ? 'Sent' : 'Failed',
                'Notes': `Plan URL: ${planUrl}`,
              }
            }]
          }),
        });
      } catch (e) {
        console.error('Log error:', e);
      }
    }

    // Persist the treatment plan record to Airtable
    try {
      // Resolve plan tier, value, and services from passed data or intake record
      let resolvedTier = planTier || 'Recommended';
      let resolvedValue = planValue || 0;
      let resolvedServices = servicesIncluded || '';

      // If not passed explicitly, try to extract from the intake record
      if (!planValue || !servicesIncluded) {
        try {
          const intakeRecords = await fetchFirst<IntakeFields>(
            Tables.intakes(),
            1,
            { filterByFormula: `RECORD_ID() = "${sanitizeFormulaValue(intakeRecordId)}"` },
            true
          );
          if (intakeRecords.length > 0) {
            const intake = intakeRecords[0].fields;
            if (!resolvedValue && intake['Treatment Value (AI)']) {
              const match = intake['Treatment Value (AI)']?.match(/\$[\d,]+/);
              resolvedValue = match ? parseInt(match[0].replace(/[$,]/g, ''), 10) : 0;
            }
            if (!resolvedServices) {
              resolvedServices = intake['Program Plan (AI)'] || intake['Cost Breakdown (AI)'] || '';
            }
          }
        } catch (intakeErr) {
          console.error('Failed to fetch intake for plan persistence:', intakeErr);
        }
      }

      // Try to find the client record by email
      let clientRecordId: string | null = null;
      if (clientEmail) {
        try {
          const clients = await fetchFirst<ClientFields>(
            Tables.clients(),
            1,
            { filterByFormula: `{Email} = "${sanitizeFormulaValue(clientEmail)}"` },
            true
          );
          if (clients.length > 0) {
            clientRecordId = clients[0].id;
          }
        } catch {
          // Client lookup is best-effort
        }
      }

      const planFields: Partial<TreatmentPlanCreateFields> = {
        'Plan Tier': resolvedTier,
        'Plan Value': resolvedValue,
        'Services Included': resolvedServices,
        'Plan URL': planUrl,
        'Status': 'Sent',
        'Created Date': new Date().toISOString(),
        'Intake Record ID': intakeRecordId,
        'Client Name': clientName,
      };

      if (clientRecordId) {
        planFields['Client'] = [clientRecordId];
      }

      results.planRecordId = await createRecord<TreatmentPlanCreateFields>(
        Tables.treatmentPlans(),
        planFields
      );

      // Create a follow-up alert
      await createRecord<AlertCreateFields>(Tables.alerts(), {
        'Type': 'follow_up',
        'Severity': 'warning',
        'Message': `${clientName} received a ${resolvedTier} treatment plan ($${resolvedValue.toLocaleString()}) - follow up if not booked`,
        'Action Recommended': `Follow up with ${clientName} about their ${resolvedTier} plan. Call or text to answer questions and help them book.`,
        'Status': 'active',
        'Created Date': new Date().toISOString(),
      });

      // Invalidate caches
      cache.invalidatePrefix('treatment-plans');
      cache.invalidate('alerts');
    } catch (persistErr) {
      console.error('Failed to persist treatment plan:', persistErr);
      // Don't fail the notification if persistence fails
    }

    return NextResponse.json({ success: true, ...results });
  } catch (error) {
    console.error('Notification error:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}

function buildEmailHtml(name: string, planUrl: string): string {
  const firstName = name.split(' ')[0];
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;padding:0;background:#F8F6F1;font-family:'Helvetica Neue',Arial,sans-serif}
.container{max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)}
.header{background:#0F1D2C;padding:40px 32px;text-align:center}
.header h1{color:#C9A96E;font-size:28px;margin:0 0 8px}
.header p{color:rgba(255,255,255,0.6);font-size:14px;margin:0}
.body{padding:40px 32px}
.body h2{color:#0F1D2C;font-size:22px;margin:0 0 16px}
.body p{color:#666;font-size:15px;line-height:1.6;margin:0 0 16px}
.cta{display:inline-block;background:#C9A96E;color:#0F1D2C;font-size:16px;font-weight:700;padding:16px 40px;border-radius:50px;text-decoration:none;margin:24px 0}
.cta:hover{background:#B8963D}
.footer{background:#F8F6F1;padding:24px 32px;text-align:center}
.footer p{color:#999;font-size:12px;margin:4px 0}
</style></head><body>
<div style="padding:24px">
<div class="container">
<div class="header">
<h1>Rani Beauty Clinic</h1>
<p>Your Personalized Treatment Plan</p>
</div>
<div class="body">
<h2>Hi ${firstName}, your treatment plan is ready!</h2>
<p>Our AI Treatment Architect has analyzed your intake and designed a custom transformation roadmap just for you.</p>
<p>Your personalized plan includes:</p>
<ul style="color:#666;font-size:14px;line-height:2">
<li>AI-powered skin analysis</li>
<li>Recommended treatment roadmap</li>
<li>Pricing with 0% financing options</li>
<li>Expected results timeline</li>
</ul>
<div style="text-align:center">
<a href="${planUrl}" class="cta">View My Treatment Plan</a>
</div>
<p style="color:#999;font-size:13px;text-align:center">Questions? Call us at <a href="tel:+14255394440" style="color:#C9A96E">(425) 539-4440</a></p>
</div>
<div class="footer">
<p>Rani Beauty Clinic</p>
<p>401 Olympia Ave NE #101, Renton, WA 98056</p>
<p>(425) 539-4440 · ranibeautyclinic.com</p>
</div>
</div>
</div>
</body></html>`;
}
