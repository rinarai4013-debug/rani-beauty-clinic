/**
 * RaniOS Notification System
 *
 * In-app, email, SMS, webhook notifications with preferences,
 * templates, digest mode, priority levels, read tracking.
 */

import { z } from 'zod';

// ─── Types ────────────────────────────────────────────────────────

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'webhook';

export type NotificationPriority = 'info' | 'warning' | 'critical';

export type NotificationCategory =
  | 'billing'
  | 'usage'
  | 'security'
  | 'system'
  | 'feature'
  | 'marketing'
  | 'integration'
  | 'ai_insight'
  | 'appointment'
  | 'client'
  | 'review'
  | 'inventory'
  | 'schedule'
  | 'campaign';

export type DigestFrequency = 'immediate' | 'hourly' | 'daily' | 'weekly';

export interface Notification {
  id: string;
  tenantId: string;
  userId: string | null; // null = tenant-wide
  channel: NotificationChannel;
  priority: NotificationPriority;
  category: NotificationCategory;
  templateId: string | null;
  title: string;
  body: string;
  actionUrl: string | null;
  actionLabel: string | null;
  icon: string | null;
  metadata: Record<string, unknown>;
  read: boolean;
  readAt: number | null;
  dismissed: boolean;
  createdAt: number;
  expiresAt: number | null;
  deliveredAt: number | null;
  deliveryStatus: 'pending' | 'delivered' | 'failed' | 'skipped';
  deliveryError: string | null;
}

export interface NotificationPreferences {
  tenantId: string;
  userId: string;
  channels: Record<NotificationChannel, boolean>;
  categories: Record<NotificationCategory, {
    enabled: boolean;
    channels: NotificationChannel[];
  }>;
  digestFrequency: DigestFrequency;
  quietHours: { start: string; end: string; timezone: string } | null;
  emailAddress: string | null;
  phoneNumber: string | null;
  webhookUrl: string | null;
  updatedAt: number;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  titleTemplate: string;
  bodyTemplate: string;
  emailSubject: string | null;
  emailHtml: string | null;
  smsTemplate: string | null;
  webhookPayloadTemplate: Record<string, unknown> | null;
  icon: string | null;
  actionUrlTemplate: string | null;
  actionLabel: string | null;
  variables: string[];
  active: boolean;
}

export interface DigestEntry {
  tenantId: string;
  userId: string;
  frequency: DigestFrequency;
  notifications: Notification[];
  scheduledFor: number;
  sentAt: number | null;
}

export interface NotificationCenterData {
  unreadCount: number;
  notifications: Notification[];
  hasMore: boolean;
  categories: { category: NotificationCategory; count: number }[];
}

export interface SendNotificationInput {
  tenantId: string;
  userId?: string | null;
  templateId?: string;
  channels?: NotificationChannel[];
  priority?: NotificationPriority;
  category: NotificationCategory;
  title: string;
  body: string;
  variables?: Record<string, string>;
  actionUrl?: string | null;
  actionLabel?: string | null;
  icon?: string | null;
  metadata?: Record<string, unknown>;
  expiresAt?: number | null;
}

// ─── Schemas ──────────────────────────────────────────────────────

