import { describe, expect, it } from 'vitest';

import {
  WEEKLY_REVIEW_CHECKLIST,
  RECORDING_ANALYSIS_PROTOCOL,
  HEATMAP_ANALYSIS_GUIDES,
  CONVERSION_PLAYBOOK,
  generateReportTemplate,
} from '@/lib/analytics/weekly-insight-engine';

describe('analytics/weekly-insight-engine', () => {
  it('defines review checklist categories with actionable tasks', () => {
    expect(WEEKLY_REVIEW_CHECKLIST.length).toBeGreaterThan(0);

    for (const checklist of WEEKLY_REVIEW_CHECKLIST) {
      expect(checklist.category.length).toBeGreaterThan(0);
      expect(checklist.tasks.length).toBeGreaterThan(0);

      for (const task of checklist.tasks) {
        expect(task.task.length).toBeGreaterThan(0);
        expect(task.where.length).toBeGreaterThan(0);
        expect(task.action.length).toBeGreaterThan(0);
      }
    }
  });

  it('keeps the recording analysis protocol ordered by step', () => {
    expect(RECORDING_ANALYSIS_PROTOCOL.map((step) => step.step)).toEqual([
      1, 2, 3, 4, 5,
    ]);
  });

  it('includes pricing and quiz heatmap guides', () => {
    expect(HEATMAP_ANALYSIS_GUIDES.map((guide) => guide.page)).toEqual(
      expect.arrayContaining(['Pricing (/pricing)', 'Quiz (/quiz)'])
    );
  });

  it('includes booking abandonment in the conversion playbook', () => {
    expect(CONVERSION_PLAYBOOK).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          finding: 'Booking widget abandonment',
          category: 'ux',
          impact: 'high',
          effort: 'medium',
        }),
      ])
    );
  });

  it('generates an empty weekly report template with the requested week', () => {
    expect(generateReportTemplate('2026-04-06')).toEqual({
      weekOf: '2026-04-06',
      topFindings: [],
      metrics: {
        totalSessions: 0,
        bounceRate: 0,
        avgScrollDepth: 0,
        rageClickCount: 0,
        hesitationCount: 0,
        bookingAttempts: 0,
        bookingCompletions: 0,
        topPages: [],
        intentBreakdown: {
          high_intent: 0,
          medium_intent: 0,
          low_intent: 0,
          bounce: 0,
        },
      },
      actionsToTake: [],
      nextWeekFocus: '',
    });
  });
});
