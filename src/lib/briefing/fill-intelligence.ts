import { fetchSchedule } from '@/lib/briefing/data-fetchers';

export interface FillOpportunity {
  provider: string;
  startTime: string;
  duration: number;
  suggestedService: string;
  suggestedAction: 'outreach_lapsed' | 'book_consult' | 'offer_walkin';
  estimatedValue: number;
  recommendedTarget?: string;
  rationale: string;
}

export interface FillIntelligence {
  openGapCount: number;
  totalRecoverableValue: number;
  topOpportunities: FillOpportunity[];
}

interface FillInputs {
  consults?: {
    activeConsults: number;
    bookedCount: number;
    topPriority:
      | {
          patientName: string;
          action: string;
          estimatedValue: number;
        }
      | null;
    topOpportunities: {
      patientName: string;
      estimatedValue: number;
      financingReady?: boolean;
    }[];
  };
  reactivation?: {
    topOpportunities: {
      clientName: string;
      estimatedValue: number;
      priority: 'high' | 'medium' | 'low';
      status: string;
    }[];
  };
}

function getSuggestedAction(duration: number, startTime: string, inputs: FillInputs): FillOpportunity['suggestedAction'] {
  const hour = Number.parseInt(startTime.split(':')[0] || '0', 10);
  const consultBacklog = (inputs.consults?.activeConsults ?? 0) > (inputs.consults?.bookedCount ?? 0);
  const reactivationTarget = inputs.reactivation?.topOpportunities[0];

  if (duration < 45 && consultBacklog) return 'book_consult';
  if (reactivationTarget?.priority === 'high' && hour >= 10 && hour <= 16) return 'outreach_lapsed';
  if (hour >= 10 && hour <= 16) return 'outreach_lapsed';
  if (duration < 45) return 'book_consult';
  return 'offer_walkin';
}

function getSuggestedService(duration: number, action: FillOpportunity['suggestedAction']): string {
  if (action === 'book_consult') return 'Consultation';
  if (duration < 75) return action === 'outreach_lapsed' ? 'return visit or injectable touch-up' : 'HydraFacial';
  return 'Injectable or premium facial';
}

function getBaseValue(duration: number): number {
  if (duration < 45) return 150;
  if (duration < 75) return 275;
  return 550;
}

function getRecommendedTarget(
  action: FillOpportunity['suggestedAction'],
  inputs: FillInputs,
): { name?: string; estimatedValue?: number; rationale: string } {
  if (action === 'book_consult') {
    const consultTarget = inputs.consults?.topPriority || inputs.consults?.topOpportunities[0];
    if (consultTarget) {
      return {
        name: consultTarget.patientName,
        estimatedValue: consultTarget.estimatedValue,
        rationale: `Best current recovery is moving ${consultTarget.patientName} into an open consult slot.`,
      };
    }
  }

  if (action === 'outreach_lapsed') {
    const reactivationTarget = inputs.reactivation?.topOpportunities[0];
    if (reactivationTarget) {
      return {
        name: reactivationTarget.clientName,
        estimatedValue: reactivationTarget.estimatedValue,
        rationale: `${reactivationTarget.clientName} is the strongest immediate win-back fit for this opening.`,
      };
    }
  }

  return {
    rationale: 'No single named target surfaced, so this slot is best treated as general same-day recovery capacity.',
  };
}

export function buildFillIntelligence(
  schedule: Awaited<ReturnType<typeof fetchSchedule>>,
  inputs: FillInputs = {},
): FillIntelligence {
  const topOpportunities = schedule.gaps
    .map((gap) => {
      const suggestedAction = getSuggestedAction(gap.duration, gap.startTime, inputs);
      const target = getRecommendedTarget(suggestedAction, inputs);
      const baseValue = getBaseValue(gap.duration);
      const estimatedValue = target.estimatedValue
        ? Math.max(baseValue, Math.min(target.estimatedValue, baseValue * 2))
        : baseValue;

      return {
        provider: gap.provider,
        startTime: gap.startTime,
        duration: gap.duration,
        suggestedService: getSuggestedService(gap.duration, suggestedAction),
        suggestedAction,
        estimatedValue,
        recommendedTarget: target.name,
        rationale: target.rationale,
      };
    })
    .sort((a, b) => b.estimatedValue - a.estimatedValue)
    .slice(0, 5);

  return {
    openGapCount: schedule.gaps.length,
    totalRecoverableValue: topOpportunities.reduce((sum, item) => sum + item.estimatedValue, 0),
    topOpportunities,
  };
}

export async function fetchFillIntelligence(inputs: FillInputs = {}): Promise<FillIntelligence> {
  try {
    const schedule = await fetchSchedule();
    return buildFillIntelligence(schedule, inputs);
  } catch (error) {
    console.error('[Briefing] Failed to fetch fill intelligence:', error);
    return {
      openGapCount: 0,
      totalRecoverableValue: 0,
      topOpportunities: [],
    };
  }
}
