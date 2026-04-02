import {
  parseUTMParams, classifyChannel, runAttribution, compareModels,
  mapCustomerJourney, calculateChannelPerformance, getJourneyStats,
  type CustomerJourney, type MarketingChannel, type AttributionModel,
} from '@/lib/marketing/attribution';

// ── Helper: sample journeys ─────────────────────────────────────────────

function makeJourney(opts: {
  id: string;
  converted: boolean;
  value?: number;
  touchpoints: { channel: MarketingChannel; source: string; campaign?: string; daysAgo: number }[];
}): CustomerJourney {
  const now = Date.now();
  return {
    leadId: opts.id,
    converted: opts.converted,
    convertedAt: opts.converted ? new Date(now).toISOString() : undefined,
    conversionValue: opts.value || 0,
    touchpoints: opts.touchpoints.map((tp, i) => ({
      id: `${opts.id}_t${i}`,
      timestamp: new Date(now - tp.daysAgo * 86400000).toISOString(),
      channel: tp.channel,
      source: tp.source,
      medium: 'test',
      campaign: tp.campaign,
    })),
  };
}

const sampleJourneys: CustomerJourney[] = [
  makeJourney({
    id: 'j1', converted: true, value: 1000,
    touchpoints: [
      { channel: 'organic_search', source: 'google', daysAgo: 14 },
      { channel: 'paid_social', source: 'facebook', campaign: 'spring', daysAgo: 7 },
      { channel: 'direct', source: 'direct', daysAgo: 1 },
    ],
  }),
  makeJourney({
    id: 'j2', converted: true, value: 500,
    touchpoints: [
      { channel: 'paid_search', source: 'google', campaign: 'botox', daysAgo: 5 },
      { channel: 'email', source: 'email', campaign: 'nurture', daysAgo: 2 },
    ],
  }),
  makeJourney({
    id: 'j3', converted: false,
    touchpoints: [
      { channel: 'paid_social', source: 'facebook', campaign: 'spring', daysAgo: 3 },
    ],
  }),
];

// ── parseUTMParams ──────────────────────────────────────────────────────

describe('parseUTMParams', () => {
  it('extracts all UTM parameters', () => {
    const result = parseUTMParams('https://www.ranibeautyclinic.com?utm_source=google&utm_medium=cpc&utm_campaign=spring&utm_content=ad1&utm_term=sofwave');
    expect(result.source).toBe('google');
    expect(result.medium).toBe('cpc');
    expect(result.campaign).toBe('spring');
    expect(result.content).toBe('ad1');
    expect(result.term).toBe('sofwave');
  });

  it('returns empty for URL without UTMs', () => {
    const result = parseUTMParams('https://www.ranibeautyclinic.com');
    expect(result.source).toBeUndefined();
    expect(result.medium).toBeUndefined();
  });

  it('handles invalid URL gracefully', () => {
    const result = parseUTMParams('not-a-url');
    expect(result).toEqual({});
  });

  it('handles partial UTMs', () => {
    const result = parseUTMParams('https://www.ranibeautyclinic.com?utm_source=instagram');
    expect(result.source).toBe('instagram');
    expect(result.medium).toBeUndefined();
  });
});

// ── classifyChannel ─────────────────────────────────────────────────────

describe('classifyChannel', () => {
  it('classifies google cpc as paid_search', () => {
    expect(classifyChannel('google', 'cpc')).toBe('paid_search');
  });

  it('classifies google organic as organic_search', () => {
    expect(classifyChannel('google', 'organic')).toBe('organic_search');
  });

  it('classifies facebook cpc as paid_social', () => {
    expect(classifyChannel('facebook', 'cpc')).toBe('paid_social');
  });

  it('classifies instagram without medium as organic_social', () => {
    expect(classifyChannel('instagram', '')).toBe('organic_social');
  });

  it('classifies email medium as email', () => {
    expect(classifyChannel('newsletter', 'email')).toBe('email');
  });

  it('classifies referral medium as referral', () => {
    expect(classifyChannel('partner', 'referral')).toBe('referral');
  });

  it('classifies direct as direct', () => {
    expect(classifyChannel('direct', '')).toBe('direct');
    expect(classifyChannel('(direct)', '')).toBe('direct');
  });

  it('classifies unknown as other', () => {
    expect(classifyChannel('unknown', 'unknown')).toBe('other');
  });

  it('uses referrer when source/medium empty', () => {
    expect(classifyChannel('', '', 'https://www.google.com/search')).toBe('organic_search');
    expect(classifyChannel('', '', 'https://www.facebook.com/link')).toBe('organic_social');
  });

  it('classifies display medium', () => {
    expect(classifyChannel('network', 'display')).toBe('display');
  });
});

