import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

process.env.TZ = 'UTC';

import {
  assignGrade,
  calculateDecay,
  calibrateModel,
  getGradeDefinitions,
  getPipelineSummary,
  getSourceQualityRanking,
  scoreLead,
  scoreLeads,
  type LeadScoringInput,
} from '@/lib/marketing/lead-scoring';

type LeadBuilder = {
  leadOverrides?: Partial<LeadScoringInput['lead']>;
  behavioralOverrides?: Partial<LeadScoringInput['behavioral']>;
  engagementOverrides?: Partial<LeadScoringInput['engagement']>;
};

function makeLeadScoringInput(overrides: LeadBuilder = {}): LeadScoringInput {
  return {
    lead: {
      id: 'lead-1',
      name: 'Rina',
      email: 'rina@example.com',
      source: 'google_organic',
      createdAt: '2026-04-10T08:00:00.000Z',
      lastActivityAt: '2026-04-10T08:00:00.000Z',
      status: 'new',
      location: {
        city: 'Renton',
        state: 'WA',
        distanceMiles: 2,
      },
      ...overrides.leadOverrides,
    },
    behavioral: {
      totalPageViews: 20,
      uniquePageViews: 12,
      totalSessions: 6,
      avgSessionDuration: 420,
      pagesPerSession: 5,
      returnVisits: 3,
      lastSessionDate: '2026-04-10T09:00:00.000Z',
      pagesViewed: [
        {
          path: '/pricing',
          category: 'pricing',
          viewCount: 1,
          totalTimeSeconds: 240,
          lastViewed: '2026-04-10T09:05:00.000Z',
        },
        {
          path: '/sofwave',
          category: 'service',
          viewCount: 2,
          totalTimeSeconds: 260,
          lastViewed: '2026-04-10T09:10:00.000Z',
        },
      ],
      ...overrides.behavioralOverrides,
    },
    engagement: {
      chatInteractions: 1,
      chatMessages: 4,
      formSubmissions: 1,
      emailOpens: 1,
      emailClicks: 0,
      smsReplies: 0,
      phoneCallsMade: 0,
      downloadedContent: [],
      quizCompleted: true,
      consultFormStarted: false,
      consultFormCompleted: false,
      ...overrides.engagementOverrides,
    },
  };
}

