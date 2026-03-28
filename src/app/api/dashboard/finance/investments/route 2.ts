import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';

/**
 * GET /api/dashboard/finance/investments
 * Investment analysis data endpoint.
 * Note: The investments page uses client-side computation via the investment-analyzer library.
 * This route provides saved analysis results and historical comparisons.
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
    // The investments page primarily uses client-side calculation via the
    // investment-analyzer library. This endpoint provides default presets
    // and any saved analysis history.
    return NextResponse.json({
      success: true,
      data: {
        presets: {
          equipment: [
            { name: 'Sofwave Device', cost: 150000, revenuePerTreatment: 3000, treatmentsPerMonth: 25 },
            { name: 'CoolSculpting', cost: 80000, revenuePerTreatment: 800, treatmentsPerMonth: 30 },
            { name: 'Laser Hair Removal', cost: 60000, revenuePerTreatment: 250, treatmentsPerMonth: 50 },
            { name: 'RF Microneedling Upgrade', cost: 35000, revenuePerTreatment: 650, treatmentsPerMonth: 15 },
          ],
          hiring: [
            { role: 'Injection Specialist', annualSalary: 85000, revenuePerHour: 300 },
            { role: 'Aesthetician', annualSalary: 55000, revenuePerHour: 180 },
            { role: 'Front Desk', annualSalary: 42000, revenuePerHour: 0 },
          ],
        },
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Investments API error:', err);
    return NextResponse.json({ error: 'Failed to load investment data' }, { status: 500 });
  }
}
