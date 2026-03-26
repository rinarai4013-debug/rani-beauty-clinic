/**
 * Campaign Builder Engine
 *
 * Build, schedule, and track marketing campaigns with audience segmentation,
 * A/B testing, drip sequences, and performance tracking.
 * CAN-SPAM compliant with unsubscribe management.
 */

import type {
  Campaign,
  CampaignType,
  CampaignStatus,
  CampaignMetrics,
  ABTest,
  AudienceFilter,
  SegmentCondition,
  SegmentGroup,
  DripStep,
  ClientPreferences,
  MessageChannel,
} from '@/types/communications';

// ── Campaign Store (in-memory; production: Airtable) ─────────────────

const campaigns = new Map<string, Campaign>();

// ── Audience Segmentation ────────────────────────────────────────────

interface ClientRecord {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status: string;
  treatmentHistory: string[];
  totalSpend: number;
  visitCount: number;
  daysSinceLastVisit: number;
  membershipStatus: 'active' | 'cancelled' | 'none';
  age?: number;
  gender?: string;
  zipCode?: string;
  lastService?: string;
  smsOptIn: boolean;
  emailOptIn: boolean;
}

export function evaluateCondition(
  client: ClientRecord,
  condition: SegmentCondition
): boolean {
  const fieldValue = getFieldValue(client, condition.field);

  switch (condition.operator) {
    case 'equals':
      return String(fieldValue).toLowerCase() === String(condition.value).toLowerCase();
    case 'not_equals':
      return String(fieldValue).toLowerCase() !== String(condition.value).toLowerCase();
    case 'contains':
      if (Array.isArray(fieldValue)) {
        return fieldValue.some(v =>
          String(v).toLowerCase().includes(String(condition.value).toLowerCase())
        );
      }
      return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
    case 'not_contains':
      if (Array.isArray(fieldValue)) {
        return !fieldValue.some(v =>
          String(v).toLowerCase().includes(String(condition.value).toLowerCase())
        );
      }
      return !String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
    case 'greater_than':
      return Number(fieldValue) > Number(condition.value);
    case 'less_than':
      return Number(fieldValue) < Number(condition.value);
    case 'between':
      return (
        Number(fieldValue) >= Number(condition.value) &&
        Number(fieldValue) <= Number(condition.secondValue ?? condition.value)
      );
    case 'in':
      if (Array.isArray(condition.value)) {
        return condition.value.includes(String(fieldValue));
      }
      return false;
    case 'not_in':
      if (Array.isArray(condition.value)) {
        return !condition.value.includes(String(fieldValue));
      }
      return true;
    case 'is_true':
      return Boolean(fieldValue) === true;
    case 'is_false':
      return Boolean(fieldValue) === false;
    default:
      return false;
  }
}

function getFieldValue(client: ClientRecord, field: string): unknown {
  const fieldMap: Record<string, unknown> = {
    treatment_history: client.treatmentHistory,
    spend_tier: getSpendTier(client.totalSpend),
    visit_recency: client.daysSinceLastVisit,
    membership_status: client.membershipStatus,
    age: client.age,
    gender: client.gender,
    zip_code: client.zipCode,
    lead_status: client.status,
    last_service: client.lastService,
    total_spend: client.totalSpend,
    visit_count: client.visitCount,
    days_since_last_visit: client.daysSinceLastVisit,
    has_email: !!client.email,
    has_phone: !!client.phone,
    sms_opt_in: client.smsOptIn,
    email_opt_in: client.emailOptIn,
  };
  return fieldMap[field];
}

export function getSpendTier(totalSpend: number): string {
  if (totalSpend >= 10000) return 'vip';
  if (totalSpend >= 5000) return 'gold';
  if (totalSpend >= 2000) return 'silver';
  if (totalSpend >= 500) return 'bronze';
  return 'new';
}

export function evaluateGroup(client: ClientRecord, group: SegmentGroup): boolean {
  if (group.conditions.length === 0) return true;

  if (group.logic === 'AND') {
    return group.conditions.every(c => evaluateCondition(client, c));
  }
  return group.conditions.some(c => evaluateCondition(client, c));
}

