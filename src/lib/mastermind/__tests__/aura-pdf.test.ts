import { describe, expect, it } from 'vitest';
import { extractAuraPdfInsightsFromText } from '../aura-pdf';

describe('Aura PDF parsing integrity', () => {
  it('rejects text that only mentions Aura without any device scores', () => {
    expect(extractAuraPdfInsightsFromText('not an aura pdf', 'fake.pdf')).toBeNull();
  });

  it('parses recognizable Aura score text', () => {
    const insights = extractAuraPdfInsightsFromText(
      [
        'Aura Skin Score: 0.8',
        'Wrinkles Score: 2.7',
        'Texture Score: 1.9',
        'Brown Spots Score: 3.1',
      ].join('\n'),
      'aura.pdf',
    );

    expect(insights).not.toBeNull();
    expect(insights?.absoluteScores.wrinkles).toBe(2.7);
    expect(insights?.absoluteScores.texture).toBe(1.9);
    expect(insights?.absoluteScores.brownSpots).toBe(3.1);
  });
});
