/**
 * Conversation Engine Tests
 * Tests for conversation CRUD, auto-categorization, smart replies,
 * escalation rules, SLA tracking, and response time analytics.
 */

import {
  createConversation,
  getConversation,
  getConversationByClient,
  getAllConversations,
  addMessageToConversation,
  markConversationRead,
  updateConversationStatus,
  assignConversation,
  categorizeMessage,
  getSmartReplies,
  getEscalationRule,
  checkSLA,
  calculateResponseTimes,
  getConversationStats,
} from '../conversation-engine';
import type { Conversation } from '@/types/communications';

// ── Tests ────────────────────────────────────────────────────────────

describe('Conversation Engine', () => {
  // ── Conversation CRUD ──────────────────────────────────────────

  describe('Conversation CRUD', () => {
    test('creates a conversation with initial message', () => {
      const conv = createConversation({
        clientId: 'client_conv_1',
        clientName: 'Sarah Johnson',
        clientPhone: '+12065551234',
        channel: 'sms',
        initialMessage: 'Hi, I want to book an appointment',
        direction: 'inbound',
      });

      expect(conv.id).toMatch(/^conv_/);
      expect(conv.clientName).toBe('Sarah Johnson');
      expect(conv.channel).toBe('sms');
      expect(conv.messages.length).toBe(1);
      expect(conv.unreadCount).toBe(1);
      expect(conv.status).toBe('active');
    });

    test('creates outbound conversation with zero unread', () => {
      const conv = createConversation({
        clientId: 'client_conv_2',
        clientName: 'Maria Lopez',
        clientEmail: 'maria@example.com',
        channel: 'email',
        initialMessage: 'Your appointment is confirmed',
        direction: 'outbound',
      });

      expect(conv.unreadCount).toBe(0);
      expect(conv.lastDirection).toBe('outbound');
    });

    test('retrieves conversation by ID', () => {
      const created = createConversation({
        clientId: 'client_conv_3',
        clientName: 'Test Client',
        channel: 'sms',
        initialMessage: 'Test message',
        direction: 'inbound',
      });

      const found = getConversation(created.id);
      expect(found).not.toBeNull();
      expect(found?.clientName).toBe('Test Client');
    });

    test('retrieves conversation by client ID', () => {
      createConversation({
        clientId: 'client_lookup_1',
        clientName: 'Lookup Client',
        channel: 'sms',
        initialMessage: 'Hello',
        direction: 'inbound',
      });

      const found = getConversationByClient('client_lookup_1');
      expect(found).not.toBeNull();
      expect(found?.clientId).toBe('client_lookup_1');
    });

    test('returns null for non-existent conversation', () => {
      const found = getConversation('nonexistent');
      expect(found).toBeNull();
    });
  });

  // ── Message Threading ──────────────────────────────────────────

  describe('Message Threading', () => {
    test('adds message to conversation', () => {
      const conv = createConversation({
        clientId: 'client_thread_1',
        clientName: 'Thread Client',
        channel: 'sms',
        initialMessage: 'Hi!',
        direction: 'inbound',
      });

      const msg = addMessageToConversation(conv.id, {
        body: 'Hello! How can I help?',
        direction: 'outbound',
      });

      expect(msg).not.toBeNull();
      expect(msg?.direction).toBe('outbound');

      const updated = getConversation(conv.id);
      expect(updated?.messages.length).toBe(2);
      expect(updated?.lastMessage).toBe('Hello! How can I help?');
    });

    test('increments unread count for inbound messages', () => {
      const conv = createConversation({
        clientId: 'client_unread_1',
        clientName: 'Unread Client',
        channel: 'sms',
        initialMessage: 'First message',
        direction: 'inbound',
      });

      addMessageToConversation(conv.id, {
        body: 'Second message',
        direction: 'inbound',
      });

      const updated = getConversation(conv.id);
      expect(updated?.unreadCount).toBe(2);
    });

    test('marks conversation as read', () => {
      const conv = createConversation({
        clientId: 'client_read_1',
        clientName: 'Read Client',
        channel: 'sms',
        initialMessage: 'Message',
        direction: 'inbound',
      });

      markConversationRead(conv.id);

      const updated = getConversation(conv.id);
      expect(updated?.unreadCount).toBe(0);
    });

    test('returns null when adding to non-existent conversation', () => {
      const msg = addMessageToConversation('nonexistent', {
        body: 'Test',
        direction: 'outbound',
      });
      expect(msg).toBeNull();
    });
  });

  // ── Status Management ──────────────────────────────────────────

  describe('Status Management', () => {
    test('updates conversation status', () => {
      const conv = createConversation({
        clientId: 'client_status_1',
        clientName: 'Status Client',
        channel: 'sms',
        initialMessage: 'Help',
        direction: 'inbound',
      });

      updateConversationStatus(conv.id, 'resolved');

      const updated = getConversation(conv.id);
      expect(updated?.status).toBe('resolved');
    });

    test('assigns conversation to staff member', () => {
      const conv = createConversation({
        clientId: 'client_assign_1',
        clientName: 'Assign Client',
        channel: 'sms',
        initialMessage: 'Need help',
        direction: 'inbound',
      });

      assignConversation(conv.id, 'Dr. Rina');

      const updated = getConversation(conv.id);
      expect(updated?.assignedTo).toBe('Dr. Rina');
    });
  });

  // ── Filtering ──────────────────────────────────────────────────

  describe('Filtering', () => {
    test('filters by status', () => {
      createConversation({
        clientId: 'filter_status_active',
        clientName: 'Active Client',
        channel: 'sms',
        initialMessage: 'Active',
        direction: 'inbound',
      });

      const active = getAllConversations({ status: 'active' });
      expect(active.every(c => c.status === 'active')).toBe(true);
    });

    test('filters by channel', () => {
      const sms = getAllConversations({ channel: 'sms' });
      expect(sms.every(c => c.channel === 'sms')).toBe(true);
    });

    test('filters by unread only', () => {
      const unread = getAllConversations({ unreadOnly: true });
      expect(unread.every(c => c.unreadCount > 0)).toBe(true);
    });

    test('filters by search term', () => {
      createConversation({
        clientId: 'search_test_1',
        clientName: 'Unique Searchable Name',
        channel: 'sms',
        initialMessage: 'Hello',
        direction: 'inbound',
      });

      const results = getAllConversations({ search: 'Unique Searchable' });
      expect(results.length).toBeGreaterThan(0);
    });

    test('sorts by most recent first', () => {
      const all = getAllConversations();
      if (all.length > 1) {
        const first = new Date(all[0].lastMessageAt).getTime();
        const second = new Date(all[1].lastMessageAt).getTime();
        expect(first).toBeGreaterThanOrEqual(second);
      }
    });
  });

  // ── Auto-Categorization ────────────────────────────────────────

  describe('Auto-Categorization', () => {
    test('categorizes booking requests', () => {
      expect(categorizeMessage('I want to book an appointment')).toBe('booking_request');
      expect(categorizeMessage('When is the next available slot?')).toBe('booking_request');
      expect(categorizeMessage('Can I schedule a consultation?')).toBe('booking_request');
    });

    test('categorizes questions', () => {
      expect(categorizeMessage('How much does a HydraFacial cost?')).toBe('question');
      expect(categorizeMessage('What is the price of Botox?')).toBe('question');
    });

    test('categorizes complaints', () => {
      expect(categorizeMessage('I am very unhappy with my treatment')).toBe('complaint');
      expect(categorizeMessage('I want a refund for the terrible service')).toBe('complaint');
    });

    test('categorizes feedback', () => {
      expect(categorizeMessage('Thank you so much, amazing results!')).toBe('feedback');
      expect(categorizeMessage('I love my results, you guys are the best!')).toBe('feedback');
    });

    test('categorizes emergencies', () => {
      expect(categorizeMessage('I am having an allergic reaction')).toBe('emergency');
      expect(categorizeMessage('Emergency: severe swelling after treatment')).toBe('emergency');
    });

    test('categorizes follow-ups', () => {
      expect(categorizeMessage('Just checking in on my follow up')).toBe('follow_up');
      expect(categorizeMessage('Any update on my status?')).toBe('follow_up');
    });

    test('defaults to general for unclassifiable messages', () => {
      expect(categorizeMessage('Hello there')).toBe('general');
      expect(categorizeMessage('OK')).toBe('general');
    });

    test('emergency takes priority over other categories', () => {
      expect(categorizeMessage('I am unhappy because I am having a severe allergic reaction')).toBe('emergency');
    });
  });

  // ── Smart Replies ──────────────────────────────────────────────

  describe('Smart Replies', () => {
    test('returns smart replies for booking requests', () => {
      const conv = createConversation({
        clientId: 'smart_reply_1',
        clientName: 'Smart Reply Client',
        channel: 'sms',
        initialMessage: 'I want to book an appointment',
        direction: 'inbound',
      });

      const replies = getSmartReplies(conv);
      expect(replies.length).toBeGreaterThan(0);
      expect(replies[0].category).toBe('booking_request');
    });

    test('returns smart replies for complaints', () => {
      const conv = createConversation({
        clientId: 'smart_reply_2',
        clientName: 'Complaint Client',
        channel: 'sms',
        initialMessage: 'I am very unhappy with the results',
        direction: 'inbound',
      });

      const replies = getSmartReplies(conv);
      expect(replies.length).toBeGreaterThan(0);
      expect(replies.some(r => r.requiresReview)).toBe(true);
    });

    test('returns smart replies for emergencies', () => {
      const conv = createConversation({
        clientId: 'smart_reply_3',
        clientName: 'Emergency Client',
        channel: 'sms',
        initialMessage: 'I am having an allergic reaction',
        direction: 'inbound',
      });

      const replies = getSmartReplies(conv);
      expect(replies.length).toBeGreaterThan(0);
      expect(replies[0].requiresReview).toBe(true);
    });

    test('all smart replies have confidence scores', () => {
      const conv = createConversation({
        clientId: 'smart_reply_4',
        clientName: 'General Client',
        channel: 'sms',
        initialMessage: 'Hello',
        direction: 'inbound',
      });

      const replies = getSmartReplies(conv);
      for (const reply of replies) {
        expect(reply.confidence).toBeGreaterThanOrEqual(0);
        expect(reply.confidence).toBeLessThanOrEqual(1);
      }
    });
  });

  // ── Escalation Rules ───────────────────────────────────────────

  describe('Escalation Rules', () => {
    test('returns escalation rule for emergency', () => {
      const rule = getEscalationRule('emergency');
      expect(rule).not.toBeNull();
      expect(rule?.autoEscalate).toBe(true);
      expect(rule?.escalateTo).toBe('provider');
      expect(rule?.maxResponseTimeMinutes).toBe(5);
    });

    test('returns escalation rule for complaint', () => {
      const rule = getEscalationRule('complaint');
      expect(rule).not.toBeNull();
      expect(rule?.autoEscalate).toBe(true);
      expect(rule?.escalateTo).toBe('manager');
    });

    test('returns null for unknown category', () => {
      const rule = getEscalationRule('general');
      expect(rule).toBeNull();
    });
  });

  // ── SLA Tracking ───────────────────────────────────────────────

  describe('SLA Tracking', () => {
    test('reports within SLA for replied conversations', () => {
      const conv = createConversation({
        clientId: 'sla_1',
        clientName: 'SLA Client',
        channel: 'sms',
        initialMessage: 'I want to book',
        direction: 'inbound',
      });

      // Add a reply
      addMessageToConversation(conv.id, {
        body: 'Sure! When works for you?',
        direction: 'outbound',
      });

      const updated = getConversation(conv.id)!;
      const sla = checkSLA(updated);
      expect(sla.withinSLA).toBe(true);
    });

    test('reports SLA status correctly for no-reply conversations', () => {
      const conv = createConversation({
        clientId: 'sla_2',
        clientName: 'Waiting Client',
        channel: 'sms',
        initialMessage: 'Hello?',
        direction: 'inbound',
      });

      const updated = getConversation(conv.id)!;
      const sla = checkSLA(updated);
      // Just created so should be within SLA
      expect(sla.minutesElapsed).toBeDefined();
      expect(typeof sla.withinSLA).toBe('boolean');
    });

    test('returns OK for conversations with no inbound messages', () => {
      const conv = createConversation({
        clientId: 'sla_3',
        clientName: 'Outbound Only',
        channel: 'sms',
        initialMessage: 'Your appointment is confirmed',
        direction: 'outbound',
      });

      const updated = getConversation(conv.id)!;
      const sla = checkSLA(updated);
      expect(sla.withinSLA).toBe(true);
      expect(sla.urgency).toBe('ok');
    });
  });

  // ── Response Time Analytics ────────────────────────────────────

  describe('Response Time Analytics', () => {
    test('calculates response times', () => {
      const stats = calculateResponseTimes(getAllConversations());
      expect(typeof stats.avgResponseMinutes).toBe('number');
      expect(typeof stats.medianResponseMinutes).toBe('number');
      expect(typeof stats.slaComplianceRate).toBe('number');
      expect(stats.slaComplianceRate).toBeGreaterThanOrEqual(0);
      expect(stats.slaComplianceRate).toBeLessThanOrEqual(100);
    });

    test('handles empty conversation list', () => {
      const stats = calculateResponseTimes([]);
      expect(stats.avgResponseMinutes).toBe(0);
      expect(stats.medianResponseMinutes).toBe(0);
      expect(stats.slaComplianceRate).toBe(100);
    });
  });

  // ── Conversation Stats ─────────────────────────────────────────

  describe('Conversation Stats', () => {
    test('returns comprehensive stats', () => {
      const stats = getConversationStats();

      expect(typeof stats.total).toBe('number');
      expect(typeof stats.active).toBe('number');
      expect(typeof stats.unread).toBe('number');
      expect(typeof stats.escalated).toBe('number');
      expect(typeof stats.avgResponseMinutes).toBe('number');
      expect(stats.byCategory).toBeDefined();
      expect(stats.byChannel).toBeDefined();
      expect(typeof stats.byChannel.sms).toBe('number');
      expect(typeof stats.byChannel.email).toBe('number');
    });
  });
});
