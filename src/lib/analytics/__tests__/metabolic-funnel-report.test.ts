import { describe, expect, it } from 'vitest';
import {
  parseMetabolicTrack,
  parseMetabolicStatus,
  computeMetabolicFunnel,
} from '@/lib/analytics/metabolic-funnel-report';
import type { MetabolicFunnelRecord } from '@/lib/analytics/metabolic-funnel-report';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeRecord(
  id: string,
  intakeSummary: string,
  processingStatus = 'Processed',
): MetabolicFunnelRecord {
  return { id, intakeSummary, processingStatus };
}

const SUMMARY_GLP1_ELIGIBLE = `Track: glp1\nStatus: eligible\nTier: foundation\nName: Jane Doe`;
const SUMMARY_GLP1_HELD = `Track: glp1\nStatus: provider-review-required\nTier: foundation`;
const SUMMARY_GLP1_INELIGIBLE = `Track: glp1\nStatus: ineligible\nTier: none`;
const SUMMARY_HORMONES_ELIGIBLE = `Track: hormones\nStatus: eligible\nTier: foundation`;
const SUMMARY_PEPTIDES_HELD = `Track: peptides\nStatus: provider-review-required`;
const SUMMARY_HYBRID_UNKNOWN_STATUS = `Track: hybrid\nStatus: awaiting_lab`;
const SUMMARY_UNKNOWN_TRACK = `treatmentInterests: glp1\nStatus: eligible`; // no Track: prefix
const SUMMARY_COMPLETED = `Track: glp1\nStatus: eligible\ncheckout_completed: true`;
const SUMMARY_RESPONDED_ELIGIBLE = `Track: glp1\nStatus: eligible`; // responded but NO checkout_completed

// ── parseMetabolicTrack ───────────────────────────────────────────────────────

describe('parseMetabolicTrack', () => {
  it('parses glp1', () => {
    expect(parseMetabolicTrack(SUMMARY_GLP1_ELIGIBLE)).toBe('glp1');
  });

  it('parses hormones', () => {
    expect(parseMetabolicTrack(SUMMARY_HORMONES_ELIGIBLE)).toBe('hormones');
  });

  it('parses peptides', () => {
    expect(parseMetabolicTrack(SUMMARY_PEPTIDES_HELD)).toBe('peptides');
  });

  it('parses hybrid', () => {
    expect(parseMetabolicTrack(SUMMARY_HYBRID_UNKNOWN_STATUS)).toBe('hybrid');
  });

  it('returns unknown when Track: prefix is absent', () => {
    expect(parseMetabolicTrack(SUMMARY_UNKNOWN_TRACK)).toBe('unknown');
  });

  it('returns unknown when Track: value is unrecognized', () => {
    expect(parseMetabolicTrack('Track: cortisol\nStatus: eligible')).toBe('unknown');
  });

  it('returns unknown for empty string', () => {
    expect(parseMetabolicTrack('')).toBe('unknown');
  });

  it('is case-insensitive for track values', () => {
    expect(parseMetabolicTrack('Track: GLP1\nStatus: eligible')).toBe('glp1');
  });
});

// ── parseMetabolicStatus ─────────────────────────────────────────────────────

describe('parseMetabolicStatus', () => {
  it('parses eligible', () => {
    expect(parseMetabolicStatus(SUMMARY_GLP1_ELIGIBLE)).toBe('eligible');
  });

  it('parses provider-review-required', () => {
    expect(parseMetabolicStatus(SUMMARY_GLP1_HELD)).toBe('provider-review-required');
  });

  it('parses ineligible', () => {
    expect(parseMetabolicStatus(SUMMARY_GLP1_INELIGIBLE)).toBe('ineligible');
  });

  it('returns unknown for unrecognized status — NEVER defaults to eligible', () => {
    expect(parseMetabolicStatus(SUMMARY_HYBRID_UNKNOWN_STATUS)).toBe('unknown');
  });

  it('returns unknown when Status: line is absent', () => {
    expect(parseMetabolicStatus('Track: glp1\nTier: foundation')).toBe('unknown');
  });

  it('returns unknown for empty string', () => {
    expect(parseMetabolicStatus('')).toBe('unknown');
  });
});

// ── computeMetabolicFunnel ────────────────────────────────────────────────────

