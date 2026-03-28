/**
 * Pipeline Engine Tests — 45 tests
 */

import {
  transitionStage,
  markLeadLost,
  calculatePipelineMetrics,
  generateForecast,
  isLeadStale,
  detectStaleLeads,
  assignLead,
  scoreLead,
  createLead,
  STAGE_ORDER,
  STAGE_PROBABILITIES,
  STALE_THRESHOLDS,
  VALID_TRANSITIONS,
} from '../pipeline';
import type { PipelineLead, AssignmentRule, TeamMember, LeadScoreInput } from '@/types/crm';

// ─── Helper ──────────────────────────────────────────────────

function makeLead(overrides: Partial<PipelineLead> = {}): PipelineLead {
  const now = new Date().toISOString();
  return {
    id: 'lead_test',
    clientId: 'c_test',
    clientName: 'Test Client',
    email: 'test@example.com',
    phone: '(555) 555-0000',
    stage: 'new_lead',
    source: 'website',
    assignedTo: 'Rina',
    estimatedValue: 1000,
    enteredAt: now,
    createdAt: now,
    lastActivityAt: now,
    stageHistory: [],
    tags: [],
    notes: '',
    score: 50,
    isStale: false,
    daysInStage: 0,
    ...overrides,
  };
}

// ─── Stage Transition Tests ──────────────────────────────────

describe('Pipeline - Stage Transitions', () => {
  test('should transition new_lead → contacted', () => {
    const lead = makeLead({ stage: 'new_lead' });
    const result = transitionStage(lead, 'contacted', 'Rina');
    expect(result.success).toBe(true);
    expect(result.lead.stage).toBe('contacted');
    expect(result.lead.previousStage).toBe('new_lead');
  });

  test('should transition contacted → consultation_booked', () => {
    const lead = makeLead({ stage: 'contacted' });
    const result = transitionStage(lead, 'consultation_booked', 'Rina');
    expect(result.success).toBe(true);
    expect(result.lead.stage).toBe('consultation_booked');
  });

  test('should transition consultation_booked → consulted', () => {
    const lead = makeLead({ stage: 'consultation_booked' });
    const result = transitionStage(lead, 'consulted', 'Rina');
    expect(result.success).toBe(true);
  });

  test('should transition consulted → treatment_planned', () => {
    const lead = makeLead({ stage: 'consulted' });
    const result = transitionStage(lead, 'treatment_planned', 'Rina');
    expect(result.success).toBe(true);
  });

  test('should transition treatment_planned → converted', () => {
    const lead = makeLead({ stage: 'treatment_planned' });
    const result = transitionStage(lead, 'converted', 'Rina');
    expect(result.success).toBe(true);
  });

  test('should transition converted → vip', () => {
    const lead = makeLead({ stage: 'converted' });
    const result = transitionStage(lead, 'vip', 'Rina');
    expect(result.success).toBe(true);
  });

  test('should reject backward transition', () => {
    const lead = makeLead({ stage: 'consulted' });
    const result = transitionStage(lead, 'new_lead', 'Rina');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot move backward');
  });

  test('should allow skip-ahead (new_lead → consultation_booked)', () => {
    const lead = makeLead({ stage: 'new_lead' });
    const result = transitionStage(lead, 'consultation_booked', 'Rina');
    expect(result.success).toBe(true);
    expect(result.lead.stage).toBe('consultation_booked');
  });

  test('should add stage to history on transition', () => {
    const lead = makeLead({ stage: 'new_lead' });
    const result = transitionStage(lead, 'contacted', 'Rina', 'First contact');
    expect(result.lead.stageHistory).toHaveLength(1);
    expect(result.lead.stageHistory[0].from).toBe('new_lead');
    expect(result.lead.stageHistory[0].to).toBe('contacted');
    expect(result.lead.stageHistory[0].by).toBe('Rina');
    expect(result.lead.stageHistory[0].note).toBe('First contact');
  });

  test('should reset daysInStage on transition', () => {
    const lead = makeLead({ stage: 'contacted', daysInStage: 5 });
    const result = transitionStage(lead, 'consultation_booked', 'Rina');
    expect(result.lead.daysInStage).toBe(0);
  });

  test('should generate automation triggers on transition to contacted', () => {
    const lead = makeLead({ stage: 'new_lead' });
    const result = transitionStage(lead, 'contacted', 'Rina');
    expect(result.automationTriggers).toContain('new_lead_welcome_sequence');
  });

  test('should generate automation triggers on transition to converted', () => {
    const lead = makeLead({ stage: 'treatment_planned' });
    const result = transitionStage(lead, 'converted', 'Rina');
    expect(result.automationTriggers).toContain('welcome_new_client');
    expect(result.automationTriggers).toContain('review_request_7day');
  });
});

