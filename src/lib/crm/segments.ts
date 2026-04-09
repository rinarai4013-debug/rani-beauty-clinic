/**
 * Client Segmentation Engine for Rani Beauty Clinic CRM
 *
 * RFM analysis, 12 behavioral segments, custom segment builder,
 * segment movement alerts, lookalike generation, service affinity clustering.
 */

import type {
  RFMScores,
  BehavioralSegment,
  ClientSegment,
  ServiceAffinity,
  SegmentCondition,
  SegmentConditionField,
  SegmentOperator,
  SegmentGroup,
  CustomSegment,
  SegmentMetrics,
  SegmentMovement,
  RFMMatrixCell,
  LookalikeSegment,
} from '@/types/crm';

// ─────────────────────────────────────────────────────────────
// RFM ANALYSIS
// ─────────────────────────────────────────────────────────────

export interface RFMInput {
  clientId: string;
  clientName: string;
  daysSinceLastVisit: number;
  visitCount: number;
  totalSpend: number;
  avgTicket: number;
  lastVisitDate: string;
  services: {
    category: string;
    serviceName: string;
    visitCount: number;
    totalSpend: number;
    lastDate: string;
  }[];
}

/** Quintile boundaries for RFM scoring (medical aesthetics calibrated) */
const RFM_BOUNDARIES = {
  recency: [14, 30, 60, 90],      // days: 5=<14, 4=14-30, 3=30-60, 2=60-90, 1=>90
  frequency: [2, 4, 7, 12],        // visits: 5=>12, 4=7-12, 3=4-7, 2=2-4, 1=<2
  monetary: [500, 1500, 3000, 6000], // spend: 5=>6K, 4=3K-6K, 3=1.5K-3K, 2=500-1.5K, 1=<500
};

/**
 * Calculate RFM scores for a client (1-5 for each dimension).
 */
export function calculateRFM(input: RFMInput): RFMScores {
  const recency = scoreQuintile(input.daysSinceLastVisit, RFM_BOUNDARIES.recency, true);
  const frequency = scoreQuintile(input.visitCount, RFM_BOUNDARIES.frequency, false);
  const monetary = scoreQuintile(input.totalSpend, RFM_BOUNDARIES.monetary, false);

  return {
    recency,
    frequency,
    monetary,
    combined: `${recency}${frequency}${monetary}`,
  };
}

/**
 * Score a value into a quintile (1-5).
 * If inverted, lower values get higher scores (for recency - more recent = better).
 */
function scoreQuintile(value: number, boundaries: number[], inverted: boolean): number {
  if (inverted) {
    if (value <= boundaries[0]) return 5;
    if (value <= boundaries[1]) return 4;
    if (value <= boundaries[2]) return 3;
    if (value <= boundaries[3]) return 2;
    return 1;
  } else {
    if (value >= boundaries[3]) return 5;
    if (value >= boundaries[2]) return 4;
    if (value >= boundaries[1]) return 3;
    if (value >= boundaries[0]) return 2;
    return 1;
  }
}

// ─────────────────────────────────────────────────────────────
// BEHAVIORAL SEGMENTATION
// ─────────────────────────────────────────────────────────────

/**
 * RFM-to-Segment mapping rules.
 * Each rule maps an RFM pattern to a behavioral segment.
 */
interface SegmentRule {
  segment: BehavioralSegment;
  recencyRange: [number, number];
  frequencyRange: [number, number];
  monetaryRange: [number, number];
}

const SEGMENT_RULES: SegmentRule[] = [
  // Champions: R=4-5, F=4-5, M=4-5
  { segment: 'champions', recencyRange: [4, 5], frequencyRange: [4, 5], monetaryRange: [4, 5] },
  // Can't Lose Them: very valuable but at risk - check before generic at_risk
  { segment: 'cant_lose', recencyRange: [1, 2], frequencyRange: [4, 5], monetaryRange: [4, 5] },
  // Loyal Customers: R=2-5, F=3-5, M=3-5
  { segment: 'loyal', recencyRange: [2, 5], frequencyRange: [3, 5], monetaryRange: [3, 5] },
  // New Customers: first recent purchase should beat generic potential loyalist
  { segment: 'new_customers', recencyRange: [4, 5], frequencyRange: [1, 1], monetaryRange: [1, 1] },
  // Potential Loyalists: R=3-5, F=1-3, M=1-3
  { segment: 'potential_loyalists', recencyRange: [3, 5], frequencyRange: [1, 3], monetaryRange: [1, 3] },
  // Promising: R=3-4, F=1-1, M=1-1
  { segment: 'promising', recencyRange: [3, 4], frequencyRange: [1, 1], monetaryRange: [1, 1] },
  // Need Attention: R=2-3, F=2-3, M=2-3
  { segment: 'need_attention', recencyRange: [2, 3], frequencyRange: [2, 3], monetaryRange: [2, 3] },
  // Lost: exact cold / low value pattern should beat hibernating fallback
  { segment: 'lost', recencyRange: [1, 1], frequencyRange: [1, 1], monetaryRange: [1, 1] },
  // Hibernating: more specific than about_to_sleep
  { segment: 'hibernating', recencyRange: [1, 2], frequencyRange: [1, 2], monetaryRange: [1, 2] },
  // At Risk: R=1-2, F=2-5, M=2-5
  { segment: 'at_risk', recencyRange: [1, 2], frequencyRange: [2, 5], monetaryRange: [2, 5] },
  // About to Sleep: softer version of hibernating
  { segment: 'about_to_sleep', recencyRange: [2, 3], frequencyRange: [1, 2], monetaryRange: [1, 2] },
];

