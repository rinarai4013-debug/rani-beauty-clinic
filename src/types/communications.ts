// ── Communication Hub Type Definitions ────────────────────────────────

// ── Channels & Preferences ───────────────────────────────────────────

export type MessageChannel = 'sms' | 'email';
export type MessageDirection = 'outbound' | 'inbound';
export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed' | 'bounced' | 'unsubscribed';

export interface ClientPreferences {
  clientId: string;
  clientName: string;
  email: string | null;
  phone: string | null;
  smsOptIn: boolean;
  emailOptIn: boolean;
  preferredChannel: MessageChannel;
  quietHoursOverride?: boolean;
  unsubscribedAt?: string;
  lastContacted?: string;
  messagesToday: number;
  promotionalThisWeek: number;
}

// ── Messages ─────────────────────────────────────────────────────────

export interface Message {
  id: string;
  clientId: string;
  clientName: string;
  channel: MessageChannel;
  direction: MessageDirection;
  status: MessageStatus;
  subject?: string; // email only
  body: string;
  templateId?: string;
  campaignId?: string;
  metadata?: Record<string, string>;
  // Tracking
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  failureReason?: string;
  // Threading
  conversationId: string;
  replyToMessageId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  channel: MessageChannel;
  lastMessage: string;
  lastMessageAt: string;
  lastDirection: MessageDirection;
  unreadCount: number;
  status: 'active' | 'resolved' | 'escalated' | 'archived';
  category?: ConversationCategory;
  assignedTo?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  slaDeadline?: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export type ConversationCategory =
  | 'booking_request'
  | 'question'
  | 'complaint'
  | 'feedback'
  | 'emergency'
  | 'general'
  | 'follow_up'
  | 'reactivation';

// ── Smart Replies ────────────────────────────────────────────────────

export interface SmartReply {
  id: string;
  text: string;
  confidence: number; // 0-1
  category: ConversationCategory;
  requiresReview: boolean;
}

// ── Templates ────────────────────────────────────────────────────────

export type TemplateCategory =
  | 'booking_confirmation'
  | 'appointment_reminder'
  | 'post_treatment'
  | 'reactivation'
  | 'promotional'
  | 'educational'
  | 'birthday'
  | 'membership'
  | 'review_request'
  | 'welcome'
  | 'custom';

export interface MessageTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  channel: MessageChannel | 'both';
  subject?: string; // email only
  body: string;
  variables: string[]; // e.g., ['clientName', 'serviceName']
  previewText?: string;
  isActive: boolean;
  usageCount: number;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Campaigns ────────────────────────────────────────────────────────

export type CampaignType =
  | 'promotional'
  | 'educational'
  | 'reactivation'
  | 'event'
  | 'seasonal'
  | 'birthday'
  | 'direct';

export type CampaignStatus =
  | 'draft'
  | 'scheduled'
  | 'sending'
  | 'sent'
  | 'paused'
  | 'cancelled'
  | 'completed';

export interface Campaign {
  id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  channel: MessageChannel | 'both';
  // Content
  subject?: string;
  body: string;
  templateId?: string;
  // A/B Testing
  abTest?: ABTest;
  // Audience
  audienceFilter: AudienceFilter;
  audienceSize: number;
  // Scheduling
  scheduledAt?: string;
  sentAt?: string;
  completedAt?: string;
  // Drip sequence
  isDrip: boolean;
  dripSteps?: DripStep[];
  // Performance
  metrics: CampaignMetrics;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DripStep {
  id: string;
  delayDays: number;
  subject?: string;
  body: string;
  channel: MessageChannel;
  status: 'pending' | 'sent' | 'skipped';
}

export interface ABTest {
  enabled: boolean;
  splitPercent: number; // e.g., 50 for 50/50 split
  variantA: {
    subject?: string;
    body: string;
    label: string;
  };
  variantB: {
    subject?: string;
    body: string;
    label: string;
  };
  winner?: 'A' | 'B';
  winnerMetric: 'open_rate' | 'click_rate' | 'conversion_rate';
  decidedAt?: string;
}

export interface CampaignMetrics {
  totalSent: number;
  delivered: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
  failed: number;
  unsubscribed: number;
  conversions: number;
  revenueAttributed: number;
  // Rates
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  bounceRate: number;
  unsubscribeRate: number;
}

// ── Audience Segmentation ────────────────────────────────────────────

export type SegmentField =
  | 'treatment_history'
  | 'spend_tier'
  | 'visit_recency'
  | 'membership_status'
  | 'age'
  | 'gender'
  | 'zip_code'
  | 'lead_status'
  | 'last_service'
  | 'total_spend'
  | 'visit_count'
  | 'days_since_last_visit'
  | 'has_email'
  | 'has_phone'
  | 'sms_opt_in'
  | 'email_opt_in';

export type SegmentOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'between'
  | 'in'
  | 'not_in'
  | 'is_true'
  | 'is_false';

export interface SegmentCondition {
  id: string;
  field: SegmentField;
  operator: SegmentOperator;
  value: string | number | boolean | string[];
  secondValue?: string | number; // for 'between' operator
}

export interface SegmentGroup {
  id: string;
  logic: 'AND' | 'OR';
  conditions: SegmentCondition[];
}

export interface AudienceFilter {
  groups: SegmentGroup[];
  logic: 'AND' | 'OR'; // between groups
  excludeUnsubscribed: boolean;
  excludeRecentlyContacted: boolean; // within last 24h
}

// ── Analytics ────────────────────────────────────────────────────────

export interface CommunicationAnalytics {
  // Volume
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalReplied: number;
  totalBounced: number;
  totalFailed: number;
  // By channel
  byChannel: {
    sms: ChannelMetrics;
    email: ChannelMetrics;
  };
  // By type
  byType: Record<CampaignType | 'direct', ChannelMetrics>;
  // Trends
  dailyVolume: DailyMetric[];
  // Engagement
  avgOpenRate: number;
  avgClickRate: number;
  avgReplyRate: number;
  // Revenue
  totalRevenueAttributed: number;
  revenueByChannel: { sms: number; email: number };
  revenueByCampaign: { campaignId: string; campaignName: string; revenue: number }[];
  // Best times
  bestSendTimes: SendTimeSlot[];
  // Unsubscribes
  unsubscribeRate: number;
  unsubscribeTrend: DailyMetric[];
}

export interface ChannelMetrics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
  failed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
}

export interface DailyMetric {
  date: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
}

export interface SendTimeSlot {
  day: number; // 0-6 (Sunday-Saturday)
  hour: number; // 0-23
  engagementScore: number; // 0-100
  sampleSize: number;
}

// ── Rate Limiting & Quiet Hours ──────────────────────────────────────

export interface RateLimitConfig {
  maxMessagesPerDay: number;
  maxPromotionalPerWeek: number;
  quietHoursStart: number; // hour in PST (0-23)
  quietHoursEnd: number; // hour in PST (0-23)
  quietHoursTimezone: string;
}

export const DEFAULT_RATE_LIMITS: RateLimitConfig = {
  maxMessagesPerDay: 3,
  maxPromotionalPerWeek: 1,
  quietHoursStart: 20, // 8 PM PST
  quietHoursEnd: 9, // 9 AM PST
  quietHoursTimezone: 'America/Los_Angeles',
};

// ── Send Request ─────────────────────────────────────────────────────

export interface SendMessageRequest {
  clientId: string;
  channel?: MessageChannel; // auto-detect from preferences if not provided
  templateId?: string;
  subject?: string;
  body: string;
  variables?: Record<string, string>;
  isPromotional: boolean;
  scheduledAt?: string;
  campaignId?: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  channel: MessageChannel;
  status: MessageStatus;
  error?: string;
  rateLimited?: boolean;
  quietHours?: boolean;
}

export interface BatchSendRequest {
  clientIds: string[];
  templateId?: string;
  subject?: string;
  body: string;
  variables?: Record<string, string>;
  channel?: MessageChannel;
  isPromotional: boolean;
  campaignId?: string;
}

export interface BatchSendResult {
  total: number;
  queued: number;
  skipped: number;
  rateLimited: number;
  optedOut: number;
  results: SendResult[];
}

// ── Preferences Page ─────────────────────────────────────────────────

export interface CommunicationPreferences {
  defaultChannel: MessageChannel;
  rateLimits: RateLimitConfig;
  autoReplyEnabled: boolean;
  autoReplyMessage: string;
  escalationEnabled: boolean;
  escalationTimeMinutes: number;
  slaWarningMinutes: number;
  slaCriticalMinutes: number;
}