// ─── Lost Lead Tests ─────────────────────────────────────────

describe('Pipeline - Lost Leads', () => {
  test('should mark lead as lost with reason', () => {
    const lead = makeLead({ stage: 'consulted' });
    const result = markLeadLost(lead, 'price', 'Rina', 'Too expensive');
    expect(result.lostReason).toBe('price');
    expect(result.lostAt).toBeDefined();
    expect(result.previousStage).toBe('consulted');
  });

  test('should record lost transition in history', () => {
    const lead = makeLead({ stage: 'treatment_planned' });
    const result = markLeadLost(lead, 'ghosted', 'Rina');
    expect(result.stageHistory).toHaveLength(1);
    expect(result.stageHistory[0].to).toBe('lost');
  });

  test('should handle all lost reasons', () => {
    const reasons = ['price', 'timing', 'competitor', 'no_show', 'ghosted', 'not_ready', 'medical_contraindication', 'moved', 'bad_experience', 'other'] as const;
    for (const reason of reasons) {
      const lead = makeLead({ stage: 'contacted' });
      const result = markLeadLost(lead, reason, 'Rina');
      expect(result.lostReason).toBe(reason);
    }
  });
});

// ─── Pipeline Metrics Tests ──────────────────────────────────

describe('Pipeline - Metrics', () => {
  test('should count leads by stage', () => {
    const leads = [
      makeLead({ stage: 'new_lead' }),
      makeLead({ stage: 'new_lead' }),
      makeLead({ stage: 'contacted' }),
      makeLead({ stage: 'converted' }),
    ];
    const metrics = calculatePipelineMetrics(leads);
    expect(metrics.leadsByStage.new_lead).toBe(2);
    expect(metrics.leadsByStage.contacted).toBe(1);
    expect(metrics.leadsByStage.converted).toBe(1);
  });

  test('should calculate total pipeline value', () => {
    const leads = [
      makeLead({ stage: 'new_lead', estimatedValue: 1000 }),
      makeLead({ stage: 'contacted', estimatedValue: 2000 }),
    ];
    const metrics = calculatePipelineMetrics(leads);
    expect(metrics.totalPipelineValue).toBe(3000);
  });

  test('should exclude lost leads from pipeline value', () => {
    const leads = [
      makeLead({ stage: 'new_lead', estimatedValue: 1000 }),
      makeLead({ stage: 'contacted', estimatedValue: 2000, lostReason: 'price' }),
    ];
    const metrics = calculatePipelineMetrics(leads);
    expect(metrics.totalPipelineValue).toBe(1000);
  });

  test('should calculate forecasted revenue', () => {
    const leads = [
      makeLead({ stage: 'new_lead', estimatedValue: 1000 }),
      makeLead({ stage: 'converted', estimatedValue: 2000 }),
    ];
    const metrics = calculatePipelineMetrics(leads);
    expect(metrics.forecastedRevenue).toBeGreaterThan(0);
    expect(metrics.forecastedRevenue).toBeLessThanOrEqual(3000);
  });

  test('should calculate win rate', () => {
    const leads = [
      makeLead({ stage: 'converted' }),
      makeLead({ stage: 'converted' }),
      makeLead({ stage: 'new_lead' }),
      makeLead({ stage: 'contacted' }),
    ];
    const metrics = calculatePipelineMetrics(leads);
    expect(metrics.winRate).toBe(50);
  });

  test('should count stale leads', () => {
    const leads = [
      makeLead({ stage: 'new_lead', isStale: true }),
      makeLead({ stage: 'contacted', isStale: false }),
    ];
    const metrics = calculatePipelineMetrics(leads);
    expect(metrics.staleLeadCount).toBe(1);
  });

  test('should track lost leads by reason', () => {
    const leads = [
      makeLead({ lostReason: 'price' }),
      makeLead({ lostReason: 'price' }),
      makeLead({ lostReason: 'ghosted' }),
    ];
    const metrics = calculatePipelineMetrics(leads);
    expect(metrics.lostLeadsByReason.price).toBe(2);
    expect(metrics.lostLeadsByReason.ghosted).toBe(1);
  });

  test('should handle empty lead array', () => {
    const metrics = calculatePipelineMetrics([]);
    expect(metrics.totalLeads).toBe(0);
    expect(metrics.winRate).toBe(0);
    expect(metrics.avgDealSize).toBe(0);
  });
});

// ─── Stale Lead Detection Tests ──────────────────────────────