describe('computeMetabolicFunnel', () => {
  it('correctly counts submitted, eligible, held, ineligible across tracks', () => {
    const records: MetabolicFunnelRecord[] = [
      makeRecord('r1', SUMMARY_GLP1_ELIGIBLE),
      makeRecord('r2', SUMMARY_GLP1_ELIGIBLE),
      makeRecord('r3', SUMMARY_GLP1_HELD),
      makeRecord('r4', SUMMARY_GLP1_INELIGIBLE),
      makeRecord('r5', SUMMARY_HORMONES_ELIGIBLE),
    ];
    const report = computeMetabolicFunnel(records);

    const glp1 = report.byTrack.find(t => t.track === 'glp1')!;
    expect(glp1.submitted).toBe(4);
    expect(glp1.eligible).toBe(2);
    expect(glp1.held).toBe(1);
    expect(glp1.ineligible).toBe(1);
    expect(glp1.completed).toBe(0);
    expect(glp1.unknown).toBe(0);

    const hormones = report.byTrack.find(t => t.track === 'hormones')!;
    expect(hormones.submitted).toBe(1);
    expect(hormones.eligible).toBe(1);
  });

  it('unknown bucket is always explicit and never hidden', () => {
    const records = [
      makeRecord('r1', SUMMARY_HYBRID_UNKNOWN_STATUS),
      makeRecord('r2', SUMMARY_GLP1_ELIGIBLE),
    ];
    const report = computeMetabolicFunnel(records);

    const hybrid = report.byTrack.find(t => t.track === 'hybrid')!;
    expect(hybrid.unknown).toBe(1);
    expect(hybrid.eligible).toBe(0);

    expect(report.totals.unknown).toBe(1);
  });

  // CRITICAL: completed requires explicit checkout_completed: true
  it('completed is 0 when responded + eligible but no checkout_completed signal', () => {
    const records = [makeRecord('r1', SUMMARY_RESPONDED_ELIGIBLE, 'Responded')];
    const report = computeMetabolicFunnel(records);
    const glp1 = report.byTrack.find(t => t.track === 'glp1')!;
    expect(glp1.completed).toBe(0);
    expect(report.totals.completed).toBe(0);
  });

  it('completed is 1 when checkout_completed: true is present in summary', () => {
    const records = [makeRecord('r1', SUMMARY_COMPLETED)];
    const report = computeMetabolicFunnel(records);
    const glp1 = report.byTrack.find(t => t.track === 'glp1')!;
    expect(glp1.completed).toBe(1);
    expect(report.totals.completed).toBe(1);
  });

  it('filters out non-metabolic records (no Track: prefix)', () => {
    const records = [
      makeRecord('r1', SUMMARY_GLP1_ELIGIBLE),
      makeRecord('r2', SUMMARY_UNKNOWN_TRACK), // contact form — no Track: prefix
      makeRecord('r3', 'Name: John\nPhone: 555-1234'), // contact form
    ];
    const report = computeMetabolicFunnel(records);
    expect(report.totalIntakes).toBe(1);
  });

  it('totals match sum of byTrack', () => {
    const records = [
      makeRecord('r1', SUMMARY_GLP1_ELIGIBLE),
      makeRecord('r2', SUMMARY_GLP1_HELD),
      makeRecord('r3', SUMMARY_HORMONES_ELIGIBLE),
      makeRecord('r4', SUMMARY_PEPTIDES_HELD),
      makeRecord('r5', SUMMARY_HYBRID_UNKNOWN_STATUS),
      makeRecord('r6', SUMMARY_COMPLETED),
    ];
    const report = computeMetabolicFunnel(records);

    const sumSubmitted = report.byTrack.reduce((s, t) => s + t.submitted, 0);
    const sumEligible = report.byTrack.reduce((s, t) => s + t.eligible, 0);
    const sumHeld = report.byTrack.reduce((s, t) => s + t.held, 0);
    const sumIneligible = report.byTrack.reduce((s, t) => s + t.ineligible, 0);
    const sumCompleted = report.byTrack.reduce((s, t) => s + t.completed, 0);
    const sumUnknown = report.byTrack.reduce((s, t) => s + t.unknown, 0);

    expect(report.totals.submitted).toBe(sumSubmitted);
    expect(report.totals.eligible).toBe(sumEligible);
    expect(report.totals.held).toBe(sumHeld);
    expect(report.totals.ineligible).toBe(sumIneligible);
    expect(report.totals.completed).toBe(sumCompleted);
    expect(report.totals.unknown).toBe(sumUnknown);
  });

  it('byTrack is sorted by submitted count descending', () => {
    const records = [
      makeRecord('r1', SUMMARY_HORMONES_ELIGIBLE),
      makeRecord('r2', SUMMARY_GLP1_ELIGIBLE),
      makeRecord('r3', SUMMARY_GLP1_HELD),
      makeRecord('r4', SUMMARY_GLP1_INELIGIBLE),
    ];
    const report = computeMetabolicFunnel(records);
    expect(report.byTrack[0].track).toBe('glp1'); // 3 submissions
    expect(report.byTrack[1].track).toBe('hormones'); // 1 submission
  });

  it('passes since through to the report metadata', () => {
    const report = computeMetabolicFunnel([], '2026-01-01');
    expect(report.since).toBe('2026-01-01');
  });

  it('since is null when not provided', () => {
    const report = computeMetabolicFunnel([]);
    expect(report.since).toBeNull();
  });

  it('returns empty byTrack and zero totals for zero records', () => {
    const report = computeMetabolicFunnel([]);
    expect(report.totalIntakes).toBe(0);
    expect(report.byTrack).toHaveLength(0);
    expect(report.totals.submitted).toBe(0);
    expect(report.totals.unknown).toBe(0);
  });

  it('generatedAt is an ISO date string', () => {
    const report = computeMetabolicFunnel([]);
    expect(() => new Date(report.generatedAt).toISOString()).not.toThrow();
  });
});
