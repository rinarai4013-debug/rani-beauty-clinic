import type { DosagePlan } from '@/lib/metabolic/dosing-engine';

export type DoseSensitivity = 'low' | 'medium' | 'high';

export interface ProviderDoseCalculatorInput {
  dosagePlan: DosagePlan;
  patientWeightKg: number;
  sensitivity: DoseSensitivity;
  adherenceTargetPct: number;
  labsComplete: boolean;
}

export interface ProviderDoseCalculatorOutput {
  startAdjustment: string;
  escalationGuidance: string;
  holdGuidance: string;
  projectedCheckpointDelta: string;
  providerGuardrail: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function buildProviderDoseCalculator(
  input: ProviderDoseCalculatorInput,
): ProviderDoseCalculatorOutput {
  const weight = clamp(input.patientWeightKg, 35, 220);
  const adherence = clamp(input.adherenceTargetPct, 40, 100);
  const highSensitivity = input.sensitivity === 'high';
  const lowSensitivity = input.sensitivity === 'low';
  const heavyWeight = weight >= 100;
  const lightWeight = weight <= 60;

  const startAdjustment = highSensitivity
    ? 'Start at lowest protocol band and extend escalation window by +2 weeks.'
    : lightWeight
      ? 'Use conservative lower-band start with week-2 tolerance confirmation.'
      : heavyWeight && lowSensitivity
        ? 'If tolerated, provider may consider standard-to-upper start band per protocol.'
        : 'Use standard starting band from protocol with week-2 tolerance check.';

  const escalationGuidance = !input.labsComplete
    ? 'Labs incomplete: hold any non-urgent escalation until baseline panel is reviewed.'
    : adherence < 75
      ? 'Adherence target below 75%: prioritize coaching before dose escalation.'
      : highSensitivity
        ? 'Escalate one step at a time after sustained tolerance signal (minimum 4 weeks).'
        : 'Escalate per protocol gates when tolerance + objective trend align.';

  const holdGuidance =
    input.dosagePlan.holdRules[0] ||
    'Hold escalation when side effects persist or objective benefit is unclear.';

  const projectedCheckpointDelta =
    adherence >= 90
      ? 'Expected checkpoint trajectory: accelerated compared with baseline plan.'
      : adherence >= 80
        ? 'Expected checkpoint trajectory: on-plan if escalation gates are met.'
        : 'Expected checkpoint trajectory: slower; optimize adherence before advancing.';

  const providerGuardrail =
    'Provider authorization required before dispensing or any dose/escalation change.';

  return {
    startAdjustment,
    escalationGuidance,
    holdGuidance,
    projectedCheckpointDelta,
    providerGuardrail,
  };
}
