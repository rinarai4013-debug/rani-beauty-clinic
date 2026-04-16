/**
 * Compliance Persistence Adapter
 *
 * Dual-write layer for the compliance engine. The engine currently stores
 * all data in in-memory module state (see `hipaa-audit.ts`, etc.). Every
 * Vercel dyno cycle wipes the memory. That's fine for a dashboard view
 * that recomputes from Airtable every page load, but it's NOT fine for
 * HIPAA audit logs which need 6 years of retention (§164.530(j)).
 *
 * This adapter closes the gap with a **wire-first, provision-later**
 * pattern:
 *
 *   1. The code calls `persistPhiAccessLog(entry)` after every log event
 *      (fire-and-forget, never throws).
 *   2. The adapter checks if a compliance Airtable table is available.
 *      If yes, writes through. If no, silently no-ops.
 *   3. Operations provisions the Airtable tables at their own pace (the
 *      table names are documented in AUDIT-RUNBOOK.md).
 *   4. The moment the tables exist in the Airtable base, writes start
 *      landing — no code change needed, no redeploy needed.
 *
 * This decouples the code change from the ops change. The alternative —
 * making `hipaa-audit.ts` hard-depend on Airtable tables that don't
 * exist yet — would require a synchronized rollout of code + tables,
 * and would cause dashboard errors during the transition.
 *
 * ## Configuration
 *
 * - `COMPLIANCE_PERSISTENCE_ENABLED=1` — turn on the adapter. Without
 *   this, every persist call is a no-op. Deliberately opt-in so the
 *   adapter can't cause test flakes or dev-mode Airtable writes.
 * - `COMPLIANCE_BASE_ID` — optional override for the Airtable base ID.
 *   Defaults to the main Rani base (`AIRTABLE_BASE_ID`). Useful if
 *   compliance data ends up in a separate base.
 *
 * ## Required Airtable tables (to be provisioned by operations)
 *
 * All four live in the base identified by `COMPLIANCE_BASE_ID` (or
 * `AIRTABLE_BASE_ID` if unset). Each has the exact field names below
 * — any drift will cause `createRecord()` to return `UNKNOWN_FIELD_NAME`
 * errors, which this adapter catches and logs.
 *
 * ### `PHI Access Log`
 * Retention: 6 years from creation (HIPAA §164.530(j))
 *
 *   - `Log ID` (Single line text, primary)
 *   - `Timestamp` (Date, includes time)
 *   - `User ID` (Single line text)
 *   - `User Name` (Single line text)
 *   - `User Role` (Single select: ceo, frontdesk, provider, marketing, operations)
 *   - `Patient ID` (Single line text)
 *   - `Patient Name` (Single line text)
 *   - `Action` (Single select: view, create, update, delete, export, print)
 *   - `Data Category` (Single select: demographics, medical_history, treatment_records,
 *      photos, billing, insurance, consents, lab_results)
 *   - `IP Address` (Single line text)
 *   - `Details` (Long text)
 *
 * ### `HIPAA Breaches`
 * Retention: indefinite (HIPAA breach log must be kept for life of entity)
 *
 *   - `Breach ID` (Single line text, primary)
 *   - `Discovery Date` (Date)
 *   - `Breach Date` (Date)
 *   - `Reported Date` (Date, optional)
 *   - `Description` (Long text)
 *   - `Data Involved` (Long text, comma-separated)
 *   - `Individuals Affected` (Number)
 *   - `Severity` (Single select: low, medium, high, critical)
 *   - `Status` (Single select: discovered, investigating, contained, notified, resolved)
 *   - `Root Cause` (Long text, optional)
 *   - `Corrective Actions` (Long text, comma-separated)
 *   - `HHS Reported` (Checkbox)
 *   - `Individuals Notified` (Checkbox)
 *   - `Media Notified` (Checkbox)
 *   - `Investigator` (Single line text)
 *   - `Resolution Date` (Date, optional)
 *
 * ### `BAAs`
 * Retention: 6 years after termination (HIPAA §164.504(e))
 *
 *   - `BAA ID` (Single line text, primary)
 *   - `Vendor Name` (Single line text)
 *   - `Vendor Contact` (Single line text)
 *   - `Vendor Email` (Email)
 *   - `Service Description` (Long text)
 *   - `Effective Date` (Date)
 *   - `Expiration Date` (Date)
 *   - `Renewal Date` (Date)
 *   - `Status` (Single select: active, expired, pending_renewal, terminated)
 *   - `Signed By` (Single line text)
 *   - `Document URL` (URL, optional)
 *   - `Last Review Date` (Date)
 *   - `Next Review Date` (Date)
 *
 * ### `HIPAA Training`
 * Retention: 6 years from completion (HIPAA §164.530(j))
 *
 *   - `Training ID` (Single line text, primary)
 *   - `Staff ID` (Single line text)
 *   - `Staff Name` (Single line text)
 *   - `Staff Role` (Single line text)
 *   - `Training Type` (Single select)
 *   - `Completed Date` (Date)
 *   - `Expiration Date` (Date)
 *   - `Score` (Number, optional)
 *   - `Passed` (Checkbox)
 *   - `Certificate URL` (URL, optional)
 *   - `Renewal Required` (Checkbox)
 */

