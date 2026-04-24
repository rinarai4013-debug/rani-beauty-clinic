/**
 * RaniOS Tenant Dashboard — Communications Module Types
 */

export interface InboxSummary {
  total: number;
  unread: number;
  urgent: number;
  channels: { channel: string; count: number }[];
}

export interface MessageTemplate {
  id: string;
  name: string;
  channel: string;
  subject?: string;
  body: string;
  variables: string[];
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  recentReviews: { id: string; rating: number; text: string; date: string; source: string }[];
  ratingDistribution: Record<number, number>;
}

type TenantConfigLike = {
  usage: {
    smsSent: number;
    emailsSent: number;
  };
};

type TenantDbLike = {
  createRecord: (_tableName: string, _fields: Record<string, unknown>) => Promise<string>;
  fetchAll: (_tableName: string) => Promise<Array<{ id: string; fields: Record<string, unknown> }>>;
};

const SYSTEM_TEMPLATES = [
  { id: 'tpl-appt-confirm', name: 'Appointment Confirmation', category: 'appointment_confirmation', channel: 'sms', body: 'Hi {{clientName}}, your {{service}} appointment is confirmed for {{appointmentDate}}.', variables: ['clientName', 'service', 'appointmentDate'], isSystem: true },
  { id: 'tpl-appt-reminder-sms', name: 'Appointment Reminder SMS', category: 'appointment_reminder', channel: 'sms', body: 'Hi {{clientName}}, reminder for your {{service}} appointment at {{appointmentTime}}.', variables: ['clientName', 'service', 'appointmentTime'], isSystem: true },
  { id: 'tpl-appt-reminder-email', name: 'Appointment Reminder Email', category: 'appointment_reminder', channel: 'email', body: 'Hello {{clientName}}, this is your reminder for {{service}} on {{appointmentDate}}.', variables: ['clientName', 'service', 'appointmentDate'], isSystem: true },
  { id: 'tpl-post-treatment-1', name: 'Post Treatment Check-In', category: 'post_treatment', channel: 'sms', body: 'Hi {{clientName}}, checking in after your {{service}}. Reply with any questions.', variables: ['clientName', 'service'], isSystem: true },
  { id: 'tpl-post-treatment-2', name: 'Post Treatment Care', category: 'post_treatment', channel: 'email', body: 'Hi {{clientName}}, here is your aftercare plan for {{service}}.', variables: ['clientName', 'service'], isSystem: true },
  { id: 'tpl-reactivation-sms', name: 'Reactivation SMS', category: 'reactivation', channel: 'sms', body: 'Hi {{clientName}}, we miss you at the clinic. Want to come back for {{service}}?', variables: ['clientName', 'service'], isSystem: true },
  { id: 'tpl-reactivation-email', name: 'Reactivation Email', category: 'reactivation', channel: 'email', body: 'Hi {{clientName}}, let’s get you back in for {{service}}.', variables: ['clientName', 'service'], isSystem: true },
  { id: 'tpl-review-request', name: 'Review Request', category: 'review_request', channel: 'sms', body: 'Hi {{clientName}}, if you loved your {{service}}, would you leave us a review?', variables: ['clientName', 'service'], isSystem: true },
  { id: 'tpl-birthday-sms', name: 'Birthday SMS', category: 'birthday', channel: 'sms', body: 'Happy birthday {{clientName}}! Enjoy a little clinic gift from us.', variables: ['clientName'], isSystem: true },
  { id: 'tpl-birthday-email', name: 'Birthday Email', category: 'birthday', channel: 'email', body: 'Happy birthday {{clientName}}. We saved a special offer for you.', variables: ['clientName'], isSystem: true },
  { id: 'tpl-membership-renewal', name: 'Membership Renewal', category: 'membership', channel: 'email', body: 'Hi {{clientName}}, your membership renews soon.', variables: ['clientName'], isSystem: true },
  { id: 'tpl-no-show-followup', name: 'No Show Follow-Up', category: 'appointment_reminder', channel: 'sms', body: 'Hi {{clientName}}, we missed you for {{service}}. Want help rescheduling?', variables: ['clientName', 'service'], isSystem: true },
] as const;

const DEFAULT_AUTOMATIONS = [
  { id: 'auto_appt_booked', name: 'Appointment Confirmation', trigger: 'appointment_booked', enabled: true, actions: ['send_confirmation'], stats: { triggered: 0, sent: 0 } },
  { id: 'auto_appt_reminder', name: 'Appointment Reminder', trigger: 'appointment_booked', enabled: true, actions: ['send_reminder'], stats: { triggered: 0, sent: 0 } },
  { id: 'auto_post_treatment', name: 'Post Treatment Check-In', trigger: 'appointment_completed', enabled: true, actions: ['send_followup'], stats: { triggered: 0, sent: 0 } },
  { id: 'auto_no_show', name: 'No Show Recovery', trigger: 'no_show', enabled: true, actions: ['send_reschedule'], stats: { triggered: 0, sent: 0 } },
  { id: 'auto_new_client', name: 'New Client Welcome', trigger: 'new_client', enabled: true, actions: ['send_welcome'], stats: { triggered: 0, sent: 0 } },
  { id: 'auto_churn_risk', name: 'Churn Risk Outreach', trigger: 'churn_risk', enabled: true, actions: ['send_reactivation'], stats: { triggered: 0, sent: 0 } },
  { id: 'auto_review_request', name: 'Review Request', trigger: 'appointment_completed', enabled: true, actions: ['request_review'], stats: { triggered: 0, sent: 0 } },
] as const;

