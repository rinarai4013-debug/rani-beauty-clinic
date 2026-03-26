import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createMagicLinkToken } from '@/lib/patient-auth/session';

const requestSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = requestSchema.parse(body);

    // Look up patient in Airtable by email
    const Airtable = (await import('airtable')).default;
    const base = new Airtable({ apiKey: process.env.AIRTABLE_PAT }).base(
      process.env.AIRTABLE_BASE_ID || 'app1SwhSfwe8GKUg4'
    );

    const records = await base('Clients')
      .select({
        filterByFormula: `LOWER({Email}) = LOWER("${email.replace(/"/g, '\\"')}")`,
        maxRecords: 1,
        fields: ['Client', 'Email'],
      })
      .firstPage();

    // Always return success to prevent email enumeration
    if (records.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists with that email, a login link has been sent.',
      });
    }

    // Generate magic link token
    const token = await createMagicLinkToken(email.toLowerCase());
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ranibeautyclinic.com';
    const magicLink = `${baseUrl}/api/patient/auth/verify?token=${token}`;

    // Send email via Resend
    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      const patientName = records[0].get('Client') as string || 'there';
      const firstName = patientName.split(' ')[0];

      await resend.emails.send({
        from: process.env.FROM_EMAIL || 'Rani Beauty Clinic <noreply@ranibeautyclinic.com>',
        to: email,
        subject: 'Your Rani Beauty Clinic Portal Login',
        html: getMagicLinkEmailHtml(firstName, magicLink),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with that email, a login link has been sent.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email address', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Magic link error:', error);
    return NextResponse.json(
      { error: 'Unable to process request. Please try again.' },
      { status: 500 }
    );
  }
}

function getMagicLinkEmailHtml(firstName: string, magicLink: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#FAF8F5;font-family:'Montserrat',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:40px auto;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,29,44,0.08);">
    <tr>
      <td style="background:#0F1D2C;padding:32px 40px;text-align:center;">
        <h1 style="margin:0;font-family:'Playfair Display',Georgia,serif;color:#F3D6BE;font-size:28px;font-weight:700;letter-spacing:0.5px;">
          Rani Beauty Clinic
        </h1>
        <p style="margin:8px 0 0;color:#F8E5D5;font-size:12px;letter-spacing:2px;text-transform:uppercase;">
          Patient Portal
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:40px;">
        <p style="color:#2A2A2A;font-size:16px;line-height:1.6;margin:0 0 24px;">
          Hello ${firstName},
        </p>
        <p style="color:#6B7280;font-size:15px;line-height:1.6;margin:0 0 32px;">
          You requested access to your patient portal. Click the button below to sign in securely. This link expires in 15 minutes.
        </p>
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto;">
          <tr>
            <td style="background:#0F1D2C;border-radius:8px;">
              <a href="${magicLink}" style="display:inline-block;padding:14px 40px;color:#F3D6BE;text-decoration:none;font-size:15px;font-weight:600;letter-spacing:0.5px;">
                Sign In to Portal
              </a>
            </td>
          </tr>
        </table>
        <p style="color:#9CA3AF;font-size:13px;line-height:1.5;margin:32px 0 0;text-align:center;">
          If you did not request this link, you can safely ignore this email.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background:#FAF8F5;padding:24px 40px;text-align:center;border-top:1px solid #E5E7EB;">
        <p style="color:#9CA3AF;font-size:12px;margin:0;">
          Rani Beauty Clinic &bull; 401 Olympia Ave NE #101, Renton, WA 98056
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
