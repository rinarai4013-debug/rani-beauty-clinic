/**
 * BoomRx Formulary Protocol Overrides
 *
 * Purpose:
 * - Provide provider-ready protocol details (dose / pulses / cadence)
 *   for services that need concrete execution guidance in Mastermind plans.
 * - Keep a single override map that the plan generator can apply per service.
 *
 * Note:
 * - This is intentionally conservative and should be treated as a draft
 *   protocol layer for provider review, not autonomous prescribing.
 */

export interface FormularyProtocolOverride {
  protocolDosage?: string;
  protocolPulses?: string;
  protocolFrequency?: string;
  protocolAreas?: string[];
  protocolEndpoint?: string;
  providerNotes?: string[];
  sourceDocument?: string;
}

const SOURCE = 'BoomRx Formulary.pdf';

export const BOOMRX_FORMULARY_OVERRIDES: Record<string, FormularyProtocolOverride> = {
  tretinoin: {
    protocolDosage: 'Start 0.025% pea-size nightly x2 weeks, then advance to 0.05% if tolerated',
    protocolFrequency: 'Nightly; reduce to qod with irritation',
    protocolAreas: ['face', 'neck (if tolerated)'],
    protocolEndpoint: 'Retinoid tolerance with visible texture/pigment improvement at 8-12 weeks',
    providerNotes: [
      'Pause 5-7 days before medium/deep peels or energy devices if needed',
      'Pair with moisturizer + daily SPF 50+',
    ],
    sourceDocument: SOURCE,
  },

  'glp1-semaglutide-m1': {
    protocolDosage: 'Semaglutide 0.25 mg weekly',
    protocolFrequency: 'Weekly x4 weeks',
    protocolEndpoint: 'Tolerability + appetite control before titration',
    providerNotes: ['Advance per protocol only if GI side effects are controlled'],
    sourceDocument: SOURCE,
  },
  'glp1-semaglutide-m2': {
    protocolDosage: 'Semaglutide 0.5 mg weekly',
    protocolFrequency: 'Weekly x4 weeks',
    protocolEndpoint: 'Progressive weight-loss response with tolerable adverse effects',
    sourceDocument: SOURCE,
  },
  'glp1-semaglutide-m3': {
    protocolDosage: 'Semaglutide 1.0 mg weekly',
    protocolFrequency: 'Weekly x4 weeks',
    protocolEndpoint: 'Target fat-loss trajectory + improved metabolic markers',
    sourceDocument: SOURCE,
  },
  'glp1-semaglutide-m4': {
    protocolDosage: 'Semaglutide 1.7 mg weekly maintenance',
    protocolFrequency: 'Weekly ongoing',
    protocolEndpoint: 'Weight maintenance with stable appetite suppression',
    sourceDocument: SOURCE,
  },

  'glp1-tirzepatide-m1': {
    protocolDosage: 'Tirzepatide 2.5 mg weekly',
    protocolFrequency: 'Weekly x4 weeks',
    protocolEndpoint: 'Tolerability baseline prior to escalation',
    sourceDocument: SOURCE,
  },
  'glp1-tirzepatide-m2': {
    protocolDosage: 'Tirzepatide 5 mg weekly',
    protocolFrequency: 'Weekly x4 weeks',
    protocolEndpoint: 'Sustained appetite + glycemic control response',
    sourceDocument: SOURCE,
  },
  'glp1-tirzepatide-m3': {
    protocolDosage: 'Tirzepatide 7.5 mg weekly',
    protocolFrequency: 'Weekly x4 weeks (or maintenance per tolerance)',
    protocolEndpoint: 'Dose optimization for weight-loss continuation',
    sourceDocument: SOURCE,
  },

  'nad-injection': {
    protocolDosage: 'NAD+ 100-200 mg IM/SC per protocol',
    protocolFrequency: '1-2x weekly induction, then weekly/biweekly maintenance',
    protocolEndpoint: 'Improved energy, recovery, and cognitive resilience markers',
    sourceDocument: SOURCE,
  },
  'glutathione-injection': {
    protocolDosage: 'Glutathione 600-1200 mg IM/IV per protocol',
    protocolFrequency: 'Weekly or biweekly',
    protocolEndpoint: 'Tone uniformity and oxidative-stress support',
    sourceDocument: SOURCE,
  },
  'b12-injection': {
    protocolDosage: 'Methylcobalamin 1,000 mcg IM',
    protocolFrequency: 'Weekly x4, then biweekly/monthly maintenance',
    protocolEndpoint: 'Energy and deficiency symptom correction',
    sourceDocument: SOURCE,
  },
};

