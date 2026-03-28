import { NextResponse } from 'next/server';
import { getPatientSession } from '@/lib/patient-auth/session';

export async function GET() {
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
}
