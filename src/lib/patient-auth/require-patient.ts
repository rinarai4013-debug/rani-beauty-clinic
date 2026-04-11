import { NextResponse } from 'next/server';
import { getPatientSession, type PatientSessionPayload } from './session';
import { env } from '../env';

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
export async function getAirtableBase() {
  const Airtable = (await import('airtable')).default;
  return new Airtable({ apiKey: env.AIRTABLE_PAT }).base(env.AIRTABLE_BASE_ID);
}
