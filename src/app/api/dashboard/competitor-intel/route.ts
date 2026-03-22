import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';

interface CompetitorFields {
  'Competitor Name': string;
  'Service Monitored': string;
  'Their Price': number;
  'Our Price': number;
  'Pricing Delta': number;
  'Pricing Delta %': number;
  'Last Scan Date': string;
  'Source URL': string;
  'Notes': string;
  'Trend': string;
  'Status': string;
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (!hasPermission(session.role, 'view_executive')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const cacheKey = 'competitor-intel';
  const cached = cache.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const records = await fetchAll<CompetitorFields>(Tables.competitorIntel(), {
      sort: [{ field: 'Last Scan Date', direction: 'desc' }],
    });

    const competitors = records.map((r) => ({
      id: r.id,
      competitorName: r.fields['Competitor Name'] || '',
      serviceMonitored: r.fields['Service Monitored'] || '',
      theirPrice: r.fields['Their Price'] || 0,
      ourPrice: r.fields['Our Price'] || 0,
      pricingDelta: r.fields['Pricing Delta'] || 0,
      pricingDeltaPercent: r.fields['Pricing Delta %'] || 0,
      lastScanDate: r.fields['Last Scan Date'] || '',
      sourceUrl: r.fields['Source URL'] || '',
      notes: r.fields['Notes'] || '',
      trend: r.fields['Trend'] || 'stable',
      status: r.fields['Status'] || 'active',
    }));

    // Aggregate stats
    const uniqueCompetitors = [...new Set(competitors.map(c => c.competitorName))].length;
    const servicesTracked = [...new Set(competitors.map(c => c.serviceMonitored))].length;
    const avgDelta = competitors.length > 0
      ? competitors.reduce((sum, c) => sum + c.pricingDeltaPercent, 0) / competitors.length
      : 0;
    const lastScan = competitors.length > 0 ? competitors[0].lastScanDate : null;

    const data = {
      success: true,
      data: {
        competitors,
        stats: {
          uniqueCompetitors,
          servicesTracked,
          avgPricingDelta: Math.round(avgDelta * 10) / 10,
          lastScanDate: lastScan,
          totalEntries: competitors.length,
        },
      },
    };

    cache.set(cacheKey, data, TTL.MODERATE);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Competitor intel route error:', error);
    return NextResponse.json({ error: 'Failed to fetch competitor intelligence' }, { status: 500 });
  }
}
