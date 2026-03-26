/**
 * Conversation Engine
 *
 * Two-way SMS/email conversation tracking with AI-powered smart replies,
 * auto-categorization, escalation rules, and response time SLA tracking.
 */

import type {
  Conversation,
  ConversationCategory,
  Message,
  MessageChannel,
  MessageDirection,
  SmartReply,
} from '@/types/communications';

// ── Conversation Store (in-memory; production: Airtable) ─────────────

const conversations = new Map<string, Conversation>();

// ── Conversation CRUD ────────────────────────────────────────────────

export function createConversation(params: {
  clientId: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  channel: MessageChannel;
  initialMessage: string;
  direction: MessageDirection;
}): Conversation {
  const id = `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const message: Message = {
    id: messageId,
    clientId: params.clientId,
    clientName: params.clientName,
    channel: params.channel,
    direction: params.direction,
    status: params.direction === 'outbound' ? 'sent' : 'delivered',
    body: params.initialMessage,
    conversationId: id,
    createdAt: now,
    updatedAt: now,
  };

  const category = categorizeMessage(params.initialMessage);

  const conversation: Conversation = {
    id,
    clientId: params.clientId,
    clientName: params.clientName,
    clientPhone: params.clientPhone,
    clientEmail: params.clientEmail,
    channel: params.channel,
    lastMessage: params.initialMessage,
    lastMessageAt: now,
    lastDirection: params.direction,
    unreadCount: params.direction === 'inbound' ? 1 : 0,
    status: 'active',
    category,
    priority: getPriority(category),
    messages: [message],
    createdAt: now,
    updatedAt: now,
  };

  conversations.set(id, conversation);
  return conversation;
}

export function getConversation(id: string): Conversation | null {
  return conversations.get(id) ?? null;
}

export function getConversationByClient(clientId: string): Conversation | null {
  for (const conv of conversations.values()) {
    if (conv.clientId === clientId && conv.status !== 'archived') {
      return conv;
    }
  }
  return null;
}

export function getAllConversations(filters?: {
  status?: Conversation['status'];
  channel?: MessageChannel;
  category?: ConversationCategory;
  unreadOnly?: boolean;
  search?: string;
}): Conversation[] {
  let result = Array.from(conversations.values());

  if (filters?.status) {
    result = result.filter(c => c.status === filters.status);
  }
  if (filters?.channel) {
    result = result.filter(c => c.channel === filters.channel);
  }
  if (filters?.category) {
    result = result.filter(c => c.category === filters.category);
  }
  if (filters?.unreadOnly) {
    result = result.filter(c => c.unreadCount > 0);
  }
  if (filters?.search) {
    const term = filters.search.toLowerCase();
    result = result.filter(
      c =>
        c.clientName.toLowerCase().includes(term) ||
        c.lastMessage.toLowerCase().includes(term) ||
        c.messages.some(m => m.body.toLowerCase().includes(term))
    );
  }

  return result.sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );
}

// ── Add Message to Conversation ──────────────────────────────────────

export function addMessageToConversation(
  conversationId: string,
  params: {
    body: string;
    direction: MessageDirection;
    channel?: MessageChannel;
    subject?: string;
  }
): Message | null {
  const conv = conversations.get(conversationId);
  if (!conv) return null;

  const now = new Date().toISOString();
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const message: Message = {
    id: messageId,
    clientId: conv.clientId,
    clientName: conv.clientName,
    channel: params.channel ?? conv.channel,
    direction: params.direction,
    status: params.direction === 'outbound' ? 'sent' : 'delivered',
    subject: params.subject,
    body: params.body,
    conversationId,
    createdAt: now,
    updatedAt: now,
  };

  conv.messages.push(message);
  conv.lastMessage = params.body;
  conv.lastMessageAt = now;
  conv.lastDirection = params.direction;
  conv.updatedAt = now;

  if (params.direction === 'inbound') {
    conv.unreadCount++;
    // Re-categorize based on latest message
    conv.category = categorizeMessage(params.body);
    conv.priority = getPriority(conv.category);
  }

  return message;
}

// ── Mark as Read ─────────────────────────────────────────────────────

export function markConversationRead(conversationId: string): void {
  const conv = conversations.get(conversationId);
  if (conv) {
    conv.unreadCount = 0;
    conv.updatedAt = new Date().toISOString();
  }
}

// ── Update Status ────────────────────────────────────────────────────

export function updateConversationStatus(
  conversationId: string,
  status: Conversation['status']
): void {
  const conv = conversations.get(conversationId);
  if (conv) {
    conv.status = status;
    conv.updatedAt = new Date().toISOString();
  }
}

// ── Assign Conversation ──────────────────────────────────────────────

export function assignConversation(
  conversationId: string,
  assignedTo: string
): void {
  const conv = conversations.get(conversationId);
  if (conv) {
    conv.assignedTo = assignedTo;
    conv.updatedAt = new Date().toISOString();
  }
}

// ── Auto-Categorization ──────────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<ConversationCategory, string[]> = {
  booking_request: [
    'book', 'appointment', 'schedule', 'available', 'opening',
    'slot', 'reserve', 'when can', 'next available', 'reschedule',
  ],
  question: [
    'how much', 'cost', 'price', 'what is', 'how does', 'how long',
    'do you offer', 'tell me about', 'information', 'details',
  ],
  complaint: [
    'unhappy', 'disappointed', 'terrible', 'worst', 'refund',
    'not satisfied', 'complaint', 'issue', 'problem', 'wrong',
  ],
  feedback: [
    'thank you', 'amazing', 'love', 'great', 'wonderful',
    'recommend', 'best', 'happy', 'satisfied', 'excellent',
  ],
  emergency: [
    'emergency', 'urgent', 'allergic', 'reaction', 'swelling',
    'infection', 'bleeding', 'severe', 'pain', 'help immediately',
  ],
  general: [],
  follow_up: [
    'follow up', 'checking in', 'any update', 'status',
    'heard back', 'still waiting',
  ],
  reactivation: [
    'come back', 'return', 'been a while', 'miss',
  ],
};

export function categorizeMessage(text: string): ConversationCategory {
  const lower = text.toLowerCase();

  // Emergency takes priority
  if (CATEGORY_KEYWORDS.emergency.some(kw => lower.includes(kw))) {
    return 'emergency';
  }

  // Check each category
  const scores: Record<ConversationCategory, number> = {
    booking_request: 0,
    question: 0,
    complaint: 0,
    feedback: 0,
    emergency: 0,
    general: 0,
    follow_up: 0,
    reactivation: 0,
  };

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        scores[category as ConversationCategory]++;
      }
    }
  }

  let maxCategory: ConversationCategory = 'general';
  let maxScore = 0;

  for (const [category, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxCategory = category as ConversationCategory;
    }
  }

  return maxCategory;
}

function getPriority(category: ConversationCategory): Conversation['priority'] {
  switch (category) {
    case 'emergency':
      return 'urgent';
    case 'complaint':
      return 'high';
    case 'booking_request':
      return 'normal';
    default:
      return 'low';
  }
}

// ── Smart Reply Suggestions ──────────────────────────────────────────

const SMART_REPLY_TEMPLATES: Record<ConversationCategory, SmartReply[]> = {
  booking_request: [
    {
      id: 'sr_book_1',
      text: 'We would love to get you scheduled! Our next available opening is {{nextAvailable}}. Would that work for you?',
      confidence: 0.9,
      category: 'booking_request',
      requiresReview: false,
    },
    {
      id: 'sr_book_2',
      text: 'You can book directly through our online scheduling at ranibeautyclinic.com, or I can help find a time that works best for you.',
      confidence: 0.85,
      category: 'booking_request',
      requiresReview: false,
    },
    {
      id: 'sr_book_3',
      text: 'I have some openings this week. What day and time works best for you?',
      confidence: 0.8,
      category: 'booking_request',
      requiresReview: false,
    },
  ],
  question: [
    {
      id: 'sr_q_1',
      text: 'Great question! I would be happy to provide more details. Could you let me know which specific treatment you are interested in?',
      confidence: 0.85,
      category: 'question',
      requiresReview: false,
    },
    {
      id: 'sr_q_2',
      text: 'For the most personalized recommendation, we suggest scheduling a complimentary consultation. Would you like me to set one up?',
      confidence: 0.8,
      category: 'question',
      requiresReview: false,
    },
  ],
  complaint: [
    {
      id: 'sr_comp_1',
      text: 'I sincerely apologize for your experience. Your satisfaction is our top priority. I am escalating this to our clinic manager right away.',
      confidence: 0.9,
      category: 'complaint',
      requiresReview: true,
    },
    {
      id: 'sr_comp_2',
      text: 'I am sorry to hear that. Can we schedule a follow-up appointment at no charge to address your concerns?',
      confidence: 0.85,
      category: 'complaint',
      requiresReview: true,
    },
  ],
  feedback: [
    {
      id: 'sr_fb_1',
      text: 'Thank you so much for your kind words! We are thrilled you had a wonderful experience. Would you mind sharing a review on Google?',
      confidence: 0.9,
      category: 'feedback',
      requiresReview: false,
    },
  ],
  emergency: [
    {
      id: 'sr_emerg_1',
      text: 'This sounds urgent. Please call our clinic immediately at (425) 999-8888. If you are experiencing a medical emergency, call 911.',
      confidence: 0.95,
      category: 'emergency',
      requiresReview: true,
    },
  ],
  general: [
    {
      id: 'sr_gen_1',
      text: 'Thank you for reaching out to Rani Beauty Clinic! How can I help you today?',
      confidence: 0.7,
      category: 'general',
      requiresReview: false,
    },
  ],
  follow_up: [
    {
      id: 'sr_fu_1',
      text: 'Thank you for following up! Let me check on this for you and get back to you shortly.',
      confidence: 0.85,
      category: 'follow_up',
      requiresReview: false,
    },
  ],
  reactivation: [
    {
      id: 'sr_react_1',
      text: 'We have missed you! We have some exciting new treatments and would love to help you continue your transformation journey. When can we see you next?',
      confidence: 0.85,
      category: 'reactivation',
      requiresReview: false,
    },
  ],
};

export function getSmartReplies(
  conversation: Conversation
): SmartReply[] {
  const category = conversation.category ?? 'general';
  return SMART_REPLY_TEMPLATES[category] ?? SMART_REPLY_TEMPLATES.general;
}

// ── Escalation Rules ─────────────────────────────────────────────────

export interface EscalationRule {
  category: ConversationCategory;
  autoEscalate: boolean;
  escalateTo: string;
  maxResponseTimeMinutes: number;
}

const ESCALATION_RULES: EscalationRule[] = [
  { category: 'emergency', autoEscalate: true, escalateTo: 'provider', maxResponseTimeMinutes: 5 },
  { category: 'complaint', autoEscalate: true, escalateTo: 'manager', maxResponseTimeMinutes: 30 },
  { category: 'booking_request', autoEscalate: false, escalateTo: 'frontdesk', maxResponseTimeMinutes: 60 },
  { category: 'question', autoEscalate: false, escalateTo: 'frontdesk', maxResponseTimeMinutes: 120 },
  { category: 'feedback', autoEscalate: false, escalateTo: 'frontdesk', maxResponseTimeMinutes: 240 },
];

export function getEscalationRule(category: ConversationCategory): EscalationRule | null {
  return ESCALATION_RULES.find(r => r.category === category) ?? null;
}

export function checkSLA(conversation: Conversation): {
  withinSLA: boolean;
  minutesElapsed: number;
  maxMinutes: number;
  urgency: 'ok' | 'warning' | 'critical';
} {
  const rule = getEscalationRule(conversation.category ?? 'general');
  if (!rule) {
    return { withinSLA: true, minutesElapsed: 0, maxMinutes: 999, urgency: 'ok' };
  }

  // Find last inbound message that hasn't been replied to
  const lastInbound = [...conversation.messages]
    .reverse()
    .find(m => m.direction === 'inbound');

  if (!lastInbound) {
    return { withinSLA: true, minutesElapsed: 0, maxMinutes: rule.maxResponseTimeMinutes, urgency: 'ok' };
  }

  // Check if there's an outbound message after the last inbound
  const lastInboundTime = new Date(lastInbound.createdAt).getTime();
  const hasReply = conversation.messages.some(
    m => m.direction === 'outbound' && new Date(m.createdAt).getTime() > lastInboundTime
  );

  if (hasReply) {
    return { withinSLA: true, minutesElapsed: 0, maxMinutes: rule.maxResponseTimeMinutes, urgency: 'ok' };
  }

  const minutesElapsed = Math.floor((Date.now() - lastInboundTime) / 60000);
  const withinSLA = minutesElapsed <= rule.maxResponseTimeMinutes;
  const urgency =
    minutesElapsed > rule.maxResponseTimeMinutes
      ? 'critical'
      : minutesElapsed > rule.maxResponseTimeMinutes * 0.75
        ? 'warning'
        : 'ok';

  return {
    withinSLA,
    minutesElapsed,
    maxMinutes: rule.maxResponseTimeMinutes,
    urgency,
  };
}

// ── Response Time Analytics ──────────────────────────────────────────

export function calculateResponseTimes(conversations: Conversation[]): {
  avgResponseMinutes: number;
  medianResponseMinutes: number;
  slaComplianceRate: number;
  totalConversations: number;
} {
  const responseTimes: number[] = [];
  let slaCompliant = 0;
  let totalChecked = 0;

  for (const conv of conversations) {
    for (let i = 0; i < conv.messages.length; i++) {
      const msg = conv.messages[i];
      if (msg.direction === 'inbound') {
        // Find next outbound message
        const reply = conv.messages
          .slice(i + 1)
          .find(m => m.direction === 'outbound');

        if (reply) {
          const responseTime =
            (new Date(reply.createdAt).getTime() - new Date(msg.createdAt).getTime()) / 60000;
          responseTimes.push(responseTime);

          const rule = getEscalationRule(conv.category ?? 'general');
          totalChecked++;
          if (rule && responseTime <= rule.maxResponseTimeMinutes) {
            slaCompliant++;
          } else if (!rule) {
            slaCompliant++;
          }
        }
      }
    }
  }

  if (responseTimes.length === 0) {
    return {
      avgResponseMinutes: 0,
      medianResponseMinutes: 0,
      slaComplianceRate: 100,
      totalConversations: conversations.length,
    };
  }

  const sorted = responseTimes.sort((a, b) => a - b);
  const avg = responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length;
  const median = sorted[Math.floor(sorted.length / 2)];

  return {
    avgResponseMinutes: Math.round(avg),
    medianResponseMinutes: Math.round(median),
    slaComplianceRate: totalChecked > 0 ? (slaCompliant / totalChecked) * 100 : 100,
    totalConversations: conversations.length,
  };
}

// ── Conversation Stats ───────────────────────────────────────────────

export function getConversationStats(): {
  total: number;
  active: number;
  unread: number;
  escalated: number;
  avgResponseMinutes: number;
  byCategory: Record<ConversationCategory, number>;
  byChannel: Record<MessageChannel, number>;
} {
  const all = Array.from(conversations.values());

  const byCategory: Record<ConversationCategory, number> = {
    booking_request: 0,
    question: 0,
    complaint: 0,
    feedback: 0,
    emergency: 0,
    general: 0,
    follow_up: 0,
    reactivation: 0,
  };

  const byChannel: Record<MessageChannel, number> = { sms: 0, email: 0 };

  let active = 0;
  let unread = 0;
  let escalated = 0;

  for (const conv of all) {
    if (conv.status === 'active') active++;
    if (conv.unreadCount > 0) unread++;
    if (conv.status === 'escalated') escalated++;
    if (conv.category) byCategory[conv.category]++;
    byChannel[conv.channel]++;
  }

  const { avgResponseMinutes } = calculateResponseTimes(all);

  return {
    total: all.length,
    active,
    unread,
    escalated,
    avgResponseMinutes,
    byCategory,
    byChannel,
  };
}
