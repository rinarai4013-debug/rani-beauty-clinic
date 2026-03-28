import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';

/**
 * GET /api/dashboard/finance/overview
 * Returns high-level finance summary: runway, next tax payment, key metrics.
 * Lightweight endpoint for the Finance Command Center landing page.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.role, 'view_finance')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Derive overview metrics from available data
    // In production, this would pull from Airtable/Plaid aggregates.
    // For now, return structure for the dashboard to consume.

    const now = new Date();
    const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);
    const quarterDueDates: Record<number, string> = {
      1: `${now.getFullYear()}-04-15`,
      2: `${now.getFullYear()}-06-16`,
      3: `${now.getFullYear()}-09-15`,
      4: `${now.getFullYear() + 1}-01-15`,
    };

    return NextResponse.json({
      success: true,
      data: {
        runway: {
          months: 12.5,
          status: 'healthy',
        },
        nextTaxPayment: {
          quarter: currentQuarter,
          amount: 0, // Will be populated when tax module has data
          dueDate: quarterDueDates[currentQuarter] ?? '',
        },
        lastUpdated: now.toISOString(),
      },
    });
  } catch (err) {
    console.error('Finance overview error:', err);
    return NextResponse.json({ error: 'Failed to generate finance overview' }, { status: 500 });
  }
}
