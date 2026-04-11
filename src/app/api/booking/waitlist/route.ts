import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { addDays, differenceInDays, format, parseISO } from 'date-fns';
import type { WaitlistEntry, WaitlistPriority } from '@/lib/booking/types';
import { loadWaitlistEntries, addWaitlistEntry, removeWaitlistEntry } from '@/lib/booking/data';
import { logEvent } from '@/lib/logging/structured-logger';
import { getClientIP, rateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';

const createSchema = z.object({
  clientId: z.string().min(1),
  clientName: z.string().min(1),
  clientEmail: z.string().email(),
  clientPhone: z.string().min(7),
  serviceId: z.string().min(1),
  serviceName: z.string().min(1),
  preferredProviderId: z.string().optional(),
  preferredProviderName: z.string().optional(),
  timePreference: z.array(z.enum(['morning', 'afternoon', 'evening', 'weekend'])).default([]),
  dateRangeStart: z.string().optional(),
  dateRangeEnd: z.string().optional(),
  isMember: z.boolean().optional(),
  isVip: z.boolean().optional(),
});

const waitlistGetQuerySchema = z.object({
  serviceId: z.string().trim().min(1).optional(),
});

const waitlistDeleteQuerySchema = z.object({
  entryId: z.string().trim().min(1),
});

function computeStats(entries: WaitlistEntry[]) {
  const active = entries.filter((e) => e.status === 'active');
  const totalActive = active.length;
  const totalConverted = entries.filter((e) => e.status === 'booked').length;
  const totalExpired = entries.filter((e) => e.status === 'expired').length;
  const totalNotified = entries.filter((e) => e.status === 'notified').length;

  const byService: Record<string, number> = {};
  const byPriority: Record<WaitlistPriority, number> = { vip: 0, member: 0, standard: 0 };
  let totalWaitDays = 0;

  for (const entry of active) {
    byService[entry.serviceId] = (byService[entry.serviceId] || 0) + 1;
    byPriority[entry.priority] = (byPriority[entry.priority] || 0) + 1;
    totalWaitDays += Math.max(0, differenceInDays(new Date(), parseISO(entry.createdAt)));
  }

  const topWaitlistedServices = Object.entries(byService)
    .map(([serviceId, count]) => ({
      serviceId,
      serviceName: active.find((e) => e.serviceId === serviceId)?.serviceName || serviceId,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalActive,
    totalConverted,
    totalExpired,
    totalNotified,
    conversionRate: totalActive + totalConverted > 0 ? Math.round((totalConverted / (totalActive + totalConverted)) * 100) : 0,
    avgWaitDays: totalActive > 0 ? Math.round(totalWaitDays / totalActive) : 0,
    byService,
    byPriority,
    topWaitlistedServices,
  };
}

export async function GET(request: NextRequest) {
  const parsedQuery = waitlistGetQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams.entries())
  );
  if (!parsedQuery.success) {
    return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
  }

  const { serviceId } = parsedQuery.data;

  try {
    const entries = await loadWaitlistEntries(serviceId);
    const stats = computeStats(entries);
    return NextResponse.json({ entries, stats });
  } catch (error) {
    logEvent('api', 'error', 'Waitlist fetch failed', { error: String(error) });
    return NextResponse.json({ error: 'Failed to fetch waitlist' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const { allowed, resetIn } = rateLimit('booking-waitlist', ip, RATE_LIMITS.FORM);
  if (!allowed) return rateLimitResponse(resetIn);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid waitlist entry' }, { status: 400 });
  }

  const now = new Date();
  const priority: WaitlistPriority = parsed.data.isVip ? 'vip' : parsed.data.isMember ? 'member' : 'standard';

  const entry: WaitlistEntry = {
    id: `wl-${Date.now()}`,
    clientId: parsed.data.clientId,
    clientName: parsed.data.clientName,
    clientEmail: parsed.data.clientEmail,
    clientPhone: parsed.data.clientPhone,
    serviceId: parsed.data.serviceId,
    serviceName: parsed.data.serviceName,
    preferredProviderId: parsed.data.preferredProviderId,
    preferredProviderName: parsed.data.preferredProviderName,
    timePreference: parsed.data.timePreference,
    dateRangeStart: parsed.data.dateRangeStart || format(now, 'yyyy-MM-dd'),
    dateRangeEnd: parsed.data.dateRangeEnd || format(addDays(now, 60), 'yyyy-MM-dd'),
    priority,
    isMember: parsed.data.isMember ?? false,
    isVip: parsed.data.isVip ?? false,
    status: 'active',
    notificationsSent: 0,
    createdAt: now.toISOString(),
    expiresAt: format(addDays(now, 30), 'yyyy-MM-dd'),
  };

  try {
    const recordId = await addWaitlistEntry(entry);
    entry.id = recordId;
    logEvent('api', 'info', 'Waitlist entry created', { id: recordId, serviceId: entry.serviceId });
    return NextResponse.json({ success: true, entry });
  } catch (error) {
    logEvent('api', 'error', 'Waitlist create failed', { error: String(error) });
    return NextResponse.json({ error: 'Failed to add waitlist entry' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const parsedQuery = waitlistDeleteQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams.entries())
  );
  if (!parsedQuery.success) {
    return NextResponse.json({ error: 'Missing entryId' }, { status: 400 });
  }
  const { entryId } = parsedQuery.data;

  try {
    await removeWaitlistEntry(entryId, 'Removed by staff');
    logEvent('api', 'info', 'Waitlist entry removed', { id: entryId });
    return NextResponse.json({ success: true });
  } catch (error) {
    logEvent('api', 'error', 'Waitlist remove failed', { error: String(error) });
    return NextResponse.json({ error: 'Failed to remove waitlist entry' }, { status: 500 });
  }
}
