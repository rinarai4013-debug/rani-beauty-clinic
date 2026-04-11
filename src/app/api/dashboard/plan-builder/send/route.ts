import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { Tables, updateRecord } from '@/lib/airtable/client';
import { FIELDS } from '@/lib/airtable/tables';
import { Resend } from 'resend';
import crypto from 'crypto';
import { z } from 'zod';

import { withSentry } from '@/lib/sentry-utils';

// ─── Input Validation ─────────────────────────────────────────────
const SendPlanSchema = z.object({
  planId: z.string().regex(/^rec[a-zA-Z0-9]{10,}$/, 'Invalid plan ID'),
  clientEmail: z.string().email('Invalid email address'),
  clientName: z.string().min(1, 'Client name is required'),
  clientPhone: z.string().optional(),
});

// ─── Access Code Generation ───────────────────────────────────────
function generateAccessCode(recordId: string): string {
  const secret = process.env.DASHBOARD_JWT_SECRET;
  if (!secret) throw new Error('DASHBOARD_JWT_SECRET is required');
  const hash = crypto.createHmac('sha256', secret).update(recordId).digest('hex');
  const numericHash = parseInt(hash.slice(0, 8), 16);
  return String(numericHash % 1000000).padStart(6, '0');
}

// ─── Branded Email HTML ───────────────────────────────────────────
function buildEmailHtml(clientName: string, planUrl: string): string {
  const firstName = clientName.split(' ')[0] || clientName;
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Treatment Plan</title>
</head>
<body style="margin:0;padding:0;background-color:#F8F6F1;font-family:'Montserrat',Arial,sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#F8F6F1;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color:#0F1D2C;padding:40px 40px 30px;text-align:center;">
              <h1 style="margin:0;font-family:'Playfair Display',Georgia,serif;font-size:28px;color:#C9A96E;letter-spacing:1px;">
                RANI BEAUTY CLINIC
              </h1>
              <p style="margin:8px 0 0;font-size:12px;color:#8899AA;letter-spacing:2px;text-transform:uppercase;">
                Medical Aesthetics & Wellness
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px;font-family:'Playfair Display',Georgia,serif;font-size:22px;color:#0F1D2C;">
                ${firstName}, Your Personalized Treatment Plan is Ready
              </h2>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4A5568;">
                We've crafted a customized treatment plan based on your unique skin profile and goals.
                Our expert team has carefully selected treatments designed to deliver the best possible results for you.
              </p>
              <p style="margin:0 0 32px;font-size:15px;line-height:1.6;color:#4A5568;">
                Click below to view your plan, including recommended treatments, timeline, and investment details.
              </p>
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${planUrl}" target="_blank" style="display:inline-block;padding:16px 48px;background-color:#C9A96E;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;letter-spacing:1px;border-radius:8px;text-transform:uppercase;">
                      View My Treatment Plan
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:32px 0 0;font-size:13px;line-height:1.5;color:#8899AA;text-align:center;">
                This plan is personalized for you and expires in 7 days.
                If you have questions, we're here to help.
              </p>
            </td>
          </tr>
          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #E2E8F0;margin:0;" />
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:30px 40px;text-align:center;">
              <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#0F1D2C;">
                Rani Beauty Clinic
              </p>
              <p style="margin:0 0 4px;font-size:13px;color:#8899AA;">
                401 Olympia Ave NE, Suite 101, Renton, WA 98056
              </p>
              <p style="margin:0 0 4px;font-size:13px;color:#8899AA;">
                (425) 539-4440 &nbsp;|&nbsp; info@ranibeautyclinic.com
              </p>
              <p style="margin:16px 0 0;font-size:12px;color:#A0AEC0;">
                &copy; ${new Date().getFullYear()} Rani Beauty Clinic. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── POST Handler ─────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  return withSentry('dashboard/plan-builder/send', async () => {
    try {
      // Auth check
      const session = await getSession();
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Parse & validate body
      const body = await request.json().catch(() => null);

      if (!body) {
        return NextResponse.json(
          { error: 'Invalid request body', details: { body: ['Invalid JSON'] } },
          { status: 400 },
        );
      }

      const parsed = SendPlanSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
          { status: 400 },
        );
      }

      const { planId, clientEmail, clientName, clientPhone } = parsed.data;

      // Generate access code and plan URL
      const accessCode = generateAccessCode(planId);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.ranibeautyclinic.com';
      const planUrl = `${baseUrl}/plan/${planId}?code=${accessCode}`;

      // Send branded email via Resend
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: 'Rani Beauty Clinic <noreply@ranibeautyclinic.com>',
        to: clientEmail,
        subject: `${clientName}, Your Personalized Treatment Plan is Ready`,
        html: buildEmailHtml(clientName, planUrl),
      });

      // Update treatment plan status to Sent with the plan URL and follow-up metadata
      await updateRecord(Tables.treatmentPlans(), planId, {
        [FIELDS.treatmentPlans.status]: 'Sent',
        [FIELDS.treatmentPlans.planUrl]: planUrl,
        [FIELDS.treatmentPlans.sentAt]: new Date().toISOString(),
        [FIELDS.treatmentPlans.clientEmail]: clientEmail,
        [FIELDS.treatmentPlans.clientName]: clientName,
        ...(clientPhone ? { [FIELDS.treatmentPlans.clientPhone]: clientPhone } : {}),
      });

      return NextResponse.json({ success: true, planUrl });
    } catch (error) {
      console.error('[Plan Send] Error sending plan:', error);
      return NextResponse.json({ error: 'Failed to send treatment plan' }, { status: 500 });
    }
  });
}
