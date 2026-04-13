/**
 * RaniOS Tenant Dashboard — Client Management Module
 *
 * Full CRM: client list, 360 view, segmentation (RFM), churn scoring,
 * treatment recommendations, communication history, loyalty, and referrals.
 * All queries scoped to tenant via TenantDatabaseClient.
 */

import type { TenantDatabaseClient } from '@/lib/tenant/database';
import type { TenantConfig } from '@/lib/tenant/config';
import { sanitizeFormulaValue } from '@/lib/airtable/sanitize';

// ─── Types ──────────────────────────────────────────────────────────────────

export type ClientStatus = 'lead' | 'active' | 'lapsed' | 'churned' | 'vip';
export type ClientSortField = 'name' | 'lastVisit' | 'totalSpend' | 'visitCount' | 'createdAt' | 'churnRisk';
export type SortDirection = 'asc' | 'desc';

export interface ClientListFilters {
  search?: string;
  status?: ClientStatus[];
  segment?: RFMSegment[];
  provider?: string;
  source?: string;
  minSpend?: number;
  maxSpend?: number;
  lastVisitBefore?: string;
  lastVisitAfter?: string;
  hasMembership?: boolean;
  tags?: string[];
}

export interface ClientListOptions {
  filters?: ClientListFilters;
  sort?: { field: ClientSortField; direction: SortDirection };
  page?: number;
  pageSize?: number;
}

export interface ClientListItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: ClientStatus;
  segment: RFMSegment;
  totalSpend: number;
  visitCount: number;
  lastVisit: string;
  nextAppointment?: string;
  churnRisk: number;     // 0–100
  hasMembership: boolean;
  source: string;
  tags: string[];
  avatarUrl?: string;
  createdAt: string;
}

