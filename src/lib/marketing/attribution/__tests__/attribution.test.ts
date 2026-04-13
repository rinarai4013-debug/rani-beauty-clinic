import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  calculateChannelPerformance,
  classifyChannel,
  compareModels,
  getJourneyStats,
  mapCustomerJourney,
  parseUTMParams,
  runAttribution,
  type CampaignSpend,
  type CustomerJourney,
  type MarketingChannel,
} from '@/lib/marketing/attribution';

process.env.TZ = 'UTC';

describe('marketing/attribution', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-10T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('parseUTMParams', () => {
    it('extracts all standard UTM params when present', () => {
      const params = parseUTMParams(
        'https://ranibeautyclinic.com/landing?utm_source=google&utm_medium=cpc&utm_campaign=sofwave&utm_content=hero&utm_term=skin-tightening',
      );

      expect(params.source).toBe('google');
      expect(params.medium).toBe('cpc');
      expect(params.campaign).toBe('sofwave');
      expect(params.content).toBe('hero');
      expect(params.term).toBe('skin-tightening');
    });

    it('returns an empty object for malformed URLs', () => {
      expect(parseUTMParams('not-a-url')).toEqual({});
    });

    it('returns partial data when only one UTM field exists', () => {
      const params = parseUTMParams('https://ranibeautyclinic.com/?utm_source=tiktok');
      expect(params).toEqual({
        source: 'tiktok',
        medium: undefined,
        campaign: undefined,
        content: undefined,
        term: undefined,
      });
    });
  });

  describe('classifyChannel', () => {
    it.each([
      ['facebook', 'cpc', undefined, 'paid_social'],
      ['instagram', 'cpc', 'https://www.instagram.com', 'paid_social'],
      ['facebook', 'paid_social', undefined, 'paid_social'],
      ['google', 'cpc', undefined, 'paid_search'],
      ['bing', '', '', 'organic_search'],
      ['google', '', 'https://www.google.com/search?q=sofwave', 'organic_search'],
      ['instagram', 'social', undefined, 'organic_social'],
      ['newsletter', 'email', undefined, 'email'],
      ['google', 'display', undefined, 'display'],
      ['friend.com', 'referral', undefined, 'referral'],
      ['affiliate', 'other', undefined, 'affiliate'],
      ['(direct)', '', '', 'direct'],
      ['random', '', 'https://ranibeautyclinic.com/landing', 'other'],
    ])('classifies %s + %s (%s) as %s', (source, medium, referrer, expected) => {
      expect(classifyChannel(source, medium, referrer)).toBe(expected);
    });

    it('treats empty values as direct when no referrer exists', () => {
      expect(classifyChannel('', '', '')).toBe('direct');
    });
  });

  describe('runAttribution', () => {
    const journeys: CustomerJourney[] = [
      {
        leadId: 'lead-1',
        converted: true,
        conversionValue: 500,
        convertedAt: '2026-04-10T09:00:00Z',
        touchpoints: [
          { id: 'tp-1', timestamp: '2026-04-09T12:00:00Z', channel: 'paid_social', source: 'facebook', medium: 'cpc', campaign: 'spring-ads' },
          { id: 'tp-2', timestamp: '2026-04-09T17:00:00Z', channel: 'email', source: 'newsletter', medium: 'email', campaign: 'welcome' },
          { id: 'tp-3', timestamp: '2026-04-10T08:30:00Z', channel: 'organic_search', source: 'google', medium: 'organic', campaign: 'sofwave-blog' },
        ],
      },
      {
        leadId: 'lead-2',
        converted: true,
        conversionValue: 300,
        convertedAt: '2026-04-10T10:00:00Z',
        touchpoints: [
          { id: 'tp-4', timestamp: '2026-04-10T08:00:00Z', channel: 'organic_search', source: 'google', medium: 'organic', campaign: 'blog' },
          { id: 'tp-5', timestamp: '2026-04-10T09:00:00Z', channel: 'paid_search', source: 'google', medium: 'cpc', campaign: 'sofwave-pps' },
        ],
      },
      {
        leadId: 'lead-3',
        converted: false,
        touchpoints: [
          { id: 'tp-6', timestamp: '2026-04-05T12:00:00Z', channel: 'paid_social', source: 'instagram', medium: 'cpc', campaign: 'cold-traffic' },
        ],
      },
    ];

    it('filters out non-converted journeys for attribution totals', () => {
      const result = runAttribution(journeys, 'first_touch');
      expect(result.totalConversions).toBe(2);
      expect(result.totalRevenue).toBe(800);
    });

    it('first-touch model assigns full credit to first touch only', () => {
      const result = runAttribution(journeys, 'first_touch');
      const paidSocial = result.touchpointBreakdown.find(c => c.touchpoint.id === 'tp-1');
      const email = result.touchpointBreakdown.find(c => c.touchpoint.id === 'tp-2');
      const organic = result.touchpointBreakdown.find(c => c.touchpoint.id === 'tp-3');

      expect(paidSocial?.credit).toBe(1);
      expect(paidSocial?.creditRevenue).toBe(500);
      expect(email?.credit).toBe(0);
      expect(organic?.credit).toBe(0);
      expect(result.channelCredits.find(c => c.channel === 'organic_search')?.conversions).toBe(1);
    });

    it('last-touch model assigns full credit to last converted touchpoint', () => {
      const result = runAttribution(journeys, 'last_touch');
      expect(result.touchpointBreakdown.find(c => c.touchpoint.id === 'tp-3')?.credit).toBe(1);
      expect(result.touchpointBreakdown.find(c => c.touchpoint.id === 'tp-1')?.credit).toBe(0);
      expect(result.channelCredits.find(c => c.channel === 'organic_search')?.revenue).toBe(500);
      expect(result.channelCredits.find(c => c.channel === 'paid_search')?.conversions).toBe(1);
    });

    it('linear model distributes equal fractional credit', () => {
      const result = runAttribution(journeys, 'linear');
      const tp1 = result.touchpointBreakdown.find(c => c.touchpoint.id === 'tp-1');
      const tp2 = result.touchpointBreakdown.find(c => c.touchpoint.id === 'tp-2');
      const tp3 = result.touchpointBreakdown.find(c => c.touchpoint.id === 'tp-3');
      expect(tp1?.credit).toBe(1 / 3);
      expect(tp2?.credit).toBe(1 / 3);
      expect(tp3?.credit).toBe(1 / 3);
      expect(tp1?.creditRevenue).toBe(500 / 3);
      expect(tp3?.creditRevenue).toBe(500 / 3);
      expect(result.channelCredits.find(c => c.channel === 'organic_search')?.conversions).toBeCloseTo(0.83, 2);
    });

    it('time-decay gives more credit to later touchpoints', () => {
      const result = runAttribution(journeys, 'time_decay');
      const first = result.touchpointBreakdown.find(c => c.touchpoint.id === 'tp-1');
      const last = result.touchpointBreakdown.find(c => c.touchpoint.id === 'tp-3');
      expect(last?.credit).toBeGreaterThan(first?.credit ?? 0);
      expect(result.totalConversions).toBe(2);
    });

    it('position-based model assigns 40/40 with middle split for 3+ touches', () => {
      const result = runAttribution(journeys, 'position_based');
      const first = result.touchpointBreakdown.find(c => c.touchpoint.id === 'tp-1');
      const middle = result.touchpointBreakdown.find(c => c.touchpoint.id === 'tp-2');
      const last = result.touchpointBreakdown.find(c => c.touchpoint.id === 'tp-3');
      expect(first?.credit).toBe(0.4);
      expect(last?.credit).toBe(0.4);
      expect(middle?.credit).toBe(0.2);
      expect(first?.creditRevenue).toBe(200);
      expect(last?.creditRevenue).toBe(200);
    });

    it('applies spend-aware CPA and ROAS at campaign and channel level', () => {
      const spends: CampaignSpend[] = [
        { campaign: 'spring-ads', channel: 'paid_social', spend: 120, startDate: '2026-04-01', endDate: '2026-04-30' },
        { campaign: 'welcome', channel: 'email', spend: 0, startDate: '2026-04-01', endDate: '2026-04-30' },
        { campaign: 'sofwave-pps', channel: 'paid_search', spend: 200, startDate: '2026-04-01', endDate: '2026-04-30' },
      ];

      const result = runAttribution(journeys, 'position_based', spends);
      const paidSearch = result.campaignCredits.find((c) => c.campaign === 'sofwave-pps');
      const spring = result.campaignCredits.find((c) => c.campaign === 'spring-ads');
      expect(paidSearch?.spend).toBe(200);
      expect(paidSearch?.costPerAcquisition).toBe(400);
      expect(paidSearch?.roas).toBe(0.75);
      expect(spring?.costPerAcquisition).toBeGreaterThan(0);

      const paidSearchChannel = result.channelCredits.find((c) => c.channel === 'paid_search');
      expect(paidSearchChannel?.roas).toBe(0.75);
      expect(paidSearchChannel?.costPerAcquisition).toBe(400);
    });

    it('returns touchpoint records with positions and journey lengths', () => {
      const result = runAttribution(journeys, 'first_touch');
      const seq = result.touchpointBreakdown.map(t => `${t.touchpoint.id}:${t.position}/${t.journeyLength}`);
      expect(seq).toEqual([
        'tp-1:1/3',
        'tp-2:2/3',
        'tp-3:3/3',
        'tp-4:1/2',
        'tp-5:2/2',
      ]);
      for (const tp of result.touchpointBreakdown) {
        expect(tp.position).toBeGreaterThan(0);
        expect(tp.journeyLength).toBeGreaterThan(0);
      }
    });
  });

  describe('compareModels', () => {
    it('includes all active channels and returns a deterministic model payload', () => {
      const journeys: CustomerJourney[] = [
        {
          leadId: 'a',
          converted: true,
          conversionValue: 100,
          convertedAt: '2026-04-09T12:00:00Z',
          touchpoints: [
            { id: 'x1', timestamp: '2026-04-08T12:00:00Z', channel: 'email', source: 'email', medium: 'email', campaign: 'e1' },
            { id: 'x2', timestamp: '2026-04-09T11:00:00Z', channel: 'paid_search', source: 'google', medium: 'cpc', campaign: 'p1' },
          ],
        },
        {
          leadId: 'b',
          converted: true,
          conversionValue: 200,
          convertedAt: '2026-04-10T12:00:00Z',
          touchpoints: [
            { id: 'x3', timestamp: '2026-04-09T10:00:00Z', channel: 'paid_search', source: 'google', medium: 'cpc', campaign: 'p1' },
          ],
        },
      ];

      const comparisons = compareModels(journeys);
      const paidSearch = comparisons.find(c => c.channel === 'paid_search');
      const email = comparisons.find(c => c.channel === 'email');

      expect(comparisons.length).toBe(2);
      expect(paidSearch?.models.first_touch.share).toBeGreaterThan(0);
      expect(paidSearch?.models.last_touch.share).toBeGreaterThan(0);
      expect(paidSearch?.models.linear.share).toBeGreaterThan(0);
      expect((paidSearch?.insight || '').length).toBeGreaterThan(0);
      expect(email?.models.position_based.conversions).toBe(0.5);
      expect(email?.models.last_touch.share).toBe(0);
    });

    it('keeps shares within 0-100 bounds', () => {
      const journeys: CustomerJourney[] = [
        {
          leadId: 'a',
          converted: true,
          conversionValue: 100,
          convertedAt: '2026-04-09T12:00:00Z',
          touchpoints: [
            { id: 'x1', timestamp: '2026-04-08T12:00:00Z', channel: 'email', source: 'email', medium: 'email', campaign: 'e1' },
          ],
        },
      ];

      const comparisons = compareModels(journeys);
      for (const c of comparisons) {
        for (const modelValues of Object.values(c.models)) {
          expect(modelValues.share).toBeGreaterThanOrEqual(0);
          expect(modelValues.share).toBeLessThanOrEqual(100);
        }
      }
    });
  });

  describe('mapCustomerJourney', () => {
    it('orders touchpoints by timestamp and computes journey duration', () => {
      const mapped = mapCustomerJourney({
        leadId: 'lead-1',
        converted: true,
        conversionValue: 100,
        convertedAt: '2026-04-10T12:00:00Z',
        touchpoints: [
          { id: 't3', timestamp: '2026-04-01T12:00:00Z', channel: 'email', source: 'email', medium: 'email' },
          { id: 't1', timestamp: '2026-03-28T12:00:00Z', channel: 'paid_search', source: 'google', medium: 'cpc' },
          { id: 't2', timestamp: '2026-03-30T12:00:00Z', channel: 'organic_social', source: 'instagram', medium: 'social' },
        ],
      });

      expect(mapped.totalTouchpoints).toBe(3);
      expect(mapped.touchSequence.map(s => s.step)).toEqual([1, 2, 3]);
      expect(mapped.touchSequence[0].timestamp).toBe('2026-03-28T12:00:00Z');
      expect(mapped.touchSequence[1].daysFromFirst).toBe(2);
      expect(mapped.touchSequence[2].daysToConversion).toBe(9);
      expect(mapped.journeyDuration).toBe(4);
      expect(mapped.converted).toBe(true);
    });

    it('handles empty touchpoints without throwing', () => {
      const mapped = mapCustomerJourney({
        leadId: 'lead-empty',
        converted: false,
        touchpoints: [],
      });
      expect(mapped.totalTouchpoints).toBe(0);
      expect(mapped.touchSequence).toEqual([]);
      expect(mapped.journeyDuration).toBe(0);
    });
  });

  describe('calculateChannelPerformance', () => {
    it('calculates leads, conversions, CPA, and ROAS', () => {
      const journeys: CustomerJourney[] = [
        {
          leadId: 'lead-1',
          converted: true,
          conversionValue: 400,
          convertedAt: '2026-04-10T12:00:00Z',
          touchpoints: [
            { id: 'a1', timestamp: '2026-04-09T12:00:00Z', channel: 'paid_search', source: 'google', medium: 'cpc', campaign: 'p1' },
          ],
        },
        {
          leadId: 'lead-2',
          converted: false,
          touchpoints: [
            { id: 'a2', timestamp: '2026-04-10T10:00:00Z', channel: 'paid_search', source: 'google', medium: 'cpc', campaign: 'p1' },
          ],
        },
      ];
      const spend: Record<MarketingChannel, number> = {
        organic_search: 0,
        paid_search: 240,
        paid_social: 0,
        organic_social: 0,
        referral: 0,
        direct: 0,
        email: 0,
        display: 0,
        affiliate: 0,
        other: 0,
      };

      const metrics = calculateChannelPerformance(journeys, spend, 'linear');
      const paidSearch = metrics.find(m => m.channel === 'paid_search');

      expect(paidSearch).toMatchObject({
        leads: 1,
        conversions: 1,
        revenue: 400,
        spend: 240,
        cpa: 240,
        roas: 1.67,
      });
      expect(paidSearch?.conversionRate).toBe(50);
    });
  });

  describe('getJourneyStats', () => {
    it('returns meaningful averages and most common endpoints', () => {
      const journeys: CustomerJourney[] = [
        {
          leadId: 'x1',
          converted: true,
          conversionValue: 500,
          convertedAt: '2026-04-10T12:00:00Z',
          touchpoints: [
            { id: 'x1', timestamp: '2026-04-05T00:00:00Z', channel: 'paid_social', source: 'facebook', medium: 'cpc', campaign: 'c1' },
            { id: 'x1-2', timestamp: '2026-04-10T12:00:00Z', channel: 'organic_search', source: 'google', medium: 'organic', campaign: 'c2' },
          ],
        },
        {
          leadId: 'x2',
          converted: true,
          conversionValue: 300,
          convertedAt: '2026-04-11T12:00:00Z',
          touchpoints: [
            { id: 'x2', timestamp: '2026-04-02T00:00:00Z', channel: 'email', source: 'email', medium: 'email', campaign: 'c3' },
          ],
        },
        {
          leadId: 'x3',
          converted: false,
          touchpoints: [
            { id: 'x3', timestamp: '2026-04-01T00:00:00Z', channel: 'referral', source: 'friend', medium: 'referral', campaign: 'c4' },
          ],
        },
      ];

      const stats = getJourneyStats(journeys);
      expect(stats.avgTouchpointsConverted).toBe(1.5);
      expect(stats.avgTouchpointsNonConverted).toBe(1);
      expect(stats.avgDaysToConvert).toBe(7.5);
      expect(stats.medianTouchpointsConverted).toBe(2);
      expect(stats.mostCommonFirstChannel).toBe('paid_social');
      expect(stats.mostCommonLastChannel).toBe('organic_search');
    });
  });
});
