/**
 * PHI Access Logger — Route Helper
 *
 * Thin wrapper around `logPHIAccess()` from `hipaa-audit.ts` that:
 *
 *  1. Extracts the client IP from the request (x-forwarded-for → x-real-ip → 'unknown')
 *  2. Normalizes the session payload into the PHIAccessLog shape
 *  3. Never throws — if logging fails, it swallows the error and logs a
 *     warning to the server console. An audit-log failure must never
 *     prevent the user from seeing their own data. HIPAA §164.312(b)
 *     wants the record to exist, but it also wants the covered entity
 *     to function.
 *
 * Usage in an API route:
 *
 *     import { logPhiAccessFromRequest } from '@/lib/compliance/phi-logger';
 *
 *     export async function GET(request: NextRequest) {
 *       const session = await getSessionFromRequest(request);
 *       if (!session) return unauthorized();
 *
 *       // ... fetch the data ...
 *
 *       logPhiAccessFromRequest(request, session, {
 *         patientId: client.id,
 *         patientName: client.name,
 *         action: 'view',
 *         dataCategory: 'treatment_records',
 *         details: 'Client profile 360 view',
 *       });
 *
 *       return NextResponse.json(client);
 *     }
 *
 * IMPORTANT: The `logPHIAccess()` function this wraps currently persists
 * to an in-memory store (see `hipaa-audit.ts`). That's a known Horizon 2
 * blocker — every Vercel dyno cycle wipes the log. The right home for
 * this data is an Airtable "PHI Access Log" table with 6-year retention
 * (HIPAA §164.530(j)). Wiring the routes first so the call-sites are
 * correct; swapping the storage layer later is a one-file change inside
 * `hipaa-audit.ts`.
 */

import type { NextRequest } from 'next/server';
import type { SessionPayload } from '@/types/auth';
import type { PHIAccessLog } from '@/types/compliance';
import { logPHIAccess } from './hipaa-audit';

/**
 * Extract the caller's IP from the request headers. Vercel sets
 * `x-forwarded-for` with the client IP as the first entry; we also
 * fall back to `x-real-ip` and finally 'unknown'. Never empty.
 */
function getClientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  const xri = request.headers.get('x-real-ip');
  if (xri) return xri.trim();
  return 'unknown';
}

export interface PhiAccessEvent {
  patientId: string;
  patientName: string;
  action: PHIAccessLog['action'];
  dataCategory: PHIAccessLog['dataCategory'];
  details?: string;
}

/**
 * Log a single PHI access event. Non-blocking — catches and logs any
 * error from the underlying `logPHIAccess()` call without throwing.
 * Returns void because callers should not wait on or branch off the
 * result. If a call-site genuinely needs the log entry, call
 * `logPHIAccess()` directly from `hipaa-audit.ts`.
 */
export function logPhiAccessFromRequest(
  request: NextRequest,
  session: SessionPayload,
  event: PhiAccessEvent,
): void {
  try {
    logPHIAccess({
      userId: session.username,
      userName: session.displayName,
      userRole: session.role,
      patientId: event.patientId,
      patientName: event.patientName,
      action: event.action,
      dataCategory: event.dataCategory,
      ipAddress: getClientIp(request),
      details: event.details,
    });
  } catch (error) {
    // Never let an audit-log failure break the route. Log to server
    // console for observability; a follow-up sprint will wire this to
    // Sentry via captureException() once we're confident the wiring
    // is stable.
    // eslint-disable-next-line no-console
    console.error('[phi-logger] Failed to log PHI access:', error, {
      patientId: event.patientId,
      action: event.action,
      dataCategory: event.dataCategory,
    });
  }
}

/**
 * Log a batch of PHI access events with a shared actor/request. Useful
 * for list endpoints where the staff user loads N records in one call —
 * each record gets its own audit entry even though the request only
 * happened once.
 *
 * Example:
 *
 *     logPhiAccessBatchFromRequest(request, session, clients.map(c => ({
 *       patientId: c.id,
 *       patientName: c.name,
 *       action: 'view',
 *       dataCategory: 'demographics',
 *       details: 'Client list page',
 *     })));
 */
export function logPhiAccessBatchFromRequest(
  request: NextRequest,
  session: SessionPayload,
  events: PhiAccessEvent[],
): void {
  const ipAddress = getClientIp(request);
  for (const event of events) {
    try {
      logPHIAccess({
        userId: session.username,
        userName: session.displayName,
        userRole: session.role,
        patientId: event.patientId,
        patientName: event.patientName,
        action: event.action,
        dataCategory: event.dataCategory,
        ipAddress,
        details: event.details,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[phi-logger] Failed to log PHI access in batch:', error, {
        patientId: event.patientId,
      });
    }
  }
}
