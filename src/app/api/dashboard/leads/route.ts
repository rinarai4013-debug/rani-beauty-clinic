import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';
import type { LeadFunnelData } from '@/types/dashboard';

interface IntakeFields {
  'Processing Status'?: string;
}

interface AppointmentFields {
  'Is Consult'?: boolean;
  'Status'?: string;
}

interface TreatmentPlanFields {
  'Status'?: string;
}

interface TransactionFields {
  'Type'?: string;
  'Status'?: string;
}

const STAGE_COLORS = ['#C9A96E', '#8B5CF6', '#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#94A3B8'];

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!hasPermission(session.role, 'view_leads')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const cacheKey = 'leads-funnel';
  const cached = cache.get<LeadFunnelData>(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const [intakes, appointments, plans, transactions] = await Promise.all([
      fetchAll<IntakeFields>(Tables.intakes(), {}, true),
      fetchAll<AppointmentFields>(Tables.appointments(), {}, true),
      fetchAll<TreatmentPlanFields>(Tables.treatmentPlans(), {}, true),
      fetchAll<TransactionFields>(Tables.transactions(), {}, true),
    ]);

    const newLeads = intakes.filter((i) => (i.fields['Processing Status'] || '') === 'New').length;
    const contacted = intakes.filter((i) =>
      ['Processed', 'Responded'].includes(String(i.fields['Processing Status'] || '')),
    ).length;
    const consultsBooked = appointments.filter((a) => a.fields['Is Consult']).length;
    const consultsCompleted = appointments.filter(
      (a) => a.fields['Is Consult'] && String(a.fields['Status'] || '').toLowerCase() === 'completed',
    ).length;
    const treatmentPlansSent = plans.filter((p) =>
      ['Sent', 'Viewed'].includes(String(p.fields['Status'] || '')),
    ).length;
    const converted = plans.filter((p) => String(p.fields['Status'] || '') === 'Booked').length;
    const depositsCollected = transactions.filter(
      (t) => String(t.fields['Type'] || '') === 'Deposit' && String(t.fields['Status'] || '') !== 'Refund',
    ).length;

    const lost = Math.max(0, contacted - converted);

    const metrics = {
      newLeads,
      contacted,
      consultsBooked,
      consultsCompleted,
      treatmentPlansSent,
      depositsCollected,
      converted,
      lost,
    };

    const leadToConsult = newLeads > 0 ? Math.round((consultsBooked / newLeads) * 100) : 0;
    const consultShowRate = consultsBooked > 0 ? Math.round((consultsCompleted / consultsBooked) * 100) : 0;
    const consultCloseRate = consultsCompleted > 0 ? Math.round((converted / consultsCompleted) * 100) : 0;
    const depositCaptureRate = treatmentPlansSent > 0 ? Math.round((depositsCollected / treatmentPlansSent) * 100) : 0;

    const stages = [
      { name: 'New Leads', count: newLeads, percentage: 100 },
      { name: 'Contacted', count: contacted, percentage: leadToConsult },
      { name: 'Consults Booked', count: consultsBooked, percentage: leadToConsult },
      { name: 'Consults Completed', count: consultsCompleted, percentage: consultShowRate },
      { name: 'Plans Sent', count: treatmentPlansSent, percentage: consultCloseRate },
      { name: 'Deposits', count: depositsCollected, percentage: depositCaptureRate },
      { name: 'Converted', count: converted, percentage: consultCloseRate },
    ].map((stage, idx) => ({ ...stage, color: STAGE_COLORS[idx % STAGE_COLORS.length] }));

    const data: LeadFunnelData = {
      stages,
      metrics,
      conversionRates: {
        leadToConsult,
        consultShowRate,
        consultCloseRate,
        depositCaptureRate,
      },
      avgResponseTime: 0,
      avgTreatmentPlanValue: 0,
      topLeadSources: [],
    };

    cache.set(cacheKey, data, TTL.MODERATE);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Leads route error:', error);
    return NextResponse.json({ error: 'Failed to fetch lead funnel data' }, { status: 500 });
  }
}
