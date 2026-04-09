// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { buildFillIntelligence } from '../fill-intelligence';

describe('buildFillIntelligence', () => {
  it('targets consult backlog for short slots and reactivation targets for longer daytime gaps', () => {
    const intelligence = buildFillIntelligence(
      {
        totalAppointments: 5,
        byProvider: { Rina: 3 },
        byCategory: { Consult: 1 },
        consultCount: 1,
        newClientCount: 1,
        gaps: [
          { provider: 'Rina', startTime: '11:00', duration: 30 },
          { provider: 'Mom', startTime: '14:00', duration: 60 },
        ],
      },
      {
        consults: {
          activeConsults: 4,
          bookedCount: 1,
          topPriority: {
            patientName: 'Aria Stone',
            action: 'Provider review needed',
            estimatedValue: 4200,
          },
          topOpportunities: [],
        },
        reactivation: {
          topOpportunities: [
            {
              clientName: 'Maya Rivers',
              estimatedValue: 900,
              priority: 'high',
              status: 'Lapsed 30',
            },
          ],
        },
      }
    );

    expect(intelligence.topOpportunities[0]?.recommendedTarget).toBe('Maya Rivers');
    expect(intelligence.topOpportunities[0]?.suggestedAction).toBe('outreach_lapsed');
    expect(intelligence.topOpportunities[1]?.recommendedTarget).toBe('Aria Stone');
    expect(intelligence.topOpportunities[1]?.suggestedAction).toBe('book_consult');
  });
});
