import { describe, expect, it, vi } from 'vitest';
import { mockAuraScanResult } from '@/lib/mastermind/mock-data';
import { generateSimulationComparison } from '@/lib/mastermind/simulation-engine';

const mockApplyFilterChain = vi.fn();
const mockAging = vi.fn();
const mockTexture = vi.fn();
const mockTone = vi.fn();
const mockElasticity = vi.fn();

vi.mock('@/lib/photo-simulation/filters', () => ({
  applyFilterChain: (...args: unknown[]) => mockApplyFilterChain(...args),
}));

vi.mock('@/lib/photo-simulation/degradation-filters', () => ({
  applyAgingProgression: (...args: unknown[]) => mockAging(...args),
  applyTextureDegradation: (...args: unknown[]) => mockTexture(...args),
  applyToneDecline: (...args: unknown[]) => mockTone(...args),
  applyElasticityLoss: (...args: unknown[]) => mockElasticity(...args),
}));

vi.mock('@/lib/photo-simulation/degradation-presets', () => ({
  DEGRADATION_PRESETS: {
    '6months': {
      filters: [
        { filter: 'agingProgression', intensity: 0.2 },
      ],
    },
    '1year': {
      filters: [
        { filter: 'textureDegradation', intensity: 0.25 },
      ],
    },
    '3years': {
      filters: [
        { filter: 'toneDecline', intensity: 0.32 },
      ],
    },
    '5years': {
      filters: [
        { filter: 'elasticityLoss', intensity: 0.42 },
      ],
    },
  },
  getAgeAdjustedDegradation: (preset: { filters: { filter: string; intensity: number }[] }, _age: number, _risk: number) => preset,
}));

vi.mock('@/lib/photo-simulation/filter-presets', () => ({
  TREATMENT_PRESETS: {},
}));

const originalImage = global.Image;
const originalDocument = global.document;

describe('mastermind/simulation-engine', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    const createMockCanvasContext = () => ({
      drawImage: vi.fn(),
    });

    Object.defineProperty(global, 'document', {
      configurable: true,
      value: {
        createElement: vi.fn(() => {
          const canvas = {
            width: 0,
            height: 0,
            getContext: vi.fn(() => createMockCanvasContext()),
            toDataURL: vi.fn(() => 'data:image/jpeg;base64,frame'),
          };
          return canvas;
        }),
      },
    });

    class MockImage {
      width = 1200;
      height = 900;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      _src = '';
      set src(value: string) {
        this._src = value;
        if (value.includes('broken')) {
          this.onerror?.();
        } else {
          this.onload?.();
        }
      }
      get src() {
        return this._src;
      }
    }

    Object.defineProperty(global, 'Image', {
      configurable: true,
      value: MockImage,
    });
  });

  it('builds a with/without comparison and cost-of-delay context', async () => {
    const result = await generateSimulationComparison({
      sourceImageDataUrl: 'data:image/jpeg;base64,test',
      scanResult: mockAuraScanResult(),
      plan: null,
      canvasWidth: 500,
      canvasHeight: 500,
    });

    expect(result.withTreatment.frames).toHaveLength(4);
    expect(result.withoutTreatment.frames).toHaveLength(4);
    expect(result.comparison.auraScoreDelta).toBeGreaterThan(0);
    expect(result.comparison.keyDifferentiators[2]).toContain('$4,200');
    expect(result.comparison.keyDifferentiators[2]).toContain('$6,300');
    expect(result.costOfDelay.currentPlanCost).toBe(4200);
    expect(result.costOfDelay.costIfDelayed1Year).toBe(5250);
    expect(mockApplyFilterChain).toHaveBeenCalledTimes(4);
    expect(mockAging).toHaveBeenCalled();
    expect(mockTexture).toHaveBeenCalled();
    expect(mockTone).toHaveBeenCalled();
    expect(mockElasticity).toHaveBeenCalled();
  });

  it('rejects when source image loading fails', async () => {
    await expect(
      generateSimulationComparison({
        sourceImageDataUrl: 'data:image/jpeg;base64,broken',
        scanResult: mockAuraScanResult(),
        plan: null,
      })
    ).rejects.toThrow('Failed to load image');
  });

  afterAll(() => {
    Object.defineProperty(global, 'Image', { configurable: true, value: originalImage });
    Object.defineProperty(global, 'document', { configurable: true, value: originalDocument });
  });
});