import { logEvent } from '@/lib/logging/structured-logger';
import type {
  PHIAccessLog,
  BreachNotification,
  BusinessAssociateAgreement,
  TrainingCompletion,
} from '@/types/compliance';

// ── Feature flag / table names ───────────────────────────────────────

export const COMPLIANCE_TABLE_NAMES = {
  phiAccessLog: 'PHI Access Log',
  breaches: 'HIPAA Breaches',
  baas: 'BAAs',
  training: 'HIPAA Training',
} as const;

function isPersistenceEnabled(): boolean {
  return process.env.COMPLIANCE_PERSISTENCE_ENABLED === '1';
}

// ── One-time production warning ──────────────────────────────────────

/**
 * Tracks whether the disabled-in-production warning has already been
 * emitted this process lifetime. Module-level so it fires at most once
 * regardless of how many persist calls are made.
 */
let _persistenceWarnedOnce = false;

/**
 * Emits a single `critical` structured log when COMPLIANCE_PERSISTENCE_ENABLED
 * is not set in a production process. Silent in development and test
 * environments — only triggers where `NODE_ENV === 'production'`.
 *
 * Called at the start of every persist function so the warning fires on
 * the first actual persist attempt, giving the clearest possible signal
 * that audit data is being silently dropped.
 */
function warnOnceIfDisabledInProduction(): void {
  if (_persistenceWarnedOnce) return;
  if (process.env.NODE_ENV !== 'production') return;
  if (isPersistenceEnabled()) return;
  _persistenceWarnedOnce = true;
  logEvent(
    'compliance',
    'critical',
    'HIPAA audit persistence is DISABLED in production — PHI access logs, breach notifications, BAAs, and training records are NOT being persisted. Set COMPLIANCE_PERSISTENCE_ENABLED=1 in Vercel environment variables.',
    {
      COMPLIANCE_PERSISTENCE_ENABLED: process.env.COMPLIANCE_PERSISTENCE_ENABLED ?? '(unset)',
      action: 'set COMPLIANCE_PERSISTENCE_ENABLED=1 in Vercel environment variables',
      impact: 'audit trail is not persisting — HIPAA §164.530(j) retention requirement unmet',
    },
  );
}

/** @internal — test-only reset for the once-per-process warning latch. */
export function _resetPersistenceWarningForTest(): void {
  _persistenceWarnedOnce = false;
}

// ── Internal helpers ─────────────────────────────────────────────────