// ── runAttribution (first_touch) ────────────────────────────────────────

describe('runAttribution — first_touch', () => {
  it('gives 100% credit to first touchpoint', () => {
    const result = runAttribution(sampleJourneys, 'first_touch');
    const j1Credits = result.touchpointBreakdown.filter(t => t.touchpoint.id.startsWith('j1'));
    const first = j1Credits.find(t => t.position === 1);
    expect(first?.credit).toBe(1);
    expect(j1Credits.filter(t => t.position > 1).every(t => t.credit === 0)).toBe(true);
  });

  it('counts only converted journeys', () => {
    const result = runAttribution(sampleJourneys, 'first_touch');
    expect(result.totalConversions).toBe(2);
  });

  it('sums total revenue from converted journeys', () => {
    const result = runAttribution(sampleJourneys, 'first_touch');
    expect(result.totalRevenue).toBe(1500);
  });
});

// ── runAttribution (last_touch) ─────────────────────────────────────────

describe('runAttribution — last_touch', () => {
  it('gives 100% credit to last touchpoint', () => {
    const result = runAttribution(sampleJourneys, 'last_touch');
    const j1Credits = result.touchpointBreakdown.filter(t => t.touchpoint.id.startsWith('j1'));
    const last = j1Credits.find(t => t.position === 3);
    expect(last?.credit).toBe(1);
    expect(j1Credits.filter(t => t.position < 3).every(t => t.credit === 0)).toBe(true);
  });
});

// ── runAttribution (linear) ─────────────────────────────────────────────

describe('runAttribution — linear', () => {
  it('distributes credit equally across touchpoints', () => {
    const result = runAttribution(sampleJourneys, 'linear');
    const j1Credits = result.touchpointBreakdown.filter(t => t.touchpoint.id.startsWith('j1'));
    const expectedCredit = 1 / 3;
    for (const c of j1Credits) {
      expect(c.credit).toBeCloseTo(expectedCredit, 4);
    }
  });

  it('credits sum to 1 per journey', () => {
    const result = runAttribution(sampleJourneys, 'linear');
    const j1Credits = result.touchpointBreakdown.filter(t => t.touchpoint.id.startsWith('j1'));
    const totalCredit = j1Credits.reduce((s, c) => s + c.credit, 0);
    expect(totalCredit).toBeCloseTo(1, 4);
  });
});

// ── runAttribution (time_decay) ─────────────────────────────────────────

describe('runAttribution — time_decay', () => {
  it('gives more credit to recent touchpoints', () => {
    const result = runAttribution(sampleJourneys, 'time_decay');
    const j1Credits = result.touchpointBreakdown.filter(t => t.touchpoint.id.startsWith('j1'));
    const sorted = [...j1Credits].sort((a, b) => a.position - b.position);
    // Last touchpoint should have more credit than first
    expect(sorted[sorted.length - 1].credit).toBeGreaterThan(sorted[0].credit);
  });

  it('credits still sum to 1', () => {
    const result = runAttribution(sampleJourneys, 'time_decay');
    const j1Credits = result.touchpointBreakdown.filter(t => t.touchpoint.id.startsWith('j1'));
    const totalCredit = j1Credits.reduce((s, c) => s + c.credit, 0);
    expect(totalCredit).toBeCloseTo(1, 4);
  });
});

// ── runAttribution (position_based) ─────────────────────────────────────

describe('runAttribution — position_based', () => {
  it('gives 40% to first and last touchpoints', () => {
    const result = runAttribution(sampleJourneys, 'position_based');
    const j1Credits = result.touchpointBreakdown.filter(t => t.touchpoint.id.startsWith('j1'));
    const first = j1Credits.find(t => t.position === 1);
    const last = j1Credits.find(t => t.position === 3);
    expect(first?.credit).toBeCloseTo(0.4, 2);
    expect(last?.credit).toBeCloseTo(0.4, 2);
  });

  it('gives remaining 20% to middle touchpoints', () => {
    const result = runAttribution(sampleJourneys, 'position_based');
    const j1Credits = result.touchpointBreakdown.filter(t => t.touchpoint.id.startsWith('j1'));
    const middle = j1Credits.find(t => t.position === 2);
    expect(middle?.credit).toBeCloseTo(0.2, 2);
  });

  it('gives 50/50 for 2-touchpoint journey', () => {
    const result = runAttribution(sampleJourneys, 'position_based');
    const j2Credits = result.touchpointBreakdown.filter(t => t.touchpoint.id.startsWith('j2'));
    expect(j2Credits.every(c => c.credit === 0.5)).toBe(true);
  });
});

