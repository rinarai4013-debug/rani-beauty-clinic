/**
 * Segmentation Engine Tests — 40 tests
 */

import {
  calculateRFM,
  classifySegment,
  segmentClient,
  calculateServiceAffinities,
  evaluateCustomSegment,
  evaluateGroup,
  evaluateSegmentCondition,
  createCustomSegment,
  calculateSegmentMetrics,
  generateLookalikeSegment,
} from '../segments';
import type { RFMScores, BehavioralSegment, SegmentCondition, SegmentGroup, CustomSegment, ClientSegment, RFMInput } from '@/types/crm';

function makeRFMInput(overrides: Partial<RFMInput> = {}): RFMInput {
  return {
    clientId: 'c_test',
    clientName: 'Test Client',
    daysSinceLastVisit: 10,
    visitCount: 5,
    totalSpend: 2500,
    avgTicket: 500,
    lastVisitDate: '2026-03-15',
    services: [
      { category: 'Injectable', serviceName: 'Botox', visitCount: 3, totalSpend: 1500, lastDate: '2026-03-15' },
      { category: 'Facial', serviceName: 'HydraFacial', visitCount: 2, totalSpend: 550, lastDate: '2026-02-15' },
    ],
    ...overrides,
  };
}

// ─── RFM Scoring Tests ───────────────────────────────────────

describe('Segments - RFM Scoring', () => {
  test('should score recent visitors with high recency', () => {
    const rfm = calculateRFM(makeRFMInput({ daysSinceLastVisit: 5 }));
    expect(rfm.recency).toBe(5);
  });

  test('should score old visitors with low recency', () => {
    const rfm = calculateRFM(makeRFMInput({ daysSinceLastVisit: 120 }));
    expect(rfm.recency).toBe(1);
  });

  test('should score frequent visitors with high frequency', () => {
    const rfm = calculateRFM(makeRFMInput({ visitCount: 15 }));
    expect(rfm.frequency).toBe(5);
  });

  test('should score infrequent visitors with low frequency', () => {
    const rfm = calculateRFM(makeRFMInput({ visitCount: 1 }));
    expect(rfm.frequency).toBe(1);
  });

  test('should score high spenders with high monetary', () => {
    const rfm = calculateRFM(makeRFMInput({ totalSpend: 8000 }));
    expect(rfm.monetary).toBe(5);
  });

  test('should score low spenders with low monetary', () => {
    const rfm = calculateRFM(makeRFMInput({ totalSpend: 200 }));
    expect(rfm.monetary).toBe(1);
  });

  test('should generate combined RFM string', () => {
    const rfm = calculateRFM(makeRFMInput({ daysSinceLastVisit: 5, visitCount: 15, totalSpend: 8000 }));
    expect(rfm.combined).toBe('555');
  });

  test('should score all dimensions 1-5', () => {
    const rfm = calculateRFM(makeRFMInput());
    expect(rfm.recency).toBeGreaterThanOrEqual(1);
    expect(rfm.recency).toBeLessThanOrEqual(5);
    expect(rfm.frequency).toBeGreaterThanOrEqual(1);
    expect(rfm.frequency).toBeLessThanOrEqual(5);
    expect(rfm.monetary).toBeGreaterThanOrEqual(1);
    expect(rfm.monetary).toBeLessThanOrEqual(5);
  });
});

// ─── Segment Classification Tests ────────────────────────────