/**
 * Classify a client into a behavioral segment based on RFM scores.
 */
export function classifySegment(rfm: RFMScores): BehavioralSegment {
  // Check rules in order (more specific first)
  for (const rule of SEGMENT_RULES) {
    if (
      rfm.recency >= rule.recencyRange[0] && rfm.recency <= rule.recencyRange[1] &&
      rfm.frequency >= rule.frequencyRange[0] && rfm.frequency <= rule.frequencyRange[1] &&
      rfm.monetary >= rule.monetaryRange[0] && rfm.monetary <= rule.monetaryRange[1]
    ) {
      return rule.segment;
    }
  }

  // Default fallback based on recency
  if (rfm.recency >= 4) return 'new';
  if (rfm.recency >= 2) return 'need_attention';
  return 'hibernating';
}

/**
 * Full segmentation: calculate RFM, classify segment, compute service affinities.
 */
export function segmentClient(input: RFMInput): ClientSegment {
  const rfm = calculateRFM(input);
  const segment = classifySegment(rfm);
  const serviceAffinities = calculateServiceAffinities(input.services);

  return {
    clientId: input.clientId,
    clientName: input.clientName,
    rfm,
    segment,
    totalSpend: input.totalSpend,
    visitCount: input.visitCount,
    lastVisitDate: input.lastVisitDate,
    daysSinceLastVisit: input.daysSinceLastVisit,
    avgTicket: input.avgTicket,
    serviceAffinities,
  };
}

// ─────────────────────────────────────────────────────────────
// SERVICE AFFINITY CLUSTERING
// ─────────────────────────────────────────────────────────────

/**
 * Calculate service affinity scores based on visit history.
 */
export function calculateServiceAffinities(
  services: RFMInput['services'],
): ServiceAffinity[] {
  if (services.length === 0) return [];

  const totalVisits = services.reduce((sum, s) => sum + s.visitCount, 0);
  const totalSpend = services.reduce((sum, s) => sum + s.totalSpend, 0);

  return services
    .map(service => {
      // Affinity score: weighted by visit frequency (60%) and spend share (40%)
      const visitShare = totalVisits > 0 ? (service.visitCount / totalVisits) * 100 : 0;
      const spendShare = totalSpend > 0 ? (service.totalSpend / totalSpend) * 100 : 0;
      const affinityScore = Math.round(visitShare * 0.6 + spendShare * 0.4);

      return {
        category: service.category,
        serviceName: service.serviceName,
        visitCount: service.visitCount,
        totalSpend: service.totalSpend,
        lastDate: service.lastDate,
        affinityScore: Math.min(100, affinityScore),
      };
    })
    .sort((a, b) => b.affinityScore - a.affinityScore);
}

// ─────────────────────────────────────────────────────────────
// CUSTOM SEGMENT BUILDER
// ─────────────────────────────────────────────────────────────

/**
 * Evaluate a client against a custom segment definition.
 */
export function evaluateCustomSegment(
  segment: CustomSegment,
  client: Record<string, unknown>,
): boolean {
  // All groups must match (AND between groups)
  return segment.groups.every(group => evaluateGroup(group, client));
}

/**
 * Evaluate a group of conditions.
 */
export function evaluateGroup(
  group: SegmentGroup,
  client: Record<string, unknown>,
): boolean {
  if (group.logic === 'AND') {
    return group.conditions.every(cond => evaluateSegmentCondition(cond, client));
  } else {
    return group.conditions.some(cond => evaluateSegmentCondition(cond, client));
  }
}

/**
 * Evaluate a single segment condition against client data.
 */
