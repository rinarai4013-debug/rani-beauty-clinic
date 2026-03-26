import { NextRequest, NextResponse } from 'next/server';
import {
  verifyMagicLinkToken,
  createPatientSession,
  getPatientSessionCookieConfig,
} from '@/lib/patient-auth/session';

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return redirectToLogin('Missing verification token.');
    }

    // Verify the magic link token
    const payload = await verifyMagicLinkToken(token);
    if (!payload) {
      return redirectToLogin('This link has expired or is invalid. Please request a new one.');
    }

    // Look up the patient in Airtable
    const Airtable = (await import('airtable')).default;
    const base = new Airtable({ apiKey: process.env.AIRTABLE_PAT }).base(
      process.env.AIRTABLE_BASE_ID || 'app1SwhSfwe8GKUg4'
    );

    const records = await base('Clients')
      .select({
        filterByFormula: `LOWER({Email}) = LOWER("${payload.email.replace(/"/g, '\\"')}")`,
        maxRecords: 1,
        fields: ['Client', 'Email'],
      })
      .firstPage();

    if (records.length === 0) {
      return redirectToLogin('No account found. Please contact the clinic.');
    }

    const patient = records[0];
    const patientId = patient.id;
    const name = (patient.get('Client') as string) || 'Patient';
    const email = (patient.get('Email') as string) || payload.email;

    // Create patient session
    const sessionToken = await createPatientSession(patientId, email.toLowerCase(), name);
    const cookieConfig = getPatientSessionCookieConfig(sessionToken);

    // Redirect to portal with session cookie
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ranibeautyclinic.com';
    const response = NextResponse.redirect(`${baseUrl}/portal`);
    response.cookies.set(cookieConfig);

    return response;
  } catch (error) {
    console.error('Magic link verification error:', error);
    return redirectToLogin('Something went wrong. Please try again.');
  }
}

function redirectToLogin(message: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ranibeautyclinic.com';
  const encoded = encodeURIComponent(message);
  return NextResponse.redirect(`${baseUrl}/portal?error=${encoded}`);
}
