// ═══════════════════════════════════════════════════════════════
// QuickBooks Online — Sync API Route
// Trigger sync, get status, full reconciliation
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import {
  incrementalSync,
  fullReconciliation,
  getSyncStatus,
  getTransactionCache,
} from '@/lib/integrations/quickbooks/sync';

/**
 * GET /api/integrations/quickbooks/sync
 * Query params:
 *   action=status       → Get sync status
 *   action=transactions → Get cached transactions (with optional filters)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'status';

  try {
    switch (action) {
      case 'status': {
        return NextResponse.json(getSyncStatus());
      }

      case 'transactions': {
        const type = searchParams.get('type') as 'income' | 'expense' | null;
        const category = searchParams.get('category');
        const start = searchParams.get('start');
        const end = searchParams.get('end');
        const limit = parseInt(searchParams.get('limit') || '100', 10);
        const offset = parseInt(searchParams.get('offset') || '0', 10);

        let transactions = getTransactionCache();

        if (type) transactions = transactions.filter(t => t.type === type);
        if (category) transactions = transactions.filter(t => t.category === category);
        if (start) transactions = transactions.filter(t => t.date >= start);
        if (end) transactions = transactions.filter(t => t.date <= end);

        // Sort by date descending
        transactions.sort((a, b) => b.date.localeCompare(a.date));

        return NextResponse.json({
          total: transactions.length,
          offset,
          limit,
          data: transactions.slice(offset, offset + limit),
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: status, transactions' },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error('[QBO Sync GET Error]', error);
    return NextResponse.json(
      { error: 'Sync error', detail: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/integrations/quickbooks/sync
 * Body: { action: 'incremental' | 'full', startDate?, endDate? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action = 'incremental', startDate, endDate } = body;

    switch (action) {
      case 'incremental': {
        const result = await incrementalSync();
        return NextResponse.json({
          success: true,
          ...result,
          syncStatus: getSyncStatus(),
        });
      }

      case 'full': {
        const result = await fullReconciliation(startDate, endDate);
        return NextResponse.json({
          success: true,
          ...result,
          syncStatus: getSyncStatus(),
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: incremental, full' },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error('[QBO Sync POST Error]', error);
    return NextResponse.json(
      { error: 'Sync failed', detail: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
