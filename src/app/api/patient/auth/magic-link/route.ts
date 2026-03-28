import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { createMagicLinkToken } from '@/lib/patient-auth/session';
import { Tables, fetchFirst } from '@/lib/airtable/client';

const resend = new Resend(process.env.RESEND_API_KEY);

const requestSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
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
      { filterByFormula: `{Email} = '${email}'` }
    );

    if (client) {
      const token = await createMagicLinkToken(email);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ranibeautyclinic.com';
      const magicLinkUrl = `${baseUrl}/portal?token=${token}`;

      await resend.emails.send({
        from: 'Rani Beauty Clinic <noreply@ranibeautyclinic.com>',
        to: email,
        subject: 'Your Rani Beauty Clinic Portal Login Link',
        html: `
          <div style="font-family: 'Montserrat', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #0F1D2C; font-family: 'Playfair Display', Georgia, serif; font-size: 24px; margin-bottom: 24px;">
              Welcome to Your Patient Portal
            </h1>
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Click the button below to securely access your Rani Beauty Clinic patient portal. This link expires in 15 minutes.
            </p>
            <a href="${magicLinkUrl}" style="display: inline-block; background-color: #C9A96E; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600;">
              Access My Portal
            </a>
            <p style="color: #999; font-size: 13px; margin-top: 32px; line-height: 1.5;">
              If you didn't request this link, you can safely ignore this email.<br/>
              Rani Beauty Clinic &middot; 401 Olympia Ave NE #101, Renton, WA 98056
            </p>
          </div>
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
