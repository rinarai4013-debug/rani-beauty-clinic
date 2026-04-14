import type { FulfillmentOption, MetabolicTrack } from '@/lib/metabolic/matrix';

export type MetabolicTierKey = 'start' | 'transform' | 'elite';

export interface MetabolicPackageOption {
  id: string;
  name: string;
  track: MetabolicTrack;
  tier: MetabolicTierKey;
  monthlyEstimate: string;
  fulfillmentModes: FulfillmentOption[];
  pulseSchedule: string;
  doseFramework: string;
  improvementTargets: string[];
  clinicProtocol: string;
  homeProtocol: string;
}

const BOOMRX_PACKAGE_MATRIX: MetabolicPackageOption[] = [
  {
    id: 'glp1-sema-start',
    name: 'Semaglutide Starter Protocol',
    track: 'glp1',
    tier: 'start',
    monthlyEstimate: '$349-$499',
    fulfillmentModes: ['clinic', 'home'],
    pulseSchedule: 'Weekly injection cadence with week-2 tolerance review',
    doseFramework: '0.25 mg weekly start, provider-evaluated escalation at week 4',
    improvementTargets: ['Appetite control', 'Craving reduction', 'Early waist reduction'],
    clinicProtocol: 'In-clinic onboarding, first dose observed, side-effect action plan issued',
    homeProtocol: 'Shipped kit + virtual administration teaching + 72-hour check-in',
  },
  {
    id: 'glp1-tirz-transform',
    name: 'Tirzepatide Transform Protocol',
    track: 'glp1',
    tier: 'transform',
    monthlyEstimate: '$499-$799',
    fulfillmentModes: ['clinic', 'home'],
    pulseSchedule: '4-week escalation windows with monthly provider check',
    doseFramework: '5 mg to 7.5 mg weekly progression as tolerated',
    improvementTargets: ['Steady fat-mass reduction', 'Metabolic marker improvement', 'Plateau prevention'],
    clinicProtocol: 'Monthly in-clinic review and escalation decisions',
    homeProtocol: 'Direct-to-home refill cycle with monthly telehealth review',
  },
  {
    id: 'glp1-elite-stack',
    name: 'GLP-1 Elite Optimization Stack',
    track: 'glp1',
    tier: 'elite',
    monthlyEstimate: '$799-$1199',
    fulfillmentModes: ['clinic', 'home'],
    pulseSchedule: 'Monthly optimization cycle + rescue plan checkpoints',
    doseFramework: 'Provider-gated advanced range with strict adverse-event gating',
    improvementTargets: ['Aggressive recomposition', 'Maintenance stability', 'Long-term adherence'],
    clinicProtocol: 'Bi-weekly KPI review in clinic with adaptive escalation',
    homeProtocol: 'Home supply protocol with structured virtual provider rounds',
  },
  {
    id: 'hormone-female-start',
    name: 'Female Hormone Baseline Program',
    track: 'hormones',
    tier: 'start',
    monthlyEstimate: '$299-$449',
    fulfillmentModes: ['clinic', 'home'],
    pulseSchedule: '2-4 week adjustment windows after baseline panel',
    doseFramework: 'Conservative symptom-led initiation after complete labs',
    improvementTargets: ['Sleep quality', 'Energy recovery', 'Mood stabilization'],
    clinicProtocol: 'In-clinic baseline panel + provider launch visit',
    homeProtocol: 'Home fulfillment after labs and protocol sign-off',
  },
  {
    id: 'hormone-trt-transform',
    name: 'TRT Optimization Program',
    track: 'hormones',
    tier: 'transform',
    monthlyEstimate: '$449-$699',
    fulfillmentModes: ['clinic', 'home'],
    pulseSchedule: '6-8 week lab recalibration cycles',
    doseFramework: 'Single-variable optimization each cycle',
    improvementTargets: ['Body composition', 'Libido normalization', 'Performance output'],
    clinicProtocol: 'In-clinic protocol calibration + periodic lab review',
    homeProtocol: 'Home fulfillment with quarterly in-clinic lab touchpoints',
  },
  {
    id: 'hormone-elite-performance',
    name: 'Hormone Performance Program',
    track: 'hormones',
    tier: 'elite',
    monthlyEstimate: '$699-$999',
    fulfillmentModes: ['clinic', 'home'],
    pulseSchedule: 'Quarterized periodization with monthly KPI check-ins',
    doseFramework: 'Advanced endocrine optimization within physician-defined bounds',
    improvementTargets: ['Cognitive clarity', 'Recovery speed', 'Long-term endocrine stability'],
    clinicProtocol: 'High-touch in-clinic optimization and quarterly panel review',
    homeProtocol: 'Home therapy plus scheduled in-clinic checkpoints',
  },
  {
    id: 'peptide-recovery-start',
    name: 'BPC-157 Recovery Starter',
    track: 'peptides',
    tier: 'start',
    monthlyEstimate: '$249-$399',
    fulfillmentModes: ['clinic', 'home'],
    pulseSchedule: 'Daily pulse protocol with 2-4 week response review',
    doseFramework: '250-500 mcg once/twice daily based on clinical target',
    improvementTargets: ['Inflammation control', 'Tissue recovery', 'Sleep support'],
    clinicProtocol: 'In-clinic protocol setup and training',
    homeProtocol: 'Shipped supply with administration coaching',
  },
  {
    id: 'peptide-cjc-transform',
    name: 'CJC-1295 / Ipamorelin Transform',
    track: 'peptides',
    tier: 'transform',
    monthlyEstimate: '$399-$649',
    fulfillmentModes: ['clinic', 'home'],
    pulseSchedule: '8-12 week cycle with midpoint adjustment',
    doseFramework: 'Nightly GH-axis pulse + adjunct peptide as indicated',
    improvementTargets: ['Recovery quality', 'Lean-mass retention', 'Deep sleep improvement'],
    clinicProtocol: 'In-clinic cycle design and midpoint reassessment',
    homeProtocol: 'Home-cycle execution with scheduled provider monitoring',
  },
  {
    id: 'peptide-elite-stack',
    name: 'Peptide Elite Stack',
    track: 'peptides',
    tier: 'elite',
    monthlyEstimate: '$649-$949',
    fulfillmentModes: ['clinic', 'home'],
    pulseSchedule: 'Cycle + deload framework to reduce response fatigue',
    doseFramework: 'Multi-compound stack with provider compatibility review',
    improvementTargets: ['High-performance adaptation', 'Longevity support', 'Body-composition quality'],
    clinicProtocol: 'In-clinic elite stack management and biomarker review',
    homeProtocol: 'Home fulfillment plus provider-led cycle governance',
  },
  {
    id: 'hybrid-start',
    name: 'Hybrid Onboarding Program',
    track: 'hybrid',
    tier: 'start',
    monthlyEstimate: '$549-$799',
    fulfillmentModes: ['clinic'],
    pulseSchedule: 'Staggered protocol onboarding every 2 weeks',
    doseFramework: 'Low-dose GLP + symptom-led endocrine support',
    improvementTargets: ['Appetite + energy reset', 'Tolerability-first onboarding'],
    clinicProtocol: 'Clinic-first onboarding required for dual-track start',
    homeProtocol: 'Not available for initial hybrid onboarding',
  },
  {
    id: 'hybrid-transform',
    name: 'Hybrid Transform Program',
    track: 'hybrid',
    tier: 'transform',
    monthlyEstimate: '$799-$1199',
    fulfillmentModes: ['clinic', 'home'],
    pulseSchedule: '4-week metabolic + 6-8 week endocrine sync reviews',
    doseFramework: 'Coordinated dual-track optimization cadence',
    improvementTargets: ['Recomposition acceleration', 'Symptom stabilization', 'Plateau interruption'],
    clinicProtocol: 'In-clinic dual-track checkpoints and escalation governance',
    homeProtocol: 'Home fulfillment after in-clinic stabilization phase',
  },
  {
    id: 'hybrid-elite',
    name: 'Hybrid Elite Program',
    track: 'hybrid',
    tier: 'elite',
    monthlyEstimate: '$1199-$1599',
    fulfillmentModes: ['clinic', 'home'],
    pulseSchedule: 'Monthly composite score review with adaptive periodization',
    doseFramework: 'Integrated high-touch protocol across metabolic + endocrine axes',
    improvementTargets: ['Maximum safe recomposition', 'Performance optimization', 'Durable maintenance'],
    clinicProtocol: 'Clinic-led high-touch optimization with frequent KPI rounds',
    homeProtocol: 'Home model with scheduled intensive provider oversight',
  },
];

const TIER_ORDER: MetabolicTierKey[] = ['start', 'transform', 'elite'];

export function getPackagesForTrack(track: MetabolicTrack): MetabolicPackageOption[] {
  return BOOMRX_PACKAGE_MATRIX
    .filter((option) => option.track === track)
    .sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier));
}

export function getPackagesForRecommendation(
  track: MetabolicTrack,
  preferredFulfillment: FulfillmentOption,
): MetabolicPackageOption[] {
  const packages = getPackagesForTrack(track);
  return packages.sort((a, b) => {
    const aPreferred = a.fulfillmentModes.includes(preferredFulfillment) ? 0 : 1;
    const bPreferred = b.fulfillmentModes.includes(preferredFulfillment) ? 0 : 1;
    if (aPreferred !== bPreferred) return aPreferred - bPreferred;
    return TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier);
  });
}

export function getPackageById(packageId: string): MetabolicPackageOption | undefined {
  return BOOMRX_PACKAGE_MATRIX.find((option) => option.id === packageId);
}
