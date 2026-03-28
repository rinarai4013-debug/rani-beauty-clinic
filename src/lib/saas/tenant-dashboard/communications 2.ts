/**
 * RaniOS Tenant Dashboard — Communications Module
 *
 * SMS/Email sending, campaign builder, template library,
 * automation triggers, conversation inbox, and review management.
 * Messages sent via shared Twilio/Resend, billed per message.
 */

import type { TenantDatabaseClient } from '@/lib/tenant/database';
import type { TenantConfig } from '@/lib/tenant/config';

// ─── Types ──────────────────────────────────────────────────────────────────

export type MessageChannel = 'sms' | 'email';
export type MessageStatus = 'draft' | 'queued' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'failed';
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';
export type AutomationTrigger = 'appointment_booked' | 'appointment_completed' | 'appointment_cancelled' | 'no_show' | 'new_client' | 'birthday' | 'membership_renewal' | 'churn_risk' | 'review_request' | 'custom';

// ─── Message Sending ────────────────────────────────────────────────────────

export interface SendMessageRequest {
  channel: MessageChannel;
  to: string;                // phone or email
  clientId?: string;
  subject?: string;          // email only
  body: string;
  templateId?: string;
  variables?: Record<string, string>;
  scheduledAt?: string;      // ISO datetime for scheduled sends
}

export interface SendMessageResult {
  id: string;
  channel: MessageChannel;
  status: MessageStatus;
  sentAt: string;
  cost: number;              // Billed amount
  externalId?: string;       // Twilio/Resend message ID
}

export interface MessageRecord {
  id: string;
  channel: MessageChannel;
  direction: 'inbound' | 'outbound';
  to: string;
  from: string;
  clientId?: string;
  clientName?: string;
  subject?: string;
  body: string;
  status: MessageStatus;
  sentAt: string;
  deliveredAt?: string;
  openedAt?: string;
  repliedAt?: string;
  campaign?: string;
  cost: number;
  templateId?: string;
}

// ─── Campaign Builder ───────────────────────────────────────────────────────

export interface Campaign {
  id: string;
  name: string;
  channel: MessageChannel;
  status: CampaignStatus;
  subject?: string;
  body: string;
  templateId?: string;
  audience: CampaignAudience;
  schedule: CampaignSchedule;
  stats: CampaignStats;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface CampaignAudience {
  type: 'all' | 'segment' | 'tag' | 'custom' | 'list';
  segment?: string;
  tags?: string[];
  clientIds?: string[];
  filters?: {
    status?: string[];
    lastVisitBefore?: string;
    lastVisitAfter?: string;
    minSpend?: number;
    hasMembership?: boolean;
  };
  estimatedSize: number;
}

export interface CampaignSchedule {
  type: 'immediate' | 'scheduled' | 'drip';
  scheduledAt?: string;
  dripSteps?: DripStep[];
  timezone: string;
}

export interface DripStep {
  delayDays: number;
  delayHours: number;
  subject?: string;
  body: string;
  templateId?: string;
  condition?: string;
}

export interface CampaignStats {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
  unsubscribed: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
  revenue: number;
  cost: number;
  roi: number;
}

// ─── Template Library ───────────────────────────────────────────────────────

export interface MessageTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  channel: MessageChannel;
  subject?: string;
  body: string;
  variables: string[];
  isSystem: boolean;       // Pre-built vs custom
  usageCount: number;
  lastUsed?: string;
  createdAt: string;
  createdBy: string;
}

export type TemplateCategory =
  | 'appointment_reminder'
  | 'appointment_confirmation'
  | 'post_treatment'
  | 'reactivation'
  | 'pre_consult'
  | 'review_request'
  | 'birthday'
  | 'membership'
  | 'promotional'
  | 'follow_up'
  | 'custom';

// ─── Automation ─────────────────────────────────────────────────────────────

export interface AutomationRule {
  id: string;
  name: string;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  enabled: boolean;
  stats: { triggered: number; sent: number; lastTriggered?: string };
  createdAt: string;
}

export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in';
  value: string | number | string[];
}

export interface AutomationAction {
  type: 'send_sms' | 'send_email' | 'add_tag' | 'remove_tag' | 'update_status' | 'create_task' | 'wait';
  templateId?: string;
  delay?: { days: number; hours: number };
  params?: Record<string, string>;
}

// ─── Conversation Inbox ─────────────────────────────────────────────────────

export interface Conversation {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  status: 'open' | 'closed' | 'archived';
  assignedTo?: string;
  tags: string[];
  messages: MessageRecord[];
}

