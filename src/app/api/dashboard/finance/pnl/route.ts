import { NextResponse } from 'next/server';
import { generateFinancialIntelligence, type FinanceInput } from '@/lib/finance/pnl-engine';

export async function GET() {
  try {
    // In production, pulls from Airtable Transactions + Expenses tables
    // Sample data for engine demonstration
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

    const sampleInput: FinanceInput = {
      revenue: [],
      expenses: [],
      period: {
        start: thirtyDaysAgo.toISOString().slice(0, 10),
        end: now.toISOString().slice(0, 10),
      },
      memberships: {
        count: 42,
        monthlyRevenue: 8400,
      },
      bankBalance: 45000,
      monthlyFixedCosts: 28000,
    };

    const result = generateFinancialIntelligence(sampleInput);

    return NextResponse.json({
      success: true,
      data: result,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('P&L generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate P&L report' },
      { status: 500 }
    );
  }
}