describe('Segments - Classification', () => {
  test('should classify champions (R=5, F=5, M=5)', () => {
    expect(classifySegment({ recency: 5, frequency: 5, monetary: 5, combined: '555' })).toBe('champions');
  });

  test('should classify loyal (R=3, F=4, M=4)', () => {
    expect(classifySegment({ recency: 3, frequency: 4, monetary: 4, combined: '344' })).toBe('loyal');
  });

  test('should classify at_risk (R=1, F=3, M=3)', () => {
    expect(classifySegment({ recency: 1, frequency: 3, monetary: 3, combined: '133' })).toBe('at_risk');
  });

  test('should classify cant_lose (R=1, F=5, M=5)', () => {
    expect(classifySegment({ recency: 1, frequency: 5, monetary: 5, combined: '155' })).toBe('cant_lose');
  });

  test('should classify lost (R=1, F=1, M=1)', () => {
    expect(classifySegment({ recency: 1, frequency: 1, monetary: 1, combined: '111' })).toBe('lost');
  });

  test('should classify new_customers (R=5, F=1, M=1)', () => {
    expect(classifySegment({ recency: 5, frequency: 1, monetary: 1, combined: '511' })).toBe('new_customers');
  });

  test('should classify hibernating (R=2, F=1, M=1)', () => {
    expect(classifySegment({ recency: 2, frequency: 1, monetary: 1, combined: '211' })).toBe('hibernating');
  });

  test('should always return a valid segment', () => {
    for (let r = 1; r <= 5; r++) {
      for (let f = 1; f <= 5; f++) {
        for (let m = 1; m <= 5; m++) {
          const segment = classifySegment({ recency: r, frequency: f, monetary: m, combined: `${r}${f}${m}` });
          expect(segment).toBeTruthy();
        }
      }
    }
  });
});

// ─── Service Affinity Tests ──────────────────────────────────

describe('Segments - Service Affinities', () => {
  test('should calculate affinity scores', () => {
    const affinities = calculateServiceAffinities([
      { category: 'Injectable', serviceName: 'Botox', visitCount: 5, totalSpend: 2500, lastDate: '2026-03-15' },
      { category: 'Facial', serviceName: 'HydraFacial', visitCount: 2, totalSpend: 550, lastDate: '2026-02-15' },
    ]);
    expect(affinities).toHaveLength(2);
    expect(affinities[0].affinityScore).toBeGreaterThan(affinities[1].affinityScore);
    expect(affinities[0].serviceName).toBe('Botox');
  });

  test('should sort by affinity score descending', () => {
    const affinities = calculateServiceAffinities([
      { category: 'A', serviceName: 'Low', visitCount: 1, totalSpend: 100, lastDate: '' },
      { category: 'B', serviceName: 'High', visitCount: 10, totalSpend: 5000, lastDate: '' },
    ]);
    expect(affinities[0].serviceName).toBe('High');
  });

  test('should handle empty services', () => {
    expect(calculateServiceAffinities([])).toHaveLength(0);
  });

  test('should cap affinity at 100', () => {
    const affinities = calculateServiceAffinities([
      { category: 'A', serviceName: 'Only', visitCount: 10, totalSpend: 5000, lastDate: '' },
    ]);
    expect(affinities[0].affinityScore).toBeLessThanOrEqual(100);
  });
});

// ─── Custom Segment Builder Tests ────────────────────────────