describe('Pipeline - Stale Detection', () => {
  test('should detect stale new_lead after 2 days', () => {
    const lead = makeLead({
      stage: 'new_lead',
      lastActivityAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    });
    expect(isLeadStale(lead)).toBe(true);
  });

  test('should not detect fresh new_lead as stale', () => {
    const lead = makeLead({
      stage: 'new_lead',
      lastActivityAt: new Date().toISOString(),
    });
    expect(isLeadStale(lead)).toBe(false);
  });

  test('should detect stale contacted after 5 days', () => {
    const lead = makeLead({
      stage: 'contacted',
      lastActivityAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    });
    expect(isLeadStale(lead)).toBe(true);
  });

  test('should not detect lost leads as stale', () => {
    const lead = makeLead({
      stage: 'new_lead',
      lostReason: 'price',
      lastActivityAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
    });
    expect(isLeadStale(lead)).toBe(false);
  });

  test('should sort stale leads by urgency', () => {
    const leads = [
      makeLead({
        id: 'stale_1', stage: 'new_lead',
        lastActivityAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      }),
      makeLead({
        id: 'stale_2', stage: 'treatment_planned',
        lastActivityAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    ];
    const stale = detectStaleLeads(leads);
    expect(stale.length).toBe(2);
    expect(stale[0].id).toBe('stale_2'); // Higher stage = more urgent
  });
});

// ─── Auto-Assignment Tests ───────────────────────────────────

describe('Pipeline - Auto-Assignment', () => {
  const members: TeamMember[] = [
    { id: 'rina', name: 'Rina', role: 'provider', capacity: 10, currentLoad: 5, specialties: ['Injectable'], isAvailable: true },
    { id: 'mom', name: 'Mom', role: 'provider', capacity: 10, currentLoad: 3, specialties: ['Laser', 'Facial'], isAvailable: true },
  ];

  test('should assign via round-robin (lowest load)', () => {
    const rule: AssignmentRule = { strategy: 'round_robin', teamMembers: members };
    const lead = makeLead();
    const result = assignLead(lead, rule);
    expect(result.assignedTo).toBe('mom'); // Lowest current load
  });

  test('should assign via capacity-based', () => {
    const rule: AssignmentRule = { strategy: 'capacity_based', teamMembers: members };
    const lead = makeLead();
    const result = assignLead(lead, rule);
    expect(result.assignedTo).toBe('mom'); // Most available capacity
  });

  test('should assign via specialty-based', () => {
    const rule: AssignmentRule = {
      strategy: 'specialty_based',
      teamMembers: members,
      specialtyMap: { Injectable: ['rina'] },
    };
    const lead = makeLead({ tags: ['Injectable'] });
    const result = assignLead(lead, rule);
    expect(result.assignedTo).toBe('rina');
  });

  test('should not assign if no members available', () => {
    const unavailable = members.map(m => ({ ...m, isAvailable: false }));
    const rule: AssignmentRule = { strategy: 'round_robin', teamMembers: unavailable };
    const lead = makeLead();
    const result = assignLead(lead, rule);
    expect(result.assignedTo).toBe(''); // No change
  });
});

// ─── Lead Scoring Tests ──────────────────────────────────────

describe('Pipeline - Lead Scoring', () => {
  test('should score referral leads higher', () => {
    const referral = scoreLead({ source: 'referral', daysSinceCreated: 1, hasEmail: true, hasPhone: true, consultBooked: false, estimatedValue: 1000, engagementCount: 1, isReferral: true, hasMembership: false });
    const website = scoreLead({ source: 'website', daysSinceCreated: 1, hasEmail: true, hasPhone: true, consultBooked: false, estimatedValue: 1000, engagementCount: 1, isReferral: false, hasMembership: false });
    expect(referral).toBeGreaterThan(website);
  });

  test('should score higher with consult booked', () => {
    const booked = scoreLead({ source: 'website', daysSinceCreated: 1, hasEmail: true, hasPhone: true, consultBooked: true, estimatedValue: 1000, engagementCount: 1, isReferral: false, hasMembership: false });
    const notBooked = scoreLead({ source: 'website', daysSinceCreated: 1, hasEmail: true, hasPhone: true, consultBooked: false, estimatedValue: 1000, engagementCount: 1, isReferral: false, hasMembership: false });
    expect(booked).toBeGreaterThan(notBooked);
  });

  test('should score higher with fast response time', () => {
    const fast = scoreLead({ source: 'website', daysSinceCreated: 1, hasEmail: true, hasPhone: true, responseTime: 0.5, consultBooked: false, estimatedValue: 1000, engagementCount: 1, isReferral: false, hasMembership: false });
    const slow = scoreLead({ source: 'website', daysSinceCreated: 1, hasEmail: true, hasPhone: true, responseTime: 48, consultBooked: false, estimatedValue: 1000, engagementCount: 1, isReferral: false, hasMembership: false });
    expect(fast).toBeGreaterThan(slow);
  });

  test('should cap score at 100', () => {
    const max = scoreLead({ source: 'referral', daysSinceCreated: 1, hasEmail: true, hasPhone: true, responseTime: 0.5, consultBooked: true, estimatedValue: 5000, engagementCount: 10, isReferral: true, hasMembership: true });
    expect(max).toBeLessThanOrEqual(100);
  });

  test('should score 0+ for minimal input', () => {
    const min = scoreLead({ source: 'other', daysSinceCreated: 100, hasEmail: false, hasPhone: false, consultBooked: false, estimatedValue: 0, engagementCount: 0, isReferral: false, hasMembership: false });
    expect(min).toBeGreaterThanOrEqual(0);
  });
});

// ─── Forecasting Tests ───────────────────────────────────────

describe('Pipeline - Forecasting', () => {
  test('should generate 3 forecast periods by default', () => {
    const leads = [makeLead({ stage: 'consulted', estimatedValue: 2000 })];
    const forecasts = generateForecast(leads);
    expect(forecasts).toHaveLength(3);
  });

  test('should generate custom number of periods', () => {
    const leads = [makeLead({ stage: 'consulted', estimatedValue: 2000 })];
    const forecasts = generateForecast(leads, 6);
    expect(forecasts).toHaveLength(6);
  });

  test('should weight revenue by stage probability', () => {
    const leads = [makeLead({ stage: 'new_lead', estimatedValue: 10000 })];
    const forecasts = generateForecast(leads);
    expect(forecasts[0].expectedRevenue).toBeLessThan(10000);
    expect(forecasts[0].expectedRevenue).toBeGreaterThan(0);
  });

  test('should have best case > expected > worst case', () => {
    const leads = [makeLead({ stage: 'consulted', estimatedValue: 5000 })];
    const forecasts = generateForecast(leads);
    expect(forecasts[0].bestCase).toBeGreaterThanOrEqual(forecasts[0].expectedRevenue);
    expect(forecasts[0].expectedRevenue).toBeGreaterThanOrEqual(forecasts[0].worstCase);
  });

  test('should handle empty pipeline', () => {
    const forecasts = generateForecast([]);
    expect(forecasts).toHaveLength(3);
    expect(forecasts[0].expectedRevenue).toBe(0);
  });
});

// ─── Create Lead Tests ───────────────────────────────────────

describe('Pipeline - Create Lead', () => {
  test('should create lead with defaults', () => {
    const lead = createLead({
      clientId: 'c_new',
      clientName: 'New Client',
      email: 'new@example.com',
      phone: '(555) 000-0000',
      source: 'google',
    });
    expect(lead.stage).toBe('new_lead');
    expect(lead.id).toMatch(/^lead_/);
    expect(lead.estimatedValue).toBeGreaterThan(0);
    expect(lead.stageHistory).toHaveLength(0);
  });

  test('should use custom estimated value', () => {
    const lead = createLead({
      clientId: 'c_new',
      clientName: 'New Client',
      email: 'new@example.com',
      phone: '',
      source: 'referral',
      estimatedValue: 5000,
    });
    expect(lead.estimatedValue).toBe(5000);
  });
});

// ─── Constants Tests ─────────────────────────────────────────

describe('Pipeline - Constants', () => {
  test('should have 7 stages in order', () => {
    expect(STAGE_ORDER).toHaveLength(7);
    expect(STAGE_ORDER[0]).toBe('new_lead');
    expect(STAGE_ORDER[6]).toBe('vip');
  });

  test('should have probabilities for all stages', () => {
    for (const stage of STAGE_ORDER) {
      expect(STAGE_PROBABILITIES[stage]).toBeGreaterThanOrEqual(0);
      expect(STAGE_PROBABILITIES[stage]).toBeLessThanOrEqual(1);
    }
  });

  test('should have increasing probabilities', () => {
    for (let i = 1; i < STAGE_ORDER.length; i++) {
      expect(STAGE_PROBABILITIES[STAGE_ORDER[i]]).toBeGreaterThanOrEqual(
        STAGE_PROBABILITIES[STAGE_ORDER[i - 1]],
      );
    }
  });

  test('should have stale thresholds for all stages', () => {
    for (const stage of STAGE_ORDER) {
      expect(STALE_THRESHOLDS[stage]).toBeGreaterThan(0);
    }
  });
});
