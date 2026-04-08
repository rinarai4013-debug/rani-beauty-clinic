import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { createMagicLinkToken } from '@/lib/patient-auth/session';
import { Tables, fetchFirst } from '@/lib/airtable/client';
import { sanitizeFormulaValue } from '@/lib/airtable/sanitize';
import { getClientIP, rateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

const requestSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const { allowed, resetIn } = rateLimit('patient-magic-link', ip, RATE_LIMITS.FORM);
    if (!allowed) return rateLimitResponse(resetIn);

    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    // Look up client by email — if not found, still return success to avoid leaking existence
    const client = await fetchFirst<{ Email: string }>(
      Tables.clients(),
      1,
      { filterByFormula: `{Email} = '${sanitizeFormulaValue(email)}'` }
    );

    if (client) {
      const resend = getResendClient();
      if (!resend) {
        return NextResponse.json(
          { error: 'Email service not configured' },
          { status: 503 }
        );
      }
      const token = await createMagicLinkToken(email);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ranibeautyclinic.com';
      const magicLinkUrl = `${baseUrl}/portal?token=${token}`;

      await resend.emails.send({
        from: 'Rani Beauty Clinic <noreply@ranibeautyclinic.com>',
        to: email,
        subject: 'Your Rani Beauty Clinic Portal Login Link',
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
          <body style="margin: 0; padding: 0; background-color: #F8F6F1; font-family: 'Montserrat', Arial, sans-serif;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8F6F1;">
              <tr>
                <td align="center" style="padding: 40px 16px;">
                  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(15,29,44,0.08);">
                    <!-- Header -->
                    <tr>
                      <td style="background-color: #0F1D2C; padding: 32px 40px; text-align: center;">
                        <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 700; color: #C9A96E; letter-spacing: 1px;">
                          Rani Beauty Clinic
                        </h1>
                      </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                      <td style="padding: 48px 40px 40px;">
                        <h2 style="margin: 0 0 16px; font-family: 'Playfair Display', Georgia, serif; font-size: 22px; font-weight: 600; color: #0F1D2C;">
                          Sign in to Your Portal
                        </h2>
                        <p style="margin: 0 0 32px; font-size: 15px; line-height: 1.7; color: #444444;">
                          Click the button below to securely access your treatment plans, appointments, and rewards.
                        </p>
                        <!-- CTA Button -->
                        <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto 32px;">
                          <tr>
                            <td style="background-color: #C9A96E; border-radius: 8px;">
                              <a href="${magicLinkUrl}" target="_blank" style="display: inline-block; padding: 16px 40px; font-family: 'Montserrat', Arial, sans-serif; font-size: 16px; font-weight: 700; color: #ffffff; text-decoration: none; letter-spacing: 0.5px;">
                                Access My Portal
                              </a>
                            </td>
                          </tr>
                        </table>
                        <p style="margin: 0 0 8px; font-size: 13px; color: #999999; text-align: center;">
                          This link expires in 15 minutes.
                        </p>
                        <p style="margin: 0; font-size: 13px; color: #999999; text-align: center;">
                          If you didn&rsquo;t request this link, you can safely ignore this email.
                        </p>
                      </td>
                    </tr>
                    <!-- Divider -->
                    <tr>
                      <td style="padding: 0 40px;">
                        <hr style="border: none; border-top: 1px solid #E8E4DF; margin: 0;" />
                      </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 24px 40px 32px; text-align: center;">
                        <p style="margin: 0 0 4px; font-size: 12px; color: #999999; line-height: 1.6;">
                          Rani Beauty Clinic
                        </p>
                        <p style="margin: 0 0 4px; font-size: 12px; color: #999999; line-height: 1.6;">
                          401 Olympia Ave NE, Suite 101, Renton, WA 98056
                        </p>
                        <p style="margin: 0; font-size: 12px; color: #999999; line-height: 1.6;">
                          <a href="tel:+14255394440" style="color: #C9A96E; text-decoration: none;">(425) 539-4440</a>
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      });
    }

    // Always return success regardless of whether client was found
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
