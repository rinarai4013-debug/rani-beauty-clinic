import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll, createRecord } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';

/**
 * GET /api/dashboard/reactivation
 *
 * Returns lapsed clients segmented into 5 reactivation buckets:
 *  1. Lapsed 30-60 days (Status = Active, last appt 30-60 days ago)
 *  2. Lapsed 60-90 days (last appt 60-90 days ago)
 *  3. Lapsed 90+ days (last appt 90+ days ago)
 *  4. One-Visit Wonders (1 appointment total, last visit 14+ days ago)
 *  5. Membership At Risk (has membership, no appointment in 45+ days)
 *
 * Sorted by total spend DESC within each segment.
 */

// ── Airtable field interfaces ──

interface ClientFields {
  Client: string;
  Email: string;
  Phone: string;
  Status: string;
  Appointments: string[];
  Transactions: string[];
  Memberships: string[];
}

interface AppointmentFields {
  'Service Name': string;
  'Service Category': string;
  Date: string;
  Status: string;
}

interface TransactionFields {
  Amount: number;
  Date: string;
  Status: string;
}

interface MembershipFields {
  Tier: string;
  Status: string;
}

// ── PATHWAYS MAP (mirrors recommendation engine) ──

const PATHWAYS: Record<string, string[]> = {
  'HydraFacial': ['VI Peel', 'RF Microneedling', 'HydraFacial Booster'],
  'VI Peel': ['HydraFacial', 'PRX-T33', 'RF Microneedling'],
  'PRX-T33': ['HydraFacial', 'VI Peel', 'RF Microneedling'],
  'BioRePeel': ['HydraFacial', 'VI Peel', 'PRX-T33'],
  'Laser Hair Removal': ['Laser Hair Removal', 'HydraFacial'],
  'PicoWay': ['PicoWay', 'HydraFacial', 'VI Peel'],
  'Laser Facial': ['HydraFacial', 'RF Microneedling', 'Sofwave'],
  'RF Microneedling': ['HydraFacial', 'PRX-T33', 'Sofwave'],
  'Sofwave': ['HydraFacial', 'RF Microneedling', 'Botox'],
  'Botox': ['Botox', 'Dermal Fillers', 'HydraFacial'],
  'Dermal Fillers': ['Botox', 'HydraFacial', 'RF Microneedling'],
  'GLP-1': ['GLP-1', 'Labs', 'Body Contouring'],
  'HRT': ['HRT', 'Labs', 'Vitamin Injections'],
  'NAD+': ['NAD+', 'Vitamin Injections', 'GLP-1'],
};

function matchService(serviceName: string): string | null {
  const lower = serviceName.toLowerCase();
  for (const key of Object.keys(PATHWAYS)) {
    if (lower.includes(key.toLowerCase())) return key;
  }
  return null;
}

function getSuggestedOffer(lastService: string): string {
  const matched = matchService(lastService);
  if (matched && PATHWAYS[matched]) {
    const next = PATHWAYS[matched].find(s => s !== matched) || PATHWAYS[matched][0];
    return `Book a ${next} — perfect follow-up to your ${matched}`;
  }
  return 'Book a HydraFacial — our most popular treatment to get you back on track';
}

export type ReactivationSegment =
  | 'lapsed-30-60'
  | 'lapsed-60-90'
  | 'lapsed-90-plus'
  | 'one-visit-wonder'
  | 'membership-at-risk';

export interface ReactivationClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  lastVisitDate: string;
  daysSinceLastVisit: number;
  totalSpend: number;
  totalAppointments: number;
  lastService: string;
  segment: ReactivationSegment;
  segmentLabel: string;
  suggestedOffer: string;
  membershipTier?: string;
}

export interface ReactivationData {
  segments: Record<ReactivationSegment, ReactivationClient[]>;
  summary: {
    totalClients: number;
    totalRecoverableRevenue: number;
    avgTicket: number;
    bySegment: Record<ReactivationSegment, number>;
  };
}

