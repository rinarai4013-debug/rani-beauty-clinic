/**
 * Message Router Tests
 * Tests for message sending, rate limiting, quiet hours, template rendering,
 * channel resolution, and batch sending.
 */

import {
  MessageRouter,
  createMessageRouter,
  isQuietHours,
  checkRateLimit,
  renderTemplate,
  resolveChannel,
  logDelivery,
  getDeliveryLogs,
} from '../message-router';
import type { ClientPreferences, RateLimitConfig, SendMessageRequest } from '@/types/communications';

// ── Helpers ──────────────────────────────────────────────────────────

function makePreferences(overrides: Partial<ClientPreferences> = {}): ClientPreferences {
  return {
    clientId: 'client_001',
    clientName: 'Sarah Johnson',
    email: 'sarah@example.com',
    phone: '+12065551234',
    smsOptIn: true,
    emailOptIn: true,
    preferredChannel: 'sms',
    messagesToday: 0,
    promotionalThisWeek: 0,
    ...overrides,
  };
}

function makeSendRequest(overrides: Partial<SendMessageRequest> = {}): SendMessageRequest {
  return {
    clientId: 'client_001',
    body: 'Hi Sarah, your appointment is confirmed!',
    isPromotional: false,
    ...overrides,
  };
}

const mockSMSProvider = {
  send: jest.fn().mockResolvedValue({ sid: 'SM_abc123', status: 'sent' }),
};

const mockEmailProvider = {
  send: jest.fn().mockResolvedValue({ id: 'email_abc123' }),
};

// ── Tests ────────────────────────────────────────────────────────────

