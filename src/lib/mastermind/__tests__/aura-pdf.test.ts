import { describe, expect, it } from 'vitest';
import { applyAuraPdfInsightsToScan, extractAuraPdfInsightsFromText } from '../aura-pdf';
import type { AuraScanResult } from '@/types/mastermind';

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

  it('keeps Aura-derived concern severity, copy, and zones internally consistent', () => {
    const baseScan = {
      scanId: 'aura_test',
      timestamp: '2026-04-25T00:00:00.000Z',
      auraScore: {
        overall: 70,
        grade: 'B',
        label: 'Good',
        breakdown: {
          hydration: 70,
          elasticity: 70,
          texture: 70,
          tone: 70,
          clarity: 70,
          firmness: 70,
          radiance: 70,
          protection: 70,
        },
        skinAge: 36,
        chronologicalAge: 36,
        skinAgeDelta: 0,
        percentile: 50,
      },
      auraDeviceAnalysis: {
        categories: [],
        compositeSkinScore: 0,
        scoringMode: 'absolute',
      },
      zoneAnalysis: [],
      detectedConcerns: [
        {
          id: 'concern_texture_0',
          concern: 'texture',
          severity: 'severe',
          score: 90,
          zones: ['neck'],
          trending: 'stable',
          urgency: 'high',
          description: 'Severe texture detected.',
          clinicalNote: 'texture — severe grade.',
        },
      ],
      predictiveMetrics: {
        withoutIntervention: {} as never,
        withTreatment: {} as never,
        riskFactors: [],
      },
      treatmentReadiness: {
        readyForTreatment: true,
        requiredPrep: [],
        seasonalConsiderations: [],
        skinBarrierStatus: 'adequate',
      },
      skinAnalysis: {} as never,
      medicalFlags: [],
    } satisfies AuraScanResult;

    const insights = extractAuraPdfInsightsFromText(
      ['Texture Score: 1.3', 'Pores Score: 4.1'].join('\n'),
      'rina-aura.pdf',
    );
    expect(insights).not.toBeNull();

    const updated = applyAuraPdfInsightsToScan(baseScan, insights!);
    const texture = updated.detectedConcerns.find((item) => item.concern === 'texture');
    const pores = updated.detectedConcerns.find((item) => item.concern === 'pores');

    expect(texture?.severity).toBe('mild');
    expect(texture?.description).toContain('1.3/5 (mild)');
    expect(texture?.description).not.toMatch(/Severe texture detected/);
    expect(texture?.zones).toContain('cheeks_left');
    expect(pores?.severity).toBe('severe');
    expect(pores?.description).toContain('4.1/5 (severe)');
  });
});