const SEGMENT_LABELS: Record<ReactivationSegment, string> = {
  'lapsed-30-60': 'Lapsed 30-60 Days',
  'lapsed-60-90': 'Lapsed 60-90 Days',
  'lapsed-90-plus': 'Lapsed 90+ Days',
  'one-visit-wonder': 'One-Visit Wonders',
  'membership-at-risk': 'Membership At Risk',
};

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!hasPermission(session.role, 'view_clients')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const cacheKey = 'reactivation-list';
    const cached = cache.get<ReactivationData>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Fetch all non-churned clients (Active + Lapsed statuses are candidates)
    const clients = await fetchAll<ClientFields>(Tables.clients(), {
      filterByFormula: `OR({Status} = 'Active', {Status} = 'Lapsed 30', {Status} = 'Lapsed 60', {Status} = 'Lapsed 90')`,
    }, true);

    // Collect all linked record IDs for batch fetching
    const allAppointmentIds = new Set<string>();
    const allTransactionIds = new Set<string>();
    const allMembershipIds = new Set<string>();

    for (const client of clients) {
      const apptIds = client.fields.Appointments || [];
      const txnIds = client.fields.Transactions || [];
      const memIds = client.fields.Memberships || [];
      apptIds.forEach(id => allAppointmentIds.add(id));
      txnIds.forEach(id => allTransactionIds.add(id));
      memIds.forEach(id => allMembershipIds.add(id));
    }

    // Batch fetch linked records (chunked to avoid formula length limits)
    const [appointmentMap, transactionMap, membershipMap] = await Promise.all([
      batchFetchRecords<AppointmentFields>(Tables.appointments(), [...allAppointmentIds]),
      batchFetchRecords<TransactionFields>(Tables.transactions(), [...allTransactionIds]),
      batchFetchRecords<MembershipFields>(Tables.memberships(), [...allMembershipIds]),
    ]);

    const now = Date.now();
    const DAY_MS = 1000 * 60 * 60 * 24;

    const segments: Record<ReactivationSegment, ReactivationClient[]> = {
      'lapsed-30-60': [],
      'lapsed-60-90': [],
      'lapsed-90-plus': [],
      'one-visit-wonder': [],
      'membership-at-risk': [],
    };

    let totalSpendAll = 0;
    let totalApptCountAll = 0;

    for (const client of clients) {
      const apptIds = client.fields.Appointments || [];
      const txnIds = client.fields.Transactions || [];
      const memIds = client.fields.Memberships || [];

      // Get appointments and find the most recent completed one
      const appointments = apptIds
        .map(id => appointmentMap.get(id))
        .filter((a): a is { id: string; fields: AppointmentFields } => !!a)
        .filter(a => a.fields.Status === 'Completed' || a.fields.Status === 'Show')
        .sort((a, b) => (b.fields.Date || '').localeCompare(a.fields.Date || ''));

      if (appointments.length === 0) continue; // No completed appointments — skip

      const lastAppt = appointments[0];
      const lastVisitDate = lastAppt.fields.Date;
      if (!lastVisitDate) continue;

      const daysSince = Math.floor((now - new Date(lastVisitDate).getTime()) / DAY_MS);
      if (daysSince < 14) continue; // Too recent — not lapsed

      // Calculate total spend from transactions
      const totalSpend = txnIds
        .map(id => transactionMap.get(id))
        .filter((t): t is { id: string; fields: TransactionFields } => !!t)
        .reduce((sum, t) => sum + (t.fields.Amount || 0), 0);

      // Check for active memberships
      const activeMemberships = memIds
        .map(id => membershipMap.get(id))
        .filter((m): m is { id: string; fields: MembershipFields } => !!m)
        .filter(m => m.fields.Status === 'Active');

      const lastService = lastAppt.fields['Service Name'] || 'Unknown';
      const suggestedOffer = getSuggestedOffer(lastService);

      const base: ReactivationClient = {
        id: client.id,
        name: client.fields.Client || '',
        email: client.fields.Email || '',
        phone: client.fields.Phone || '',
        lastVisitDate,
        daysSinceLastVisit: daysSince,
        totalSpend,
        totalAppointments: appointments.length,
        lastService,
        segment: 'lapsed-30-60', // placeholder
        segmentLabel: '',
        suggestedOffer,
        membershipTier: activeMemberships[0]?.fields.Tier,
      };

      totalSpendAll += totalSpend;
      totalApptCountAll += appointments.length;

      // Segment: Membership At Risk (has active membership, no visit in 45+ days)
      if (activeMemberships.length > 0 && daysSince >= 45) {
        segments['membership-at-risk'].push({
          ...base,
          segment: 'membership-at-risk',
          segmentLabel: SEGMENT_LABELS['membership-at-risk'],
        });
      }

      // Segment: One-Visit Wonders (exactly 1 completed appointment, 14+ days ago)
      if (appointments.length === 1 && daysSince >= 14) {
        segments['one-visit-wonder'].push({
          ...base,
          segment: 'one-visit-wonder',
          segmentLabel: SEGMENT_LABELS['one-visit-wonder'],
        });
      }

      // Time-based segments (mutually exclusive based on lapse duration)
      if (daysSince >= 90) {
        segments['lapsed-90-plus'].push({
          ...base,
          segment: 'lapsed-90-plus',
          segmentLabel: SEGMENT_LABELS['lapsed-90-plus'],
        });
      } else if (daysSince >= 60) {
        segments['lapsed-60-90'].push({
          ...base,
          segment: 'lapsed-60-90',
          segmentLabel: SEGMENT_LABELS['lapsed-60-90'],
        });
      } else if (daysSince >= 30) {
        segments['lapsed-30-60'].push({
          ...base,
          segment: 'lapsed-30-60',
          segmentLabel: SEGMENT_LABELS['lapsed-30-60'],
        });
      }
    }

    // Sort each segment by total spend DESC (high-value clients first)
    for (const seg of Object.values(segments)) {
      seg.sort((a, b) => b.totalSpend - a.totalSpend);
    }

    const totalClients = Object.values(segments).reduce((sum, seg) => sum + seg.length, 0);
    const avgTicket = totalApptCountAll > 0 ? totalSpendAll / totalApptCountAll : 0;

    const data: ReactivationData = {
      segments,
      summary: {
        totalClients,
        totalRecoverableRevenue: Math.round(avgTicket * totalClients),
        avgTicket: Math.round(avgTicket),
        bySegment: {
          'lapsed-30-60': segments['lapsed-30-60'].length,
          'lapsed-60-90': segments['lapsed-60-90'].length,
          'lapsed-90-plus': segments['lapsed-90-plus'].length,
          'one-visit-wonder': segments['one-visit-wonder'].length,
          'membership-at-risk': segments['membership-at-risk'].length,
        },
      },
    };

    cache.set(cacheKey, data, TTL.RELAXED);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching reactivation list:', error);
    return NextResponse.json({ error: 'Failed to fetch reactivation list' }, { status: 500 });
  }
}

