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
    if (!hasPermission(session.role, 'entry_sale')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.amount || body.amount <= 0) {
      return NextResponse.json({ error: 'A positive amount is required' }, { status: 400 });
    }
    if (!body.serviceName) {
      return NextResponse.json({ error: 'Service name is required' }, { status: 400 });
    }
    if (!body.paymentMethod) {
      return NextResponse.json({ error: 'Payment method is required' }, { status: 400 });
    }
    if (!body.provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 });
    }

    // Valid Airtable select options:
    // Type: Service Payment, Package Payment, Membership Payment, Deposit, Refund, Tip, Product
    // Payment Method: Credit Card, Debit Card, Cash, Afterpay, Cherry, PatientFi, ACH
    // Provider: Raj, Mom, Jasmeen, Injector
    // Status: Completed, Pending, Refunded, Failed
    const paymentMethodMap: Record<string, string> = {
      'credit-card': 'Credit Card', 'debit': 'Debit Card', 'cash': 'Cash',
      'cherry': 'Cherry', 'affirm': 'Afterpay', 'zelle': 'ACH', 'other': 'Credit Card',
    };
    const providerMap: Record<string, string> = {
      'rina': 'Raj', 'mom': 'Mom',
    };
    const fields: Record<string, unknown> = {
      'Date': new Date().toISOString().split('T')[0],
      'Type': 'Service Payment',
      'Amount': body.amount,
      'Service Name': body.serviceName,
      'Payment Method': paymentMethodMap[body.paymentMethod] || 'Credit Card',
      'Status': 'Completed',
    };
    const provider = providerMap[body.provider];
    if (provider) fields['Provider'] = provider;
    if (body.isFinancing && body.financingProvider) fields['Financing Provider'] = body.financingProvider;
    const recordId = await createRecord(Tables.transactions(), fields);

    cache.invalidate('kpis');
    cache.invalidate('revenue');

    return NextResponse.json({ success: true, recordId });
  } catch (error) {
    console.error('Error recording sale:', error);
    return NextResponse.json({ error: 'Failed to record sale' }, { status: 500 });
  }
}
