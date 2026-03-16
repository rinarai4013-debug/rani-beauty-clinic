import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, rateLimitedQuery } from '@/lib/airtable/client';
import {
  getAll2026Payments,
  listLocations,
  isConfigured,
  type ParsedTransaction,
} from '@/lib/square/client';
import { cache, TTL } from '@/lib/cache';

// GET — fetch Square payment data + status
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!hasPermission(session.role, 'view_executive')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!isConfigured()) {
      return NextResponse.json({
        configured: false,
        message: 'SQUARE_ACCESS_TOKEN not set. Go to developer.squareup.com → your app → Credentials → copy Access Token → add to .env.local',
        setupUrl: 'https://developer.squareup.com',
      });
    }

    const cacheKey = 'integrations:square:status';
    const cached = cache.get<object>(cacheKey);
    if (cached) return NextResponse.json(cached);

    // Fetch locations
    const { locations } = await listLocations();

    // Fetch 2026 payments
    const payments = await getAll2026Payments();
    const completed = payments.filter((p) => p.status === 'COMPLETED');

    // Calculate metrics
    const totalRevenue = completed.reduce((sum, p) => sum + p.amount, 0);
    const totalTips = completed.reduce((sum, p) => sum + p.tip, 0);
    const avgTicket = completed.length > 0 ? totalRevenue / completed.length : 0;

    // Monthly breakdown
    const monthlyRevenue: Record<string, number> = {};
    for (const p of completed) {
      const month = p.date.substring(0, 7); // YYYY-MM
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + p.amount;
    }

    const result = {
      configured: true,
      locations: locations.map((l) => ({
        id: l.id,
        name: l.name,
        address: l.address,
      })),
      payments2026: {
        total: payments.length,
        completed: completed.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalTips: Math.round(totalTips * 100) / 100,
        avgTicket: Math.round(avgTicket * 100) / 100,
        monthlyRevenue,
      },
      recentPayments: completed.slice(0, 10).map((p) => ({
        date: p.date,
        amount: p.amount,
        tip: p.tip,
        method: p.paymentMethod,
        last4: p.cardLast4,
        note: p.note,
      })),
      lastSynced: new Date().toISOString(),
    };

    cache.set(cacheKey, result, TTL.STANDARD);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Square GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Square data', details: String(error) },
      { status: 500 }
    );
  }
}

// POST — sync Square payments → Airtable Transactions table
export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!hasPermission(session.role, 'manage_settings')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!isConfigured()) {
      return NextResponse.json(
        {
          error: 'SQUARE_ACCESS_TOKEN not configured',
          setupUrl: 'https://developer.squareup.com',
        },
        { status: 400 }
      );
    }

    // Fetch all 2026 completed payments
    const payments = await getAll2026Payments();
    const completed = payments.filter((p) => p.status === 'COMPLETED');

    // Get existing transactions from Airtable to deduplicate
    const existingRecords = await rateLimitedQuery(() =>
      new Promise<Array<{ id: string; fields: Record<string, unknown> }>>((resolve, reject) => {
        const records: Array<{ id: string; fields: Record<string, unknown> }> = [];
        Tables.transactions()
          .select({
            fields: ['Date', 'Amount', 'Payment Method'],
            filterByFormula: "FIND('Square', {Payment Method})",
          })
          .eachPage(
            (pageRecords, fetchNextPage) => {
              records.push(
                ...pageRecords.map((r) => ({ id: r.id, fields: r.fields as Record<string, unknown> }))
              );
              fetchNextPage();
            },
            (err) => {
              if (err) reject(err);
              else resolve(records);
            }
          );
      })
    );

    // Simple dedup by amount + date (within same day)
    const existingKeys = new Set(
      existingRecords.map((r) => {
        const date = String(r.fields['Date'] || '').substring(0, 10);
        const amount = Number(r.fields['Amount'] || 0);
        return `${date}:${amount}`;
      })
    );

    const newPayments = completed.filter((p) => {
      const date = p.date.substring(0, 10);
      const key = `${date}:${p.amount}`;
      return !existingKeys.has(key);
    });

    // Create transaction records in Airtable (batch of 10)
    let created = 0;
    const batches: ParsedTransaction[][] = [];
    for (let i = 0; i < newPayments.length; i += 10) {
      batches.push(newPayments.slice(i, i + 10));
    }

    for (const batch of batches) {
      await rateLimitedQuery(() =>
        new Promise<void>((resolve, reject) => {
          Tables.transactions().create(
            batch.map((p) => ({
              fields: {
                Date: p.date.substring(0, 10),
                Type: 'Service Payment',
                Amount: p.amount,
                'Payment Method': `Square (${p.paymentMethod}${p.cardLast4 ? ` •${p.cardLast4}` : ''})`,
                Status: 'Completed',
                'Service Name': p.note || 'Treatment',
                'Is Financing': false,
              },
            })),
            { typecast: true },
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        })
      );
      created += batch.length;
    }

    // Clear cache
    cache.invalidate('integrations:square:status');

    return NextResponse.json({
      success: true,
      totalPayments: completed.length,
      newTransactionsAdded: created,
      alreadyExisted: completed.length - newPayments.length,
      totalRevenue: Math.round(completed.reduce((s, p) => s + p.amount, 0) * 100) / 100,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Square sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync Square data', details: String(error) },
      { status: 500 }
    );
  }
}
