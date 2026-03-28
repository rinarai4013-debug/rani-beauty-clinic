import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { cache, TTL } from '@/lib/cache';
import {
  DEFAULT_WORKING_HOURS,
  calculateWeeklyHours,
  getAllTimeOffBalances,
  checkWeekCoverage,
} from '@/lib/providers/scheduling-preferences';
import type { WorkingHours, TimeOffRequest } from '@/types/providers';

const PROVIDER_HOURS: Record<string, WorkingHours[]> = {
  rina: DEFAULT_WORKING_HOURS.map(h => ({ ...h, providerId: 'rina' })),
  mom: DEFAULT_WORKING_HOURS.map(h => ({
    ...h,
    providerId: 'mom',
    isWorkday: h.dayOfWeek >= 1 && h.dayOfWeek <= 5,
    startTime: h.dayOfWeek >= 1 && h.dayOfWeek <= 5 ? '10:00' : '00:00',
    endTime: h.dayOfWeek >= 1 && h.dayOfWeek <= 5 ? '17:00' : '00:00',
  })),
};

const SAMPLE_TIME_OFF: TimeOffRequest[] = [
  {
    id: 'to-1', providerId: 'rina', type: 'pto', startDate: '2026-04-15', endDate: '2026-04-18',
    hours: 32, reason: 'Family vacation', status: 'approved', requestedAt: '2026-03-01T00:00:00Z',
    reviewedBy: 'admin', reviewedAt: '2026-03-02T00:00:00Z',
  },
  {
    id: 'to-2', providerId: 'mom', type: 'personal', startDate: '2026-04-10', endDate: '2026-04-10',
    hours: 7, reason: 'Personal appointment', status: 'pending', requestedAt: '2026-03-20T00:00:00Z',
  },
];

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.role, 'view_providers')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('id');
    const type = searchParams.get('type'); // 'time-off', 'balances', 'coverage', 'swaps'

    if (type === 'time-off') {
      const requests = providerId
        ? SAMPLE_TIME_OFF.filter(r => r.providerId === providerId)
        : SAMPLE_TIME_OFF;
      return NextResponse.json(requests);
    }

    if (type === 'balances' && providerId) {
      const providerRequests = SAMPLE_TIME_OFF.filter(r => r.providerId === providerId);
      const balances = getAllTimeOffBalances(providerRequests);
      return NextResponse.json(balances.map(b => ({ ...b, providerId })));
    }

    if (type === 'coverage') {
      const now = new Date();
      const monday = new Date(now);
      monday.setDate(monday.getDate() - monday.getDay() + 1);
      const weekStart = monday.toISOString().split('T')[0];

      const allHoursMap = new Map<string, WorkingHours[]>();
      for (const [pid, hours] of Object.entries(PROVIDER_HOURS)) {
        allHoursMap.set(pid, hours);
      }

      const coverage = checkWeekCoverage(weekStart, allHoursMap, SAMPLE_TIME_OFF);
      return NextResponse.json(coverage);
    }

    if (type === 'swaps') {
      return NextResponse.json([]);
    }

    // Default: provider schedule
    if (providerId) {
      const hours = PROVIDER_HOURS[providerId] || DEFAULT_WORKING_HOURS.map(h => ({ ...h, providerId }));
      const weeklyHours = calculateWeeklyHours(hours);
      return NextResponse.json({ workingHours: hours, weeklyHours });
    }

    return NextResponse.json({ error: 'Provider ID or type required' }, { status: 400 });
  } catch (err) {
    console.error('[Provider Schedule API]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