export interface ClientListResult {
  clients: ClientListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Client 360 View ────────────────────────────────────────────────────────

export interface Client360 {
  id: string;
  profile: ClientProfile;
  visits: ClientVisit[];
  transactions: ClientTransaction[];
  treatments: TreatmentHistory[];
  notes: ClientNote[];
  riskScore: ChurnRiskScore;
  recommendations: TreatmentRecommendation[];
  communications: CommunicationRecord[];
  loyalty: LoyaltyStatus;
  referrals: ReferralRecord[];
  memberships: MembershipRecord[];
  segment: RFMAnalysis;
}

export interface ClientProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  status: ClientStatus;
  source: string;
  tags: string[];
  address?: string;
  avatarUrl?: string;
  preferredProvider?: string;
  totalSpend: number;
  visitCount: number;
  avgSpendPerVisit: number;
  ltv: number;            // Lifetime value
  firstVisit: string;
  lastVisit: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientVisit {
  id: string;
  date: string;
  service: string;
  provider: string;
  duration: number;
  status: string;
  amount: number;
  notes?: string;
}

export interface ClientTransaction {
  id: string;
  date: string;
  service: string;
  amount: number;
  method: string;       // cash, card, financing
  status: string;
  receiptId?: string;
}

export interface TreatmentHistory {
  service: string;
  count: number;
  totalSpend: number;
  lastDate: string;
  avgInterval: number;  // days between treatments
  nextDue?: string;     // estimated next treatment date
}

export interface ClientNote {
  id: string;
  date: string;
  author: string;
  content: string;
  type: 'general' | 'clinical' | 'follow_up' | 'concern';
}

// ─── Churn Risk ─────────────────────────────────────────────────────────────

export interface ChurnRiskScore {
  score: number;        // 0–100
  risk: 'low' | 'moderate' | 'high' | 'critical';
  factors: ChurnFactor[];
  recommendation: string;
  predictedChurnDate?: string;
}

export interface ChurnFactor {
  name: string;
  score: number;
  weight: number;
  detail: string;
}

// ─── Treatment Recommendations ──────────────────────────────────────────────

export interface TreatmentRecommendation {
  service: string;
  reason: string;
  confidence: number;   // 0–100
  strategy: 'pathway' | 'category_gap' | 'goal_based' | 'timing' | 'membership_upsell';
  estimatedPrice: number;
  priority: 'high' | 'medium' | 'low';
}

// ─── Communications ─────────────────────────────────────────────────────────

export interface CommunicationRecord {
  id: string;
  date: string;
  type: 'sms' | 'email' | 'call' | 'in_person';
  direction: 'inbound' | 'outbound';
  subject?: string;
  preview: string;
  status: 'sent' | 'delivered' | 'opened' | 'replied' | 'failed';
  campaign?: string;
}

// ─── Loyalty ────────────────────────────────────────────────────────────────

export interface LoyaltyStatus {
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  pointsToNextTier: number;
  rewardsAvailable: LoyaltyReward[];
  history: LoyaltyEvent[];
}

export interface LoyaltyReward {
  id: string;
  name: string;
  pointsCost: number;
  description: string;
  available: boolean;
}

export interface LoyaltyEvent {
  date: string;
  type: 'earn' | 'redeem';
  points: number;
  description: string;
}

// ─── Referrals ──────────────────────────────────────────────────────────────

export interface ReferralRecord {
  id: string;
  referredName: string;
  referredEmail: string;
  date: string;
  status: 'pending' | 'booked' | 'completed' | 'expired';
  rewardEarned: number;
  rewardStatus: 'pending' | 'credited' | 'redeemed';
}

// ─── Memberships ────────────────────────────────────────────────────────────

export interface MembershipRecord {
  id: string;
  plan: string;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  startDate: string;
  renewalDate?: string;
  monthlyRate: number;
  benefits: string[];
}

// ─── RFM Segmentation ───────────────────────────────────────────────────────

export type RFMSegment =
  | 'champions'
  | 'loyal_customers'
  | 'potential_loyalists'
  | 'recent_customers'
  | 'promising'
  | 'needs_attention'
  | 'about_to_sleep'
  | 'at_risk'
  | 'cant_lose'
  | 'hibernating'
  | 'lost';

export interface RFMAnalysis {
  segment: RFMSegment;
  recency: number;       // 1–5
  frequency: number;     // 1–5
  monetary: number;      // 1–5
  score: number;         // composite
  description: string;
  suggestedAction: string;
}

export interface SegmentDistribution {
  segment: RFMSegment;
  count: number;
  percentage: number;
  avgSpend: number;
  avgVisits: number;
}

// ─── Client List ────────────────────────────────────────────────────────────

export async function getClientList(
  db: TenantDatabaseClient,
  _tenant: TenantConfig,
  options: ClientListOptions = {}
): Promise<ClientListResult> {
  const { filters = {}, sort, page = 1, pageSize = 25 } = options;

  // Build filter formula parts
  const formulaParts: string[] = [];

  if (filters.status?.length) {
    const statusOr = filters.status.map(s => `{Status} = '${s}'`).join(', ');
    formulaParts.push(`OR(${statusOr})`);
  }

  if (filters.hasMembership !== undefined) {
    formulaParts.push(filters.hasMembership ? `{Membership} != ''` : `{Membership} = ''`);
  }

  if (filters.minSpend !== undefined) {
    formulaParts.push(`{Total Spend} >= ${filters.minSpend}`);
  }

  if (filters.provider) {
    formulaParts.push(`{Preferred Provider} = '${filters.provider}'`);
  }

  const filterFormula = formulaParts.length > 0
    ? `AND(${formulaParts.join(', ')})`
    : '';

  const allClients = await db.fetchAll<{
    'First Name': string;
    'Last Name': string;
    Email: string;
    Phone: string;
    Status: string;
    'Total Spend': number;
    'Visit Count': number;
    'Last Visit': string;
    'Next Appointment': string;
    Membership: string;
    Source: string;
    Tags: string;
    'Created Date': string;
  }>('Clients', {
    ...(filterFormula ? { filterByFormula: filterFormula } : {}),
    fields: [
      'First Name', 'Last Name', 'Email', 'Phone', 'Status',
      'Total Spend', 'Visit Count', 'Last Visit', 'Next Appointment',
      'Membership', 'Source', 'Tags', 'Created Date',
    ],
  });

  // Apply search filter in-memory
  let filtered = allClients;
  if (filters.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(c => {
      const name = `${c.fields['First Name'] || ''} ${c.fields['Last Name'] || ''}`.toLowerCase();
      const email = (c.fields.Email || '').toLowerCase();
      const phone = (c.fields.Phone || '').toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q);
    });
  }

