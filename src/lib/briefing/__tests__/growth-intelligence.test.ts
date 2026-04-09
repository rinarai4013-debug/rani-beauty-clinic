// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { buildGrowthIntelligence } from '../growth-intelligence';

describe('buildGrowthIntelligence', () => {
  it('prefers real attributed booking revenue over flat lead heuristics', () => {
    const result = buildGrowthIntelligence(
      {
        newLeads: 7,
        leadsBySource: { Meta: 4, Email: 3 },
        avgLeadScore: 0,
        reviewCount: 0,
        avgRating: 0,
        reviewVelocity: 0,
      },
      {
        totalActiveCodes: 0,
        newCodes: 0,
        conversions: 1,
        revenueAttributed: 900,
      },
      {
        total: 8000,
        byProvider: {},
        byService: {},
        byCategory: {},
        byPaymentMethod: {},
        transactionCount: 10,
        avgTicket: 500,
        financingTotal: 0,
      },
      {
        bySource: {
          Meta: { bookings: 2, revenue: 1500 },
          Email: { bookings: 1, revenue: 250 },
        },
      }
    );

    expect(result.topChannel).toBe('meta');
    expect(result.topChannels[0]).toMatchObject({
      channel: 'meta',
      bookings: 2,
      attributedRevenue: 1500,
      estimatedRevenue: 1500,
      leadToBookingRate: 50,
    });
    expect(result.weakestChannel).toBe('email');
  });
});
