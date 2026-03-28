import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { cache, TTL } from '@/lib/cache';
import { calculateGoalProgress, generateLeaderboard, checkAchievements, ACHIEVEMENTS, type GoalInput } from '@/lib/providers/goals';
import type { ProviderGoal } from '@/types/providers';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.role, 'view_providers')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('id');

    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID required' }, { status: 400 });
    }

    const cacheKey = `provider-goals-${providerId}`;
    const cached = cache.get(cacheKey);
    if (cached) return NextResponse.json(cached);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const quarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);

    // Sample goals — in production these come from Airtable
    const goals: ProviderGoal[] = [
      {
        id: `${providerId}-rev-monthly`,
        providerId,
        type: 'revenue',
        title: 'Monthly Revenue Target',
        description: 'Total service revenue for the month',
        targetValue: providerId === 'rina' ? 30000 : 20000,
        currentValue: providerId === 'rina' ? 22500 : 14000,
        unit: 'USD',
        period: 'monthly',
        startDate: monthStart.toISOString().split('T')[0],
        endDate: monthEnd.toISOString().split('T')[0],
        status: 'on_track',
        progressPercent: 0,
        milestones: [
          { label: '25%', targetValue: providerId === 'rina' ? 7500 : 5000, achieved: true, achievedDate: monthStart.toISOString() },
          { label: '50%', targetValue: providerId === 'rina' ? 15000 : 10000, achieved: true },
          { label: '75%', targetValue: providerId === 'rina' ? 22500 : 15000, achieved: providerId === 'rina' },
          { label: '100%', targetValue: providerId === 'rina' ? 30000 : 20000, achieved: false },
        ],
      },
      {
        id: `${providerId}-rebook`,
        providerId,
        type: 'rebook',
        title: 'Rebook Rate',
        description: 'Percentage of appointments with a follow-up booked',
        targetValue: 80,
        currentValue: providerId === 'rina' ? 72 : 65,
        unit: '%',
        period: 'monthly',
        startDate: monthStart.toISOString().split('T')[0],
        endDate: monthEnd.toISOString().split('T')[0],
        status: 'on_track',
        progressPercent: 0,
        milestones: [
          { label: '60%', targetValue: 60, achieved: true },
          { label: '70%', targetValue: 70, achieved: providerId === 'rina' },
          { label: '80%', targetValue: 80, achieved: false },
        ],
      },
      {
        id: `${providerId}-retention`,
        providerId,
        type: 'retention',
        title: 'Client Retention',
        description: 'Client return rate within 90 days',
        targetValue: 75,
        currentValue: providerId === 'rina' ? 68 : 62,
        unit: '%',
        period: 'quarterly',
        startDate: quarterStart.toISOString().split('T')[0],
        endDate: quarterEnd.toISOString().split('T')[0],
        status: 'on_track',
        progressPercent: 0,
        milestones: [
          { label: '60%', targetValue: 60, achieved: true },
          { label: '70%', targetValue: 70, achieved: false },
          { label: '75%', targetValue: 75, achieved: false },
        ],
      },
      {
        id: `${providerId}-reviews`,
        providerId,
        type: 'review',
        title: 'Review Score',
        description: 'Maintain excellent Google review rating',
        targetValue: 4.8,
        currentValue: providerId === 'rina' ? 4.9 : 4.7,
        unit: 'stars',
        period: 'quarterly',
        startDate: quarterStart.toISOString().split('T')[0],
        endDate: quarterEnd.toISOString().split('T')[0],
        status: providerId === 'rina' ? 'exceeded' : 'at_risk',
        progressPercent: 0,
        milestones: [
          { label: '4.5', targetValue: 4.5, achieved: true },
          { label: '4.7', targetValue: 4.7, achieved: true },
          { label: '4.8', targetValue: 4.8, achieved: providerId === 'rina' },
        ],
      },
    ];

    const input: GoalInput = { providerId, goals };
    const progress = calculateGoalProgress(input);

    cache.set(cacheKey, progress, TTL.SHORT);
    return NextResponse.json(progress);
  } catch (err) {
    console.error('[Provider Goals API]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
