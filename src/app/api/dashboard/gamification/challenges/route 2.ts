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
  'Date': string;
  'Rating': number;
}

interface ClientFields {
  'Status': string;
  'Created': string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  xpReward: number;
  emoji: string;
  completed: boolean;
  metric: string;
}

const CHALLENGE_POOL = [
  { id: 'revenue-2k', title: 'Hit $2K Revenue', description: 'Collect $2,000 in revenue today', target: 2000, metric: 'revenue', emoji: '\uD83D\uDCB0', xpReward: 100 },
  { id: 'revenue-4k', title: 'Hit $4K Revenue', description: 'Crush the daily revenue target', target: 4000, metric: 'revenue', emoji: '\uD83D\uDD25', xpReward: 200 },
  { id: 'bookings-5', title: 'Book 5 Appointments', description: 'Get 5 appointments on the books', target: 5, metric: 'bookings', emoji: '\uD83D\uDCC5', xpReward: 75 },
  { id: 'bookings-8', title: 'Book 8 Appointments', description: 'Pack the schedule today', target: 8, metric: 'bookings', emoji: '\uD83D\uDCC5', xpReward: 150 },
  { id: 'consults-2', title: 'Close 2 Consults', description: 'Convert 2 consultations today', target: 2, metric: 'consults', emoji: '\uD83C\uDFAF', xpReward: 150 },
  { id: 'consults-3', title: 'Close 3 Consults', description: 'Triple consult closer', target: 3, metric: 'consults', emoji: '\uD83C\uDFAF', xpReward: 250 },
  { id: 'review-1', title: 'Earn a Review', description: 'Get a Google review today', target: 1, metric: 'reviews', emoji: '\u2B50', xpReward: 100 },
  { id: 'zero-noshow', title: 'Zero No-Shows', description: 'Perfect attendance day', target: 0, metric: 'noShows', emoji: '\uD83C\uDFAA', xpReward: 100 },
  { id: 'treatments-6', title: '6 Treatments Done', description: 'Complete 6 treatments', target: 6, metric: 'completedAppts', emoji: '\uD83D\uDCAB', xpReward: 100 },
  { id: 'treatments-10', title: '10 Treatments Done', description: 'A full day of glow', target: 10, metric: 'completedAppts', emoji: '\u2728', xpReward: 200 },
  { id: 'lead-3', title: 'Capture 3 Leads', description: 'Get 3 new leads today', target: 3, metric: 'leads', emoji: '\uD83D\uDC64', xpReward: 100 },
  { id: 'bookings-3', title: 'Book 3 Appointments', description: 'Get 3 bookings today', target: 3, metric: 'bookings', emoji: '\uD83D\uDCC5', xpReward: 50 },
  { id: 'revenue-1k', title: 'Hit $1K Revenue', description: 'First thousand of the day', target: 1000, metric: 'revenue', emoji: '\uD83D\uDCB0', xpReward: 50 },
  { id: 'treatments-3', title: '3 Treatments Done', description: 'Complete 3 treatments', target: 3, metric: 'completedAppts', emoji: '\uD83D\uDCAB', xpReward: 50 },
  { id: 'consults-1', title: 'Close a Consult', description: 'Convert 1 consultation', target: 1, metric: 'consults', emoji: '\uD83C\uDFAF', xpReward: 75 },
];

function selectChallenges(dayOfYear: number): typeof CHALLENGE_POOL {
  // Use day of year as seed to deterministically select 3 challenges from different metrics
  const metrics = ['revenue', 'bookings', 'consults', 'reviews', 'completedAppts', 'leads', 'noShows'];
  const selected: typeof CHALLENGE_POOL = [];

  // Pick 3 different metric categories
  const shuffledMetrics: string[] = [];
  for (let i = 0; i < metrics.length; i++) {
    shuffledMetrics.push(metrics[(i + dayOfYear) % metrics.length]);
  }
  const targetMetrics = shuffledMetrics.slice(0, 3);

  for (const metric of targetMetrics) {
    const pool = CHALLENGE_POOL.filter((c) => c.metric === metric);
    if (pool.length > 0) {
      const idx = dayOfYear % pool.length;
      selected.push(pool[idx]);
    }
  }

  // Fill if needed
  while (selected.length < 3) {
    const remaining = CHALLENGE_POOL.filter((c) => !selected.find((s) => s.id === c.id));
    if (remaining.length === 0) break;
    selected.push(remaining[dayOfYear % remaining.length]);
  }

  return selected;
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!hasPermission(session.role, 'view_executive')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const cached = cache.get<{ challenges: Challenge[] }>('gamification-challenges');
    if (cached) {
      return NextResponse.json(cached);
    }

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
    const today = now.toISOString().split('T')[0];

    const todayChallenges = selectChallenges(dayOfYear);

    // Fetch today's data for progress
    const [todayTxns, todayAppts, todayReviews, todayLeads] = await Promise.all([
      fetchAll<TransactionFields>(Tables.transactions(), {
        filterByFormula: `AND({Date} = '${today}', {Type} = 'Service', {Status} = 'Completed')`,
      }),
      fetchAll<AppointmentFields>(Tables.appointments(), {
        filterByFormula: `{Date} = '${today}'`,
      }),
      fetchAll<ReviewFields>(Tables.reviews(), {
        filterByFormula: `{Date} = '${today}'`,
      }),
      fetchAll<ClientFields>(Tables.clients(), {
        filterByFormula: `AND({Status} = 'Lead', IS_SAME({Created}, TODAY(), 'day'))`,
      }, true),
    ]);

    const revenue = todayTxns.reduce((sum, t) => sum + (t.fields['Amount'] || 0), 0);
    const bookings = todayAppts.filter(
      (a) => a.fields['Status'] === 'scheduled' || a.fields['Status'] === 'confirmed'
    ).length;
    const completedAppts = todayAppts.filter((a) => a.fields['Status'] === 'completed').length;
    const consults = todayAppts.filter(
      (a) => a.fields['Is Consult'] && (a.fields['Consult Outcome'] === 'Booked' || a.fields['Consult Outcome'] === 'Closed')
    ).length;
    const reviews = todayReviews.length;
    const noShows = todayAppts.filter((a) => a.fields['Status'] === 'no_show').length;
    const leads = todayLeads.length;

    const metricValues: Record<string, number> = {
      revenue,
      bookings,
      completedAppts,
      consults,
      reviews,
      noShows,
      leads,
    };

    const challenges: Challenge[] = todayChallenges.map((c) => {
      const current = metricValues[c.metric] ?? 0;
      let completed: boolean;

      if (c.metric === 'noShows') {
        // For zero no-shows, completed when no-shows === 0 and there are appointments
        completed = current === 0 && todayAppts.length > 0;
      } else {
        completed = current >= c.target;
      }

      return {
        id: c.id,
        title: c.title,
        description: c.description,
        target: c.target,
        current: c.metric === 'noShows' ? (todayAppts.length > 0 ? (current === 0 ? 1 : 0) : 0) : current,
        xpReward: c.xpReward,
        emoji: c.emoji,
        completed,
        metric: c.metric,
      };
    });

    // For noShows challenges, fix target to 1 for the progress bar display
    for (const challenge of challenges) {
      if (challenge.metric === 'noShows') {
        challenge.target = 1;
      }
    }

    const result = { challenges };
    cache.set('gamification-challenges', result, TTL.REALTIME);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching daily challenges:', error);
    return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 });
  }
}
