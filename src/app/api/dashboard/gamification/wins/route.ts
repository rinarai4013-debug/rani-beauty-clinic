import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { cache, TTL } from '@/lib/cache';
import { gatherDailyData } from '@/lib/briefing';
import type { WinToday } from '@/types/gamification';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function buildWins(data: Awaited<ReturnType<typeof gatherDailyData>>): WinToday[] {
  const wins: WinToday[] = [];

  if (data.revenue.total > 0) {
    wins.push({
      id: 'revenue',
      type: 'revenue',
      label: `${formatCurrency(data.revenue.total)} booked so far`,
      emoji: '💸',
      timestamp: 'Today',
    });
  }

  if (data.schedule.consultCount > 0) {
    wins.push({
      id: 'consults',
      type: 'consults',
      label: `${data.schedule.consultCount} consult${data.schedule.consultCount === 1 ? '' : 's'} on the board`,
      emoji: '🗓️',
      timestamp: 'Today',
    });
  }

  if (data.marketing.newLeads > 0) {
    wins.push({
      id: 'leads',
      type: 'leads',
      label: `${data.marketing.newLeads} new lead${data.marketing.newLeads === 1 ? '' : 's'} captured`,
      emoji: '✨',
      timestamp: 'Today',
    });
  }

  if (data.marketing.reviewCount > 0) {
    wins.push({
      id: 'reviews',
      type: 'reviews',
      label: `${data.marketing.reviewCount} new review${data.marketing.reviewCount === 1 ? '' : 's'} at ${data.marketing.avgRating.toFixed(1)} stars`,
      emoji: '⭐',
      timestamp: 'Today',
    });
  }

  if (wins.length === 0 && data.schedule.totalAppointments > 0) {
    wins.push({
      id: 'schedule',
      type: 'schedule',
      label: `${data.schedule.totalAppointments} appointment${data.schedule.totalAppointments === 1 ? '' : 's'} scheduled today`,
      emoji: '📅',
      timestamp: 'Today',
    });
  }

  return wins;
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.role, 'view_leaderboard')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const cacheKey = 'gamification-wins';
  const cached = cache.get<{ wins: WinToday[] }>(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const data = await gatherDailyData();
    const payload = { wins: buildWins(data) };
    cache.set(cacheKey, payload, TTL.STANDARD);
    return NextResponse.json(payload);
  } catch (error) {
    console.error('[dashboard/gamification/wins]', error);
    return NextResponse.json({ error: 'Failed to load daily wins' }, { status: 500 });
  }
}