export function evaluateSegmentCondition(
  condition: SegmentCondition,
  client: Record<string, unknown>,
): boolean {
  const value = client[condition.field];

  switch (condition.operator) {
    case 'equals':
      return value === condition.value;

    case 'not_equals':
      return value !== condition.value;

    case 'greater_than':
      return typeof value === 'number' && value > (condition.value as number);

    case 'less_than':
      return typeof value === 'number' && value < (condition.value as number);

    case 'between': {
      const [min, max] = condition.value as number[];
      return typeof value === 'number' && value >= min && value <= max;
    }

    case 'contains':
      if (typeof value === 'string') return value.includes(condition.value as string);
      if (Array.isArray(value)) return value.includes(condition.value);
      return false;

    case 'not_contains':
      if (typeof value === 'string') return !value.includes(condition.value as string);
      if (Array.isArray(value)) return !value.includes(condition.value);
      return true;

    case 'in':
      return Array.isArray(condition.value) && (condition.value as unknown[]).includes(value);

    case 'not_in':
      return Array.isArray(condition.value) && !(condition.value as unknown[]).includes(value);

    case 'is_true':
      return value === true || value === 1 || value === 'true';

    case 'is_false':
      return value === false || value === 0 || value === 'false' || value === undefined || value === null;

    default:
      return false;
  }
}

/**
 * Create a new custom segment.
 */