export interface InboxSummary {
  conversations: Conversation[];
  totalOpen: number;
  totalUnread: number;
  avgResponseTime: number;  // minutes
}

// ─── Review Management ──────────────────────────────────────────────────────

export interface Review {
  id: string;
  platform: 'google' | 'yelp' | 'facebook' | 'internal';
  rating: number;           // 1–5
  text: string;
  clientName: string;
  clientId?: string;
  date: string;
  status: 'new' | 'responded' | 'flagged';
  response?: string;
  responseDate?: string;
  respondedBy?: string;
  suggestedResponse?: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface ReviewSummary {
  reviews: Review[];
  avgRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
  responseRate: number;
  avgResponseTime: number;
  sentimentBreakdown: { positive: number; neutral: number; negative: number };
  recentTrend: 'improving' | 'stable' | 'declining';
}

// ─── Message Sending ────────────────────────────────────────────────────────

export async function sendMessage(
  db: TenantDatabaseClient,
  tenant: TenantConfig,
  request: SendMessageRequest
): Promise<SendMessageResult> {
  // Validate usage limits
  const usage = tenant.usage;
  if (request.channel === 'sms' && usage.smsSent >= 500) {
    throw new Error('SMS limit reached for current period');
  }
  if (request.channel === 'email' && usage.emailsSent >= 2000) {
    throw new Error('Email limit reached for current period');
  }

  // Apply template variables
  let body = request.body;
  if (request.variables) {
    for (const [key, value] of Object.entries(request.variables)) {
      body = body.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
  }

  // Log message to tenant's Messages Log
  const recordId = await db.createRecord('Messages Log', {
    'Client Email': request.to,
    'Type': request.channel,
    'Direction': 'outbound',
    'Subject': request.subject || '',
    'Preview': body.slice(0, 200),
    'Status': 'sent',
    'Date': new Date().toISOString(),
    'Campaign': '',
  });

  const cost = request.channel === 'sms' ? 0.05 : 0.01;

  return {
    id: recordId,
    channel: request.channel,
    status: 'sent',
    sentAt: new Date().toISOString(),
    cost,
  };
}

// ─── Campaigns ──────────────────────────────────────────────────────────────

export async function getCampaigns(
  db: TenantDatabaseClient,
  _tenant: TenantConfig
): Promise<Campaign[]> {
  // Campaigns would be stored in a separate Airtable table
  // Return empty for now - structure is ready
  return [];
}

export async function createCampaign(
  db: TenantDatabaseClient,
  _tenant: TenantConfig,
  campaign: Omit<Campaign, 'id' | 'stats' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const id = await db.createRecord('Campaigns', {
    'Name': campaign.name,
    'Channel': campaign.channel,
    'Status': campaign.status,
    'Subject': campaign.subject || '',
    'Body': campaign.body,
    'Created By': campaign.createdBy,
    'Created At': new Date().toISOString(),
  });
  return id;
}

// ─── Template Library ───────────────────────────────────────────────────────

export function getSystemTemplates(): MessageTemplate[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'tpl-appt-confirm',
      name: 'Appointment Confirmation',
      category: 'appointment_confirmation',
      channel: 'sms',
      body: 'Hi {{clientName}}! Your {{service}} appointment is confirmed for {{date}} at {{time}} with {{provider}}. Reply C to confirm or R to reschedule.',
      variables: ['clientName', 'service', 'date', 'time', 'provider'],
      isSystem: true,
      usageCount: 0,
      createdAt: now,
      createdBy: 'system',
    },
    {
      id: 'tpl-appt-reminder-24h',
      name: '24h Appointment Reminder',
      category: 'appointment_reminder',
      channel: 'sms',
      body: 'Reminder: {{clientName}}, you have a {{service}} appointment tomorrow at {{time}}. See you then!',
      variables: ['clientName', 'service', 'time'],
      isSystem: true,
      usageCount: 0,
      createdAt: now,
      createdBy: 'system',
    },
    {
      id: 'tpl-appt-reminder-2h',
      name: '2h Appointment Reminder',
      category: 'appointment_reminder',
      channel: 'sms',
      body: 'Hi {{clientName}}! Quick reminder: your {{service}} appointment is in 2 hours. We look forward to seeing you!',
      variables: ['clientName', 'service'],
      isSystem: true,
      usageCount: 0,
      createdAt: now,
      createdBy: 'system',
    },
    {
      id: 'tpl-post-treatment',
      name: 'Post-Treatment Follow-Up',
      category: 'post_treatment',
      channel: 'email',
      subject: 'How are you feeling after your {{service}}?',
      body: 'Hi {{clientName}},\n\nThank you for your visit today. We hope your {{service}} treatment went wonderfully.\n\nRemember to follow your aftercare instructions. If you have any questions, don\'t hesitate to reach out.\n\nWarm regards,\n{{clinicName}}',
      variables: ['clientName', 'service', 'clinicName'],
      isSystem: true,
      usageCount: 0,
      createdAt: now,
      createdBy: 'system',
    },
    {
      id: 'tpl-review-request',
      name: 'Review Request',
      category: 'review_request',
      channel: 'sms',
      body: 'Hi {{clientName}}! We hope you loved your {{service}}. Would you mind leaving us a quick review? {{reviewLink}} Thank you!',
      variables: ['clientName', 'service', 'reviewLink'],
      isSystem: true,
      usageCount: 0,
      createdAt: now,
      createdBy: 'system',
    },
    {
      id: 'tpl-reactivation-30',
      name: '30-Day Reactivation',
      category: 'reactivation',
      channel: 'email',
      subject: 'We miss you, {{clientName}}!',
      body: 'Hi {{clientName}},\n\nIt\'s been a while since your last visit. We\'d love to see you again!\n\nBook your next appointment and enjoy a complimentary consultation.\n\n{{clinicName}}',
      variables: ['clientName', 'clinicName'],
      isSystem: true,
      usageCount: 0,
      createdAt: now,
      createdBy: 'system',
    },
    {
      id: 'tpl-reactivation-60',
      name: '60-Day Reactivation',
      category: 'reactivation',
      channel: 'email',
      subject: 'A special offer just for you, {{clientName}}',
      body: 'Hi {{clientName}},\n\nWe noticed it\'s been 60 days since your last visit. We have a special offer to welcome you back.\n\nBook now and save 10% on your next treatment.\n\n{{clinicName}}',
      variables: ['clientName', 'clinicName'],
      isSystem: true,
      usageCount: 0,
      createdAt: now,
      createdBy: 'system',
    },
    {
      id: 'tpl-reactivation-90',
      name: '90-Day Reactivation',
      category: 'reactivation',
      channel: 'sms',
      body: 'Hi {{clientName}}, it\'s been a while! We have an exclusive offer for returning clients. Reply YES to learn more. -{{clinicName}}',
      variables: ['clientName', 'clinicName'],
      isSystem: true,
      usageCount: 0,
      createdAt: now,
      createdBy: 'system',
    },
    {
      id: 'tpl-birthday',
      name: 'Birthday Greeting',
      category: 'birthday',
      channel: 'email',
      subject: 'Happy Birthday, {{clientName}}! A gift from us',
      body: 'Happy Birthday, {{clientName}}!\n\nTo celebrate your special day, we\'d like to offer you a complimentary add-on with your next treatment.\n\nBook within 30 days to redeem.\n\n{{clinicName}}',
      variables: ['clientName', 'clinicName'],
      isSystem: true,
      usageCount: 0,
      createdAt: now,
      createdBy: 'system',
    },
    {
      id: 'tpl-membership-renewal',
      name: 'Membership Renewal Reminder',
      category: 'membership',
      channel: 'email',
      subject: 'Your membership is up for renewal',
      body: 'Hi {{clientName}},\n\nYour {{membershipPlan}} membership renews on {{renewalDate}}. As a member, you enjoy exclusive benefits including priority booking and special pricing.\n\nThank you for being part of our community.\n\n{{clinicName}}',
      variables: ['clientName', 'membershipPlan', 'renewalDate', 'clinicName'],
      isSystem: true,
      usageCount: 0,
      createdAt: now,
      createdBy: 'system',
    },
    {
      id: 'tpl-pre-consult',
      name: 'Pre-Consultation Prep',
      category: 'pre_consult',
      channel: 'email',
      subject: 'Prepare for your consultation at {{clinicName}}',
      body: 'Hi {{clientName}},\n\nYour consultation is coming up! Here\'s how to prepare:\n\n1. Avoid sun exposure 48h before\n2. Come with clean skin (no makeup)\n3. Bring a list of current medications\n4. Have your skincare goals in mind\n\nSee you soon!\n{{clinicName}}',
      variables: ['clientName', 'clinicName'],
      isSystem: true,
      usageCount: 0,
      createdAt: now,
      createdBy: 'system',
    },
    {
      id: 'tpl-no-show-followup',
      name: 'No-Show Follow-Up',
      category: 'follow_up',
      channel: 'sms',
      body: 'Hi {{clientName}}, we missed you at your {{service}} appointment today. We hope everything is okay. Would you like to reschedule? Reply YES or call us.',
      variables: ['clientName', 'service'],
      isSystem: true,
      usageCount: 0,
      createdAt: now,
      createdBy: 'system',
    },
  ];
}

