import { NextResponse } from 'next/server';
import { createSession, getSessionCookieConfig } from '@/lib/auth/session';
import type { UserRole } from '@/types/auth';

interface Credential {
  password: string;
  role: UserRole;
  displayName: string;
}

const CREDENTIALS: Record<string, Credential> = {
  rina: { password: 'rani2026', role: 'ceo', displayName: 'Rina' },
  mom: { password: 'rani2026', role: 'provider', displayName: 'Mom' },
  frontdesk: { password: 'rani2026', role: 'frontdesk', displayName: 'Front Desk' },
};

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    const credential = CREDENTIALS[username];

    if (!credential || credential.password !== password) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 },
      );
    }

    const token = await createSession(username, credential.role, credential.displayName);
    const cookieConfig = getSessionCookieConfig(token);

    const response = NextResponse.json({
      success: true,
      user: {
        username,
        role: credential.role,
        displayName: credential.displayName,
      },
    });

    response.cookies.set(cookieConfig);

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 },
    );
  }
}
