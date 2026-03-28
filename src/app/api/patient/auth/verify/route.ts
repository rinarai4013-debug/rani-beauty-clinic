import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  verifyMagicLinkToken,
  createPatientSession,
  getPatientSessionCookieConfig,
} from '@/lib/patient-auth/session';
import { Tables, fetchFirst } from '@/lib/airtable/client';

const requestSchema = z.object({
  token: z.string().min(1),
});

interface ClientRecord {
  Client: string;
  Email: string;
  Phone: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const { token } = parsed.data;

    // Verify the magic link token
    const payload = await verifyMagicLinkToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired link' },
        { status: 401 }
      );
    }

    // Look up client by email
    const client = await fetchFirst<ClientRecord>(
      Tables.clients(),
      1,
      { filterByFormula: `{Email} = '${payload.email}'` },
      true // skip cache to get fresh data
    );

    if (!client) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 401 }
      );
    }

    const clientId = client.id;
    const email = client.fields.Email;
    const name = client.fields.Client;

    // Create patient session
    const sessionToken = await createPatientSession(clientId, email, name);
    const cookieConfig = getPatientSessionCookieConfig(sessionToken);

    // Build response with session cookie
    const response = NextResponse.json({
      success: true,
      name,
    });

    response.cookies.set(
      cookieConfig.name,
      cookieConfig.value,
      {
        httpOnly: cookieConfig.httpOnly,
        secure: cookieConfig.secure,
        sameSite: cookieConfig.sameSite,
        maxAge: cookieConfig.maxAge,
        path: cookieConfig.path,
      }
    );

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
