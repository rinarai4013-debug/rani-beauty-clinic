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
    if (!hasPermission(session.role, 'entry_inventory')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.itemName && !body.item) {
      return NextResponse.json({ error: 'Item name is required' }, { status: 400 });
    }

    const itemName = body.itemName || body.item;
    const adjustmentType = body.adjustmentType || 'add';
    const quantity = body.quantity || body.amount || 0;
    const reason = body.reason || '';
    const category = body.category || '';
    const sku = body.sku || '';

    const recordId = await createRecord(Tables.alerts(), {
      'Type': 'Custom',
      'Severity': 'INFO',
      'Message': `[Inventory ${adjustmentType}] ${itemName}${sku ? ` (${sku})` : ''} - ${quantity} units | ${category} | ${reason}`,
      'Action Recommended': body.notes || '',
      'Status': 'Active',
      'Created Date': new Date().toISOString(),
    });

    cache.invalidate('alerts');

    return NextResponse.json({ success: true, recordId });
  } catch (error) {
    console.error('Error recording inventory:', error);
    return NextResponse.json({ error: 'Failed to record inventory' }, { status: 500 });
  }
}
