import { NextResponse } from 'next/server';
import { getPatientSession } from '@/lib/patient-auth/session';

import { withSentry } from '@/lib/sentry-utils';


export async function GET() {
  return withSentry('patient/auth/me', async () => {
  try {
    const session = await getPatientSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      patientId: session.patientId,
      email: session.email,
      name: session.name,
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }

  });
}
