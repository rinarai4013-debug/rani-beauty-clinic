// ═══════════════════════════════════════════════════════════════
// QuickBooks Online — Reports API Route
// P&L, Balance Sheet, Cash Flow, AR/AP, Revenue, Expenses, Tax
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import {
  getProfitAndLoss,
  getBalanceSheet,
  getCashFlowStatement,
  getARAgingSummary,
  getAPAgingSummary,
  getRevenueByService,
  getExpenseBreakdown,
  getTaxSummary,
  getBudgetVsActual,
  getProviderProfitability,
  getFinancialSummary,
} from '@/lib/integrations/quickbooks/reports';
import { getPayrollSummary } from '@/lib/integrations/quickbooks/payroll';

type Period = 'monthly' | 'quarterly' | 'annual';

/**
 * GET /api/integrations/quickbooks/reports
 * Query params:
 *   report = pnl | balance-sheet | cash-flow | ar-aging | ap-aging |
 *            revenue-by-service | expenses | tax | budget | providers |
 *            payroll | summary
 *   period = monthly | quarterly | annual (default: monthly)
 *   offset = number (0 = current period, 1 = previous, etc.)
 *   startDate, endDate = YYYY-MM-DD (for summary report)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const report = searchParams.get('report');
  const period = (searchParams.get('period') || 'monthly') as Period;
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!report) {
    return NextResponse.json(
      {
        error: 'Missing report parameter',
        available: [
          'pnl', 'balance-sheet', 'cash-flow', 'ar-aging', 'ap-aging',
          'revenue-by-service', 'expenses', 'tax', 'budget', 'providers',
          'payroll', 'summary',
        ],
      },
      { status: 400 },
    );
  }

  try {
    switch (report) {
      case 'pnl':
        return NextResponse.json(await getProfitAndLoss(period, offset));

      case 'balance-sheet':
        return NextResponse.json(await getBalanceSheet(endDate || undefined));

      case 'cash-flow':
        return NextResponse.json(await getCashFlowStatement(period, offset));

      case 'ar-aging':
        return NextResponse.json(await getARAgingSummary(endDate || undefined));

      case 'ap-aging':
        return NextResponse.json(await getAPAgingSummary(endDate || undefined));

      case 'revenue-by-service':
        return NextResponse.json(await getRevenueByService(period, offset));

      case 'expenses':
        return NextResponse.json(await getExpenseBreakdown(period, offset));

      case 'tax':
        return NextResponse.json(await getTaxSummary(period, offset));

      case 'budget':
        return NextResponse.json(
          await getBudgetVsActual(parseInt(searchParams.get('months') || '6', 10)),
        );

      case 'providers':
        return NextResponse.json(await getProviderProfitability(period, offset));

      case 'payroll': {
        const now = new Date();
        const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const end = endDate || now.toISOString().split('T')[0];
        return NextResponse.json(await getPayrollSummary(start, end));
      }

      case 'summary': {
        const now = new Date();
        const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const end = endDate || now.toISOString().split('T')[0];
        return NextResponse.json(await getFinancialSummary(start, end));
      }

      default:
        return NextResponse.json(
          { error: `Unknown report: ${report}` },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error(`[QBO Report Error: ${report}]`, error);
    return NextResponse.json(
      { error: 'Report generation failed', detail: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