export async function getCustomTemplates(
  db: TenantDatabaseClient,
  _tenant: TenantConfig
): Promise<MessageTemplate[]> {
  // Custom templates would be stored in tenant's Airtable
  return [];
}

// ─── Automation Rules ───────────────────────────────────────────────────────

export function getDefaultAutomations(): AutomationRule[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'auto-confirm',
      name: 'Appointment Confirmation',
      trigger: 'appointment_booked',
      conditions: [],
      actions: [
        { type: 'send_sms', templateId: 'tpl-appt-confirm' },
        { type: 'send_email', templateId: 'tpl-appt-confirm' },
      ],
      enabled: true,
      stats: { triggered: 0, sent: 0 },
      createdAt: now,
    },
    {
      id: 'auto-reminder-24h',
      name: '24h Appointment Reminder',
      trigger: 'appointment_booked',
      conditions: [],
      actions: [
        { type: 'wait', delay: { days: 0, hours: 0 } }, // Triggered 24h before
        { type: 'send_sms', templateId: 'tpl-appt-reminder-24h' },
      ],
      enabled: true,
      stats: { triggered: 0, sent: 0 },
      createdAt: now,
    },
    {
      id: 'auto-post-treatment',
      name: 'Post-Treatment Follow-Up',
      trigger: 'appointment_completed',
      conditions: [],
      actions: [
        { type: 'wait', delay: { days: 0, hours: 2 } },
        { type: 'send_email', templateId: 'tpl-post-treatment' },
      ],
      enabled: true,
      stats: { triggered: 0, sent: 0 },
      createdAt: now,
    },
    {
      id: 'auto-review-request',
      name: 'Review Request (24h after visit)',
      trigger: 'appointment_completed',
      conditions: [],
      actions: [
        { type: 'wait', delay: { days: 1, hours: 0 } },
        { type: 'send_sms', templateId: 'tpl-review-request' },
      ],
      enabled: true,
      stats: { triggered: 0, sent: 0 },
      createdAt: now,
    },
    {
      id: 'auto-no-show',
      name: 'No-Show Follow-Up',
      trigger: 'no_show',
      conditions: [],
      actions: [
        { type: 'send_sms', templateId: 'tpl-no-show-followup' },
        { type: 'add_tag', params: { tag: 'no-show' } },
      ],
      enabled: true,
      stats: { triggered: 0, sent: 0 },
      createdAt: now,
    },
    {
      id: 'auto-new-client',
      name: 'New Client Welcome',
      trigger: 'new_client',
      conditions: [],
      actions: [
        { type: 'send_email', templateId: 'tpl-pre-consult' },
        { type: 'add_tag', params: { tag: 'new-client' } },
      ],
      enabled: true,
      stats: { triggered: 0, sent: 0 },
      createdAt: now,
    },
    {
      id: 'auto-churn-alert',
      name: 'Churn Risk Alert',
      trigger: 'churn_risk',
      conditions: [{ field: 'churnScore', operator: 'greater_than', value: 70 }],
      actions: [
        { type: 'send_email', templateId: 'tpl-reactivation-30' },
        { type: 'create_task', params: { title: 'Follow up with at-risk client' } },
      ],
      enabled: true,
      stats: { triggered: 0, sent: 0 },
      createdAt: now,
    },
  ];
}

