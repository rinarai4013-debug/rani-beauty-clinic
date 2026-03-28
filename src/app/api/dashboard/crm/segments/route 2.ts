import { NextRequest, NextResponse } from 'next/server';
import { segmentClient, calculateSegmentMetrics } from '@/lib/crm/segments';
import type { SegmentMetrics, ClientSegment, RFMInput } from '@/lib/crm/segments';

/**
 * GET /api/dashboard/crm/segments
 * Returns segment analysis with RFM matrix.
 */
export async function GET(request: NextRequest) {
  try {
    const sampleInputs = getSampleRFMInputs();
    const clients = sampleInputs.map(input => segmentClient(input));
    const metrics = calculateSegmentMetrics(clients);

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('CRM Segments error:', error);
    return NextResponse.json({ error: 'Failed to load segment data' }, { status: 500 });
  }
}

function getSampleRFMInputs(): RFMInput[] {
  return [
    { clientId: 'c001', clientName: 'Sarah Johnson', daysSinceLastVisit: 5, visitCount: 8, totalSpend: 4200, avgTicket: 525, lastVisitDate: '2026-03-21', services: [{ category: 'Injectable', serviceName: 'Botox', visitCount: 5, totalSpend: 2500, lastDate: '2026-03-21' }, { category: 'Facial', serviceName: 'HydraFacial', visitCount: 3, totalSpend: 825, lastDate: '2026-03-01' }] },
    { clientId: 'c002', clientName: 'Emily Chen', daysSinceLastVisit: 45, visitCount: 3, totalSpend: 1800, avgTicket: 600, lastVisitDate: '2026-02-09', services: [{ category: 'Laser', serviceName: 'PicoWay', visitCount: 2, totalSpend: 1200, lastDate: '2026-02-09' }] },
    { clientId: 'c003', clientName: 'Michelle Park', daysSinceLastVisit: 6, visitCount: 15, totalSpend: 12500, avgTicket: 833, lastVisitDate: '2026-03-20', services: [{ category: 'Injectable', serviceName: 'Filler', visitCount: 5, totalSpend: 5000, lastDate: '2026-03-20' }, { category: 'Laser', serviceName: 'Sofwave', visitCount: 3, totalSpend: 9000, lastDate: '2026-02-15' }] },
    { clientId: 'c004', clientName: 'Lisa Wang', daysSinceLastVisit: 120, visitCount: 6, totalSpend: 3600, avgTicket: 600, lastVisitDate: '2025-11-26', services: [{ category: 'Facial', serviceName: 'VI Peel', visitCount: 4, totalSpend: 1580, lastDate: '2025-11-26' }] },
    { clientId: 'c005', clientName: 'Jennifer Kim', daysSinceLastVisit: 200, visitCount: 1, totalSpend: 275, avgTicket: 275, lastVisitDate: '2025-09-07', services: [{ category: 'Facial', serviceName: 'HydraFacial', visitCount: 1, totalSpend: 275, lastDate: '2025-09-07' }] },
  ];
}
