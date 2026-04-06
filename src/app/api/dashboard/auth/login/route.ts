import { NextRequest, NextResponse } from 'next/server';
import { createSession, getSessionCookieConfig } from '@/lib/auth/session';
import type { UserRole } from '@/types/auth';

interface DashboardUser {
  username: string;
  password: string;
  role: UserRole;
  displayName: string;
}

function getUsers(): DashboardUser[] {
  const raw = process.env.DASHBOARD_USERS;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    // Support both formats:
    // Object: {"email": {"password":"...", "role":"...", "displayName":"..."}}
    // Array: [{"username":"...", "password":"...", "role":"...", "displayName":"..."}]
    if (Array.isArray(parsed)) return parsed as DashboardUser[];
    return Object.entries(parsed).map(([email, data]) => ({
      username: email,
      ...(data as Omit<DashboardUser, 'username'>),
    }));
  } catch {
    console.error('[auth/login] Failed to parse DASHBOARD_USERS env var');
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body as { username?: string; password?: string };

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }

    const users = getUsers();
    const user = users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );

    if (!user) {
      // Consistent timing to prevent username enumeration
      await new Promise((r) => setTimeout(r, 200 + Math.random() * 100));
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await createSession(user.username, user.role, user.displayName);
    const cookieConfig = getSessionCookieConfig(token);

    const response = NextResponse.json({
      ok: true,
      user: { username: user.username, role: user.role, displayName: user.displayName },
    });

    response.cookies.set(cookieConfig);
    return response;
  } catch (err) {
    console.error('[auth/login]', err);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}

// Block GET (stub was GET-only)
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