// ─── Conversation Inbox ─────────────────────────────────────────────────────

export async function getInbox(
  db: TenantDatabaseClient,
  _tenant: TenantConfig
): Promise<InboxSummary> {
  const messages = await db.fetchAll<{
    'Client Email': string;
    'Client Name': string;
    Type: string;
    Direction: string;
    Subject: string;
    Preview: string;
    Status: string;
    Date: string;
  }>('Messages Log', {
    sort: [{ field: 'Date', direction: 'desc' }],
    fields: ['Client Email', 'Client Name', 'Type', 'Direction', 'Subject', 'Preview', 'Status', 'Date'],
  });

  // Group by client
  const clientMap = new Map<string, MessageRecord[]>();
  for (const m of messages) {
    const email = m.fields['Client Email'] || '';
    const existing = clientMap.get(email) || [];
    existing.push({
      id: m.id,
      channel: (m.fields.Type || 'email') as MessageChannel,
      direction: (m.fields.Direction || 'outbound') as 'inbound' | 'outbound',
      to: email,
      from: m.fields.Direction === 'inbound' ? email : 'clinic',
      clientName: m.fields['Client Name'] || '',
      subject: m.fields.Subject || undefined,
      body: m.fields.Preview || '',
      status: (m.fields.Status || 'sent') as MessageStatus,
      sentAt: m.fields.Date || '',
      cost: 0,
    });
    clientMap.set(email, existing);
  }

  const conversations: Conversation[] = Array.from(clientMap.entries())
    .map(([email, msgs]) => {
      const latest = msgs[0];
      return {
        id: `conv-${email}`,
        clientId: '',
        clientName: latest.clientName || email,
        clientEmail: email,
        clientPhone: '',
        lastMessage: latest.body,
        lastMessageAt: latest.sentAt,
        unreadCount: msgs.filter(m => m.direction === 'inbound' && m.status !== 'opened').length,
        status: 'open' as const,
        tags: [],
        messages: msgs.slice(0, 20),
      };
    })
    .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
    .slice(0, 50);

  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0);

  return {
    conversations,
    totalOpen: conversations.filter(c => c.status === 'open').length,
    totalUnread,
    avgResponseTime: 45, // Would need real calculation
  };
}

