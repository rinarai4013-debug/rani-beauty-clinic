import { describe, expect, it } from 'vitest';
import { buildSimulationPrompt } from '@/lib/photo-simulation/ai-simulation';

describe('photo-simulation/ai-simulation prompt coverage', () => {
  it('builds service-aware prompts for injectables and collagen stimulators', () => {
    const prompt = buildSimulationPrompt(['Botox', 'Sculptra'], '3-months').toLowerCase();
    expect(prompt).toContain('visible transformation');
    expect(prompt).toContain('smoothed forehead lines');
    expect(prompt).toContain('collagen-rich');
  });

  it('builds service-aware prompts for energy and peel modalities', () => {
    const prompt = buildSimulationPrompt(['Sofwave', 'PRX-T33', 'RF Microneedling'], '6-months').toLowerCase();
    expect(prompt).toContain('dramatic results');
    expect(prompt).toContain('firmer jawline');
    expect(prompt).toContain('deep hydration');
    expect(prompt).toContain('smoother skin texture');
  });

  it('builds service-aware prompts for metabolic + hormone paths', () => {
    const prompt = buildSimulationPrompt(['GLP-1', 'Hormone Optimization', 'Peptide Therapy'], '1-month').toLowerCase();
    expect(prompt).toContain('subtle early improvement');
    expect(prompt).toContain('slimmer face contour');
    expect(prompt).toContain('improved skin vitality');
    expect(prompt).toContain('enhanced recovery appearance');
  });
});