export function evaluateAudienceFilter(
  client: ClientRecord,
  filter: AudienceFilter
): boolean {
  if (filter.groups.length === 0) return true;

  // Check unsubscribe exclusion
  if (filter.excludeUnsubscribed && !client.smsOptIn && !client.emailOptIn) {
    return false;
  }

  const groupResults = filter.groups.map(g => evaluateGroup(client, g));

  if (filter.logic === 'AND') {
    return groupResults.every(Boolean);
  }
  return groupResults.some(Boolean);
}

export function segmentAudience(
  clients: ClientRecord[],
  filter: AudienceFilter
): ClientRecord[] {
  return clients.filter(client => evaluateAudienceFilter(client, filter));
}

// ── A/B Test Splitting ───────────────────────────────────────────────

export function splitAudience<T>(
  audience: T[],
  splitPercent: number
): { groupA: T[]; groupB: T[] } {
  const shuffled = [...audience].sort(() => Math.random() - 0.5);
  const splitIndex = Math.floor(shuffled.length * (splitPercent / 100));
  return {
    groupA: shuffled.slice(0, splitIndex),
    groupB: shuffled.slice(splitIndex),
  };
}

export function determineABWinner(
  metricsA: CampaignMetrics,
  metricsB: CampaignMetrics,
  winnerMetric: ABTest['winnerMetric']
): 'A' | 'B' {
  switch (winnerMetric) {
    case 'open_rate':
      return metricsA.openRate >= metricsB.openRate ? 'A' : 'B';
    case 'click_rate':
      return metricsA.clickRate >= metricsB.clickRate ? 'A' : 'B';
    case 'conversion_rate':
      return metricsA.conversionRate >= metricsB.conversionRate ? 'A' : 'B';
    default:
      return 'A';
  }
}

// ── Campaign CRUD ────────────────────────────────────────────────────

