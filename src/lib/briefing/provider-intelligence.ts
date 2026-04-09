import { PROVIDERS } from '@/lib/airtable/tables';
import { fetchProviderPerformance, fetchSchedule, getDaysAgo, getToday } from '@/lib/briefing/data-fetchers';

export interface ProviderPressureEntry {
  provider: string;
  todayAppointments: number;
  noShowRate: number;
  revenuePerShow: number;
  gapCount: number;
  status: 'underfilled' | 'watch' | 'strong';
  recommendation: string;
}

export interface ProviderIntelligence {
  pressureProvider: string | null;
  underfilledProviders: number;
  openGapCount: number;
  topEntries: ProviderPressureEntry[];
}

export async function fetchProviderIntelligence(): Promise<ProviderIntelligence> {
  try {
    const [performance, schedule] = await Promise.all([
      fetchProviderPerformance(getDaysAgo(7), getToday()),
      fetchSchedule(),
    ]);

    const gapCounts = schedule.gaps.reduce<Record<string, number>>((acc, gap) => {
      acc[gap.provider] = (acc[gap.provider] || 0) + 1;
      return acc;
    }, {});

    const providerNames = [...new Set([...PROVIDERS, ...Object.keys(performance), ...Object.keys(schedule.byProvider)])];

    const topEntries = providerNames
      .map((provider) => {
        const stats = performance[provider] || { revenue: 0, appointments: 0, shows: 0, noShows: 0 };
        const todayAppointments = schedule.byProvider[provider] || 0;
        const noShowRate = stats.appointments > 0 ? (stats.noShows / stats.appointments) * 100 : 0;
        const revenuePerShow = stats.shows > 0 ? stats.revenue / stats.shows : 0;
        const gapCount = gapCounts[provider] || 0;
        const status: ProviderPressureEntry['status'] =
          todayAppointments === 0 || gapCount >= 2 || noShowRate >= 20
            ? 'underfilled'
            : gapCount > 0 || noShowRate >= 10 || todayAppointments <= 2
              ? 'watch'
              : 'strong';

        const recommendation =
          todayAppointments === 0
            ? `Urgently backfill ${provider}'s open day with reactivation and same-day outreach.`
            : status === 'underfilled'
              ? `Prioritize ${provider} for consult fill and same-day outreach.`
            : status === 'watch'
              ? `Keep ${provider}'s gaps and no-show exposure under active watch.`
              : `${provider} is running a stable book right now.`;

        return {
          provider,
          todayAppointments,
          noShowRate: Math.round(noShowRate),
          revenuePerShow: Math.round(revenuePerShow),
          gapCount,
          status,
          recommendation,
        };
      })
      .sort(
        (a, b) =>
          (a.todayAppointments === 0 ? -1 : 0) - (b.todayAppointments === 0 ? -1 : 0) ||
          (b.gapCount - a.gapCount) ||
          (b.noShowRate - a.noShowRate) ||
          (a.revenuePerShow - b.revenuePerShow)
      );

    return {
      pressureProvider: topEntries[0]?.provider ?? null,
      underfilledProviders: topEntries.filter((entry) => entry.status === 'underfilled').length,
      openGapCount: schedule.gaps.length,
      topEntries: topEntries.slice(0, 5),
    };
  } catch (error) {
    console.error('[Briefing] Failed to fetch provider intelligence:', error);
    return {
      pressureProvider: null,
      underfilledProviders: 0,
      openGapCount: 0,
      topEntries: [],
    };
  }
}
