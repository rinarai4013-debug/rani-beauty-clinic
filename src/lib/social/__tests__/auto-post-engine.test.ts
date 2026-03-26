// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { generateSocialPlan, type SocialInput, type ServiceInfo } from '../auto-post-engine';

function makeService(overrides: Partial<ServiceInfo> = {}): ServiceInfo {
  return {
    name: 'HydraFacial', category: 'Facial', price: 275, popularity: 80,
    beforeAfterAvailable: true,
    educationalPoints: ['HydraFacial uses vortex technology to cleanse, extract, and hydrate.'],
    ...overrides,
  };
}

function makeInput(overrides: Partial<SocialInput> = {}): SocialInput {
  return {
    services: [
      makeService(),
      makeService({ name: 'Botox', category: 'Injectable', price: 400, popularity: 70, beforeAfterAvailable: false }),
      makeService({ name: 'GLP-1', category: 'Wellness', price: 399, popularity: 50, beforeAfterAvailable: false, educationalPoints: ['Medical weight management with GLP-1.'] }),
      makeService({ name: 'Laser Hair Removal', category: 'Hair Removal', price: 225, popularity: 60, beforeAfterAvailable: true }),
    ],
    recentPromotions: [{ title: 'Spring Sale', discount: '20% off facials', validUntil: '2026-04-01', services: ['HydraFacial'] }],
    clinicStats: { totalClients: 2181, monthlyBookings: 300, googleRating: 4.9, reviewCount: 125, topService: 'HydraFacial', membershipCount: 30 },
    seasonality: { currentMonth: 3, upcomingHolidays: ['Easter'], season: 'spring', weddingSeason: false },
    ...overrides,
  };
}