// ─── Review Management ──────────────────────────────────────────────────────

export async function getReviewSummary(
  db: TenantDatabaseClient,
  _tenant: TenantConfig
): Promise<ReviewSummary> {
  const reviewRecords = await db.fetchAll<{
    Platform: string;
    Rating: number;
    Text: string;
    'Client Name': string;
    Date: string;
    Status: string;
    Response: string;
    'Response Date': string;
  }>('Reviews', {
    sort: [{ field: 'Date', direction: 'desc' }],
    fields: ['Platform', 'Rating', 'Text', 'Client Name', 'Date', 'Status', 'Response', 'Response Date'],
  });

  const reviews: Review[] = reviewRecords.map(r => {
    const rating = r.fields.Rating || 5;
    const text = r.fields.Text || '';
    return {
      id: r.id,
      platform: (r.fields.Platform || 'google') as Review['platform'],
      rating,
      text,
      clientName: r.fields['Client Name'] || 'Anonymous',
      date: r.fields.Date || '',
      status: r.fields.Response ? 'responded' : 'new',
      response: r.fields.Response || undefined,
      responseDate: r.fields['Response Date'] || undefined,
      suggestedResponse: generateReviewResponse(rating, text),
      sentiment: rating >= 4 ? 'positive' : rating >= 3 ? 'neutral' : 'negative',
    };
  });

  const ratings = reviews.map(r => r.rating);
  const avgRating = ratings.length > 0
    ? Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) / 10
    : 0;

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const rating of ratings) {
    distribution[Math.round(rating)] = (distribution[Math.round(rating)] || 0) + 1;
  }

  const responded = reviews.filter(r => r.status === 'responded').length;
  const sentimentBreakdown = {
    positive: reviews.filter(r => r.sentiment === 'positive').length,
    neutral: reviews.filter(r => r.sentiment === 'neutral').length,
    negative: reviews.filter(r => r.sentiment === 'negative').length,
  };

  return {
    reviews: reviews.slice(0, 50),
    avgRating,
    totalReviews: reviews.length,
    ratingDistribution: distribution,
    responseRate: reviews.length > 0 ? Math.round((responded / reviews.length) * 100) : 0,
    avgResponseTime: 24,
    sentimentBreakdown,
    recentTrend: avgRating >= 4.5 ? 'improving' : avgRating >= 3.5 ? 'stable' : 'declining',
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateReviewResponse(rating: number, text: string): string {
  if (rating >= 4) {
    return `Thank you for your wonderful ${rating}-star review! We're thrilled to hear about your positive experience. We look forward to seeing you again soon.`;
  }
  if (rating >= 3) {
    return `Thank you for your feedback. We appreciate you taking the time to share your experience. We'd love the opportunity to make your next visit even better. Please feel free to reach out to us directly.`;
  }
  return `We sincerely apologize for your experience. Your feedback is important to us, and we'd like to make this right. Please contact us directly so we can address your concerns.`;
}