/**
 * Lazy-load the Airtable client. Wrapped in a try/catch so that tests
 * running under vitest jsdom (where Airtable env vars may be unset)
 * silently skip persistence without importing the Airtable SDK at all.
 *
 * NOTE: this is an async import so the compliance engine can be
 * imported in contexts that don't have Airtable available (e.g. static
 * analysis, unit tests of pure functions) without pulling in the full
 * Airtable dependency graph.
 */
async function loadAirtable(): Promise<
  | {
      getAirtableBase: typeof import('@/lib/airtable/client').getAirtableBase;
      createRecord: typeof import('@/lib/airtable/client').createRecord;
      updateRecord: typeof import('@/lib/airtable/client').updateRecord;
    }
  | null
> {
  try {
    const mod = await import('@/lib/airtable/client');
    return {
      getAirtableBase: mod.getAirtableBase,
      createRecord: mod.createRecord,
      updateRecord: mod.updateRecord,
    };
  } catch (err) {
    // Airtable client unavailable (tests, build-time static analysis, etc.)
    // Silently no-op — persistence is opt-in.
    return null;
  }
}

function getComplianceBase() {
  // Delegate to the main Airtable client. If COMPLIANCE_BASE_ID is set,
  // it overrides AIRTABLE_BASE_ID at the process level so the loaded
  // client points at the right base. Otherwise, the main base is used.
  //
  // NOTE: because `getAirtableBase()` memoizes on first call, swapping
  // base IDs at runtime is NOT supported. Set COMPLIANCE_BASE_ID in
  // deploy config, not per-request.
  return undefined; // Delegated via env var; see loadAirtable() comment.
}

/**
 * Catch every error from a persist call and log once. We deliberately
 * don't re-throw — an audit-log persistence failure must never break
 * the user's request. The in-memory store has the authoritative record
 * for the lifetime of the dyno; Airtable persistence is best-effort.
 */
async function safelyPersist(
  label: string,
  fn: () => Promise<void>,
): Promise<void> {
  try {
    await fn();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`[compliance/persistence] ${label} failed:`, error);
  }
}

// ── Field-name mappers ───────────────────────────────────────────────

function mapPhiLogToFields(entry: PHIAccessLog): Record<string, unknown> {
  return {
    'Log ID': entry.id,
    'Timestamp': entry.timestamp,
    'User ID': entry.userId,
    'User Name': entry.userName,
    'User Role': entry.userRole,
    'Patient ID': entry.patientId,
    'Patient Name': entry.patientName,
    'Action': entry.action,
    'Data Category': entry.dataCategory,
    'IP Address': entry.ipAddress,
    ...(entry.details ? { 'Details': entry.details } : {}),
  };
}

function mapBreachToFields(breach: BreachNotification): Record<string, unknown> {
  return {
    'Breach ID': breach.id,
    'Discovery Date': breach.discoveryDate,
    'Breach Date': breach.breachDate,
    ...(breach.reportedDate ? { 'Reported Date': breach.reportedDate } : {}),
    'Description': breach.description,
    'Data Involved': breach.dataInvolved.join(', '),
    'Individuals Affected': breach.individualsAffected,
    'Severity': breach.severity,
    'Status': breach.status,
    ...(breach.rootCause ? { 'Root Cause': breach.rootCause } : {}),
    'Corrective Actions': breach.correctiveActions.join(', '),
    'HHS Reported': breach.hhs_reported,
    'Individuals Notified': breach.individuals_notified,
    'Media Notified': breach.media_notified,
    'Investigator': breach.investigator,
    ...(breach.resolutionDate ? { 'Resolution Date': breach.resolutionDate } : {}),
  };
}

function mapBaaToFields(baa: BusinessAssociateAgreement): Record<string, unknown> {
  return {
    'BAA ID': baa.id,
    'Vendor Name': baa.vendorName,
    'Vendor Contact': baa.vendorContact,
    'Vendor Email': baa.vendorEmail,
    'Service Description': baa.serviceDescription,
    'Effective Date': baa.effectiveDate,
    'Expiration Date': baa.expirationDate,
    'Renewal Date': baa.renewalDate,
    'Status': baa.status,
    'Signed By': baa.signedBy,
    ...(baa.documentUrl ? { 'Document URL': baa.documentUrl } : {}),
    'Last Review Date': baa.lastReviewDate,
    'Next Review Date': baa.nextReviewDate,
  };
}

