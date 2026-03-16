import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';

interface TransactionFields {
  'Date': string;
  'Type': string;
  'Amount': number;
  'Status': string;
}

interface AppointmentFields {
  'Date': string;
  'Status': string;
  'Is Consult': boolean;
  'Consult Outcome': string;
}

interface ReviewFields {
  'Star Rating': number;
  'Review Date': string;
}

// Static achievement definitions
const ACHIEVEMENTS = [
  {
    id: 'first-sale',
    name: 'First Sale',
    description: 'Record your first completed transaction',
    icon: 'trophy',
    category: 'revenue' as const,
    rarity: 'common' as const,
    xp: 50,
  },
  {
    id: 'revenue-1k',
    name: 'Thousand Club',
    description: 'Reach $1,000 in monthly revenue',
    icon: 'dollar-sign',
    category: 'revenue' as const,
    rarity: 'common' as const,
    xp: 100,
  },
  {
    id: 'revenue-10k',
    name: 'Five Figure Flow',
    description: 'Reach $10,000 in monthly revenue',
    icon: 'trending-up',
    category: 'revenue' as const,
    rarity: 'rare' as const,
    xp: 250,
  },
  {
    id: 'revenue-50k',
    name: 'Revenue Royalty',
    description: 'Reach $50,000 in monthly revenue',
    icon: 'crown',
    category: 'revenue' as const,
    rarity: 'epic' as const,
    xp: 500,
  },
  {
    id: 'revenue-100k',
    name: 'Six Figure Sovereign',
    description: 'Reach $100,000 in monthly revenue',
    icon: 'gem',
    category: 'revenue' as const,
    rarity: 'legendary' as const,
    xp: 1000,
  },
  {
    id: 'bookings-10',
    name: 'Getting Busy',
    description: 'Complete 10 appointments in a month',
    icon: 'calendar',
    category: 'bookings' as const,
    rarity: 'common' as const,
    xp: 75,
  },
  {
    id: 'bookings-50',
    name: 'Fully Booked',
    description: 'Complete 50 appointments in a month',
    icon: 'calendar-check',
    category: 'bookings' as const,
    rarity: 'rare' as const,
    xp: 200,
  },
  {
    id: 'bookings-100',
    name: 'Century Mark',
    description: 'Complete 100 appointments in a month',
    icon: 'star',
    category: 'bookings' as const,
    rarity: 'epic' as const,
    xp: 400,
  },
  {
    id: 'consult-closer',
    name: 'Consult Closer',
    description: 'Close 5 consults in a month',
    icon: 'handshake',
    category: 'sales' as const,
    rarity: 'rare' as const,
    xp: 200,
  },
  {
    id: 'five-star',
    name: 'Five Star Day',
    description: 'Receive a 5-star review',
    icon: 'star',
    category: 'reviews' as const,
    rarity: 'common' as const,
    xp: 100,
  },
  {
    id: 'review-streak',
    name: 'Review Magnet',
    description: 'Receive 5 five-star reviews in a month',
    icon: 'stars',
    category: 'reviews' as const,
    rarity: 'rare' as const,
    xp: 300,
  },
  {
    id: 'perfect-ops',
    name: 'Perfect Operations',
    description: 'Zero no-shows or cancellations in a week',
    icon: 'check-circle',
    category: 'operations' as const,
    rarity: 'rare' as const,
    xp: 150,
  },
];

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!hasPermission(session.role, 'view_executive')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const cached = cache.get<unknown>('gamification-achievements');
    if (cached) {
      return NextResponse.json(cached);
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    // Fetch this month's data for achievement checks
    const [transactions, appointments, reviews] = await Promise.all([
      fetchAll<TransactionFields>(Tables.transactions(), {
        filterByFormula: `AND(IS_AFTER({Date}, '${monthStart}'), IS_BEFORE({Date}, '${monthEnd}'), {Type} = 'Service', {Status} = 'Completed')`,
      }),
      fetchAll<AppointmentFields>(Tables.appointments(), {
        filterByFormula: `AND(IS_AFTER({Date}, '${monthStart}'), IS_BEFORE({Date}, '${monthEnd}'))`,
      }),
      fetchAll<ReviewFields>(Tables.reviews(), {
        filterByFormula: `AND(IS_AFTER({Review Date}, '${monthStart}'), IS_BEFORE({Review Date}, '${monthEnd}'))`,
      }),
    ]);

    const monthlyRevenue = transactions.reduce((sum, t) => sum + (t.fields['Amount'] || 0), 0);
    const completedAppts = appointments.filter((a) => a.fields['Status'] === 'completed').length;
    const consultsClosed = appointments.filter(
      (a) =>
        a.fields['Is Consult'] &&
        (a.fields['Consult Outcome'] === 'Booked' || a.fields['Consult Outcome'] === 'Closed')
    ).length;
    const fiveStarReviews = reviews.filter((r) => r.fields['Star Rating'] === 5).length;
    const noShows = appointments.filter((a) => a.fields['Status'] === 'no_show').length;
    const cancellations = appointments.filter((a) => a.fields['Status'] === 'cancelled').length;

    // Check each achievement
    const achievementChecks: Record<string, boolean> = {
      'first-sale': transactions.length > 0,
      'revenue-1k': monthlyRevenue >= 1000,
      'revenue-10k': monthlyRevenue >= 10000,
      'revenue-50k': monthlyRevenue >= 50000,
      'revenue-100k': monthlyRevenue >= 100000,
      'bookings-10': completedAppts >= 10,
      'bookings-50': completedAppts >= 50,
      'bookings-100': completedAppts >= 100,
      'consult-closer': consultsClosed >= 5,
      'five-star': fiveStarReviews >= 1,
      'review-streak': fiveStarReviews >= 5,
      'perfect-ops': appointments.length > 0 && noShows === 0 && cancellations === 0,
    };

    const achievements = ACHIEVEMENTS.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      icon: a.icon,
      category: a.category,
      rarity: a.rarity,
      earned: achievementChecks[a.id] || false,
      dateEarned: achievementChecks[a.id] ? now.toISOString() : undefined,
    }));

    const earnedXP = ACHIEVEMENTS.filter((a) => achievementChecks[a.id]).reduce(
      (sum, a) => sum + a.xp,
      0
    );

    // Simple level calculation: 1 level per 500 XP
    const level = Math.floor(earnedXP / 500) + 1;

    const data = {
      achievements,
      totalXP: earnedXP,
      level,
    };

    cache.set('gamification-achievements', data, TTL.STANDARD);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 });
  }
}