  // Map to ClientListItem
  let items: ClientListItem[] = filtered.map(c => {
    const totalSpend = c.fields['Total Spend'] || 0;
    const visitCount = c.fields['Visit Count'] || 0;
    const daysSinceVisit = c.fields['Last Visit']
      ? Math.floor((Date.now() - new Date(c.fields['Last Visit']).getTime()) / 86400000)
      : 999;

    return {
      id: c.id,
      name: `${c.fields['First Name'] || ''} ${c.fields['Last Name'] || ''}`.trim(),
      email: c.fields.Email || '',
      phone: c.fields.Phone || '',
      status: mapStatus(c.fields.Status),
      segment: computeRFMSegment(daysSinceVisit, visitCount, totalSpend),
      totalSpend,
      visitCount,
      lastVisit: c.fields['Last Visit'] || '',
      nextAppointment: c.fields['Next Appointment'] || undefined,
      churnRisk: computeSimpleChurnRisk(daysSinceVisit, visitCount, !!c.fields.Membership),
      hasMembership: !!c.fields.Membership,
      source: c.fields.Source || 'Unknown',
      tags: c.fields.Tags ? c.fields.Tags.split(',').map(t => t.trim()) : [],
      createdAt: c.fields['Created Date'] || '',
    };
  });

  // Sort
  if (sort) {
    items.sort((a, b) => {
      const aVal = a[sort.field as keyof ClientListItem];
      const bVal = b[sort.field as keyof ClientListItem];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sort.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal || '');
      const bStr = String(bVal || '');
      return sort.direction === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }

  const total = items.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  items = items.slice(start, start + pageSize);

  return { clients: items, total, page, pageSize, totalPages };
}

// ─── Client 360 View ────────────────────────────────────────────────────────

export async function getClient360(
  db: TenantDatabaseClient,
  _tenant: TenantConfig,
  clientId: string
): Promise<Client360 | null> {
  const safeClientId = sanitizeFormulaValue(clientId);

  // Fetch client record
  const clientRecords = await db.fetchAll<Record<string, unknown>>('Clients', {
    filterByFormula: `RECORD_ID() = "${safeClientId}"`,
  });

  if (clientRecords.length === 0) return null;
  const client = clientRecords[0];
  const f = client.fields as Record<string, unknown>;

  const firstName = (f['First Name'] as string) || '';
  const lastName = (f['Last Name'] as string) || '';
  const email = (f['Email'] as string) || '';
  const safeEmail = sanitizeFormulaValue(email);
  const totalSpend = (f['Total Spend'] as number) || 0;
  const visitCount = (f['Visit Count'] as number) || 0;

  // Fetch related records in parallel
  const [appointments, transactions, messages, reviews, memberships] = await Promise.all([
    db.fetchAll<{
      Date: string;
      Service: string;
      Provider: string;
      Duration: number;
      Status: string;
      Amount: number;
      Notes: string;
    }>('Appointments', {
      filterByFormula: `{Client Email} = "${safeEmail}"`,
      sort: [{ field: 'Date', direction: 'desc' }],
      fields: ['Date', 'Service', 'Provider', 'Duration', 'Status', 'Amount', 'Notes'],
    }),
    db.fetchAll<{
      Date: string;
      Service: string;
      Amount: number;
      'Payment Method': string;
      Status: string;
    }>('Transactions', {
      filterByFormula: `{Client Email} = "${safeEmail}"`,
      sort: [{ field: 'Date', direction: 'desc' }],
      fields: ['Date', 'Service', 'Amount', 'Payment Method', 'Status'],
    }),
    db.fetchAll<{
      Date: string;
      Type: string;
      Direction: string;
      Subject: string;
      Preview: string;
      Status: string;
      Campaign: string;
    }>('Messages Log', {
      filterByFormula: `{Client Email} = "${safeEmail}"`,
      sort: [{ field: 'Date', direction: 'desc' }],
      fields: ['Date', 'Type', 'Direction', 'Subject', 'Preview', 'Status', 'Campaign'],
    }),
    db.fetchAll<{
      Rating: number;
      Date: string;
      Text: string;
    }>('Reviews', {
      filterByFormula: `{Client Email} = "${safeEmail}"`,
      fields: ['Rating', 'Date', 'Text'],
    }),
    db.fetchAll<{
      Plan: string;
      Status: string;
      'Start Date': string;
      'Renewal Date': string;
      'Monthly Rate': number;
    }>('Memberships', {
      filterByFormula: `{Client Email} = "${safeEmail}"`,
      fields: ['Plan', 'Status', 'Start Date', 'Renewal Date', 'Monthly Rate'],
    }),
  ]);

  const visits: ClientVisit[] = appointments.map(a => ({
    id: a.id,
    date: a.fields.Date || '',
    service: a.fields.Service || '',
    provider: a.fields.Provider || '',
    duration: a.fields.Duration || 30,
    status: a.fields.Status || '',
    amount: a.fields.Amount || 0,
    notes: a.fields.Notes || undefined,
  }));

  const txns: ClientTransaction[] = transactions.map(t => ({
    id: t.id,
    date: t.fields.Date || '',
    service: t.fields.Service || '',
    amount: t.fields.Amount || 0,
    method: t.fields['Payment Method'] || 'card',
    status: t.fields.Status || '',
  }));

  // Build treatment history
  const treatmentMap = new Map<string, { count: number; spend: number; dates: string[] }>();
  for (const v of visits) {
    if (v.service && v.status === 'Completed') {
      const existing = treatmentMap.get(v.service) || { count: 0, spend: 0, dates: [] };
      existing.count++;
      existing.spend += v.amount;
      existing.dates.push(v.date);
      treatmentMap.set(v.service, existing);
    }
  }

  const treatments: TreatmentHistory[] = Array.from(treatmentMap.entries()).map(([service, data]) => {
    const sortedDates = data.dates.sort();
    let avgInterval = 0;
    if (sortedDates.length > 1) {
      const intervals: number[] = [];
      for (let i = 1; i < sortedDates.length; i++) {
        intervals.push(
          Math.floor((new Date(sortedDates[i]).getTime() - new Date(sortedDates[i - 1]).getTime()) / 86400000)
        );
      }
      avgInterval = Math.round(intervals.reduce((s, i) => s + i, 0) / intervals.length);
    }

    const lastDate = sortedDates[sortedDates.length - 1];
    const nextDue = avgInterval > 0
      ? new Date(new Date(lastDate).getTime() + avgInterval * 86400000).toISOString().split('T')[0]
      : undefined;

    return {
      service,
      count: data.count,
      totalSpend: Math.round(data.spend * 100) / 100,
      lastDate,
      avgInterval,
      nextDue,
    };
  });

  const comms: CommunicationRecord[] = messages.map(m => ({
    id: m.id,
    date: m.fields.Date || '',
    type: (m.fields.Type || 'email') as CommunicationRecord['type'],
    direction: (m.fields.Direction || 'outbound') as CommunicationRecord['direction'],
    subject: m.fields.Subject || undefined,
    preview: m.fields.Preview || '',
    status: (m.fields.Status || 'sent') as CommunicationRecord['status'],
    campaign: m.fields.Campaign || undefined,
  }));

  const membershipRecords: MembershipRecord[] = memberships.map(m => ({
    id: m.id,
    plan: m.fields.Plan || '',
    status: (m.fields.Status || 'active') as MembershipRecord['status'],
    startDate: m.fields['Start Date'] || '',
    renewalDate: m.fields['Renewal Date'] || undefined,
    monthlyRate: m.fields['Monthly Rate'] || 0,
    benefits: [],
  }));

  // Churn risk
  const lastVisitDate = (f['Last Visit'] as string) || '';
  const daysSinceVisit = lastVisitDate
    ? Math.floor((Date.now() - new Date(lastVisitDate).getTime()) / 86400000)
    : 999;

  const riskScore = computeDetailedChurnRisk(
    daysSinceVisit,
    visitCount,
    totalSpend,
    membershipRecords.some(m => m.status === 'active'),
    comms.length
  );

  // RFM segment
  const segment = computeRFMAnalysis(daysSinceVisit, visitCount, totalSpend);

  // Treatment recommendations
  const recommendations = generateRecommendations(treatments, totalSpend);

  // Loyalty
  const loyalty = computeLoyalty(totalSpend, visitCount);

  const profile: ClientProfile = {
    id: client.id,
    firstName,
    lastName,
    email,
    phone: (f['Phone'] as string) || '',
    dateOfBirth: (f['Date of Birth'] as string) || undefined,
    status: mapStatus((f['Status'] as string) || ''),
    source: (f['Source'] as string) || 'Unknown',
    tags: f['Tags'] ? String(f['Tags']).split(',').map(t => t.trim()) : [],
    address: (f['Address'] as string) || undefined,
    preferredProvider: (f['Preferred Provider'] as string) || undefined,
    totalSpend,
    visitCount,
    avgSpendPerVisit: visitCount > 0 ? Math.round((totalSpend / visitCount) * 100) / 100 : 0,
    ltv: totalSpend, // Simple LTV = total spend
    firstVisit: visits[visits.length - 1]?.date || '',
    lastVisit: lastVisitDate,
    createdAt: (f['Created Date'] as string) || '',
    updatedAt: (f['Updated Date'] as string) || '',
  };

  return {
    id: client.id,
    profile,
    visits,
    transactions: txns,
    treatments,
    notes: [], // Notes would be in a separate table or field
    riskScore,
    recommendations,
    communications: comms,
    loyalty,
    referrals: [], // Referrals would be tracked separately
    memberships: membershipRecords,
    segment,
  };
}

// ─── Client Segments ────────────────────────────────────────────────────────

export async function getSegmentDistribution(
  db: TenantDatabaseClient,
  _tenant: TenantConfig
): Promise<SegmentDistribution[]> {
  const clients = await db.fetchAll<{
    'Total Spend': number;
    'Visit Count': number;
    'Last Visit': string;
  }>('Clients', {
    fields: ['Total Spend', 'Visit Count', 'Last Visit'],
  });

  const segmentMap = new Map<RFMSegment, { count: number; totalSpend: number; totalVisits: number }>();

  for (const c of clients) {
    const daysSince = c.fields['Last Visit']
      ? Math.floor((Date.now() - new Date(c.fields['Last Visit']).getTime()) / 86400000)
      : 999;
    const segment = computeRFMSegment(daysSince, c.fields['Visit Count'] || 0, c.fields['Total Spend'] || 0);
    const existing = segmentMap.get(segment) || { count: 0, totalSpend: 0, totalVisits: 0 };
    existing.count++;
    existing.totalSpend += c.fields['Total Spend'] || 0;
    existing.totalVisits += c.fields['Visit Count'] || 0;
    segmentMap.set(segment, existing);
  }

  const total = clients.length || 1;

  return Array.from(segmentMap.entries())
    .map(([segment, data]) => ({
      segment,
      count: data.count,
      percentage: Math.round((data.count / total) * 100),
      avgSpend: data.count > 0 ? Math.round(data.totalSpend / data.count) : 0,
      avgVisits: data.count > 0 ? Math.round((data.totalVisits / data.count) * 10) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

// ─── At-Risk Clients ────────────────────────────────────────────────────────

export async function getAtRiskClients(
  db: TenantDatabaseClient,
  _tenant: TenantConfig,
  limit = 20
): Promise<ClientListItem[]> {
  const clients = await db.fetchAll<{
    'First Name': string;
    'Last Name': string;
    Email: string;
    Phone: string;
    Status: string;
    'Total Spend': number;
    'Visit Count': number;
    'Last Visit': string;
    Membership: string;
    Source: string;
    'Created Date': string;
  }>('Clients', {
    filterByFormula: `OR({Status} = 'lapsed', {Status} = 'at_risk', {Status} = 'Lapsed')`,
    fields: [
      'First Name', 'Last Name', 'Email', 'Phone', 'Status',
      'Total Spend', 'Visit Count', 'Last Visit', 'Membership', 'Source', 'Created Date',
    ],
  });

  return clients
    .map(c => {
      const totalSpend = c.fields['Total Spend'] || 0;
      const visitCount = c.fields['Visit Count'] || 0;
      const daysSince = c.fields['Last Visit']
        ? Math.floor((Date.now() - new Date(c.fields['Last Visit']).getTime()) / 86400000)
        : 999;

      return {
        id: c.id,
        name: `${c.fields['First Name'] || ''} ${c.fields['Last Name'] || ''}`.trim(),
        email: c.fields.Email || '',
        phone: c.fields.Phone || '',
        status: mapStatus(c.fields.Status),
        segment: computeRFMSegment(daysSince, visitCount, totalSpend),
        totalSpend,
        visitCount,
        lastVisit: c.fields['Last Visit'] || '',
        churnRisk: computeSimpleChurnRisk(daysSince, visitCount, !!c.fields.Membership),
        hasMembership: !!c.fields.Membership,
        source: c.fields.Source || 'Unknown',
        tags: [],
        createdAt: c.fields['Created Date'] || '',
      };
    })
    .sort((a, b) => b.churnRisk - a.churnRisk)
    .slice(0, limit);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function mapStatus(raw: string): ClientStatus {
  const lower = (raw || '').toLowerCase();
  if (lower === 'vip' || lower === 'premium') return 'vip';
  if (lower === 'active' || lower === 'client') return 'active';
  if (lower === 'lapsed' || lower === 'at_risk' || lower === 'at risk') return 'lapsed';
  if (lower === 'churned' || lower === 'inactive' || lower === 'lost') return 'churned';
  return 'lead';
}

function computeRFMSegment(daysSinceVisit: number, visitCount: number, totalSpend: number): RFMSegment {
  const r = daysSinceVisit <= 14 ? 5 : daysSinceVisit <= 30 ? 4 : daysSinceVisit <= 60 ? 3 : daysSinceVisit <= 120 ? 2 : 1;
  const f = visitCount >= 10 ? 5 : visitCount >= 6 ? 4 : visitCount >= 3 ? 3 : visitCount >= 2 ? 2 : 1;
  const m = totalSpend >= 5000 ? 5 : totalSpend >= 2000 ? 4 : totalSpend >= 800 ? 3 : totalSpend >= 300 ? 2 : 1;

  const score = r + f + m;

  if (score >= 13) return 'champions';
  if (r >= 4 && f >= 4) return 'loyal_customers';
  if (r >= 4 && f >= 2) return 'potential_loyalists';
  if (r >= 4 && f === 1) return 'recent_customers';
  if (r >= 3 && f >= 2) return 'promising';
  if (r === 3 && f >= 3) return 'needs_attention';
  if (r === 2 && f >= 3) return 'about_to_sleep';
  if (r === 2 && f >= 2) return 'at_risk';
  if (r <= 2 && m >= 4) return 'cant_lose';
  if (r <= 2 && f <= 2) return 'hibernating';
  return 'lost';
}

function computeRFMAnalysis(daysSinceVisit: number, visitCount: number, totalSpend: number): RFMAnalysis {
  const r = daysSinceVisit <= 14 ? 5 : daysSinceVisit <= 30 ? 4 : daysSinceVisit <= 60 ? 3 : daysSinceVisit <= 120 ? 2 : 1;
  const f = visitCount >= 10 ? 5 : visitCount >= 6 ? 4 : visitCount >= 3 ? 3 : visitCount >= 2 ? 2 : 1;
  const m = totalSpend >= 5000 ? 5 : totalSpend >= 2000 ? 4 : totalSpend >= 800 ? 3 : totalSpend >= 300 ? 2 : 1;

  const segment = computeRFMSegment(daysSinceVisit, visitCount, totalSpend);
  const descriptions: Record<RFMSegment, { desc: string; action: string }> = {
    champions: { desc: 'Best clients - recent, frequent, high spend', action: 'Reward and offer VIP experiences' },
    loyal_customers: { desc: 'Consistent visitors with good spend', action: 'Upsell premium services' },
    potential_loyalists: { desc: 'Recent clients with growing engagement', action: 'Encourage membership sign-up' },
    recent_customers: { desc: 'New clients with single visit', action: 'Onboard with welcome sequence' },
    promising: { desc: 'Moderate engagement, showing potential', action: 'Build relationship with personalized offers' },
    needs_attention: { desc: 'Previously good clients, activity dropping', action: 'Send targeted re-engagement campaign' },
    about_to_sleep: { desc: 'Activity declining, at risk of lapsing', action: 'Urgent: time-limited offer' },
    at_risk: { desc: 'Were good clients, now disengaging', action: 'Personal outreach from provider' },
    cant_lose: { desc: 'High-value clients who stopped visiting', action: 'Win-back with premium incentive' },
    hibernating: { desc: 'Low activity for extended period', action: 'Light-touch reactivation email' },
    lost: { desc: 'No recent activity, likely churned', action: 'Archive or last-chance campaign' },
  };

  return {
    segment,
    recency: r,
    frequency: f,
    monetary: m,
    score: r + f + m,
    description: descriptions[segment].desc,
    suggestedAction: descriptions[segment].action,
  };
}

function computeSimpleChurnRisk(daysSinceVisit: number, visitCount: number, hasMembership: boolean): number {
  let score = 0;
  // Recency (40%)
  if (daysSinceVisit <= 14) score += 0;
  else if (daysSinceVisit <= 30) score += 15;
  else if (daysSinceVisit <= 60) score += 35;
  else if (daysSinceVisit <= 90) score += 55;
  else if (daysSinceVisit <= 120) score += 75;
  else score += 40;

  // Frequency (30%)
  if (visitCount >= 10) score += 0;
  else if (visitCount >= 5) score += 5;
  else if (visitCount >= 3) score += 10;
  else if (visitCount >= 2) score += 20;
  else score += 30;

  // Membership (30%)
  if (!hasMembership) score += 20;

  return Math.min(100, score);
}

function computeDetailedChurnRisk(
  daysSinceVisit: number,
  visitCount: number,
  totalSpend: number,
  hasMembership: boolean,
  messageCount: number
): ChurnRiskScore {
  const factors: ChurnFactor[] = [];

  // Recency (40%)
  let recencyScore = 0;
  let recencyDetail = '';
  if (daysSinceVisit <= 14) { recencyScore = 5; recencyDetail = `${daysSinceVisit}d ago - recent`; }
  else if (daysSinceVisit <= 30) { recencyScore = 15; recencyDetail = `${daysSinceVisit}d ago - normal`; }
  else if (daysSinceVisit <= 60) { recencyScore = 45; recencyDetail = `${daysSinceVisit}d ago - lapsing`; }
  else if (daysSinceVisit <= 90) { recencyScore = 75; recencyDetail = `${daysSinceVisit}d ago - at risk`; }
  else { recencyScore = 95; recencyDetail = `${daysSinceVisit}d ago - likely churned`; }
  factors.push({ name: 'Recency', score: recencyScore, weight: 40, detail: recencyDetail });

  // Frequency (20%)
  const freqScore = visitCount >= 10 ? 5 : visitCount >= 5 ? 20 : visitCount >= 3 ? 40 : visitCount >= 2 ? 60 : 80;
  factors.push({ name: 'Frequency', score: freqScore, weight: 20, detail: `${visitCount} total visits` });

  // Monetary (15%)
  const monScore = totalSpend >= 5000 ? 5 : totalSpend >= 2000 ? 20 : totalSpend >= 500 ? 40 : 70;
  factors.push({ name: 'Monetary', score: monScore, weight: 15, detail: `$${totalSpend.toLocaleString()} lifetime` });

  // Membership (15%)
  const memScore = hasMembership ? 10 : 60;
  factors.push({ name: 'Membership', score: memScore, weight: 15, detail: hasMembership ? 'Active member' : 'No membership' });

  // Engagement (10%)
  const engScore = messageCount >= 10 ? 10 : messageCount >= 5 ? 25 : messageCount >= 2 ? 50 : 75;
  factors.push({ name: 'Engagement', score: engScore, weight: 10, detail: `${messageCount} messages` });

  const total = Math.round(factors.reduce((s, f) => s + f.score * (f.weight / 100), 0));
  const risk = total >= 75 ? 'critical' : total >= 50 ? 'high' : total >= 30 ? 'moderate' : 'low';

  const recommendations: Record<string, string> = {
    critical: 'Immediate personal outreach required. Consider offering premium incentive to re-engage.',
    high: 'Send targeted reactivation campaign with compelling offer.',
    moderate: 'Schedule follow-up communication. Recommend maintenance appointment.',
    low: 'Continue regular engagement. Consider loyalty program enrollment.',
  };

  return {
    score: total,
    risk,
    factors,
    recommendation: recommendations[risk],
  };
}

function generateRecommendations(treatments: TreatmentHistory[], _totalSpend: number): TreatmentRecommendation[] {
  const recs: TreatmentRecommendation[] = [];

  // Timing-based: overdue treatments
  for (const t of treatments) {
    if (t.nextDue && new Date(t.nextDue) <= new Date()) {
      recs.push({
        service: t.service,
        reason: `Overdue by ${Math.floor((Date.now() - new Date(t.nextDue).getTime()) / 86400000)} days`,
        confidence: 85,
        strategy: 'timing',
        estimatedPrice: Math.round(t.totalSpend / t.count),
        priority: 'high',
      });
    }
  }

  // Pathway: common next-step services
  const pathwayMap: Record<string, string> = {
    'HydraFacial': 'RF Microneedling',
    'VI Peel': 'PRX-T33',
    'Botox': 'Dermal Fillers',
    'RF Microneedling': 'Sofwave',
    'Laser Hair Removal': 'PicoWay',
  };

  const serviceNames = new Set(treatments.map(t => t.service));
  for (const [current, next] of Object.entries(pathwayMap)) {
    if (serviceNames.has(current) && !serviceNames.has(next)) {
      recs.push({
        service: next,
        reason: `Natural progression from ${current}`,
        confidence: 70,
        strategy: 'pathway',
        estimatedPrice: 500,
        priority: 'medium',
      });
    }
  }

  return recs.slice(0, 5);
}

function computeLoyalty(totalSpend: number, visitCount: number): LoyaltyStatus {
  const points = Math.floor(totalSpend) + visitCount * 50;
  const tier = points >= 10000 ? 'platinum' : points >= 5000 ? 'gold' : points >= 2000 ? 'silver' : 'bronze';

  const tierThresholds = { bronze: 0, silver: 2000, gold: 5000, platinum: 10000 };
  const nextTier = tier === 'platinum' ? 'platinum' : tier === 'gold' ? 'platinum' : tier === 'silver' ? 'gold' : 'silver';
  const pointsToNext = tierThresholds[nextTier] - points;

  return {
    points,
    tier,
    pointsToNextTier: Math.max(0, pointsToNext),
    rewardsAvailable: [
      { id: 'r1', name: 'Free HydraFacial Add-on', pointsCost: 500, description: 'LED light therapy add-on', available: points >= 500 },
      { id: 'r2', name: '$50 Service Credit', pointsCost: 1000, description: 'Apply to any service', available: points >= 1000 },
      { id: 'r3', name: 'Free Consultation', pointsCost: 250, description: 'Complimentary consultation', available: points >= 250 },
    ],
    history: [],
  };
}
