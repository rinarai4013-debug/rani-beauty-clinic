import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, rateLimitedQuery } from '@/lib/airtable/client';
import {
  getAppointments,
  getClients,
  getServices,
  isConfigured,
  type MangomintClient,
} from '@/lib/mangomint/client';
import { cache, TTL } from '@/lib/cache';

// GET — fetch Mangomint data summary + connection status
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
        webhooksEnabled: true,
        message:
          'Mangomint Webhooks add-on is enabled. Add MANGOMINT_API_KEY to .env.local for API access. Get key from Mangomint Settings → Developer → API Keys.',
        setupUrl: 'https://app.mangomint.com/876418/settings',
      });
    }

    const cacheKey = 'integrations:mangomint:status';
    const cached = cache.get<object>(cacheKey);
    if (cached) return NextResponse.json(cached);

    // Fetch data from Mangomint API
    const today = new Date().toISOString().substring(0, 10);
    const yearStart = `${today.substring(0, 4)}-01-01`;

    const [appointments, clients, services] = await Promise.all([
      getAppointments({ startDate: yearStart, endDate: today, limit: 100 }),
      getClients({ limit: 100 }),
      getServices(),
    ]);

    // Today's appointments
    const todayAppointments = appointments.filter(
      (a) => a.startAt?.substring(0, 10) === today
    );

    // Monthly appointment counts
    const monthlyAppointments: Record<string, number> = {};
    for (const a of appointments) {
      const month = a.startAt?.substring(0, 7) || 'unknown';
      monthlyAppointments[month] = (monthlyAppointments[month] || 0) + 1;
    }

    const result = {
      configured: true,
      webhooksEnabled: true,
      clients: {
        total: clients.length,
        recentClients: clients.slice(0, 10).map((c) => ({
          id: c.id,
          name: `${c.firstName} ${c.lastName}`.trim(),
          email: c.email || '',
          phone: c.mobilePhone || c.homePhone || '',
          lastVisit: c.lastVisitDate || '',
        })),
      },
      appointments: {
        total: appointments.length,
        todayCount: todayAppointments.length,
        monthlyBreakdown: monthlyAppointments,
      },
      services: {
        total: services.length,
        list: services.slice(0, 20).map((s) => ({
          id: s.id,
          name: s.name,
          duration: s.duration,
          price: s.price,
          category: s.categoryName || '',
        })),
      },
      lastSynced: new Date().toISOString(),
    };

    cache.set(cacheKey, result, TTL.STANDARD);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Mangomint GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Mangomint data', details: String(error) },
      { status: 500 }
    );
  }
}

// POST — sync Mangomint clients → Airtable Clients table
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
          error: 'MANGOMINT_API_KEY not configured',
          webhooksEnabled: true,
          message:
            'Webhooks are enabled but API key is needed for bulk sync. Add MANGOMINT_API_KEY to .env.local.',
          setupUrl: 'https://app.mangomint.com/876418/settings',
        },
        { status: 400 }
      );
    }

    // Fetch all clients from Mangomint
    const allClients: MangomintClient[] = [];
    let offset = 0;
    const limit = 100;

    // Paginate through all clients
    while (true) {
      const batch = await getClients({ limit, offset });
      allClients.push(...batch);
      if (batch.length < limit) break;
      offset += limit;
    }

    // Get existing clients from Airtable to deduplicate
    const existingRecords = await rateLimitedQuery(() =>
      new Promise<Array<{ id: string; fields: Record<string, unknown> }>>((resolve, reject) => {
        const records: Array<{ id: string; fields: Record<string, unknown> }> = [];
        Tables.clients()
          .select({ fields: ['Client', 'Email', 'Phone'] })
          .eachPage(
            (pageRecords, fetchNextPage) => {
              records.push(
                ...pageRecords.map((r) => ({
                  id: r.id,
                  fields: r.fields as Record<string, unknown>,
                }))
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

    const existingEmails = new Set(
      existingRecords
        .map((r) => String(r.fields['Email'] || '').toLowerCase())
        .filter(Boolean)
    );

    // Filter to clients with emails not already in Airtable
    const newClients = allClients.filter((c) => {
      const email = (c.email || '').toLowerCase();
      return email && !existingEmails.has(email);
    });

    // Create new client records in Airtable (batch of 10)
    let created = 0;
    const batches: MangomintClient[][] = [];
    for (let i = 0; i < newClients.length; i += 10) {
      batches.push(newClients.slice(i, i + 10));
    }

    for (const batch of batches) {
      await rateLimitedQuery(() =>
        new Promise<void>((resolve, reject) => {
          Tables.clients().create(
            batch.map((c) => ({
              fields: {
                Client: `${c.firstName} ${c.lastName}`.trim(),
                Email: c.email || '',
                Phone: c.mobilePhone || c.homePhone || '',
                Status: 'Active',
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
    cache.invalidate('integrations:mangomint:status');
    cache.invalidatePrefix('clients');

    return NextResponse.json({
      success: true,
      totalMangomintClients: allClients.length,
      newClientsAdded: created,
      alreadyExisted: allClients.length - newClients.length - allClients.filter((c) => !c.email).length,
      noEmail: allClients.filter((c) => !c.email).length,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Mangomint sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync Mangomint data', details: String(error) },
      { status: 500 }
    );
  }
}
