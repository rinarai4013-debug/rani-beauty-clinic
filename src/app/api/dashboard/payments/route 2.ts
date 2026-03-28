import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { sanitizeFormulaValue } from '@/lib/airtable/sanitize';
import { cache, TTL } from '@/lib/cache';
import { rateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';

interface TransactionFields {
  'Date': string;
  'Type': string;
  'Amount': number;
  'Payment Method': string;
  'Client Name': string;
  'Service Name': string;
  'Provider': string;
  'Status': string;
  'Is Financing': boolean;
  'Financing Provider': string;
  'Notes': string;
}

export async function GET(request: NextRequest) {
  // Rate limit
  const ip = getClientIP(request);
  const { allowed, resetIn } = rateLimit('dashboard-payments', ip, RATE_LIMITS.VIEW);
  if (!allowed) return rateLimitResponse(resetIn);

  // Auth
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (!hasPermission(session.role, 'view_revenue')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const method = searchParams.get('method') || 'all';
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';

  const cacheKey = `payments-${method}-${from}-${to}`;
  const cached = cache.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    // Build Airtable filter formula - sanitize all user inputs
    const conditions: string[] = [];

    // Payment method filter (allowlist approach)
    if (method && method !== 'all') {
      const methodMap: Record<string, string> = {
        stripe: 'Stripe',
        cherry: 'Cherry',
        square: 'Square',
      };
      const mappedMethod = methodMap[method.toLowerCase()];
      if (mappedMethod) {
        conditions.push(`FIND("${sanitizeFormulaValue(mappedMethod)}", {Payment Method})`);
      }
    }

    // Date range filter - validate ISO date format before injecting
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (from && dateRegex.test(from)) {
      conditions.push(`{Date} >= "${sanitizeFormulaValue(from)}"`);
    }
    if (to && dateRegex.test(to)) {
      conditions.push(`{Date} <= "${sanitizeFormulaValue(to)}"`);
    }

    const filterByFormula = conditions.length > 0
      ? conditions.length === 1
        ? conditions[0]
        : `AND(${conditions.join(', ')})`
      : '';

    const transactions = await fetchAll<TransactionFields>(Tables.transactions(), {
      filterByFormula,
      sort: [{ field: 'Date', direction: 'desc' }],
    });

    // Map to response format
    const mapped = transactions.map((t) => ({
      id: t.id,
      date: t.fields['Date'] || '',
      type: t.fields['Type'] || '',
      amount: t.fields['Amount'] || 0,
      paymentMethod: t.fields['Payment Method'] || 'Unknown',
      clientName: t.fields['Client Name'] || '',
      serviceName: t.fields['Service Name'] || '',
      provider: t.fields['Provider'] || '',
      status: t.fields['Status'] || '',
      isFinancing: t.fields['Is Financing'] || false,
      financingProvider: t.fields['Financing Provider'] || '',
    }));

    // Summary aggregations
    const total = mapped.reduce((sum, t) => sum + t.amount, 0);

    const byMethod: Record<string, { amount: number; count: number }> = {};
    for (const t of mapped) {
      const key = t.paymentMethod;
      if (!byMethod[key]) byMethod[key] = { amount: 0, count: 0 };
      byMethod[key].amount += t.amount;
      byMethod[key].count += 1;
    }

    const byStatus: Record<string, { amount: number; count: number }> = {};
    for (const t of mapped) {
      const key = t.status || 'Unknown';
      if (!byStatus[key]) byStatus[key] = { amount: 0, count: 0 };
      byStatus[key].amount += t.amount;
      byStatus[key].count += 1;
    }

    const data = {
      transactions: mapped,
      summary: {
        total: Math.round(total),
        count: mapped.length,
        byMethod,
        byStatus,
      },
    };

    cache.set(cacheKey, data, TTL.STANDARD);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Payments route error:', error);
    return NextResponse.json({ error: 'Failed to fetch payment data' }, { status: 500 });
  }
}