describe('marketing/lead-scoring', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-10T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('calculateDecay', () => {
    it.each([
      [3, 0],
      [4, 2],
      [5, 3],
      [10, 11],
      [50, 60],
      [70, 60],
    ])('decays %i days since activity to %i%%', (daysSince, expected) => {
      const lastActivityAt = new Date(Date.now() - daysSince * 24 * 60 * 60 * 1000).toISOString();
      expect(calculateDecay(lastActivityAt)).toBe(expected);
    });
  });

  describe('assignGrade', () => {
    it.each([
      [24, 'D'],
      [25, 'C'],
      [49, 'C'],
      [50, 'B'],
      [74, 'B'],
      [75, 'A'],
      [100, 'A'],
    ])('score %i maps to grade %s', (score, expected) => {
      expect(assignGrade(score).grade).toBe(expected);
    });

    it('returns immutable grade definition objects', () => {
      const definitions = getGradeDefinitions();
      definitions[0].label = 'Corrupt';
      expect(getGradeDefinitions()[0].label).not.toBe('Corrupt');
    });
  });

  describe('scoreLead', () => {
    it('classifies strong intent leads as hot and auto-assigns frontdesk', () => {
      const result = scoreLead(makeLeadScoringInput({
        leadOverrides: {
          lastActivityAt: '2026-04-10T11:00:00.000Z',
        },
        behavioralOverrides: {
          pagesPerSession: 8,
          returnVisits: 5,
          avgSessionDuration: 720,
          pagesViewed: [
            {
              path: '/booking',
              category: 'booking',
              viewCount: 1,
              totalTimeSeconds: 200,
              lastViewed: '2026-04-10T11:45:00.000Z',
            },
          ],
        },
        engagementOverrides: {
          consultFormCompleted: true,
          chatInteractions: 2,
          chatMessages: 8,
          phoneCallsMade: 0,
          smsReplies: 0,
          emailOpens: 1,
          emailClicks: 1,
          formSubmissions: 2,
          quizCompleted: true,
          consultFormStarted: false,
        },
      }));

      expect(result.grade).toBe('A');
      expect(result.autoAssign).toBe(true);
      expect(result.assignTo).toBe('frontdesk');
      expect(result.urgency).toBe('immediate');
      expect(result.recommendation.channel).toBe('phone');
    });

    it('downgrades low signal leads to nurture', () => {
      const result = scoreLead(makeLeadScoringInput({
        leadOverrides: {
          source: 'tiktok',
          lastActivityAt: '2026-03-30T12:00:00.000Z',
          location: {
            state: 'CA',
            distanceMiles: 200,
          },
        },
        behavioralOverrides: {
          pagesPerSession: 1,
          returnVisits: 0,
          avgSessionDuration: 30,
          pagesViewed: [
            {
              path: '/about',
              category: 'about',
              viewCount: 1,
              totalTimeSeconds: 10,
              lastViewed: '2026-03-30T11:50:00.000Z',
            },
          ],
        },
        engagementOverrides: {
          chatInteractions: 0,
          chatMessages: 0,
          formSubmissions: 0,
          emailOpens: 0,
          emailClicks: 0,
          smsReplies: 0,
          phoneCallsMade: 0,
          downloadedContent: [],
          quizCompleted: false,
          consultFormStarted: false,
          consultFormCompleted: false,
        },
      }));

      expect(result.grade).toBe('D');
      expect(result.autoAssign).toBe(false);
      expect(result.urgency).toBe('nurture');
    });

    it('returns zero score when decay reaches cap and base score is low', () => {
      const result = scoreLead(makeLeadScoringInput({
        leadOverrides: {
          source: 'other',
          lastActivityAt: '2026-03-20T00:00:00.000Z',
          location: {
            city: 'Seattle',
            state: 'WA',
            distanceMiles: 100,
          },
        },
        behavioralOverrides: {
          totalPageViews: 1,
          uniquePageViews: 1,
          totalSessions: 1,
          pagesPerSession: 1,
          returnVisits: 0,
          avgSessionDuration: 10,
          lastSessionDate: '2026-03-20T00:00:00.000Z',
          pagesViewed: [
            {
              path: '/about',
              category: 'about',
              viewCount: 1,
              totalTimeSeconds: 10,
              lastViewed: '2026-03-20T00:00:00.000Z',
            },
          ],
        },
        engagementOverrides: {
          chatInteractions: 0,
          chatMessages: 0,
          formSubmissions: 0,
          emailOpens: 0,
          emailClicks: 0,
          smsReplies: 0,
          phoneCallsMade: 0,
          downloadedContent: [],
          quizCompleted: false,
          consultFormStarted: false,
          consultFormCompleted: false,
        },
      }));

      expect(result.decayApplied).toBe(28);
      expect(result.totalScore).toBe(5);
    });
  });

  describe('scoreLeads', () => {
    it('sorts leads descending by totalScore', () => {
      const ranked = scoreLeads([
        makeLeadScoringInput({
          leadOverrides: { id: 'cold' },
          behavioralOverrides: {
            pagesPerSession: 1,
            returnVisits: 0,
            avgSessionDuration: 10,
            pagesViewed: [
              {
                path: '/about',
                category: 'about',
                viewCount: 1,
                totalTimeSeconds: 5,
                lastViewed: '2026-04-10T11:00:00.000Z',
              },
            ],
          },
        }),
        makeLeadScoringInput({
          leadOverrides: { id: 'hot' },
          engagementOverrides: {
            consultFormCompleted: true,
            consultFormStarted: false,
            chatMessages: 9,
            formSubmissions: 2,
          },
          behavioralOverrides: {
            pagesPerSession: 8,
            returnVisits: 4,
            avgSessionDuration: 1800,
            pagesViewed: [
              {
                path: '/booking',
                category: 'booking',
                viewCount: 2,
                totalTimeSeconds: 300,
                lastViewed: '2026-04-10T11:30:00.000Z',
              },
            ],
          },
        }),
      ]);

      expect(ranked.map((item) => item.leadId)).toEqual(['hot', 'cold']);
      expect(ranked[0].grade).toBe('A');
      expect(ranked[1].grade).toBe('C');
    });
  });

  describe('model quality and summaries', () => {
    it('calculates conversion rates and model accuracy', () => {
      const calibration = calibrateModel([
        { grade: 'A', converted: true, source: 'google_organic' },
        { grade: 'B', converted: false, source: 'google_organic' },
        { grade: 'C', converted: true, source: 'tiktok' },
        { grade: 'D', converted: false, source: 'meta_ads' },
      ]);

      expect(calibration.avgDaysToConvert).toBe(14);
      expect(calibration.gradeConversionRates.A).toBe(100);
      expect(calibration.gradeConversionRates.B).toBe(0);
      expect(calibration.sourceConversionRates.google_organic).toBe(50);
      expect(calibration.modelAccuracy).toBe(50);
    });

    it('returns safety values when no scored leads are provided', () => {
      const calibration = calibrateModel([]);
      expect(calibration.modelAccuracy).toBe(0);
      expect(calibration.gradeConversionRates.A).toBe(0);
      expect(calibration.sourceConversionRates).toEqual({});
    });

    it('returns source quality ranking in descending percentage order', () => {
      const ranking = getSourceQualityRanking();
      expect(ranking[0].source).toBe('google_organic');
      expect(ranking[0].quality).toBe(100);
      expect(ranking[ranking.length - 1].quality).toBeLessThan(ranking[0].quality);
    });

    it('builds pipeline summary with grade and urgency breakdown', () => {
      const scored = scoreLeads([
        makeLeadScoringInput({
          leadOverrides: { id: 'lead-1' },
          engagementOverrides: {
            consultFormCompleted: true,
            consultFormStarted: false,
            chatMessages: 10,
          },
          behavioralOverrides: {
            pagesPerSession: 9,
            returnVisits: 4,
            avgSessionDuration: 1200,
            pagesViewed: [
              {
                path: '/booking',
                category: 'booking',
                viewCount: 1,
                totalTimeSeconds: 300,
                lastViewed: '2026-04-10T11:20:00.000Z',
              },
            ],
          },
        }),
        makeLeadScoringInput({
          leadOverrides: {
            id: 'lead-2',
            source: 'tiktok',
          },
          behavioralOverrides: {
            pagesPerSession: 1,
            returnVisits: 0,
            avgSessionDuration: 15,
            pagesViewed: [
              {
                path: '/about',
                category: 'about',
                viewCount: 1,
                totalTimeSeconds: 10,
                lastViewed: '2026-04-10T11:00:00.000Z',
              },
            ],
          },
          engagementOverrides: {
            chatMessages: 0,
            formSubmissions: 0,
            chatInteractions: 0,
          },
        }),
      ]);
      const summary = getPipelineSummary(scored);
      expect(summary.total).toBe(2);
      expect(summary.hotLeads).toBe(1);
      expect(summary.byUrgency.immediate).toBe(1);
      expect(summary.byUrgency.nurture).toBe(1);
    });
  });
});
