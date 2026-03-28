import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, rateLimitedQuery } from '@/lib/airtable/client';
import {
  get2026Submissions,
  parseSubmission,
  getAllForms,
  isConfigured,
  JOTFORM_FORMS,
  type ParsedClient,
} from '@/lib/jotform/client';
import { cache, TTL } from '@/lib/cache';

const FORM_NAMES: Record<string, string> = {
  [JOTFORM_FORMS.LHR_CONSENT]: 'LHR Consent',
  [JOTFORM_FORMS.INJECTABLES_CONSENT]: 'Injectables Consent',
  [JOTFORM_FORMS.MICRONEEDLING_CONSENT]: 'Microneedling Consent',
  [JOTFORM_FORMS.FACIAL_CONSENT]: 'Facial Consent',
  [JOTFORM_FORMS.LYMPHATIC_CONSENT]: 'Lymphatic Consent',
};

// GET - fetch latest Jotform submissions + status
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
        message: 'JOTFORM_API_KEY not set in environment variables',
      });
    }

    const cacheKey = 'integrations:jotform:status';
    const cached = cache.get<object>(cacheKey);
    if (cached) return NextResponse.json(cached);

    // Get form list + submission counts
    const forms = await getAllForms();
    const formSummary = forms.map((f) => ({
      id: f.id,
      title: f.title,
      totalSubmissions: parseInt(f.count || '0'),
      lastSubmission: f.last_submission,
      status: f.status,
    }));

    // Get 2026 LHR submissions (main form)
    const lhrSubs = await get2026Submissions(JOTFORM_FORMS.LHR_CONSENT);
    const parsedClients = lhrSubs.map((s) => parseSubmission(s, 'LHR Consent'));

    const result = {
      configured: true,
      forms: formSummary,
      submissions2026: {
        lhr: parsedClients.length,
        total: parsedClients.length, // Will add other forms
      },
      recentClients: parsedClients.slice(0, 10).map((c) => ({
        name: c.name,
        email: c.email,
        phone: c.phone,
        form: c.formName,
        date: c.submittedAt,
      })),
      lastSynced: new Date().toISOString(),
    };

    cache.set(cacheKey, result, TTL.STANDARD);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Jotform GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Jotform data', details: String(error) },
      { status: 500 }
    );
  }
}

// POST - sync Jotform submissions → Airtable Clients table
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
        { error: 'JOTFORM_API_KEY not configured' },
        { status: 400 }
      );
    }

    // Fetch all 2026 submissions from all consent forms
    const allClients: ParsedClient[] = [];

    for (const [formId, formName] of Object.entries(FORM_NAMES)) {
      try {
        const subs = await get2026Submissions(formId);
        allClients.push(...subs.map((s) => parseSubmission(s, formName)));
      } catch (err) {
        console.warn(`Jotform: Failed to fetch ${formName}:`, err);
      }
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

    const existingEmails = new Set(
      existingRecords
        .map((r) => String(r.fields['Email'] || '').toLowerCase())
        .filter(Boolean)
    );

    // Filter to new clients only
    const newClients = allClients.filter(
      (c) => c.email && !existingEmails.has(c.email.toLowerCase())
    );

    // Create new client records in Airtable (batch of 10)
    let created = 0;
    const batches = [];
    for (let i = 0; i < newClients.length; i += 10) {
      batches.push(newClients.slice(i, i + 10));
    }

    for (const batch of batches) {
      await rateLimitedQuery(() =>
        new Promise<void>((resolve, reject) => {
          Tables.clients().create(
            batch.map((c) => ({
              fields: {
                Client: c.name,
                Email: c.email,
                Phone: c.phone,
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
    cache.invalidate('integrations:jotform:status');

    return NextResponse.json({
      success: true,
      totalSubmissions: allClients.length,
      newClientsAdded: created,
      alreadyExisted: allClients.length - newClients.length - allClients.filter((c) => !c.email).length,
      noEmail: allClients.filter((c) => !c.email).length,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Jotform sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync Jotform data', details: String(error) },
      { status: 500 }
    );
  }
}