describe('Segments - Custom Segment Builder', () => {
  test('should evaluate equals condition', () => {
    const cond: SegmentCondition = { field: 'membershipStatus', operator: 'equals', value: 'active' };
    expect(evaluateSegmentCondition(cond, { membershipStatus: 'active' })).toBe(true);
    expect(evaluateSegmentCondition(cond, { membershipStatus: 'expired' })).toBe(false);
  });

  test('should evaluate greater_than condition', () => {
    const cond: SegmentCondition = { field: 'totalSpend', operator: 'greater_than', value: 1000 };
    expect(evaluateSegmentCondition(cond, { totalSpend: 1500 })).toBe(true);
    expect(evaluateSegmentCondition(cond, { totalSpend: 500 })).toBe(false);
  });

  test('should evaluate between condition', () => {
    const cond: SegmentCondition = { field: 'visitCount', operator: 'between', value: [3, 10] };
    expect(evaluateSegmentCondition(cond, { visitCount: 5 })).toBe(true);
    expect(evaluateSegmentCondition(cond, { visitCount: 15 })).toBe(false);
  });

  test('should evaluate contains condition for strings', () => {
    const cond: SegmentCondition = { field: 'lastService', operator: 'contains', value: 'Botox' };
    expect(evaluateSegmentCondition(cond, { lastService: 'Botox Treatment' })).toBe(true);
  });

  test('should evaluate in condition', () => {
    const cond: SegmentCondition = { field: 'source', operator: 'in', value: ['google', 'referral'] };
    expect(evaluateSegmentCondition(cond, { source: 'google' })).toBe(true);
    expect(evaluateSegmentCondition(cond, { source: 'instagram' })).toBe(false);
  });

  test('should evaluate is_true condition', () => {
    const cond: SegmentCondition = { field: 'hasPackage', operator: 'is_true', value: true };
    expect(evaluateSegmentCondition(cond, { hasPackage: true })).toBe(true);
    expect(evaluateSegmentCondition(cond, { hasPackage: false })).toBe(false);
  });

  test('should evaluate AND group', () => {
    const group: SegmentGroup = {
      logic: 'AND',
      conditions: [
        { field: 'totalSpend', operator: 'greater_than', value: 1000 },
        { field: 'visitCount', operator: 'greater_than', value: 3 },
      ],
    };
    expect(evaluateGroup(group, { totalSpend: 1500, visitCount: 5 })).toBe(true);
    expect(evaluateGroup(group, { totalSpend: 1500, visitCount: 2 })).toBe(false);
  });

  test('should evaluate OR group', () => {
    const group: SegmentGroup = {
      logic: 'OR',
      conditions: [
        { field: 'totalSpend', operator: 'greater_than', value: 5000 },
        { field: 'visitCount', operator: 'greater_than', value: 10 },
      ],
    };
    expect(evaluateGroup(group, { totalSpend: 6000, visitCount: 2 })).toBe(true);
    expect(evaluateGroup(group, { totalSpend: 1000, visitCount: 2 })).toBe(false);
  });

  test('should evaluate custom segment with multiple groups', () => {
    const segment = createCustomSegment({
      name: 'High Value Injection Clients',
      description: 'Test segment',
      groups: [
        { logic: 'AND', conditions: [{ field: 'totalSpend', operator: 'greater_than', value: 2000 }] },
        { logic: 'AND', conditions: [{ field: 'visitCount', operator: 'greater_than', value: 3 }] },
      ],
    });
    expect(evaluateCustomSegment(segment, { totalSpend: 3000, visitCount: 5 })).toBe(true);
    expect(evaluateCustomSegment(segment, { totalSpend: 3000, visitCount: 2 })).toBe(false);
  });

  test('should create custom segment with ID', () => {
    const segment = createCustomSegment({ name: 'Test', description: 'Test', groups: [] });
    expect(segment.id).toMatch(/^seg_/);
    expect(segment.isActive).toBe(true);
  });
});

// ─── Segment Metrics Tests ───────────────────────────────────

describe('Segments - Metrics', () => {
  const sampleClients: ClientSegment[] = [
    { clientId: 'c1', clientName: 'A', rfm: { recency: 5, frequency: 5, monetary: 5, combined: '555' }, segment: 'champions', totalSpend: 5000, visitCount: 10, lastVisitDate: '', daysSinceLastVisit: 5, avgTicket: 500, serviceAffinities: [] },
    { clientId: 'c2', clientName: 'B', rfm: { recency: 4, frequency: 3, monetary: 3, combined: '433' }, segment: 'loyal', totalSpend: 2000, visitCount: 5, lastVisitDate: '', daysSinceLastVisit: 15, avgTicket: 400, serviceAffinities: [] },
    { clientId: 'c3', clientName: 'C', rfm: { recency: 1, frequency: 1, monetary: 1, combined: '111' }, segment: 'lost', totalSpend: 275, visitCount: 1, lastVisitDate: '', daysSinceLastVisit: 200, avgTicket: 275, serviceAffinities: [] },
  ];

  test('should count segment distribution', () => {
    const metrics = calculateSegmentMetrics(sampleClients);
    expect(metrics.segmentDistribution.champions).toBe(1);
    expect(metrics.segmentDistribution.loyal).toBe(1);
    expect(metrics.segmentDistribution.lost).toBe(1);
  });

  test('should calculate segment revenue', () => {
    const metrics = calculateSegmentMetrics(sampleClients);
    expect(metrics.segmentRevenue.champions).toBe(5000);
  });

  test('should calculate segment avg ticket', () => {
    const metrics = calculateSegmentMetrics(sampleClients);
    expect(metrics.segmentAvgTicket.champions).toBe(500);
  });

  test('should detect segment movements', () => {
    const previous = new Map<string, BehavioralSegment>([
      ['c1', 'loyal'], // Was loyal, now champion (positive)
    ]);
    const metrics = calculateSegmentMetrics(sampleClients, previous);
    expect(metrics.movementAlerts.length).toBe(1);
    expect(metrics.movementAlerts[0].from).toBe('loyal');
    expect(metrics.movementAlerts[0].to).toBe('champions');
    expect(metrics.movementAlerts[0].significance).toBe('positive');
  });

  test('should build RFM matrix', () => {
    const metrics = calculateSegmentMetrics(sampleClients);
    expect(metrics.rfmMatrix.length).toBeGreaterThan(0);
  });
});

