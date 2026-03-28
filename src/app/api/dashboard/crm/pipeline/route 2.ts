import { NextRequest, NextResponse } from 'next/server';
import { calculatePipelineMetrics, generateForecast, detectStaleLeads, STAGE_ORDER } from '@/lib/crm/pipeline';
import type { PipelineLead, CRMKanbanData, PipelineStage } from '@/types/crm';
import { PIPELINE_STAGE_LABELS } from '@/types/crm';

/**
 * GET /api/dashboard/crm/pipeline
 * Returns pipeline kanban data with leads grouped by stage.
 */
export async function GET(request: NextRequest) {
  try {
    // In production, fetch from Airtable. Using sample data for structure.
    const leads = getSampleLeads();
    const metrics = calculatePipelineMetrics(leads);
    const forecasts = generateForecast(leads);

    const stages = STAGE_ORDER.map(stage => ({
      stage,
      label: PIPELINE_STAGE_LABELS[stage],
      leads: leads.filter(l => l.stage === stage && !l.lostReason),
      count: leads.filter(l => l.stage === stage && !l.lostReason).length,
      totalValue: leads
        .filter(l => l.stage === stage && !l.lostReason)
        .reduce((sum, l) => sum + l.estimatedValue, 0),
    }));

    const data: CRMKanbanData = { stages, metrics, forecasts };
    return NextResponse.json(data);
  } catch (error) {
    console.error('CRM Pipeline error:', error);
    return NextResponse.json({ error: 'Failed to load pipeline data' }, { status: 500 });
  }
}

/**
 * POST /api/dashboard/crm/pipeline
 * Create a new lead or transition a lead stage.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'create_lead') {
      return NextResponse.json({ success: true, message: 'Lead created' });
    }

    if (action === 'transition') {
      return NextResponse.json({ success: true, message: 'Stage transitioned' });
    }

    if (action === 'mark_lost') {
      return NextResponse.json({ success: true, message: 'Lead marked as lost' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('CRM Pipeline POST error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

/** Sample data for development */
function getSampleLeads(): PipelineLead[] {
  const now = new Date();
  return [
    {
      id: 'lead_001', clientId: 'c001', clientName: 'Sarah Johnson', email: 'sarah@example.com', phone: '(425) 555-0101',
      stage: 'new_lead', source: 'instagram', assignedTo: 'Rina', estimatedValue: 1200,
      enteredAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      lastActivityAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      stageHistory: [], tags: ['botox', 'new'], notes: 'Interested in injection treatments', score: 45, isStale: false, daysInStage: 1,
    },
    {
      id: 'lead_002', clientId: 'c002', clientName: 'Emily Chen', email: 'emily@example.com', phone: '(206) 555-0202',
      stage: 'consultation_booked', source: 'google', assignedTo: 'Rina', estimatedValue: 2500,
      enteredAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      lastActivityAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      stageHistory: [
        { from: 'new_lead', to: 'contacted', at: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(), by: 'Rina' },
        { from: 'contacted', to: 'consultation_booked', at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), by: 'Rina' },
      ],
      tags: ['sofwave', 'skin_tightening'], notes: 'Sofwave consultation booked', score: 65, isStale: false, daysInStage: 3,
    },
    {
      id: 'lead_003', clientId: 'c003', clientName: 'Michelle Park', email: 'michelle@example.com', phone: '(425) 555-0303',
      stage: 'treatment_planned', source: 'referral', assignedTo: 'Rina', estimatedValue: 4500,
      enteredAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      lastActivityAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      stageHistory: [
        { from: 'new_lead', to: 'contacted', at: new Date(now.getTime() - 19 * 24 * 60 * 60 * 1000).toISOString(), by: 'Rina' },
        { from: 'contacted', to: 'consultation_booked', at: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(), by: 'Rina' },
        { from: 'consultation_booked', to: 'consulted', at: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(), by: 'Rina' },
        { from: 'consulted', to: 'treatment_planned', at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), by: 'Rina' },
      ],
      tags: ['sofwave', 'package', 'vip_potential'], notes: 'Platinum package discussed', score: 85, isStale: false, daysInStage: 5,
    },
  ];
}
