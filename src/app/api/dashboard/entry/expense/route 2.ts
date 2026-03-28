import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, createRecord } from '@/lib/airtable/client';
import { cache } from '@/lib/cache';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!hasPermission(session.role, 'entry_expense')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.amount || body.amount <= 0) {
      return NextResponse.json({ error: 'A positive amount is required' }, { status: 400 });
    }
    if (!body.vendor) {
      return NextResponse.json({ error: 'Vendor is required' }, { status: 400 });
    }
    if (!body.category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }

    // Valid Payment Method options: Credit Card, Debit Card, Cash, Afterpay, Cherry, PatientFi, ACH
    const paymentMethodMap: Record<string, string> = {
      'business-card': 'Credit Card', 'business-checking': 'ACH', 'personal-card': 'Credit Card',
      'cash': 'Cash', 'auto-pay': 'ACH',
    };
    const recordId = await createRecord(Tables.transactions(), {
      'Date': body.date || new Date().toISOString().split('T')[0],
      'Amount': -Math.abs(body.amount),
      'Service Name': `[Expense] ${body.vendor}`,
      'Payment Method': paymentMethodMap[body.paymentMethod] || 'Credit Card',
      'Status': 'Completed',
    });

    cache.invalidate('finance-expenses');

    return NextResponse.json({ success: true, recordId });
  } catch (error) {
    console.error('Error recording expense:', error);
    return NextResponse.json({ error: 'Failed to record expense' }, { status: 500 });
  }
}
