/**
 * Metabolic Funnel Report Engine
 *
 * Computes accurate started/held/completed funnel metrics from Client Intake records.
 *
 * Funnel truth model constraints:
 *   - `completed` is authoritative — requires explicit checkout completion signal.
 *     The loose heuristic (responded + eligible => completed) is explicitly removed.
 *   - Status inference defaults to `unknown`, never to `eligible`.
 *   - The `unknown` bucket is always explicit in output, never hidden.
 *   - Field parsing uses the canonical `Track:` / `Status:` format from /api/metabolic/intake.
 *
 * SAFETY: No PII in computed output. Records are identified by Airtable ID only.
 */

// ── Record input type ──────────────────────────────────────────────────────

export interface MetabolicFunnelRecord {
  id: string;
  intakeSummary: string;   // Content of 'Intake Summary (AI)' Airtable field
  processingStatus: string; // Content of 'Processing Status' Airtable field
}

// ── Output types ─────────────────────────────────────────────────────────

export type MetabolicTrack = 'glp1' | 'hormones' | 'peptides' | 'hybrid' | 'unknown';

export type MetabolicIntakeStatus =
  | 'eligible'
  | 'provider-review-required'
  | 'ineligible'
  | 'unknown';

export interface TrackFunnelMetrics {
  track: MetabolicTrack;
  /** Total metabolic intakes for this track */
  submitted: number;
  /** Checkout launched — status: eligible */
  eligible: number;
  /** Checkout held — status: provider-review-required */
  held: number;
  /** Blocked — status: ineligible */
  ineligible: number;
  /**
   * Authoritative checkout completions only.
   * NOT inflated by weak heuristics (e.g. responded + eligible).
   * Requires explicit checkout_completed signal in intake summary.
   */
  completed: number;
  /** Unclassified — status could not be parsed from intake summary */
  unknown: number;
}

export interface MetabolicFunnelTotals {
  submitted: number;
  eligible: number;
  held: number;
  ineligible: number;
  completed: number;
  unknown: number;
}

export interface MetabolicFunnelReport {
  generatedAt: string;
  since: string | null;
  totalIntakes: number;
  byTrack: TrackFunnelMetrics[];
  totals: MetabolicFunnelTotals;
}

// ── Parsing helpers ───────────────────────────────────────────────────────

const KNOWN_TRACKS: MetabolicTrack[] = ['glp1', 'hormones', 'peptides', 'hybrid'];

/**
 * Parse the metabolic track from the canonical Intake Summary format.
 *
 * Uses `Track:` prefix written by /api/metabolic/intake.
 * Falls back to `unknown` — does NOT guess from treatmentInterests or similar variants.
 */
export function parseMetabolicTrack(intakeSummary: string): MetabolicTrack {
  const match = intakeSummary.match(/^Track:\s*(\S+)/m);
  const raw = match?.[1]?.trim().toLowerCase() ?? '';
  return (KNOWN_TRACKS as string[]).includes(raw) ? (raw as MetabolicTrack) : 'unknown';
}

/**
 * Parse the metabolic status from the canonical Intake Summary format.
 *
 * Status inference defaults to `unknown`, never to `eligible`.
 * This prevents false inflation of the eligible bucket from ambiguous records.
 */
export function parseMetabolicStatus(intakeSummary: string): MetabolicIntakeStatus {
  const match = intakeSummary.match(/^Status:\s*(.+)$/m);
  const raw = match?.[1]?.trim() ?? '';

  if (raw === 'eligible') return 'eligible';
  if (raw === 'provider-review-required') return 'provider-review-required';
  if (raw === 'ineligible') return 'ineligible';

  // Default to unknown — NOT eligible. This is the critical correctness constraint.
  return 'unknown';
}

/**
 * Determine if a record is a metabolic intake (vs. general contact form).
 * Only records with a known Track: prefix are counted.
 */
function isMetabolicRecord(record: MetabolicFunnelRecord): boolean {
  return /^Track:\s*(glp1|hormones|peptides|hybrid)/m.test(record.intakeSummary);
}

/**
 * Determine authoritative checkout completion.
 *
 * STRICT: requires explicit `checkout_completed: true` marker in summary.
 * REMOVED HEURISTIC: processingStatus === 'Responded' && status === 'eligible' is NOT completed.
 * This prevents inflating the completed count from weak signals.
 */
function isCheckoutCompleted(record: MetabolicFunnelRecord): boolean {
  // Only count as completed when there is an explicit completion signal.
  // Until checkout completion webhooks are implemented, this is always false.
  return record.intakeSummary.includes('checkout_completed: true');
}

// ── Main computation ──────────────────────────────────────────────────────

function emptyTrackMetrics(track: MetabolicTrack): TrackFunnelMetrics {
  return { track, submitted: 0, eligible: 0, held: 0, ineligible: 0, completed: 0, unknown: 0 };
}

/**
 * Compute the metabolic funnel report from a set of intake records.
 *
 * @param records - Intake records (already filtered by date at Airtable level if `since` was set)
 * @param since   - ISO date string passed from the API (YYYY-MM-DD), recorded in output only
 */
export function computeMetabolicFunnel(
  records: MetabolicFunnelRecord[],
  since: string | null = null,
): MetabolicFunnelReport {
  const metabolicRecords = records.filter(isMetabolicRecord);

  const trackMap = new Map<MetabolicTrack, TrackFunnelMetrics>();

  for (const record of metabolicRecords) {
    const track = parseMetabolicTrack(record.intakeSummary);
    const status = parseMetabolicStatus(record.intakeSummary);

    if (!trackMap.has(track)) {
      trackMap.set(track, emptyTrackMetrics(track));
    }
    const metrics = trackMap.get(track)!;

    metrics.submitted++;

    if (status === 'eligible') metrics.eligible++;
    else if (status === 'provider-review-required') metrics.held++;
    else if (status === 'ineligible') metrics.ineligible++;
    else metrics.unknown++;

    if (isCheckoutCompleted(record)) metrics.completed++;
  }

  // Sort by submitted count descending
  const byTrack = Array.from(trackMap.values()).sort((a, b) => b.submitted - a.submitted);

  const totals = byTrack.reduce<MetabolicFunnelTotals>(
    (acc, t) => ({
      submitted: acc.submitted + t.submitted,
      eligible: acc.eligible + t.eligible,
      held: acc.held + t.held,
      ineligible: acc.ineligible + t.ineligible,
      completed: acc.completed + t.completed,
      unknown: acc.unknown + t.unknown,
    }),
    { submitted: 0, eligible: 0, held: 0, ineligible: 0, completed: 0, unknown: 0 },
  );

  return {
    generatedAt: new Date().toISOString(),
    since,
    totalIntakes: metabolicRecords.length,
    byTrack,
    totals,
  };
}