// ── runAttribution (channel aggregation) ────────────────────────────────

describe('runAttribution — channel aggregation', () => {
  it('aggregates revenue by channel', () => {
    const result = runAttribution(sampleJourneys, 'linear');
    const totalRevenue = result.channelCredits.reduce((s, c) => s + c.revenue, 0);
    expect(totalRevenue).toBeCloseTo(1500, 0);
  });

  it('includes all channels that have touchpoints', () => {
    const result = runAttribution(sampleJourneys, 'linear');
    const channels = result.channelCredits.map(c => c.channel);
    expect(channels).toContain('organic_search');
    expect(channels).toContain('paid_social');
    expect(channels).toContain('direct');
  });

  it('calculates CPA when spend data provided', () => {
    const spends = [{ campaign: 'spring', channel: 'paid_social' as MarketingChannel, spend: 500, startDate: '', endDate: '' }];
    const result = runAttribution(sampleJourneys, 'linear', spends);
    const campaign = result.campaignCredits.find(c => c.campaign === 'spring');
    expect(campaign?.spend).toBe(500);
    if (campaign && campaign.conversions > 0) {
      expect(campaign.costPerAcquisition).toBeDefined();
    }
  });
});

// ── compareModels ───────────────────────────────────────────────────────

describe('compareModels', () => {
  it('returns comparison for all channels across all 5 models', () => {
    const comparisons = compareModels(sampleJourneys);
    expect(comparisons.length).toBeGreaterThan(0);
    for (const comp of comparisons) {
      expect(comp.models.first_touch).toBeDefined();
      expect(comp.models.last_touch).toBeDefined();
      expect(comp.models.linear).toBeDefined();
      expect(comp.models.time_decay).toBeDefined();
      expect(comp.models.position_based).toBeDefined();
    }
  });

  it('generates insights for each channel', () => {
    const comparisons = compareModels(sampleJourneys);
    for (const comp of comparisons) {
      expect(comp.insight).toBeTruthy();
    }
  });
});

// ── mapCustomerJourney ──────────────────────────────────────────────────

describe('mapCustomerJourney', () => {
  it('maps touchpoints in chronological order', () => {
    const mapped = mapCustomerJourney(sampleJourneys[0]);
    expect(mapped.touchSequence[0].step).toBe(1);
    expect(mapped.touchSequence.length).toBe(3);
    expect(mapped.totalTouchpoints).toBe(3);
  });

  it('calculates journey duration', () => {
    const mapped = mapCustomerJourney(sampleJourneys[0]);
    expect(mapped.journeyDuration).toBeGreaterThan(0);
  });

  it('includes daysFromFirst for each touchpoint', () => {
    const mapped = mapCustomerJourney(sampleJourneys[0]);
    expect(mapped.touchSequence[0].daysFromFirst).toBe(0);
    expect(mapped.touchSequence[1].daysFromFirst).toBeGreaterThan(0);
  });
});

// ── calculateChannelPerformance ─────────────────────────────────────────

describe('calculateChannelPerformance', () => {
  it('returns performance for each channel', () => {
    const spend: Record<MarketingChannel, number> = {
      organic_search: 0, paid_search: 500, paid_social: 800,
      organic_social: 0, referral: 0, direct: 0, email: 100,
      display: 0, affiliate: 0, other: 0,
    };
    const perf = calculateChannelPerformance(sampleJourneys, spend);
    expect(perf.length).toBeGreaterThan(0);
    for (const p of perf) {
      expect(p.channel).toBeTruthy();
      expect(p.cpa).toBeGreaterThanOrEqual(0);
      expect(p.roas).toBeGreaterThanOrEqual(0);
    }
  });
});

// ── getJourneyStats ─────────────────────────────────────────────────────

describe('getJourneyStats', () => {
  it('calculates average touchpoints for converted journeys', () => {
    const stats = getJourneyStats(sampleJourneys);
    expect(stats.avgTouchpointsConverted).toBeGreaterThan(0);
  });

  it('identifies most common first and last channels', () => {
    const stats = getJourneyStats(sampleJourneys);
    expect(stats.mostCommonFirstChannel).toBeTruthy();
    expect(stats.mostCommonLastChannel).toBeTruthy();
  });

  it('calculates avg days to convert', () => {
    const stats = getJourneyStats(sampleJourneys);
    expect(stats.avgDaysToConvert).toBeGreaterThanOrEqual(0);
  });

  it('handles empty journeys', () => {
    const stats = getJourneyStats([]);
    expect(stats.avgTouchpointsConverted).toBe(0);
    expect(stats.avgDaysToConvert).toBe(0);
  });
});