export function createCustomSegment(input: {
  name: string;
  description: string;
  groups: SegmentGroup[];
}): CustomSegment {
  const now = new Date().toISOString();
  return {
    id: `seg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: input.name,
    description: input.description,
    groups: input.groups,
    clientCount: 0,
    createdAt: now,
    updatedAt: now,
    isActive: true,
  };
}

// ─────────────────────────────────────────────────────────────
// SEGMENT METRICS & ANALYSIS
// ─────────────────────────────────────────────────────────────

/**
 * Calculate segment metrics from a list of client segments.
 */
export function calculateSegmentMetrics(
  clients: ClientSegment[],
  previousSegments?: Map<string, BehavioralSegment>,
): SegmentMetrics {
  const segmentDistribution: Record<BehavioralSegment, number> = {
    champions: 0, loyal: 0, potential_loyalists: 0, new_customers: 0,
    promising: 0, need_attention: 0, about_to_sleep: 0, at_risk: 0,
    cant_lose: 0, hibernating: 0, lost: 0, new: 0,
  };

  const segmentRevenue: Record<BehavioralSegment, number> = { ...segmentDistribution };
  const segmentTickets: Record<BehavioralSegment, number[]> = {
    champions: [], loyal: [], potential_loyalists: [], new_customers: [],
    promising: [], need_attention: [], about_to_sleep: [], at_risk: [],
    cant_lose: [], hibernating: [], lost: [], new: [],
  };

  const movementAlerts: SegmentMovement[] = [];

  for (const client of clients) {
    segmentDistribution[client.segment]++;
    segmentRevenue[client.segment] += client.totalSpend;
    segmentTickets[client.segment].push(client.avgTicket);

    // Detect segment movements
    if (previousSegments) {
      const prevSegment = previousSegments.get(client.clientId);
      if (prevSegment && prevSegment !== client.segment) {
        movementAlerts.push({
          clientId: client.clientId,
          clientName: client.clientName,
          from: prevSegment,
          to: client.segment,
          at: new Date().toISOString(),
          significance: getMovementSignificance(prevSegment, client.segment),
        });
      }
    }
  }

  const segmentAvgTicket: Record<BehavioralSegment, number> = {} as Record<BehavioralSegment, number>;
  for (const segment of Object.keys(segmentTickets) as BehavioralSegment[]) {
    const tickets = segmentTickets[segment];
    segmentAvgTicket[segment] = tickets.length > 0
      ? Math.round(tickets.reduce((a, b) => a + b, 0) / tickets.length)
      : 0;
  }

  // Build RFM matrix
  const rfmMatrix = buildRFMMatrix(clients);

  return {
    segmentDistribution,
    segmentRevenue,
    segmentAvgTicket,
    movementAlerts: movementAlerts.sort((a, b) =>
      a.significance === 'negative' ? -1 : b.significance === 'negative' ? 1 : 0,
    ),
    rfmMatrix,
  };
}

/**
 * Determine if a segment movement is positive, negative, or neutral.
 */
function getMovementSignificance(
  from: BehavioralSegment,
  to: BehavioralSegment,
): 'positive' | 'negative' | 'neutral' {
  const segmentRank: Record<BehavioralSegment, number> = {
    champions: 11,
    loyal: 10,
    potential_loyalists: 9,
    new_customers: 8,
    promising: 7,
    need_attention: 6,
    about_to_sleep: 5,
    at_risk: 4,
    cant_lose: 3,
    hibernating: 2,
    lost: 1,
    new: 0,
  };
  const positiveSegments: BehavioralSegment[] = ['champions', 'loyal', 'potential_loyalists'];
  const negativeSegments: BehavioralSegment[] = ['at_risk', 'cant_lose', 'hibernating', 'lost'];

  const wasPositive = positiveSegments.includes(from);
  const isPositive = positiveSegments.includes(to);
  const wasNegative = negativeSegments.includes(from);
  const isNegative = negativeSegments.includes(to);

  if (wasNegative && isPositive) return 'positive';
  if (wasPositive && isNegative) return 'negative';
  if (!wasPositive && isPositive) return 'positive';
  if (!wasNegative && isNegative) return 'negative';
  if (segmentRank[to] > segmentRank[from]) return 'positive';
  if (segmentRank[to] < segmentRank[from]) return 'negative';
  return 'neutral';
}

/**
 * Build an RFM matrix for visualization (R vs F, with M as color).
 */
function buildRFMMatrix(clients: ClientSegment[]): RFMMatrixCell[] {
  const matrix: Map<string, { count: number; totalM: number; segment: BehavioralSegment }> = new Map();

  for (const client of clients) {
    const key = `${client.rfm.recency}-${client.rfm.frequency}`;
    const existing = matrix.get(key);
    if (existing) {
      existing.count++;
      existing.totalM += client.rfm.monetary;
    } else {
      matrix.set(key, { count: 1, totalM: client.rfm.monetary, segment: client.segment });
    }
  }

  const cells: RFMMatrixCell[] = [];
  for (const [key, data] of matrix) {
    const [r, f] = key.split('-').map(Number);
    cells.push({
      recency: r,
      frequency: f,
      clientCount: data.count,
      avgMonetary: Math.round(data.totalM / data.count),
      segment: data.segment,
    });
  }

  return cells;
}

// ─────────────────────────────────────────────────────────────
// LOOKALIKE SEGMENT GENERATION
// ─────────────────────────────────────────────────────────────

/**
 * Find clients that look similar to a target segment.
 * Useful for finding new prospects that resemble your best clients.
 */
export function generateLookalikeSegment(
  sourceSegment: BehavioralSegment,
  allClients: ClientSegment[],
  maxResults: number = 20,
): LookalikeSegment {
  const sourceClients = allClients.filter(c => c.segment === sourceSegment);
  if (sourceClients.length === 0) {
    return { sourceSegment, matchingClients: [], similarityScore: 0, sharedTraits: [] };
  }

  // Calculate average profile of source segment
  const avgSpend = average(sourceClients.map(c => c.totalSpend));
  const avgVisits = average(sourceClients.map(c => c.visitCount));
  const avgTicket = average(sourceClients.map(c => c.avgTicket));

  // Get top service categories for source
  const categoryFreq: Record<string, number> = {};
  for (const client of sourceClients) {
    for (const aff of client.serviceAffinities.slice(0, 3)) {
      categoryFreq[aff.category] = (categoryFreq[aff.category] || 0) + 1;
    }
  }
  const topCategories = Object.entries(categoryFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat]) => cat);

  // Score non-source clients on similarity
  const otherClients = allClients.filter(c => c.segment !== sourceSegment);
  const scored = otherClients.map(client => {
    let similarity = 0;

    // Spend similarity (0-30)
    const spendRatio = Math.min(client.totalSpend, avgSpend) / Math.max(client.totalSpend, avgSpend);
    similarity += spendRatio * 30;

    // Visit similarity (0-25)
    const visitRatio = Math.min(client.visitCount, avgVisits) / Math.max(client.visitCount, avgVisits || 1);
    similarity += visitRatio * 25;

    // Ticket similarity (0-20)
    const ticketRatio = Math.min(client.avgTicket, avgTicket) / Math.max(client.avgTicket, avgTicket || 1);
    similarity += ticketRatio * 20;

    // Service overlap (0-25)
    const clientCategories = client.serviceAffinities.map(a => a.category);
    const overlap = topCategories.filter(c => clientCategories.includes(c)).length;
    similarity += (overlap / Math.max(topCategories.length, 1)) * 25;

    return { clientId: client.clientId, similarity: Math.round(similarity) };
  });

  const top = scored
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxResults);

  return {
    sourceSegment,
    matchingClients: top.map(t => t.clientId),
    similarityScore: top.length > 0 ? Math.round(average(top.map(t => t.similarity))) : 0,
    sharedTraits: [
      `Avg spend: $${Math.round(avgSpend)}`,
      `Avg visits: ${Math.round(avgVisits)}`,
      ...topCategories.map(c => `Prefers: ${c}`),
    ],
  };
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}
