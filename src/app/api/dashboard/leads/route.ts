import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';
import type { LeadFunnelData, FunnelStage, LeadSource } from '@/types/dashboard';

// Actual fields in the live Airtable Clients table
interface ClientFields {
  'Client': string;
  'Email': string;
  'Phone': string;
  'Status': string;
}

interface AppointmentFields {
  'Service Name': string;
  'Date': string;
  'Status': string;
  'Is Consult': boolean;
  'Consult Outcome': string;
  'Deposit Amount': number;
  'Deposit Paid': boolean;
  'Amount Quoted': number;
}

const FUNNEL_COLORS: Record<string, string> = {
  'New Lead': '#3B82F6',
  'Contacted': '#8B5CF6',
  'Consult Booked': '#EC4899',
  'Consult Completed': '#F59E0B',
  'Treatment Plan Sent': '#10B981',
  'Deposit Collected': '#C9A96E',
  'Active': '#0F1D2C',
  'Lost': '#EF4444',
};

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (!hasPermission(session.role, 'view_leads')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const cacheKey = 'leads';
  const cached = cache.get<LeadFunnelData>(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const [clients, recentConsults] = await Promise.all([
      // Clients table has no "Is Test" field - pass skipTestFilter=true
      fetchAll<ClientFields>(Tables.clients(), {}, true),
      fetchAll<AppointmentFields>(Tables.appointments(), {
        filterByFormula: `AND({Is Consult} = TRUE(), {Date} >= DATEADD(TODAY(), -30, 'days'))`,
      }),
    ]);

    // --- Group clients by status ---
    const statusCounts = new Map<string, number>();
    for (const c of clients) {
      const status = c.fields['Status'] || 'Unknown';
      statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
    }

    // --- Funnel stages ---
    const newLeads = statusCounts.get('New Lead') || 0;
    const contacted = statusCounts.get('Contacted') || 0;
    const consultBooked = statusCounts.get('Consult Booked') || 0;
    const consultCompleted = statusCounts.get('Consult Completed') || 0;
    const treatmentPlanSent = statusCounts.get('Treatment Plan Sent') || 0;
    const depositCollected = statusCounts.get('Deposit Collected') || 0;
    const active = statusCounts.get('Active') || 0;
    const lost = statusCounts.get('Lost') || statusCounts.get('Inactive') || 0;

    const totalInPipeline = newLeads + contacted + consultBooked + consultCompleted + treatmentPlanSent + depositCollected;
    const pipelineBase = Math.max(totalInPipeline, 1);

    const stageDefinitions = [
      { name: 'New Lead', count: newLeads },
      { name: 'Contacted', count: contacted },
      { name: 'Consult Booked', count: consultBooked },
      { name: 'Consult Completed', count: consultCompleted },
      { name: 'Treatment Plan Sent', count: treatmentPlanSent },
      { name: 'Deposit Collected', count: depositCollected },
      { name: 'Active', count: active },
      { name: 'Lost', count: lost },
    ];

    const stages: FunnelStage[] = stageDefinitions.map((s) => ({
      name: s.name,
      count: s.count,
      percentage: Math.round((s.count / pipelineBase) * 100),
      color: FUNNEL_COLORS[s.name] || '#6B7280',
    }));

    // --- Conversion rates ---
    const totalConsultsBooked = recentConsults.length;
    const totalConsultsShown = recentConsults.filter(
      (a) => a.fields['Status'] === 'completed'
    ).length;
    const totalConsultsClosed = recentConsults.filter(
      (a) => a.fields['Consult Outcome'] === 'Booked' || a.fields['Consult Outcome'] === 'Closed'
    ).length;
    const totalDepositsCollected = recentConsults.filter(
      (a) => a.fields['Deposit Paid']
    ).length;

    const leadToConsult = newLeads + contacted + consultBooked > 0
      ? Math.round((totalConsultsBooked / (newLeads + contacted + consultBooked + totalConsultsBooked)) * 100)
      : 0;
    const consultShowRate = totalConsultsBooked > 0
      ? Math.round((totalConsultsShown / totalConsultsBooked) * 100)
      : 0;
    const consultCloseRate = totalConsultsShown > 0
      ? Math.round((totalConsultsClosed / totalConsultsShown) * 100)
      : 0;
    const depositCaptureRate = totalConsultsClosed > 0
      ? Math.round((totalDepositsCollected / totalConsultsClosed) * 100)
      : 0;

    // --- Average treatment plan value ---
    const quotedConsults = recentConsults.filter(
      (a) => a.fields['Amount Quoted'] && a.fields['Amount Quoted'] > 0
    );
    const avgTreatmentPlanValue = quotedConsults.length > 0
      ? Math.round(
          quotedConsults.reduce((sum, a) => sum + (a.fields['Amount Quoted'] || 0), 0) /
            quotedConsults.length
        )
      : 0;

    // --- Top lead sources (Source field not in Clients table - return empty) ---
    const topLeadSources: LeadSource[] = [];

    const data: LeadFunnelData = {
      stages,
      metrics: {
        newLeads,
        contacted,
        consultsBooked: consultBooked,
        consultsCompleted: consultCompleted,
        treatmentPlansSent: treatmentPlanSent,
        depositsCollected: depositCollected,
        converted: active,
        lost,
      },
      conversionRates: {
        leadToConsult,
        consultShowRate,
        consultCloseRate,
        depositCaptureRate,
      },
      avgResponseTime: 0,
      avgTreatmentPlanValue,
      topLeadSources,
    };

    cache.set(cacheKey, data, TTL.MODERATE);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Leads route error:', error);
    return NextResponse.json({ error: 'Failed to fetch lead data' }, { status: 500 });
  }
}