export function createCampaign(params: {
  name: string;
  type: CampaignType;
  channel: MessageChannel | 'both';
  subject?: string;
  body: string;
  templateId?: string;
  audienceFilter: AudienceFilter;
  audienceSize?: number;
  abTest?: ABTest;
  scheduledAt?: string;
  isDrip?: boolean;
  dripSteps?: DripStep[];
  createdBy: string;
}): Campaign {
  const id = `camp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  const campaign: Campaign = {
    id,
    name: params.name,
    type: params.type,
    status: params.scheduledAt ? 'scheduled' : 'draft',
    channel: params.channel,
    subject: params.subject,
    body: params.body,
    templateId: params.templateId,
    abTest: params.abTest,
    audienceFilter: params.audienceFilter,
    audienceSize: params.audienceSize ?? 0,
    scheduledAt: params.scheduledAt,
    isDrip: params.isDrip ?? false,
    dripSteps: params.dripSteps,
    metrics: createEmptyMetrics(),
    createdBy: params.createdBy,
    createdAt: now,
    updatedAt: now,
  };

  campaigns.set(id, campaign);
  return campaign;
}

export function getCampaign(id: string): Campaign | null {
  return campaigns.get(id) ?? null;
}

export function getAllCampaigns(): Campaign[] {
  return Array.from(campaigns.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function updateCampaign(id: string, updates: Partial<Campaign>): Campaign | null {
  const campaign = campaigns.get(id);
  if (!campaign) return null;

  const updated = {
    ...campaign,
    ...updates,
    id, // prevent ID change
    updatedAt: new Date().toISOString(),
  };
  campaigns.set(id, updated);
  return updated;
}

export function updateCampaignStatus(id: string, status: CampaignStatus): Campaign | null {
  return updateCampaign(id, { status });
}

export function duplicateCampaign(id: string, newName?: string): Campaign | null {
  const original = campaigns.get(id);
  if (!original) return null;

  const duplicate = createCampaign({
    name: newName ?? `${original.name} (Copy)`,
    type: original.type,
    channel: original.channel,
    subject: original.subject,
    body: original.body,
    templateId: original.templateId,
    audienceFilter: original.audienceFilter,
    abTest: original.abTest,
    isDrip: original.isDrip,
    dripSteps: original.dripSteps?.map(s => ({ ...s, status: 'pending' as const })),
    createdBy: original.createdBy,
  });

  return duplicate;
}

export function deleteCampaign(id: string): boolean {
  return campaigns.delete(id);
}

// ── Performance Tracking ─────────────────────────────────────────────

export function createEmptyMetrics(): CampaignMetrics {
  return {
    totalSent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    replied: 0,
    bounced: 0,
    failed: 0,
    unsubscribed: 0,
    conversions: 0,
    revenueAttributed: 0,
    deliveryRate: 0,
    openRate: 0,
    clickRate: 0,
    conversionRate: 0,
    bounceRate: 0,
    unsubscribeRate: 0,
  };
}

export function calculateMetricRates(metrics: CampaignMetrics): CampaignMetrics {
  const sent = metrics.totalSent || 1; // avoid division by zero
  return {
    ...metrics,
    deliveryRate: (metrics.delivered / sent) * 100,
    openRate: metrics.delivered > 0 ? (metrics.opened / metrics.delivered) * 100 : 0,
    clickRate: metrics.opened > 0 ? (metrics.clicked / metrics.opened) * 100 : 0,
    conversionRate: metrics.clicked > 0 ? (metrics.conversions / metrics.clicked) * 100 : 0,
    bounceRate: (metrics.bounced / sent) * 100,
    unsubscribeRate: (metrics.unsubscribed / sent) * 100,
  };
}

export function updateCampaignMetrics(
  id: string,
  metricUpdates: Partial<CampaignMetrics>
): CampaignMetrics | null {
  const campaign = campaigns.get(id);
  if (!campaign) return null;

  const updatedMetrics = {
    ...campaign.metrics,
    ...metricUpdates,
  };

  const withRates = calculateMetricRates(updatedMetrics);
  campaign.metrics = withRates;
  campaign.updatedAt = new Date().toISOString();

  return withRates;
}

// ── Revenue Attribution ──────────────────────────────────────────────

export function attributeRevenue(
  campaignId: string,
  revenue: number,
  isConversion: boolean
): void {
  const campaign = campaigns.get(campaignId);
  if (!campaign) return;

  campaign.metrics.revenueAttributed += revenue;
  if (isConversion) {
    campaign.metrics.conversions++;
  }
  campaign.metrics = calculateMetricRates(campaign.metrics);
  campaign.updatedAt = new Date().toISOString();
}

// ── Unsubscribe Management (CAN-SPAM) ────────────────────────────────

const unsubscribeList = new Set<string>();
const resubscribeRequests: Array<{ clientId: string; requestedAt: string }> = [];

export function unsubscribeClient(clientId: string): void {
  unsubscribeList.add(clientId);
}

export function resubscribeClient(clientId: string): void {
  unsubscribeList.delete(clientId);
}

export function isUnsubscribed(clientId: string): boolean {
  return unsubscribeList.has(clientId);
}

export function requestResubscribe(clientId: string): void {
  resubscribeRequests.push({
    clientId,
    requestedAt: new Date().toISOString(),
  });
}

export function getUnsubscribedClients(): string[] {
  return Array.from(unsubscribeList);
}

export function getResubscribeRequests(): Array<{ clientId: string; requestedAt: string }> {
  return [...resubscribeRequests];
}

// ── CAN-SPAM Compliance Validator ────────────────────────────────────

export interface ComplianceCheck {
  isCompliant: boolean;
  violations: string[];
}

export function validateCANSPAM(campaign: Campaign): ComplianceCheck {
  const violations: string[] = [];

  // Must include physical address
  if (!campaign.body.includes('401 Olympia Ave') && !campaign.body.includes('Renton, WA')) {
    violations.push('Missing physical mailing address (CAN-SPAM requirement)');
  }

  // Must include unsubscribe mechanism
  if (
    !campaign.body.toLowerCase().includes('unsubscribe') &&
    !campaign.body.toLowerCase().includes('opt-out') &&
    !campaign.body.toLowerCase().includes('opt out')
  ) {
    violations.push('Missing unsubscribe/opt-out link (CAN-SPAM requirement)');
  }

  // Subject line must not be deceptive
  if (campaign.subject && campaign.subject.includes('RE:') && !campaign.body.includes('In reply to')) {
    violations.push('Subject line may be deceptive (fake reply)');
  }

  // Must identify as promotional if it is
  if (campaign.type === 'promotional' && !campaign.body.toLowerCase().includes('promotional')) {
    // This is a soft warning, not a hard violation
  }

  return {
    isCompliant: violations.length === 0,
    violations,
  };
}

// ── Drip Sequence Builder ────────────────────────────────────────────

export function createDripSequence(
  steps: Array<{
    delayDays: number;
    subject?: string;
    body: string;
    channel: MessageChannel;
  }>
): DripStep[] {
  return steps.map((step, index) => ({
    id: `drip_${Date.now()}_${index}`,
    delayDays: step.delayDays,
    subject: step.subject,
    body: step.body,
    channel: step.channel,
    status: 'pending' as const,
  }));
}

// ── Campaign Type Presets ────────────────────────────────────────────

export function getCampaignTypeDefaults(type: CampaignType): {
  suggestedSubject: string;
  suggestedBody: string;
  defaultChannel: MessageChannel | 'both';
} {
  const defaults: Record<CampaignType, { suggestedSubject: string; suggestedBody: string; defaultChannel: MessageChannel | 'both' }> = {
    promotional: {
      suggestedSubject: 'Special Offer from Rani Beauty Clinic',
      suggestedBody: 'Hi {{clientName}}, we have an exclusive offer just for you! Visit us at Rani Beauty Clinic for premium treatment results.\n\nRani Beauty Clinic\n401 Olympia Ave NE #101, Renton, WA 98056\nTo unsubscribe, reply STOP',
      defaultChannel: 'both',
    },
    educational: {
      suggestedSubject: 'Learn About {{serviceName}} at Rani Beauty Clinic',
      suggestedBody: 'Hi {{clientName}}, discover what {{serviceName}} can do for your skin goals.\n\nRani Beauty Clinic\n401 Olympia Ave NE #101, Renton, WA 98056\nTo unsubscribe, reply STOP',
      defaultChannel: 'email',
    },
    reactivation: {
      suggestedSubject: 'We Miss You at Rani Beauty Clinic',
      suggestedBody: 'Hi {{clientName}}, it has been a while since your last visit. We would love to see you again and help you continue your transformation journey.\n\nRani Beauty Clinic\n401 Olympia Ave NE #101, Renton, WA 98056\nTo unsubscribe, reply STOP',
      defaultChannel: 'both',
    },
    event: {
      suggestedSubject: 'You\'re Invited - {{eventName}} at Rani Beauty Clinic',
      suggestedBody: 'Hi {{clientName}}, join us for an exclusive event at Rani Beauty Clinic.\n\nRani Beauty Clinic\n401 Olympia Ave NE #101, Renton, WA 98056\nTo unsubscribe, reply STOP',
      defaultChannel: 'both',
    },
    seasonal: {
      suggestedSubject: '{{seasonName}} Specials at Rani Beauty Clinic',
      suggestedBody: 'Hi {{clientName}}, this season calls for a refresh! Discover our curated seasonal treatments.\n\nRani Beauty Clinic\n401 Olympia Ave NE #101, Renton, WA 98056\nTo unsubscribe, reply STOP',
      defaultChannel: 'email',
    },
    birthday: {
      suggestedSubject: 'Happy Birthday, {{clientName}}! A Gift From Rani Beauty Clinic',
      suggestedBody: 'Happy Birthday, {{clientName}}! As our gift to you, enjoy a special birthday treat at Rani Beauty Clinic.\n\nRani Beauty Clinic\n401 Olympia Ave NE #101, Renton, WA 98056\nTo unsubscribe, reply STOP',
      defaultChannel: 'both',
    },
  };

  return defaults[type];
}
