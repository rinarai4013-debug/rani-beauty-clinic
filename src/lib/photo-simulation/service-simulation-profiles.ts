/**
 * Service simulation profiles for the trajectory engine.
 *
 * Each profile defines a deterministic improvement curve across standard
 * timeframes. Values represent illustrative improvement scores (0-100)
 * relative to no-treatment baseline.
 *
 * SAFETY: Not diagnostic. Not prescriptive. No dosage guidance.
 * Displayed values are illustrative only.
 */

export type SimulationTimeframe = '1m' | '3m' | '6m' | '12m';
export const SIMULATION_TIMEFRAMES: SimulationTimeframe[] = ['1m', '3m', '6m', '12m'];

export type ServiceCategory = 'injectables' | 'energy' | 'chemical' | 'laser' | 'metabolic';

export interface ServiceSimulationProfile {
  serviceKey: string;
  displayName: string;
  category: ServiceCategory;
  /** Whether this service produces visible aesthetic changes (metabolic = false) */
  isVisual: boolean;
  /**
   * Illustrative improvement score (0-100) per timeframe.
   * Represents relative expected response vs no-treatment baseline.
   */
  treatmentCurve: Record<SimulationTimeframe, number>;
  peakTimeframe: SimulationTimeframe;
  courseNote: string;
}

export const SERVICE_SIMULATION_PROFILES: Record<string, ServiceSimulationProfile> = {
  botox: {
    serviceKey: 'botox',
    displayName: 'Botox / Neuromodulator',
    category: 'injectables',
    isVisual: true,
    treatmentCurve: { '1m': 75, '3m': 80, '6m': 72, '12m': 55 },
    peakTimeframe: '3m',
    courseNote: 'Typical results visible within weeks; maintenance recommended at 3-4 months.',
  },
  fillers: {
    serviceKey: 'fillers',
    displayName: 'Dermal Fillers',
    category: 'injectables',
    isVisual: true,
    treatmentCurve: { '1m': 85, '3m': 82, '6m': 75, '12m': 60 },
    peakTimeframe: '1m',
    courseNote: 'Immediate volumizing effect; gradual resorption over 9-18 months.',
  },
  sculptra: {
    serviceKey: 'sculptra',
    displayName: 'Sculptra',
    category: 'injectables',
    isVisual: true,
    treatmentCurve: { '1m': 20, '3m': 55, '6m': 80, '12m': 85 },
    peakTimeframe: '12m',
    courseNote: 'Collagen stimulator; gradual build with peak results at 6-12 months.',
  },
  'prx-peel': {
    serviceKey: 'prx-peel',
    displayName: 'PRX-T33 Peel',
    category: 'chemical',
    isVisual: true,
    treatmentCurve: { '1m': 60, '3m': 75, '6m': 70, '12m': 60 },
    peakTimeframe: '3m',
    courseNote: 'Series of treatments; peak glow at 4-6 weeks post-series.',
  },
  rfmn: {
    serviceKey: 'rfmn',
    displayName: 'RF Microneedling',
    category: 'energy',
    isVisual: true,
    treatmentCurve: { '1m': 30, '3m': 60, '6m': 80, '12m': 85 },
    peakTimeframe: '12m',
    courseNote: 'Collagen remodeling; progressive improvement over 3-6 months post-treatment.',
  },
  'laser-hair-removal': {
    serviceKey: 'laser-hair-removal',
    displayName: 'Laser Hair Removal',
    category: 'laser',
    isVisual: true,
    treatmentCurve: { '1m': 30, '3m': 55, '6m': 75, '12m': 90 },
    peakTimeframe: '12m',
    courseNote: 'Series of sessions; cumulative reduction per treatment cycle.',
  },
  sofwave: {
    serviceKey: 'sofwave',
    displayName: 'Sofwave',
    category: 'energy',
    isVisual: true,
    treatmentCurve: { '1m': 25, '3m': 55, '6m': 80, '12m': 78 },
    peakTimeframe: '6m',
    courseNote: 'Ultrasound lifting; results develop over 3-6 months.',
  },
  glp1: {
    serviceKey: 'glp1',
    displayName: 'GLP-1 Metabolic Protocol',
    category: 'metabolic',
    isVisual: false,
    treatmentCurve: { '1m': 20, '3m': 45, '6m': 65, '12m': 75 },
    peakTimeframe: '12m',
    courseNote: 'Non-visual metabolic progression factor. Provider authorization required.',
  },
  hormones: {
    serviceKey: 'hormones',
    displayName: 'Hormone Optimization',
    category: 'metabolic',
    isVisual: false,
    treatmentCurve: { '1m': 15, '3m': 40, '6m': 60, '12m': 70 },
    peakTimeframe: '12m',
    courseNote: 'Non-visual metabolic progression factor. Provider authorization required.',
  },
  peptides: {
    serviceKey: 'peptides',
    displayName: 'Peptide Protocol',
    category: 'metabolic',
    isVisual: false,
    treatmentCurve: { '1m': 15, '3m': 35, '6m': 55, '12m': 65 },
    peakTimeframe: '12m',
    courseNote: 'Non-visual metabolic progression factor. Provider authorization required.',
  },
};

/** Fallback profile for unknown service keys */
export const DEFAULT_SERVICE_PROFILE: ServiceSimulationProfile = {
  serviceKey: 'general',
  displayName: 'General Treatment',
  category: 'energy',
  isVisual: true,
  treatmentCurve: { '1m': 30, '3m': 55, '6m': 70, '12m': 72 },
  peakTimeframe: '6m',
  courseNote: 'Results vary based on individual response and treatment adherence.',
};

export function getServiceProfile(serviceKey: string): ServiceSimulationProfile {
  return SERVICE_SIMULATION_PROFILES[serviceKey] ?? DEFAULT_SERVICE_PROFILE;
}