function interpolate(body: string, variables?: Record<string, string>) {
  return body.replace(/\{\{(\w+)\}\}/g, (_, key: string) => variables?.[key] ?? '');
}

export async function sendMessage(
  db: TenantDbLike,
  tenant: TenantConfigLike,
  input: {
    channel: 'sms' | 'email';
    to: string;
    subject?: string;
    body: string;
    variables?: Record<string, string>;
  }
) {
  if (input.channel === 'sms' && tenant.usage.smsSent >= 500) {
    throw new Error('SMS limit reached');
  }
  if (input.channel === 'email' && tenant.usage.emailsSent >= 2000) {
    throw new Error('Email limit reached');
  }

  const renderedBody = interpolate(input.body, input.variables);
  const id = await db.createRecord('Messages Log', {
    Type: input.channel,
    Direction: 'outbound',
    Subject: input.subject ?? '',
    Preview: renderedBody.slice(0, 160),
    Status: 'sent',
    Date: new Date().toISOString(),
  });

  return {
    id,
    channel: input.channel,
    status: 'sent',
    cost: input.channel === 'sms' ? 0.05 : 0.01,
    sentAt: new Date().toISOString(),
  };
}

export function getSystemTemplates() {
  return SYSTEM_TEMPLATES.map((template) => ({ ...template }));
}

export function getDefaultAutomations() {
  return DEFAULT_AUTOMATIONS.map((automation) => ({
    ...automation,
    actions: [...automation.actions],
    stats: { ...automation.stats },
  }));
}

export async function getInbox(db: TenantDbLike) {
  const messages = await db.fetchAll('Messages Log');
  const conversationMap = new Map<string, {
    clientEmail: string;
    clientName: string;
    messages: Array<Record<string, unknown>>;
    unread: number;
    lastMessageAt: string;
  }>();

  messages.forEach((record) => {
    const email = String(record.fields['Client Email'] ?? 'unknown');
    const clientName = String(record.fields['Client Name'] ?? 'Unknown');
    const current = conversationMap.get(email) ?? {
      clientEmail: email,
      clientName,
      messages: [],
      unread: 0,
      lastMessageAt: String(record.fields.Date ?? ''),
    };
    current.messages.push(record.fields);
    if (String(record.fields.Direction ?? '') === 'inbound') current.unread += 1;
    if (String(record.fields.Date ?? '') > current.lastMessageAt) current.lastMessageAt = String(record.fields.Date ?? '');
    conversationMap.set(email, current);
  });

  const conversations = [...conversationMap.values()]
    .map((conversation) => ({
      ...conversation,
      open: conversation.unread > 0,
    }))
    .sort((left, right) => (left.lastMessageAt < right.lastMessageAt ? 1 : -1));

  return {
    conversations,
    totalOpen: conversations.filter((conversation) => conversation.open).length,
    totalUnread: conversations.reduce((sum, conversation) => sum + conversation.unread, 0),
    avgResponseTime: 60,
  };
}

export async function getReviewSummary(db: TenantDbLike) {
  const reviews = await db.fetchAll('Reviews');
  const mapped = reviews.map((review) => {
    const rating = Number(review.fields.Rating ?? review.fields['Star Rating'] ?? 0);
    const responded = Boolean(review.fields.Response);
    return {
      id: review.id,
      rating,
      text: String(review.fields.Text ?? review.fields['Review Text'] ?? ''),
      clientName: String(review.fields['Client Name'] ?? ''),
      source: String(review.fields.Platform ?? 'unknown'),
      date: String(review.fields.Date ?? review.fields['Review Date'] ?? new Date().toISOString()),
      status: responded ? 'responded' : 'new',
      suggestedResponse: responded ? undefined : `Hi ${String(review.fields['Client Name'] ?? 'there')}, thank you for sharing your feedback with us.`,
    };
  });

  const totalReviews = mapped.length;
  const avgRating = totalReviews === 0 ? 0 : mapped.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
  const ratingDistribution = mapped.reduce<Record<number, number>>((acc, review) => {
    acc[review.rating] = (acc[review.rating] ?? 0) + 1;
    return acc;
  }, {});

  return {
    reviews: mapped,
    avgRating,
    averageRating: avgRating,
    totalReviews,
    ratingDistribution,
    responseRate: totalReviews === 0 ? 0 : (mapped.filter((review) => review.status === 'responded').length / totalReviews) * 100,
    sentimentBreakdown: {
      positive: mapped.filter((review) => review.rating >= 4).length,
      neutral: mapped.filter((review) => review.rating === 3).length,
      negative: mapped.filter((review) => review.rating <= 2).length,
    },
    recentTrend: 'stable',
    recentReviews: mapped.slice(0, 5).map((review) => ({
      id: review.id,
      rating: review.rating,
      text: review.text,
      date: review.date,
      source: review.source,
    })),
  };
}
