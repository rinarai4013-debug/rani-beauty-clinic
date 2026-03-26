import { NextResponse } from 'next/server';
import { getPatientSession, getPatientLogoutCookieConfig } from '@/lib/patient-auth/session';

export async function GET() {
  try {
    const session = await getPatientSession();

    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      patient: {
        id: session.patientId,
        email: session.email,
        name: session.name,
      },
    });
  } catch (error) {
    console.error('Patient session error:', error);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

// Logout
export async function DELETE() {
  try {
    const cookieConfig = getPatientLogoutCookieConfig();
    const response = NextResponse.json({ success: true, message: 'Logged out' });
    response.cookies.set(cookieConfig);
    return response;
  } catch (error) {
    console.error('Patient logout error:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