// ─── Lookalike Segment Tests ─────────────────────────────────

describe('Segments - Lookalike Generation', () => {
  const allClients: ClientSegment[] = [
    { clientId: 'c1', clientName: 'Champion', rfm: { recency: 5, frequency: 5, monetary: 5, combined: '555' }, segment: 'champions', totalSpend: 5000, visitCount: 10, lastVisitDate: '', daysSinceLastVisit: 5, avgTicket: 500, serviceAffinities: [{ category: 'Injectable', serviceName: 'Botox', visitCount: 5, totalSpend: 2500, lastDate: '', affinityScore: 80 }] },
    { clientId: 'c2', clientName: 'Similar', rfm: { recency: 4, frequency: 3, monetary: 3, combined: '433' }, segment: 'loyal', totalSpend: 4000, visitCount: 8, lastVisitDate: '', daysSinceLastVisit: 10, avgTicket: 500, serviceAffinities: [{ category: 'Injectable', serviceName: 'Filler', visitCount: 4, totalSpend: 2000, lastDate: '', affinityScore: 70 }] },
    { clientId: 'c3', clientName: 'Different', rfm: { recency: 1, frequency: 1, monetary: 1, combined: '111' }, segment: 'lost', totalSpend: 275, visitCount: 1, lastVisitDate: '', daysSinceLastVisit: 200, avgTicket: 275, serviceAffinities: [{ category: 'Facial', serviceName: 'HydraFacial', visitCount: 1, totalSpend: 275, lastDate: '', affinityScore: 100 }] },
  ];

  test('should find similar clients to champions', () => {
    const lookalike = generateLookalikeSegment('champions', allClients);
    expect(lookalike.matchingClients).toContain('c2');
    expect(lookalike.similarityScore).toBeGreaterThan(0);
  });

  test('should rank by similarity', () => {
    const lookalike = generateLookalikeSegment('champions', allClients);
    expect(lookalike.matchingClients[0]).toBe('c2'); // More similar
  });

  test('should include shared traits', () => {
    const lookalike = generateLookalikeSegment('champions', allClients);
    expect(lookalike.sharedTraits.length).toBeGreaterThan(0);
  });

  test('should handle empty source segment', () => {
    const lookalike = generateLookalikeSegment('new', allClients);
    expect(lookalike.similarityScore).toBe(0);
  });
});

// ─── Full Segmentation Tests ─────────────────────────────────

describe('Segments - Full Pipeline', () => {
  test('should segment a client end-to-end', () => {
    const result = segmentClient(makeRFMInput());
    expect(result.clientId).toBe('c_test');
    expect(result.rfm.combined).toBeDefined();
    expect(result.segment).toBeDefined();
    expect(result.serviceAffinities.length).toBeGreaterThan(0);
  });

  test('should produce consistent results', () => {
    const input = makeRFMInput();
    const r1 = segmentClient(input);
    const r2 = segmentClient(input);
    expect(r1.segment).toBe(r2.segment);
    expect(r1.rfm.combined).toBe(r2.rfm.combined);
  });
});