/**
 * POST /api/dashboard/reactivation
 *
 * Logs a reactivation message to the Messages Log table.
 * Called by the dashboard when sending reactivation campaigns.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!hasPermission(session.role, 'view_clients')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { clientId, clientName, channel, subject, body: messageBody } = body;

    if (!clientId || !messageBody) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const recordId = await createRecord(Tables.messagesLog(), {
      'Date': new Date().toISOString().split('T')[0],
      'Channel': channel || 'SMS',
      'Direction': 'Outbound',
      'Subject': subject || `Reactivation — ${clientName}`,
      'Body': messageBody,
      'Clients': [clientId],
    });

    // Invalidate cache so next GET reflects the campaign
    cache.invalidate('reactivation-list');

    return NextResponse.json({ success: true, recordId });
  } catch (error) {
    console.error('Error logging reactivation message:', error);
    return NextResponse.json({ error: 'Failed to log message' }, { status: 500 });
  }
}

// ── Helpers ──

/**
 * Batch-fetch Airtable records by ID in chunks to avoid formula length limits.
 * Returns a Map<recordId, record> for O(1) lookups.
 */
async function batchFetchRecords<T>(
  table: Airtable.Table<Airtable.FieldSet>,
  ids: string[],
  chunkSize = 50
): Promise<Map<string, { id: string; fields: T }>> {
  const map = new Map<string, { id: string; fields: T }>();
  if (ids.length === 0) return map;

  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += chunkSize) {
    chunks.push(ids.slice(i, i + chunkSize));
  }

  const results = await Promise.all(
    chunks.map(chunk =>
      fetchAll<T>(table, {
        filterByFormula: `OR(${chunk.map(id => `RECORD_ID()='${id}'`).join(',')})`,
      }).catch(() => [])
    )
  );

  for (const records of results) {
    for (const record of records) {
      map.set(record.id, record);
    }
  }

  return map;
}