describe('Social Auto-Post Engine', () => {
  // ── Structure ──
  it('returns all expected fields', () => {
    const r = generateSocialPlan(makeInput());
    expect(r).toHaveProperty('weeklyCalendar');
    expect(r).toHaveProperty('monthlyThemes');
    expect(r).toHaveProperty('contentQueue');
    expect(r).toHaveProperty('hashtagSets');
    expect(r).toHaveProperty('optimalPostingTimes');
    expect(r).toHaveProperty('performanceInsights');
    expect(r).toHaveProperty('contentScore');
  });

  it('contentScore is 0-100', () => {
    const r = generateSocialPlan(makeInput());
    expect(r.contentScore).toBeGreaterThanOrEqual(0);
    expect(r.contentScore).toBeLessThanOrEqual(100);
  });

  // ── Weekly Calendar ──
  it('generates 7 days in weekly calendar', () => {
    const r = generateSocialPlan(makeInput());
    expect(r.weeklyCalendar).toHaveLength(7);
  });

  it('each day has posts', () => {
    const r = generateSocialPlan(makeInput());
    r.weeklyCalendar.forEach(day => {
      expect(day.posts.length).toBeGreaterThan(0);
    });
  });

  it('Monday has educational content', () => {
    const r = generateSocialPlan(makeInput());
    const monday = r.weeklyCalendar.find(d => d.dayOfWeek === 'Monday');
    expect(monday!.posts.some(p => p.category === 'educational')).toBe(true);
  });

  it('Tuesday has before/after when available', () => {
    const r = generateSocialPlan(makeInput());
    const tuesday = r.weeklyCalendar.find(d => d.dayOfWeek === 'Tuesday');
    expect(tuesday!.posts.some(p => p.category === 'before_after')).toBe(true);
  });

  it('Wednesday has wellness content', () => {
    const r = generateSocialPlan(makeInput());
    const wednesday = r.weeklyCalendar.find(d => d.dayOfWeek === 'Wednesday');
    expect(wednesday!.posts.some(p => p.category === 'wellness_tip')).toBe(true);
  });

  it('Friday has GBP offer when promotions exist', () => {
    const r = generateSocialPlan(makeInput());
    const friday = r.weeklyCalendar.find(d => d.dayOfWeek === 'Friday');
    expect(friday!.posts.some(p => p.platform === 'gbp')).toBe(true);
  });

  // ── Content Queue ──
  it('generates content for top services', () => {
    const r = generateSocialPlan(makeInput());
    expect(r.contentQueue.length).toBeGreaterThan(0);
  });

  it('includes before/after for services that have it', () => {
    const r = generateSocialPlan(makeInput());
    expect(r.contentQueue.some(c => c.category === 'before_after')).toBe(true);
  });

  it('sorted by engagement (highest first)', () => {
    const r = generateSocialPlan(makeInput());
    for (let i = 1; i < r.contentQueue.length; i++) {
      expect(r.contentQueue[i - 1].estimatedEngagement).toBeGreaterThanOrEqual(r.contentQueue[i].estimatedEngagement);
    }
  });

  it('includes seasonal content', () => {
    const r = generateSocialPlan(makeInput());
    expect(r.contentQueue.some(c => c.category === 'seasonal')).toBe(true);
  });

  // ── Content Items ──
  it('content items have all required fields', () => {
    const r = generateSocialPlan(makeInput());
    const item = r.contentQueue[0];
    expect(item).toHaveProperty('platform');
    expect(item).toHaveProperty('type');
    expect(item).toHaveProperty('category');
    expect(item).toHaveProperty('caption');
    expect(item).toHaveProperty('hashtags');
    expect(item).toHaveProperty('callToAction');
    expect(item).toHaveProperty('suggestedImageDesc');
    expect(item).toHaveProperty('estimatedEngagement');
  });

  it('content items include brand hashtags', () => {
    const r = generateSocialPlan(makeInput());
    const item = r.contentQueue.find(c => c.hashtags.length > 0);
    expect(item!.hashtags.some(h => h.includes('Rani'))).toBe(true);
  });

  // ── Monthly Themes ──
  it('generates 4 monthly themes', () => {
    const r = generateSocialPlan(makeInput());
    expect(r.monthlyThemes).toHaveLength(4);
  });

  it('monthly themes have focus service and content mix', () => {
    const r = generateSocialPlan(makeInput());
    r.monthlyThemes.forEach(theme => {
      expect(theme.focusService).toBeDefined();
      expect(theme.contentMix.length).toBeGreaterThan(0);
    });
  });

  it('spring theme includes spring services', () => {
    const r = generateSocialPlan(makeInput());
    expect(r.monthlyThemes[0].theme).toContain('Spring');
  });

  // ── Hashtag Sets ──
  it('includes branded, location, and industry hashtag sets', () => {
    const r = generateSocialPlan(makeInput());
    expect(r.hashtagSets.some(s => s.category === 'Branded')).toBe(true);
    expect(r.hashtagSets.some(s => s.category === 'Location')).toBe(true);
    expect(r.hashtagSets.some(s => s.category === 'Industry')).toBe(true);
  });

  it('includes service-specific hashtag sets', () => {
    const r = generateSocialPlan(makeInput());
    expect(r.hashtagSets.some(s => s.category === 'Facial')).toBe(true);
  });

  // ── Posting Times ──
  it('generates posting times for all 7 days x 2 platforms', () => {
    const r = generateSocialPlan(makeInput());
    expect(r.optimalPostingTimes).toHaveLength(14);
  });

  it('posting times include both instagram and gbp', () => {
    const r = generateSocialPlan(makeInput());
    expect(r.optimalPostingTimes.some(t => t.platform === 'instagram')).toBe(true);
    expect(r.optimalPostingTimes.some(t => t.platform === 'gbp')).toBe(true);
  });

  // ── Insights ──
  it('generates seasonal insight', () => {
    const r = generateSocialPlan(makeInput());
    expect(r.performanceInsights.some(i => i.includes('Spring'))).toBe(true);
  });

  it('highlights top service', () => {
    const r = generateSocialPlan(makeInput());
    expect(r.performanceInsights.some(i => i.includes('HydraFacial'))).toBe(true);
  });

  it('highlights before/after content engagement', () => {
    const r = generateSocialPlan(makeInput());
    expect(r.performanceInsights.some(i => i.includes('Before/after'))).toBe(true);
  });

  it('highlights Google rating', () => {
    const r = generateSocialPlan(makeInput());
    expect(r.performanceInsights.some(i => i.includes('4.9'))).toBe(true);
  });

  // ── Content Scoring ──
  it('higher score with diverse content types', () => {
    const r = generateSocialPlan(makeInput());
    expect(r.contentScore).toBeGreaterThan(50);
  });

  // ── Seasonal Variations ──
  it('generates summer-themed content', () => {
    const r = generateSocialPlan(makeInput({
      seasonality: { currentMonth: 7, upcomingHolidays: [], season: 'summer', weddingSeason: true },
    }));
    expect(r.monthlyThemes[0].theme).toContain('Summer');
  });

  // ── Edge Cases ──
  it('handles single service', () => {
    const r = generateSocialPlan(makeInput({
      services: [makeService()],
    }));
    expect(r.contentQueue.length).toBeGreaterThan(0);
  });

  it('handles no promotions', () => {
    const r = generateSocialPlan(makeInput({ recentPromotions: [] }));
    const friday = r.weeklyCalendar.find(d => d.dayOfWeek === 'Friday');
    // Should not crash, just no GBP offer
    expect(friday).toBeDefined();
  });

  it('handles no before/after available', () => {
    const r = generateSocialPlan(makeInput({
      services: [makeService({ beforeAfterAvailable: false })],
    }));
    const tuesday = r.weeklyCalendar.find(d => d.dayOfWeek === 'Tuesday');
    expect(tuesday).toBeDefined();
  });

  // ── Engagement Estimation ──
  it('reels get higher engagement than static posts', () => {
    const r = generateSocialPlan(makeInput());
    const reel = r.contentQueue.find(c => c.type === 'reel');
    const feedPost = r.contentQueue.find(c => c.type === 'feed_post' && c.category === reel?.category);
    if (reel && feedPost) {
      expect(reel.estimatedEngagement).toBeGreaterThan(feedPost.estimatedEngagement);
    }
  });
});
