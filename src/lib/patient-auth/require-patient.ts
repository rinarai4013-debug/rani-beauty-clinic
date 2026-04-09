import { NextResponse } from 'next/server';
import { getAirtableBase as getSharedAirtableBase } from '@/lib/airtable/client';
import { getPatientSession, type PatientSessionPayload } from './session';

/**
 * Helper to require patient authentication in API routes.
 * Returns the session or a 401 response.
 */
export async function requirePatientAuth(): Promise<
  | { session: PatientSessionPayload; error?: never }
  | { session?: never; error: NextResponse }
> {
  const session = await getPatientSession();

  if (!session) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized. Please sign in to your patient portal.' },
        { status: 401 }
      ),
    };
  }

  return { session };
}

/**
 * Get an Airtable base instance.
 */
export function getAirtableBase() {
  return getSharedAirtableBase();
}