export const SendNotificationSchema = z.object({
  tenantId: z.string().min(1),
  userId: z.string().nullable().optional(),
  templateId: z.string().optional(),
  channels: z.array(z.enum(['in_app', 'email', 'sms', 'webhook'])).optional(),
  priority: z.enum(['info', 'warning', 'critical']).optional().default('info'),
  category: z.enum([
    'billing', 'usage', 'security', 'system', 'feature', 'marketing',
    'integration', 'ai_insight', 'appointment', 'client', 'review',
    'inventory', 'schedule', 'campaign',
  ]),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(2000),
  variables: z.record(z.string()).optional(),
  actionUrl: z.string().url().nullable().optional(),
  actionLabel: z.string().max(50).nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const UpdatePreferencesSchema = z.object({
  channels: z.record(z.boolean()).optional(),
  digestFrequency: z.enum(['immediate', 'hourly', 'daily', 'weekly']).optional(),
  quietHours: z.object({
    start: z.string(),
    end: z.string(),
    timezone: z.string(),
  }).nullable().optional(),
  emailAddress: z.string().email().nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  webhookUrl: z.string().url().nullable().optional(),
});

// ─── In-Memory Stores ─────────────────────────────────────────────

const notifications: Notification[] = [];
const preferences = new Map<string, NotificationPreferences>(); // key: tenantId:userId
const templates = new Map<string, NotificationTemplate>();
const digestQueue: DigestEntry[] = [];

// ─── Template Registry (50+ templates) ────────────────────────────

const DEFAULT_TEMPLATES: Omit<NotificationTemplate, 'id'>[] = [
  // Billing
  { name: 'payment_successful', category: 'billing', priority: 'info', channels: ['in_app', 'email'], titleTemplate: 'Payment Received', bodyTemplate: 'Your payment of {{amount}} has been processed successfully.', emailSubject: 'Payment Confirmation - {{amount}}', emailHtml: null, smsTemplate: null, webhookPayloadTemplate: null, icon: 'credit-card', actionUrlTemplate: '/billing', actionLabel: 'View Receipt', variables: ['amount', 'invoiceId'], active: true },
  { name: 'payment_failed', category: 'billing', priority: 'critical', channels: ['in_app', 'email', 'sms'], titleTemplate: 'Payment Failed', bodyTemplate: 'Your payment of {{amount}} could not be processed. Please update your payment method.', emailSubject: 'Action Required: Payment Failed', emailHtml: null, smsTemplate: 'RaniOS: Payment of {{amount}} failed. Update payment: {{actionUrl}}', webhookPayloadTemplate: null, icon: 'alert-triangle', actionUrlTemplate: '/billing/payment-methods', actionLabel: 'Update Payment', variables: ['amount'], active: true },
  { name: 'invoice_generated', category: 'billing', priority: 'info', channels: ['in_app', 'email'], titleTemplate: 'New Invoice Available', bodyTemplate: 'Your invoice #{{invoiceNumber}} for {{amount}} is ready.', emailSubject: 'Invoice #{{invoiceNumber}} - {{amount}}', emailHtml: null, smsTemplate: null, webhookPayloadTemplate: null, icon: 'file-text', actionUrlTemplate: '/billing/invoices/{{invoiceId}}', actionLabel: 'View Invoice', variables: ['invoiceNumber', 'amount', 'invoiceId'], active: true },
  { name: 'subscription_expiring', category: 'billing', priority: 'warning', channels: ['in_app', 'email'], titleTemplate: 'Subscription Expiring Soon', bodyTemplate: 'Your {{plan}} plan expires on {{expiryDate}}. Renew to avoid service interruption.', emailSubject: 'Your subscription expires on {{expiryDate}}', emailHtml: null, smsTemplate: null, webhookPayloadTemplate: null, icon: 'clock', actionUrlTemplate: '/billing/subscription', actionLabel: 'Renew Now', variables: ['plan', 'expiryDate'], active: true },
  { name: 'trial_ending', category: 'billing', priority: 'warning', channels: ['in_app', 'email', 'sms'], titleTemplate: 'Trial Ending in {{daysLeft}} Days', bodyTemplate: 'Your free trial ends on {{endDate}}. Upgrade now to keep all features.', emailSubject: 'Your trial ends in {{daysLeft}} days', emailHtml: null, smsTemplate: 'RaniOS: Trial ends in {{daysLeft}} days. Upgrade: {{actionUrl}}', webhookPayloadTemplate: null, icon: 'clock', actionUrlTemplate: '/billing/upgrade', actionLabel: 'Upgrade Now', variables: ['daysLeft', 'endDate'], active: true },

  // Usage
  { name: 'usage_80_percent', category: 'usage', priority: 'info', channels: ['in_app', 'email'], titleTemplate: '{{metric}} at 80% of Limit', bodyTemplate: 'Your {{metric}} usage has reached 80% of your plan limit ({{current}}/{{limit}}).', emailSubject: 'Usage Alert: {{metric}} at 80%', emailHtml: null, smsTemplate: null, webhookPayloadTemplate: null, icon: 'bar-chart', actionUrlTemplate: '/usage', actionLabel: 'View Usage', variables: ['metric', 'current', 'limit'], active: true },
  { name: 'usage_90_percent', category: 'usage', priority: 'warning', channels: ['in_app', 'email'], titleTemplate: '{{metric}} at 90% of Limit', bodyTemplate: 'Your {{metric}} usage is at 90%. Consider upgrading to avoid overages.', emailSubject: 'Warning: {{metric}} at 90% of Limit', emailHtml: null, smsTemplate: null, webhookPayloadTemplate: null, icon: 'alert-triangle', actionUrlTemplate: '/billing/upgrade', actionLabel: 'Upgrade Plan', variables: ['metric', 'current', 'limit'], active: true },
  { name: 'usage_exceeded', category: 'usage', priority: 'critical', channels: ['in_app', 'email', 'sms'], titleTemplate: '{{metric}} Limit Exceeded', bodyTemplate: 'Your {{metric}} usage has exceeded your plan limit. Overage charges apply.', emailSubject: 'Alert: {{metric}} Limit Exceeded', emailHtml: null, smsTemplate: 'RaniOS Alert: {{metric}} limit exceeded. Upgrade: {{actionUrl}}', webhookPayloadTemplate: null, icon: 'x-circle', actionUrlTemplate: '/billing/upgrade', actionLabel: 'Upgrade Now', variables: ['metric', 'current', 'limit', 'overageRate'], active: true },

  // Security
  { name: 'new_login', category: 'security', priority: 'info', channels: ['in_app', 'email'], titleTemplate: 'New Login Detected', bodyTemplate: 'A new login was detected from {{location}} ({{ip}}) at {{time}}.', emailSubject: 'New Login from {{location}}', emailHtml: null, smsTemplate: null, webhookPayloadTemplate: null, icon: 'shield', actionUrlTemplate: '/settings/security', actionLabel: 'Review Activity', variables: ['location', 'ip', 'time', 'device'], active: true },
  { name: 'api_key_created', category: 'security', priority: 'info', channels: ['in_app', 'email'], titleTemplate: 'New API Key Created', bodyTemplate: 'A new API key "{{keyName}}" was created by {{user}}.', emailSubject: 'New API Key: {{keyName}}', emailHtml: null, smsTemplate: null, webhookPayloadTemplate: null, icon: 'key', actionUrlTemplate: '/api-keys', actionLabel: 'Manage Keys', variables: ['keyName', 'user'], active: true },
  { name: 'api_key_revoked', category: 'security', priority: 'warning', channels: ['in_app', 'email'], titleTemplate: 'API Key Revoked', bodyTemplate: 'API key "{{keyName}}" was revoked by {{user}}. Reason: {{reason}}.', emailSubject: 'API Key Revoked: {{keyName}}', emailHtml: null, smsTemplate: null, webhookPayloadTemplate: null, icon: 'shield-off', actionUrlTemplate: '/api-keys', actionLabel: 'View Keys', variables: ['keyName', 'user', 'reason'], active: true },
  { name: 'suspicious_activity', category: 'security', priority: 'critical', channels: ['in_app', 'email', 'sms'], titleTemplate: 'Suspicious Activity Detected', bodyTemplate: 'Unusual activity detected: {{description}}. Please review immediately.', emailSubject: 'SECURITY ALERT: Suspicious Activity', emailHtml: null, smsTemplate: 'RaniOS SECURITY: Suspicious activity detected. Review: {{actionUrl}}', webhookPayloadTemplate: null, icon: 'alert-octagon', actionUrlTemplate: '/settings/security', actionLabel: 'Review Now', variables: ['description'], active: true },
  { name: 'password_changed', category: 'security', priority: 'info', channels: ['in_app', 'email'], titleTemplate: 'Password Changed', bodyTemplate: 'Your password was successfully changed. If this was not you, contact support.', emailSubject: 'Password Changed Successfully', emailHtml: null, smsTemplate: null, webhookPayloadTemplate: null, icon: 'lock', actionUrlTemplate: null, actionLabel: null, variables: [], active: true },

  // System
  { name: 'maintenance_scheduled', category: 'system', priority: 'warning', channels: ['in_app', 'email'], titleTemplate: 'Scheduled Maintenance', bodyTemplate: 'System maintenance planned for {{date}} from {{startTime}} to {{endTime}} ({{timezone}}).', emailSubject: 'Scheduled Maintenance: {{date}}', emailHtml: null, smsTemplate: null, webhookPayloadTemplate: null, icon: 'tool', actionUrlTemplate: '/status', actionLabel: 'View Status', variables: ['date', 'startTime', 'endTime', 'timezone'], active: true },
  { name: 'system_update', category: 'system', priority: 'info', channels: ['in_app'], titleTemplate: 'System Update Available', bodyTemplate: 'Version {{version}} is now available with {{featureCount}} new features.', emailSubject: null, emailHtml: null, smsTemplate: null, webhookPayloadTemplate: null, icon: 'download', actionUrlTemplate: '/changelog', actionLabel: 'View Changes', variables: ['version', 'featureCount'], active: true },
  { name: 'incident_reported', category: 'system', priority: 'critical', channels: ['in_app', 'email', 'webhook'], titleTemplate: 'Service Incident', bodyTemplate: '{{service}} is experiencing issues. Our team is investigating.', emailSubject: 'Service Incident: {{service}}', emailHtml: null, smsTemplate: null, webhookPayloadTemplate: { event: 'incident', service: '{{service}}', status: '{{status}}' }, icon: 'alert-circle', actionUrlTemplate: '/status', actionLabel: 'Status Page', variables: ['service', 'status'], active: true },
  { name: 'incident_resolved', category: 'system', priority: 'info', channels: ['in_app', 'email', 'webhook'], titleTemplate: 'Incident Resolved', bodyTemplate: 'The {{service}} incident has been resolved. All systems operational.', emailSubject: 'Resolved: {{service}} Incident', emailHtml: null, smsTemplate: null, webhookPayloadTemplate: { event: 'incident_resolved', service: '{{service}}' }, icon: 'check-circle', actionUrlTemplate: '/status', actionLabel: 'View Status', variables: ['service'], active: true },

  // Feature
  { name: 'new_feature', category: 'feature', priority: 'info', channels: ['in_app'], titleTemplate: 'New Feature: {{featureName}}', bodyTemplate: '{{featureDescription}}', emailSubject: null, emailHtml: null, smsTemplate: null, webhookPayloadTemplate: null, icon: 'star', actionUrlTemplate: '{{featureUrl}}', actionLabel: 'Try It', variables: ['featureName', 'featureDescription', 'featureUrl'], active: true },
  { name: 'feature_flag_enabled', category: 'feature', priority: 'info', channels: ['in_app'], titleTemplate: '{{featureName}} Now Available', bodyTemplate: '{{featureName}} has been enabled for your account. {{description}}', emailSubject: null, emailHtml: null, smsTemplate: null, webhookPayloadTemplate: null, icon: 'toggle-right', actionUrlTemplate: null, actionLabel: null, variables: ['featureName', 'description'], active: true },
  { name: 'beta_invite', category: 'feature', priority: 'info', channels: ['in_app', 'email'], titleTemplate: 'Beta Invite: {{featureName}}', bodyTemplate: 'You have been invited to test {{featureName}} in beta. {{description}}', emailSubject: 'You are invited to beta test {{featureName}}', emailHtml: null, smsTemplate: null, webhookPayloadTemplate: null, icon: 'beaker', actionUrlTemplate: '{{featureUrl}}', actionLabel: 'Join Beta', variables: ['featureName', 'description', 'featureUrl'], active: true },

  // Integration
  { name: 'integration_connected', category: 'integration', priority: 'info', channels: ['in_app'], titleTemplate: '{{integrationName}} Connected', bodyTemplate: 'Your {{integrationName}} integration is now active and syncing.', emailSubject: null, emailHtml: null, smsTemplate: null, webhookPayloadTemplate: null, icon: 'link', actionUrlTemplate: '/integrations', actionLabel: 'View Integration', variables: ['integrationName'], active: true },
  { name: 'integration_disconnected', category: 'integration', priority: 'warning', channels: ['in_app', 'email'], titleTemplate: '{{integrationName}} Disconnected', bodyTemplate: 'Your {{integrationName}} integration has been disconnected. Data sync paused.', emailSubject: '{{integrationName}} Integration Disconnected', emailHtml: null, smsTemplate: null, webhookPayloadTemplate: null, icon: 'unlink', actionUrlTemplate: '/integrations', actionLabel: 'Reconnect', variables: ['integrationName'], active: true },
  { name: 'sync_failed', category: 'integration', priority: 'warning', channels: ['in_app', 'email'], titleTemplate: '{{integrationName}} Sync Failed', bodyTemplate: 'Sync with {{integrationName}} failed: {{error}}. Retrying automatically.', emailSubject: 'Sync Failed: {{integrationName}}', emailHtml: null, smsTemplate: null, webhookPayloadTemplate: null, icon: 'refresh-cw', actionUrlTemplate: '/integrations', actionLabel: 'View Details', variables: ['integrationName', 'error'], active: true },
  { name: 'webhook_delivery_failed', category: 'integration', priority: 'warning', channels: ['in_app'], titleTemplate: 'Webhook Delivery Failed', bodyTemplate: 'Failed to deliver webhook to {{url}}. Error: {{error}}. Attempt {{attempt}}/5.', emailSubject: null, emailHtml: null, smsTemplate: null, webhookPayloadTemplate: null, icon: 'alert-triangle', actionUrlTemplate: '/webhooks', actionLabel: 'View Webhooks', variables: ['url', 'error', 'attempt'], active: true },

  // AI Insights
  { name: 'ai_churn_alert', category: 'ai_insight', priority: 'warning', channels: ['in_app', 'email'], titleTemplate: 'Churn Risk: {{clientName}}', bodyTemplate: '{{clientName}} has a {{riskLevel}} churn risk (score: {{score}}/100). Recommended action: {{action}}.', emailSubject: 'Churn Alert: {{clientName}}', emailHtml: null, smsTemplate: null, webhookPayloadTemplate: null, icon: 'trending-down', actionUrlTemplate: '/clients/{{clientId}}', actionLabel: 'View Client', variables: ['clientName', 'clientId', 'riskLevel', 'score', 'action'], active: true },
  { name: 'ai_revenue_anomaly', category: 'ai_insight', priority: 'warning', channels: ['in_app', 'email'], titleTemplate: 'Revenue Anomaly Detected', bodyTemplate: 'Revenue is {{direction}} {{percentage}}% compared to expected. {{description}}', emailSubject: 'Revenue Anomaly: {{direction}} {{percentage}}%', emailHtml: null, smsTemplate: null, webhookPayloadTemplate: null, icon: 'trending-down', actionUrlTemplate: '/dashboard/revenue', actionLabel: 'View Details', variables: ['direction', 'percentage', 'description'], active: true },
  { name: 'ai_recommendation', category: 'ai_insight', priority: 'info', channels: ['in_app'], titleTemplate: 'AI Recommendation', bodyTemplate: '{{recommendation}}', emailSubject: null, emailHtml: null, smsTemplate: null, webhookPayloadTemplate: null, icon: 'lightbulb', actionUrlTemplate: '{{actionUrl}}', actionLabel: '{{actionLabel}}', variables: ['recommendation', 'actionUrl', 'actionLabel'], active: true },
  { name: 'ai_no_show_risk', category: 'ai_insight', priority: 'warning', channels: ['in_app'], titleTemplate: 'High No-Show Risk: {{clientName}}', bodyTemplate: '{{clientName}}\'s appointment at {{time}} has a {{risk}}% no-show probability. Consider confirming.', emailSubject: null, emailHtml: null, smsTemplate: null, webhookPayloadTemplate: null, icon: 'user-x', actionUrlTemplate: '/schedule', actionLabel: 'View Schedule', variables: ['clientName', 'time', 'risk'], active: true },

  // Appointments
  { name: 'appointment_booked', category: 'appointment', priority: 'info', channels: ['in_app'], titleTemplate: 'New Appointment Booked', bodyTemplate: '{{clientName}} booked {{service}} on {{date}} at {{time}} with {{provider}}.', emailSubject: null, emailHtml: null, smsTemplate: null, webhookPayloadTemplate: null, icon: 'calendar', actionUrlTemplate: '/schedule', actionLabel: 'View Schedule', variables: ['clientName', 'service', 'date', 'time', 'provider'], active: true },
  { name: 'appointment_cancelled', category: 'appointment', priority: 'info', channels: ['in_app'], titleTemplate: 'Appointment Cancelled', bodyTemplate: '{{clientName}} cancelled their {{service}} appointment on {{date}}.', emailSubject: null, emailHtml: null, smsTemplate: null, webhookPayloadTemplate: null, icon: 'calendar-x', actionUrlTemplate: '/schedule', actionLabel: 'View Schedule', variables: ['clientName', 'service', 'date'], active: true },
  { name: 'appointment_rescheduled', category: 'appointment', priority: 'info', channels: ['in_app'], titleTemplate: 'Appointment Rescheduled', bodyTemplate: '{{clientName}} rescheduled {{service}} from {{oldDate}} to {{newDate}}.', emailSubject: null, emailHtml: null, smsTemplate: null, webhookPayloadTemplate: null, icon: 'calendar', actionUrlTemplate: '/schedule', actionLabel: 'View Schedule', variables: ['clientName', 'service', 'oldDate', 'newDate'], active: true },
  { name: 'appointment_reminder', category: 'appointment', priority: 'info', channels: ['in_app', 'email', 'sms'], titleTemplate: 'Appointment Tomorrow', bodyTemplate: '{{clientName}} has {{service}} tomorrow at {{time}} with {{provider}}.', emailSubject: 'Reminder: {{clientName}} - {{service}} Tomorrow', emailHtml: null, smsTemplate: 'Reminder: {{clientName}} - {{service}} at {{time}} tomorrow with {{provider}}', webhookPayloadTemplate: null, icon: 'bell', actionUrlTemplate: '/schedule', actionLabel: 'View', variables: ['clientName', 'service', 'time', 'provider'], active: true },

  // Client
  { name: 'new_lead', category: 'client', priority: 'info', channels: ['in_app', 'email'], titleTemplate: 'New Lead: {{clientName}}', bodyTemplate: '{{clientName}} submitted a consultation request for {{interest}}. Score: {{score}}.', emailSubject: 'New Lead: {{clientName}}', emailHtml: null, smsTemplate: null, webhookPayloadTemplate: null, icon: 'user-plus', actionUrlTemplate: '/clients/{{clientId}}', actionLabel: 'View Lead', variables: ['clientName', 'clientId', 'interest', 'score'], active: true },
  { name: 'client_milestone', category: 'client', priority: 'info', channels: ['in_app'], titleTemplate: '{{clientName}} Milestone', bodyTemplate: '{{clientName}} reached {{milestone}}: {{description}}.', emailSubject: null, emailHtml: null, smsTemplate: null, webhookPayloadTemplate: null, icon: 'award', actionUrlTemplate: '/clients/{{clientId}}', actionLabel: 'View Client', variables: ['clientName', 'clientId', 'milestone', 'description'], active: true },
  { name: 'client_birthday', category: 'client', priority: 'info', channels: ['in_app'], titleTemplate: 'Birthday: {{clientName}}', bodyTemplate: '{{clientName}} has a birthday on {{date}}. Consider sending a personalized offer.', emailSubject: null, emailHtml: null, smsTemplate: null, webhookPayloadTemplate: null, icon: 'cake', actionUrlTemplate: '/clients/{{clientId}}', actionLabel: 'Send Offer', variables: ['clientName', 'clientId', 'date'], active: true },

  // Reviews
  { name: 'new_review', category: 'review', priority: 'info', channels: ['in_app', 'email'], titleTemplate: 'New {{stars}}-Star Review', bodyTemplate: '{{clientName}} left a {{stars}}-star review: "{{preview}}..."', emailSubject: 'New Review: {{stars}} Stars from {{clientName}}', emailHtml: null, smsTemplate: null, webhookPayloadTemplate: null, icon: 'star', actionUrlTemplate: '/reviews', actionLabel: 'Respond', variables: ['clientName', 'stars', 'preview'], active: true },
  { name: 'negative_review', category: 'review', priority: 'critical', channels: ['in_app', 'email', 'sms'], titleTemplate: 'Negative Review Alert', bodyTemplate: '{{clientName}} left a {{stars}}-star review. Immediate response recommended.', emailSubject: 'URGENT: {{stars}}-Star Review from {{clientName}}', emailHtml: null, smsTemplate: 'RaniOS: {{stars}}-star review from {{clientName}}. Respond: {{actionUrl}}', webhookPayloadTemplate: null, icon: 'alert-triangle', actionUrlTemplate: '/reviews', actionLabel: 'Respond Now', variables: ['clientName', 'stars'], active: true },

  // Inventory
  { name: 'low_stock', category: 'inventory', priority: 'warning', channels: ['in_app', 'email'], titleTemplate: 'Low Stock: {{productName}}', bodyTemplate: '{{productName}} is running low ({{current}}/{{minimum}} units). Reorder recommended.', emailSubject: 'Low Stock Alert: {{productName}}', emailHtml: null, smsTemplate: null, webhookPayloadTemplate: null, icon: 'package', actionUrlTemplate: '/inventory', actionLabel: 'Reorder', variables: ['productName', 'current', 'minimum'], active: true },
  { name: 'expiring_product', category: 'inventory', priority: 'warning', channels: ['in_app'], titleTemplate: 'Expiring: {{productName}}', bodyTemplate: '{{productName}} expires on {{expiryDate}}. {{units}} units remaining.', emailSubject: null, emailHtml: null, smsTemplate: null, webhookPayloadTemplate: null, icon: 'clock', actionUrlTemplate: '/inventory', actionLabel: 'View Inventory', variables: ['productName', 'expiryDate', 'units'], active: true },

  // Schedule
  { name: 'schedule_gap', category: 'schedule', priority: 'info', channels: ['in_app'], titleTemplate: 'Schedule Gap Detected', bodyTemplate: '{{provider}} has a {{duration}} gap on {{date}} from {{startTime}} to {{endTime}}. Revenue potential: ${{potential}}.', emailSubject: null, emailHtml: null, smsTemplate: null, webhookPayloadTemplate: null, icon: 'calendar', actionUrlTemplate: '/schedule-optimizer', actionLabel: 'Optimize', variables: ['provider', 'duration', 'date', 'startTime', 'endTime', 'potential'], active: true },
  { name: 'overtime_alert', category: 'schedule', priority: 'warning', channels: ['in_app'], titleTemplate: 'Overtime: {{provider}}', bodyTemplate: '{{provider}} is scheduled {{hours}} hours this week (limit: {{limit}}h).', emailSubject: null, emailHtml: null, smsTemplate: null, webhookPayloadTemplate: null, icon: 'clock', actionUrlTemplate: '/schedule', actionLabel: 'View Schedule', variables: ['provider', 'hours', 'limit'], active: true },

  // Campaign
  { name: 'campaign_sent', category: 'campaign', priority: 'info', channels: ['in_app'], titleTemplate: 'Campaign Sent: {{campaignName}}', bodyTemplate: '{{campaignName}} was sent to {{recipientCount}} recipients.', emailSubject: null, emailHtml: null, smsTemplate: null, webhookPayloadTemplate: null, icon: 'send', actionUrlTemplate: '/campaigns/{{campaignId}}', actionLabel: 'View Results', variables: ['campaignName', 'campaignId', 'recipientCount'], active: true },
  { name: 'campaign_results', category: 'campaign', priority: 'info', channels: ['in_app', 'email'], titleTemplate: 'Campaign Results: {{campaignName}}', bodyTemplate: '{{campaignName}}: {{openRate}}% open rate, {{clickRate}}% CTR, {{conversions}} conversions.', emailSubject: 'Campaign Results: {{campaignName}}', emailHtml: null, smsTemplate: null, webhookPayloadTemplate: null, icon: 'bar-chart', actionUrlTemplate: '/campaigns/{{campaignId}}', actionLabel: 'Full Report', variables: ['campaignName', 'campaignId', 'openRate', 'clickRate', 'conversions'], active: true },
  { name: 'reactivation_success', category: 'campaign', priority: 'info', channels: ['in_app'], titleTemplate: 'Reactivation Win', bodyTemplate: '{{clientName}} booked after {{daysLapsed}} days. Campaign: {{campaignName}}.', emailSubject: null, emailHtml: null, smsTemplate: null, webhookPayloadTemplate: null, icon: 'refresh-cw', actionUrlTemplate: '/clients/{{clientId}}', actionLabel: 'View Client', variables: ['clientName', 'clientId', 'daysLapsed', 'campaignName'], active: true },

  // Marketing
  { name: 'content_ready', category: 'marketing', priority: 'info', channels: ['in_app'], titleTemplate: 'Content Ready for Review', bodyTemplate: '{{contentCount}} new posts generated for {{platform}}. Review and schedule.', emailSubject: null, emailHtml: null, smsTemplate: null, webhookPayloadTemplate: null, icon: 'edit', actionUrlTemplate: '/social', actionLabel: 'Review Content', variables: ['contentCount', 'platform'], active: true },
  { name: 'ad_performance_alert', category: 'marketing', priority: 'warning', channels: ['in_app', 'email'], titleTemplate: 'Ad Performance Alert', bodyTemplate: '{{campaignName}} CPA increased by {{increase}}% to ${{cpa}}. Creative fatigue likely.', emailSubject: 'Ad Alert: {{campaignName}} Performance Drop', emailHtml: null, smsTemplate: null, webhookPayloadTemplate: null, icon: 'trending-down', actionUrlTemplate: '/meta-ads', actionLabel: 'Optimize Ads', variables: ['campaignName', 'increase', 'cpa'], active: true },
  { name: 'competitor_update', category: 'marketing', priority: 'info', channels: ['in_app'], titleTemplate: 'Competitor Update', bodyTemplate: '{{competitorName}}: {{update}}', emailSubject: null, emailHtml: null, smsTemplate: null, webhookPayloadTemplate: null, icon: 'eye', actionUrlTemplate: '/competitor-intel', actionLabel: 'View Intel', variables: ['competitorName', 'update'], active: true },
];

// ─── Initialize Templates ─────────────────────────────────────────

export function initializeTemplates(): void {
  DEFAULT_TEMPLATES.forEach((tmpl, i) => {
    const id = `tmpl_${tmpl.name}`;
    templates.set(id, { ...tmpl, id });
  });
}

// ─── Send Notification ────────────────────────────────────────────

export function sendNotification(input: SendNotificationInput): Notification[] {
  const sent: Notification[] = [];
  const channels = input.channels || ['in_app'];

  // Apply template if provided
  let title = input.title;
  let body = input.body;
  let icon = input.icon || null;
  let actionUrl = input.actionUrl || null;
  let actionLabel = input.actionLabel || null;

  if (input.templateId) {
    const template = templates.get(input.templateId);
    if (template) {
      title = interpolateTemplate(template.titleTemplate, input.variables || {});
      body = interpolateTemplate(template.bodyTemplate, input.variables || {});
      icon = template.icon;
      if (template.actionUrlTemplate) {
        actionUrl = interpolateTemplate(template.actionUrlTemplate, input.variables || {});
      }
      actionLabel = template.actionLabel;
    }
  }

  // Check user preferences
  const prefsKey = `${input.tenantId}:${input.userId || 'system'}`;
  const userPrefs = preferences.get(prefsKey);

  for (const channel of channels) {
    // Skip if user has disabled this channel
    if (userPrefs && !userPrefs.channels[channel]) continue;

    // SMS only for critical
    if (channel === 'sms' && input.priority !== 'critical') continue;

    // Check quiet hours
    if (userPrefs?.quietHours && channel !== 'sms') {
      if (isInQuietHours(userPrefs.quietHours)) continue;
    }

    // Check digest mode
    if (userPrefs?.digestFrequency !== 'immediate' && channel === 'email' && input.priority !== 'critical') {
      addToDigest(input.tenantId, input.userId || 'system', userPrefs.digestFrequency, {
        id: generateNotifId(),
        tenantId: input.tenantId,
        userId: input.userId || null,
        channel,
        priority: input.priority || 'info',
        category: input.category,
        templateId: input.templateId || null,
        title,
        body,
        actionUrl,
        actionLabel,
        icon,
        metadata: input.metadata || {},
        read: false,
        readAt: null,
        dismissed: false,
        createdAt: Date.now(),
        expiresAt: input.expiresAt || null,
        deliveredAt: null,
        deliveryStatus: 'pending',
        deliveryError: null,
      });
      continue;
    }

    const notification: Notification = {
      id: generateNotifId(),
      tenantId: input.tenantId,
      userId: input.userId || null,
      channel,
      priority: input.priority || 'info',
      category: input.category,
      templateId: input.templateId || null,
      title,
      body,
      actionUrl,
      actionLabel,
      icon,
      metadata: input.metadata || {},
      read: false,
      readAt: null,
      dismissed: false,
      createdAt: Date.now(),
      expiresAt: input.expiresAt || null,
      deliveredAt: Date.now(),
      deliveryStatus: 'delivered',
      deliveryError: null,
    };

    notifications.push(notification);
    sent.push(notification);
  }

  // Keep store manageable
  if (notifications.length > 50_000) {
    notifications.splice(0, notifications.length - 50_000);
  }

  return sent;
}

export function sendFromTemplate(
  templateName: string,
  tenantId: string,
  variables: Record<string, string>,
  userId?: string,
): Notification[] {
  const templateId = `tmpl_${templateName}`;
  const template = templates.get(templateId);
  if (!template) return [];

  return sendNotification({
    tenantId,
    userId,
    templateId,
    channels: template.channels,
    priority: template.priority,
    category: template.category,
    title: template.titleTemplate,
    body: template.bodyTemplate,
    variables,
  });
}

// ─── Notification Queries ─────────────────────────────────────────

export function getNotifications(
  tenantId: string,
  filter?: {
    userId?: string;
    channel?: NotificationChannel;
    category?: NotificationCategory;
    priority?: NotificationPriority;
    read?: boolean;
    limit?: number;
    offset?: number;
  },
): NotificationCenterData {
  let result = notifications.filter(n => n.tenantId === tenantId && n.channel === 'in_app');

  if (filter?.userId) result = result.filter(n => n.userId === filter.userId || n.userId === null);
  if (filter?.category) result = result.filter(n => n.category === filter.category);
  if (filter?.priority) result = result.filter(n => n.priority === filter.priority);
  if (filter?.read !== undefined) result = result.filter(n => n.read === filter.read);

  result.sort((a, b) => b.createdAt - a.createdAt);

  const unreadCount = result.filter(n => !n.read).length;
  const offset = filter?.offset || 0;
  const limit = filter?.limit || 50;
  const paged = result.slice(offset, offset + limit);

  // Category counts
  const catCounts = new Map<NotificationCategory, number>();
  result.filter(n => !n.read).forEach(n => {
    catCounts.set(n.category, (catCounts.get(n.category) || 0) + 1);
  });

  return {
    unreadCount,
    notifications: paged,
    hasMore: offset + limit < result.length,
    categories: Array.from(catCounts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count),
  };
}

export function markAsRead(notificationId: string): boolean {
  const notif = notifications.find(n => n.id === notificationId);
  if (notif) {
    notif.read = true;
    notif.readAt = Date.now();
    return true;
  }
  return false;
}

export function markAllAsRead(tenantId: string, userId?: string): number {
  let count = 0;
  notifications
    .filter(n => n.tenantId === tenantId && !n.read && (userId ? n.userId === userId || n.userId === null : true))
    .forEach(n => {
      n.read = true;
      n.readAt = Date.now();
      count++;
    });
  return count;
}

export function dismissNotification(notificationId: string): boolean {
  const notif = notifications.find(n => n.id === notificationId);
  if (notif) {
    notif.dismissed = true;
    return true;
  }
  return false;
}

// ─── Preferences ──────────────────────────────────────────────────

export function getPreferences(tenantId: string, userId: string): NotificationPreferences {
  const key = `${tenantId}:${userId}`;
  return preferences.get(key) || getDefaultPreferences(tenantId, userId);
}

export function updatePreferences(
  tenantId: string,
  userId: string,
  updates: Partial<NotificationPreferences>,
): NotificationPreferences {
  const key = `${tenantId}:${userId}`;
  const existing = preferences.get(key) || getDefaultPreferences(tenantId, userId);
  const updated = { ...existing, ...updates, updatedAt: Date.now() };
  preferences.set(key, updated);
  return updated;
}

function getDefaultPreferences(tenantId: string, userId: string): NotificationPreferences {
  const allCategories: NotificationCategory[] = [
    'billing', 'usage', 'security', 'system', 'feature', 'marketing',
    'integration', 'ai_insight', 'appointment', 'client', 'review',
    'inventory', 'schedule', 'campaign',
  ];

  const categories = {} as NotificationPreferences['categories'];
  allCategories.forEach(cat => {
    categories[cat] = {
      enabled: true,
      channels: cat === 'security' || cat === 'billing'
        ? ['in_app', 'email']
        : ['in_app'],
    };
  });

  return {
    tenantId,
    userId,
    channels: { in_app: true, email: true, sms: true, webhook: false },
    categories,
    digestFrequency: 'immediate',
    quietHours: null,
    emailAddress: null,
    phoneNumber: null,
    webhookUrl: null,
    updatedAt: Date.now(),
  };
}

// ─── Digest Mode ──────────────────────────────────────────────────

function addToDigest(
  tenantId: string,
  userId: string,
  frequency: DigestFrequency,
  notification: Notification,
): void {
  let entry = digestQueue.find(
    d => d.tenantId === tenantId && d.userId === userId && d.frequency === frequency && !d.sentAt,
  );

  if (!entry) {
    entry = {
      tenantId,
      userId,
      frequency,
      notifications: [],
      scheduledFor: getNextDigestTime(frequency),
      sentAt: null,
    };
    digestQueue.push(entry);
  }

  entry.notifications.push(notification);
}

export function processDigests(): DigestEntry[] {
  const now = Date.now();
  const ready = digestQueue.filter(d => !d.sentAt && d.scheduledFor <= now);

  ready.forEach(d => {
    d.sentAt = now;
    // In production, would send combined email here
  });

  return ready;
}

function getNextDigestTime(frequency: DigestFrequency): number {
  const now = Date.now();
  switch (frequency) {
    case 'hourly': return now + 60 * 60 * 1000;
    case 'daily': return now + 24 * 60 * 60 * 1000;
    case 'weekly': return now + 7 * 24 * 60 * 60 * 1000;
    default: return now;
  }
}

// ─── Utility Functions ────────────────────────────────────────────

function generateNotifId(): string {
  return `notif_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
}

function interpolateTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => variables[key] || match);
}

function isInQuietHours(qh: { start: string; end: string; timezone: string }): boolean {
  const now = new Date();
  const [startH, startM] = qh.start.split(':').map(Number);
  const [endH, endM] = qh.end.split(':').map(Number);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
  // Overnight quiet hours
  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}

// ─── Template Management ──────────────────────────────────────────

export function getTemplate(templateId: string): NotificationTemplate | null {
  return templates.get(templateId) || null;
}

export function getAllTemplates(): NotificationTemplate[] {
  return Array.from(templates.values());
}

export function getTemplatesByCategory(category: NotificationCategory): NotificationTemplate[] {
  return Array.from(templates.values()).filter(t => t.category === category);
}

// ─── Reset (for testing) ──────────────────────────────────────────

export function resetNotifications(): void {
  notifications.length = 0;
  preferences.clear();
  templates.clear();
  digestQueue.length = 0;
}
