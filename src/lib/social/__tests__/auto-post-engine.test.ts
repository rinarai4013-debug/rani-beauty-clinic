import { describe, it, expect } from 'vitest';
import { generateSocialPlan, type SocialInput } from '../auto-post-engine';

function buildInput(overrides: Partial<SocialInput> = {}): SocialInput {
  return {
    services: [
      { name: 'HydraFacial', category: 'facial', price: 275, popularity: 90, beforeAfterAvailable: true, educationalPoints: ['Deeply cleanses pores'] },
      { name: 'Botox', category: 'injectable', price: 400, popularity: 95, beforeAfterAvailable: true, educationalPoints: ['Reduces fine lines'] },
    ],
    recentPromotions: [
      { title: 'Spring Refresh', discount: '20% off', validUntil: '2026-05-01', services: ['HydraFacial'] },
    ],
    clinicStats: {
      totalClients: 2181,
      monthlyBookings: 350,
      googleRating: 4.9,
      reviewCount: 127,
      topService: 'HydraFacial',
      membershipCount: 85,
    },
    seasonality: {
      currentMonth: 4,
      upcomingHolidays: ['Easter'],
      season: 'spring',
      weddingSeason: false,
    },
    previousPosts: [],
    ...overrides,
  };
}

describe('generateSocialPlan', () => {
  it('returns all expected result keys', () => {
    const result = generateSocialPlan(buildInput());
    expect(result).toHaveProperty('weeklyCalendar');
    expect(result).toHaveProperty('monthlyThemes');
    expect(result).toHaveProperty('hashtagSets');
    expect(result).toHaveProperty('optimalPostingTimes');
    expect(result).toHaveProperty('contentScore');
    expect(result).toHaveProperty('performanceInsights');
  });

  it('generates 7 days of content', () => {
    const { weeklyCalendar } = generateSocialPlan(buildInput());
    expect(weeklyCalendar).toHaveLength(7);
  });

  it('each day has at least one post', () => {
    const { weeklyCalendar } = generateSocialPlan(buildInput());
    for (const day of weeklyCalendar) {
      expect(day.posts.length).toBeGreaterThan(0);
      for (const post of day.posts) {
        expect(post.caption).toBeTruthy();
        expect(post.platform).toBeTruthy();
      }
    }
  });

  it('includes hashtag sets', () => {
    const { hashtagSets } = generateSocialPlan(buildInput());
    expect(hashtagSets.length).toBeGreaterThan(0);
  });

  it('includes posting time recommendations', () => {
    const { optimalPostingTimes } = generateSocialPlan(buildInput());
    expect(optimalPostingTimes.length).toBeGreaterThan(0);
  });

  it('produces contentScore between 0 and 100', () => {
    const { contentScore } = generateSocialPlan(buildInput());
    expect(contentScore).toBeGreaterThanOrEqual(0);
    expect(contentScore).toBeLessThanOrEqual(100);
  });

  it('generates monthly themes', () => {
    const { monthlyThemes } = generateSocialPlan(buildInput());
    expect(monthlyThemes.length).toBeGreaterThan(0);
    expect(monthlyThemes[0].theme).toBeTruthy();
  });
});