function mapTrainingToFields(record: TrainingCompletion): Record<string, unknown> {
  return {
    'Training ID': record.id,
    'Staff ID': record.staffId,
    'Staff Name': record.staffName,
    'Staff Role': record.staffRole,
    'Training Type': record.trainingType,
    'Completed Date': record.completedDate,
    'Expiration Date': record.expirationDate,
    ...(record.score !== undefined ? { 'Score': record.score } : {}),
    'Passed': record.passed,
    ...(record.certificateUrl ? { 'Certificate URL': record.certificateUrl } : {}),
    'Renewal Required': record.renewalRequired,
  };
}

// ── Public API — dual-write persist functions ───────────────────────

/**
 * Persist a PHI access log entry to Airtable. Fire-and-forget — never
 * throws, never blocks. Safe to call from a sync code path.
 *
 * Behavior:
 *   - persistence disabled (COMPLIANCE_PERSISTENCE_ENABLED != '1') → no-op
 *     (emits one critical log in production to surface the misconfiguration)
 *   - Airtable client unavailable → no-op
 *   - persistence enabled + client available:
 *       → writes to the `PHI Access Log` table
 *       → catches and logs any failure (including UNKNOWN_FIELD_NAME
 *         which happens when the table hasn't been provisioned yet)
 */
export function persistPhiAccessLog(entry: PHIAccessLog): void {
  warnOnceIfDisabledInProduction();
  if (!isPersistenceEnabled()) return;
  void safelyPersist('persistPhiAccessLog', async () => {
    const client = await loadAirtable();
    if (!client) return;
    const base = client.getAirtableBase();
    const table = base(COMPLIANCE_TABLE_NAMES.phiAccessLog);
    await client.createRecord(table, mapPhiLogToFields(entry));
  });
}

export function persistBreach(breach: BreachNotification): void {
  warnOnceIfDisabledInProduction();
  if (!isPersistenceEnabled()) return;
  void safelyPersist('persistBreach', async () => {
    const client = await loadAirtable();
    if (!client) return;
    const base = client.getAirtableBase();
    const table = base(COMPLIANCE_TABLE_NAMES.breaches);
    await client.createRecord(table, mapBreachToFields(breach));
  });
}

export function persistBaa(baa: BusinessAssociateAgreement): void {
  warnOnceIfDisabledInProduction();
  if (!isPersistenceEnabled()) return;
  void safelyPersist('persistBaa', async () => {
    const client = await loadAirtable();
    if (!client) return;
    const base = client.getAirtableBase();
    const table = base(COMPLIANCE_TABLE_NAMES.baas);
    await client.createRecord(table, mapBaaToFields(baa));
  });
}

export function persistTraining(record: TrainingCompletion): void {
  warnOnceIfDisabledInProduction();
  if (!isPersistenceEnabled()) return;
  void safelyPersist('persistTraining', async () => {
    const client = await loadAirtable();
    if (!client) return;
    const base = client.getAirtableBase();
    const table = base(COMPLIANCE_TABLE_NAMES.training);
    await client.createRecord(table, mapTrainingToFields(record));
  });
}

// ── Test / introspection helpers ─────────────────────────────────────

/**
 * For tests + the compliance dashboard: returns the current persistence
 * state without actually attempting a write.
 */
export function getPersistenceStatus(): {
  enabled: boolean;
  tables: typeof COMPLIANCE_TABLE_NAMES;
} {
  return {
    enabled: isPersistenceEnabled(),
    tables: COMPLIANCE_TABLE_NAMES,
  };
}
