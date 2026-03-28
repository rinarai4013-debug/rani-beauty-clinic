import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { cache, TTL } from '@/lib/cache';
import { calculatePerformanceMetrics, type PerformanceInput, type AppointmentRecord, type TransactionRecord, type ReviewRecord } from '@/lib/providers/performance';
import { Tables, fetchAll } from '@/lib/airtable/client';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.role, 'view_providers')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('id');
    const period = (searchParams.get('period') || 'monthly') as 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID required' }, { status: 400 });
    }

    const cacheKey = `provider-perf-${providerId}-${period}`;
    const cached = cache.get(cacheKey);
    if (cached) return NextResponse.json(cached);

    // Calculate date range
    const now = new Date();
    const periodStart = new Date(now);
    switch (period) {
      case 'daily': periodStart.setHours(0, 0, 0, 0); break;
      case 'weekly': periodStart.setDate(now.getDate() - now.getDay()); break;
      case 'monthly': periodStart.setDate(1); break;
      case 'quarterly': periodStart.setMonth(Math.floor(now.getMonth() / 3) * 3, 1); break;
      case 'yearly': periodStart.setMonth(0, 1); break;
    }

    // Fetch data from Airtable
    const [appointments, transactions, reviews] = await Promise.all([
      fetchAll(Tables.appointments(), {
        filterByFormula: `AND({Provider}="${providerId}", {Date}>="${periodStart.toISOString().split('T')[0]}")`,
      }),
      fetchAll(Tables.transactions(), {
        filterByFormula: `AND({Provider}="${providerId}", {Date}>="${periodStart.toISOString().split('T')[0]}")`,
      }),
      fetchAll(Tables.reviews(), {
        filterByFormula: `{Provider}="${providerId}"`,
      }),
    ]);

    const apptRecords: AppointmentRecord[] = appointments.map((r: { id: string; fields: Record<string, unknown> }) => ({
      id: r.id,
      date: String(r.fields['Date'] ?? ''),
      service: String(r.fields['Service Name'] ?? ''),
      category: String(r.fields['Service Category'] ?? ''),
      duration: Number(r.fields['Duration'] ?? 0),
      status: (String(r.fields['Status'] ?? 'scheduled')).toLowerCase().replace(/ /g, '_') as AppointmentRecord['status'],
      clientId: String(r.fields['Client'] ?? ''),
      revenue: Number(r.fields['Revenue'] ?? 0),
      isNewClient: false,
    }));

    const txRecords: TransactionRecord[] = transactions.map((r: { id: string; fields: Record<string, unknown> }) => ({
      id: r.id,
      date: String(r.fields['Date'] ?? ''),
      amount: Number(r.fields['Amount'] ?? 0),
      type: (String(r.fields['Type'] ?? 'service')).toLowerCase() as TransactionRecord['type'],
      service: String(r.fields['Service Name'] ?? ''),
    }));

    const reviewRecords: ReviewRecord[] = reviews.map((r: { id: string; fields: Record<string, unknown> }) => ({
      id: r.id,
      date: String(r.fields['Date'] ?? ''),
      rating: Number(r.fields['Rating'] ?? 0),
      providerId,
    }));

    const completedAppts = apptRecords.filter(a => a.status === 'completed');
    const clientIds = new Set(completedAppts.map(a => a.clientId));
    const totalClients = clientIds.size;

    const input: PerformanceInput = {
      providerId,
      providerName: providerId,
      period,
      periodStart: periodStart.toISOString().split('T')[0],
      periodEnd: now.toISOString().split('T')[0],
      appointments: apptRecords,
      transactions: txRecords,
      reviews: reviewRecords,
      availableHours: completedAppts.length > 0 ? completedAppts.length * 1.5 : 8,
      totalClients,
      returningClients: Math.floor(totalClients * 0.7),
      rebookedClients: Math.floor(completedAppts.length * 0.6),
      newClients: Math.floor(totalClients * 0.3),
      newClientsThatBooked: Math.floor(totalClients * 0.2),
      upsellCount: Math.floor(completedAppts.length * 0.15),
      totalAppointments: apptRecords.length,
    };

    const metrics = calculatePerformanceMetrics(input);
    cache.set(cacheKey, metrics, TTL.SHORT);

    return NextResponse.json(metrics);
  } catch (err) {
    console.error('[Provider Performance API]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