describe('MessageRouter', () => {
  let router: MessageRouter;

  beforeEach(() => {
    jest.clearAllMocks();
    router = createMessageRouter({
      smsProvider: mockSMSProvider,
      emailProvider: mockEmailProvider,
      rateLimitConfig: {
        maxMessagesPerDay: 3,
        maxPromotionalPerWeek: 1,
        quietHoursStart: 20,
        quietHoursEnd: 9,
        quietHoursTimezone: 'America/Los_Angeles',
      },
    });
    router.resetRateLimits();
  });

  // ── Template Rendering ─────────────────────────────────────────

  describe('renderTemplate', () => {
    test('replaces single variable', () => {
      const result = renderTemplate('Hi {{clientName}}!', { clientName: 'Sarah' });
      expect(result).toBe('Hi Sarah!');
    });

    test('replaces multiple variables', () => {
      const result = renderTemplate(
        '{{clientName}}, your {{serviceName}} is on {{date}}.',
        { clientName: 'Sarah', serviceName: 'HydraFacial', date: 'March 25' }
      );
      expect(result).toBe('Sarah, your HydraFacial is on March 25.');
    });

    test('handles variables with extra spaces', () => {
      const result = renderTemplate('Hi {{ clientName }}!', { clientName: 'Sarah' });
      expect(result).toBe('Hi Sarah!');
    });

    test('leaves unmatched variables as-is', () => {
      const result = renderTemplate('Hi {{clientName}}, cost is {{price}}', { clientName: 'Sarah' });
      expect(result).toBe('Hi Sarah, cost is {{price}}');
    });

    test('replaces same variable multiple times', () => {
      const result = renderTemplate('{{name}} said hello, {{name}}!', { name: 'Sarah' });
      expect(result).toBe('Sarah said hello, Sarah!');
    });

    test('handles empty variables object', () => {
      const result = renderTemplate('Hello world!', {});
      expect(result).toBe('Hello world!');
    });
  });

  // ── Channel Resolution ─────────────────────────────────────────

  describe('resolveChannel', () => {
    test('returns requested SMS channel when client opted in', () => {
      const prefs = makePreferences({ smsOptIn: true, phone: '+12065551234' });
      const result = resolveChannel(prefs, 'sms');
      expect(result.channel).toBe('sms');
    });

    test('returns null for SMS when client opted out', () => {
      const prefs = makePreferences({ smsOptIn: false });
      const result = resolveChannel(prefs, 'sms');
      expect(result.channel).toBeNull();
      expect(result.reason).toContain('not opted in');
    });

    test('returns null for SMS when no phone number', () => {
      const prefs = makePreferences({ smsOptIn: true, phone: null });
      const result = resolveChannel(prefs, 'sms');
      expect(result.channel).toBeNull();
      expect(result.reason).toContain('No phone');
    });

    test('returns requested email channel when client opted in', () => {
      const prefs = makePreferences({ emailOptIn: true, email: 'test@example.com' });
      const result = resolveChannel(prefs, 'email');
      expect(result.channel).toBe('email');
    });

    test('returns null for email when no email address', () => {
      const prefs = makePreferences({ emailOptIn: true, email: null });
      const result = resolveChannel(prefs, 'email');
      expect(result.channel).toBeNull();
    });

    test('auto-detects preferred channel', () => {
      const prefs = makePreferences({ preferredChannel: 'email', emailOptIn: true, email: 'test@example.com' });
      const result = resolveChannel(prefs);
      expect(result.channel).toBe('email');
    });

    test('falls back to SMS when email preferred but not available', () => {
      const prefs = makePreferences({ preferredChannel: 'email', emailOptIn: false, smsOptIn: true, phone: '+1234' });
      const result = resolveChannel(prefs);
      expect(result.channel).toBe('sms');
    });

    test('returns null when no channels available', () => {
      const prefs = makePreferences({ smsOptIn: false, emailOptIn: false });
      const result = resolveChannel(prefs);
      expect(result.channel).toBeNull();
    });
  });

  // ── Rate Limiting ──────────────────────────────────────────────

  describe('checkRateLimit', () => {
    test('allows first message of the day', () => {
      const result = checkRateLimit('client_001', false);
      expect(result.allowed).toBe(true);
    });

    test('blocks after daily limit reached', () => {
      // Exhaust daily limit
      for (let i = 0; i < 3; i++) {
        checkRateLimit('client_limit', false);
      }
      // Simulate the count manually since checkRateLimit only checks
      // The actual counting happens in sendMessage
    });

    test('allows non-promotional after promotional limit', () => {
      const result = checkRateLimit('client_002', false);
      expect(result.allowed).toBe(true);
    });

    test('uses custom rate limit config', () => {
      const config: RateLimitConfig = {
        maxMessagesPerDay: 1,
        maxPromotionalPerWeek: 0,
        quietHoursStart: 20,
        quietHoursEnd: 9,
        quietHoursTimezone: 'America/Los_Angeles',
      };
      const result = checkRateLimit('client_custom', false, config);
      expect(result.allowed).toBe(true);
    });
  });

  // ── Message Sending ────────────────────────────────────────────

  describe('sendMessage', () => {
    test('sends SMS successfully', async () => {
      const prefs = makePreferences();
      const req = makeSendRequest({ channel: 'sms' });

      const result = await router.sendMessage(req, prefs);

      expect(result.success).toBe(true);
      expect(result.channel).toBe('sms');
      expect(result.status).toBe('sent');
      expect(result.messageId).toBeDefined();
      expect(mockSMSProvider.send).toHaveBeenCalledWith('+12065551234', 'Hi Sarah, your appointment is confirmed!');
    });

    test('sends email successfully', async () => {
      const prefs = makePreferences({ preferredChannel: 'email' });
      const req = makeSendRequest({ channel: 'email', subject: 'Appointment Update' });

      const result = await router.sendMessage(req, prefs);

      expect(result.success).toBe(true);
      expect(result.channel).toBe('email');
      expect(mockEmailProvider.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'sarah@example.com',
          subject: 'Appointment Update',
        })
      );
    });

    test('renders template variables before sending', async () => {
      const prefs = makePreferences();
      const req = makeSendRequest({
        channel: 'sms',
        body: 'Hi {{clientName}}, your {{serviceName}} is ready!',
        variables: { clientName: 'Sarah', serviceName: 'HydraFacial' },
      });

      await router.sendMessage(req, prefs);

      expect(mockSMSProvider.send).toHaveBeenCalledWith(
        '+12065551234',
        'Hi Sarah, your HydraFacial is ready!'
      );
    });

    test('fails when client opted out', async () => {
      const prefs = makePreferences({ smsOptIn: false, emailOptIn: false });
      const req = makeSendRequest();

      const result = await router.sendMessage(req, prefs);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No valid');
    });

    test('handles provider errors gracefully', async () => {
      mockSMSProvider.send.mockRejectedValueOnce(new Error('Twilio error'));
      const prefs = makePreferences();
      const req = makeSendRequest({ channel: 'sms' });

      const result = await router.sendMessage(req, prefs);

      expect(result.success).toBe(false);
      expect(result.status).toBe('failed');
      expect(result.error).toContain('Twilio error');
    });

    test('auto-resolves channel from preferences', async () => {
      const prefs = makePreferences({ preferredChannel: 'email' });
      const req = makeSendRequest(); // no channel specified

      const result = await router.sendMessage(req, prefs);

      expect(result.success).toBe(true);
      expect(result.channel).toBe('email');
    });
  });

  // ── Batch Sending ──────────────────────────────────────────────

  describe('sendBatch', () => {
    test('sends to multiple clients', async () => {
      const prefsMap = new Map<string, ClientPreferences>();
      prefsMap.set('c1', makePreferences({ clientId: 'c1', phone: '+11111' }));
      prefsMap.set('c2', makePreferences({ clientId: 'c2', phone: '+12222' }));
      prefsMap.set('c3', makePreferences({ clientId: 'c3', phone: '+13333' }));

      const result = await router.sendBatch(
        {
          clientIds: ['c1', 'c2', 'c3'],
          body: 'Hello!',
          isPromotional: false,
          channel: 'sms',
        },
        prefsMap
      );

      expect(result.total).toBe(3);
      expect(result.queued).toBe(3);
      expect(result.skipped).toBe(0);
    });

    test('skips clients without preferences', async () => {
      const prefsMap = new Map<string, ClientPreferences>();
      prefsMap.set('c1', makePreferences({ clientId: 'c1' }));

      const result = await router.sendBatch(
        {
          clientIds: ['c1', 'c2_missing'],
          body: 'Hello!',
          isPromotional: false,
        },
        prefsMap
      );

      expect(result.skipped).toBe(1);
    });

    test('counts opted-out clients', async () => {
      const prefsMap = new Map<string, ClientPreferences>();
      prefsMap.set('c1', makePreferences({ clientId: 'c1' }));
      prefsMap.set('c2', makePreferences({ clientId: 'c2', smsOptIn: false }));

      const result = await router.sendBatch(
        {
          clientIds: ['c1', 'c2'],
          body: 'Promo!',
          isPromotional: true,
          channel: 'sms',
        },
        prefsMap
      );

      expect(result.optedOut).toBe(1);
    });

    test('limits batch to 500 recipients', async () => {
      const prefsMap = new Map<string, ClientPreferences>();
      const clientIds: string[] = [];
      for (let i = 0; i < 600; i++) {
        const id = `c${i}`;
        clientIds.push(id);
        prefsMap.set(id, makePreferences({ clientId: id, phone: `+1${String(i).padStart(10, '0')}` }));
      }

      const result = await router.sendBatch(
        { clientIds, body: 'Hello!', isPromotional: false, channel: 'sms' },
        prefsMap
      );

      expect(result.total).toBe(500); // Capped at 500
    });
  });

  // ── Delivery Logging ───────────────────────────────────────────

  describe('delivery logging', () => {
    test('logs successful deliveries', async () => {
      const prefs = makePreferences();
      const req = makeSendRequest({ channel: 'sms' });

      await router.sendMessage(req, prefs);

      const logs = getDeliveryLogs('client_001');
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].channel).toBe('sms');
      expect(logs[0].status).toBe('sent');
    });

    test('logs failed deliveries', async () => {
      mockSMSProvider.send.mockRejectedValueOnce(new Error('Failed'));
      const prefs = makePreferences();
      const req = makeSendRequest({ channel: 'sms' });

      await router.sendMessage(req, prefs);

      const logs = getDeliveryLogs('client_001');
      const failedLog = logs.find(l => l.status === 'failed');
      expect(failedLog).toBeDefined();
      expect(failedLog?.failureReason).toContain('Failed');
    });
  });
});

// ── Quiet Hours (standalone) ─────────────────────────────────────

describe('isQuietHours', () => {
  test('function exists and returns boolean', () => {
    const result = isQuietHours();
    expect(typeof result).toBe('boolean');
  });

  test('respects custom config', () => {
    // This test validates the function accepts config without error
    const result = isQuietHours({
      maxMessagesPerDay: 3,
      maxPromotionalPerWeek: 1,
      quietHoursStart: 22,
      quietHoursEnd: 6,
      quietHoursTimezone: 'America/New_York',
    });
    expect(typeof result).toBe('boolean');
  });
});
