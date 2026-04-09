import { fetchSchedule } from '@/lib/briefing/data-fetchers';

export interface FillOpportunity {
  provider: string;
  startTime: string;
  duration: number;
  suggestedService: string;
  suggestedAction: 'outreach_lapsed' | 'book_consult' | 'offer_walkin';
  estimatedValue: number;
}

export interface FillIntelligence {
  openGapCount: number;
  totalRecoverableValue: number;
  topOpportunities: FillOpportunity[];
}

function getSuggestedAction(duration: number, startTime: string): FillOpportunity['suggestedAction'] {
  const hour = Number.parseInt(startTime.split(':')[0] || '0', 10);
  if (hour >= 10 && hour <= 16) return 'outreach_lapsed';
  if (duration < 45) return 'book_consult';
  return 'offer_walkin';
}

function getSuggestedService(duration: number): string {
  if (duration < 45) return 'Consultation';
  if (duration < 75) return 'HydraFacial';
  return 'Injectable or premium facial';
}

function getEstimatedValue(duration: number): number {
  if (duration < 45) return 150;
  if (duration < 75) return 275;
  return 550;
}

export async function fetchFillIntelligence(): Promise<FillIntelligence> {
  try {
    const schedule = await fetchSchedule();
    const topOpportunities = schedule.gaps
      .map((gap) => ({
        provider: gap.provider,
        startTime: gap.startTime,
        duration: gap.duration,
        suggestedService: getSuggestedService(gap.duration),
        suggestedAction: getSuggestedAction(gap.duration, gap.startTime),
        estimatedValue: getEstimatedValue(gap.duration),
      }))
      .sort((a, b) => b.estimatedValue - a.estimatedValue)
      .slice(0, 5);

    return {
      openGapCount: schedule.gaps.length,
      totalRecoverableValue: topOpportunities.reduce((sum, item) => sum + item.estimatedValue, 0),
      topOpportunities,
    };
  } catch (error) {
    console.error('[Briefing] Failed to fetch fill intelligence:', error);
    return {
      openGapCount: 0,
      totalRecoverableValue: 0,
      topOpportunities: [],
    };
  }
}
