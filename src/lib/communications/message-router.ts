/**
 * Unified Message Router
 *
 * Routes messages to SMS (Twilio) or Email (Resend) based on client preferences.
 * Enforces rate limiting, quiet hours, and opt-in/opt-out compliance.
 */

import type {
  MessageChannel,
  ClientPreferences,
  SendMessageRequest,
  SendResult,
  BatchSendRequest,
  BatchSendResult,
  RateLimitConfig,
  DEFAULT_RATE_LIMITS,
  MessageTemplate,
  Message,
  MessageStatus,
} from '@/types/communications';

// ── Provider Interfaces ──────────────────────────────────────────────

interface SMSProvider {
  send(to: string, body: string): Promise<{ sid: string; status: string }>;
}

interface EmailProvider {
  send(params: {
    to: string;
    from: string;
    subject: string;
    html: string;
  }): Promise<{ id: string }>;
}

// ── Rate Limit Store ─────────────────────────────────────────────────

interface ClientMessageCount {
  daily: number;
  weeklyPromotional: number;
  lastReset: string; // ISO date
  lastWeeklyReset: string; // ISO date
}

const messageCounts = new Map<string, ClientMessageCount>();

function getClientCounts(clientId: string): ClientMessageCount {
  const today = new Date().toISOString().split('T')[0];
  const weekStart = getWeekStart();
  let counts = messageCounts.get(clientId);

  if (!counts) {
    counts = { daily: 0, weeklyPromotional: 0, lastReset: today, lastWeeklyReset: weekStart };
    messageCounts.set(clientId, counts);
    return counts;
  }

  // Reset daily count if new day
  if (counts.lastReset !== today) {
    counts.daily = 0;
    counts.lastReset = today;
  }

  // Reset weekly count if new week
  if (counts.lastWeeklyReset !== weekStart) {
    counts.weeklyPromotional = 0;
    counts.lastWeeklyReset = weekStart;
  }

  return counts;
}

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
}

// ── Quiet Hours Check ────────────────────────────────────────────────

export function isQuietHours(
  config: RateLimitConfig = {
    maxMessagesPerDay: 3,
    maxPromotionalPerWeek: 1,
    quietHoursStart: 20,
    quietHoursEnd: 9,
    quietHoursTimezone: 'America/Los_Angeles',
  }
): boolean {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: config.quietHoursTimezone,
    hour: 'numeric',
    hour12: false,
  });
  const currentHour = parseInt(formatter.format(now), 10);

  // Handle overnight quiet hours (e.g., 8 PM to 9 AM)
  if (config.quietHoursStart > config.quietHoursEnd) {
    return currentHour >= config.quietHoursStart || currentHour < config.quietHoursEnd;
  }
  return currentHour >= config.quietHoursStart && currentHour < config.quietHoursEnd;
}

// ── Rate Limit Check ─────────────────────────────────────────────────

export function checkRateLimit(
  clientId: string,
  isPromotional: boolean,
  config: RateLimitConfig = {
    maxMessagesPerDay: 3,
    maxPromotionalPerWeek: 1,
    quietHoursStart: 20,
    quietHoursEnd: 9,
    quietHoursTimezone: 'America/Los_Angeles',
  }
): { allowed: boolean; reason?: string } {
  const counts = getClientCounts(clientId);

  if (counts.daily >= config.maxMessagesPerDay) {
    return {
      allowed: false,
      reason: `Daily limit reached (${config.maxMessagesPerDay} messages/day)`,
    };
  }

  if (isPromotional && counts.weeklyPromotional >= config.maxPromotionalPerWeek) {
    return {
      allowed: false,
      reason: `Weekly promotional limit reached (${config.maxPromotionalPerWeek}/week)`,
    };
  }

  return { allowed: true };
}

// ── Template Rendering ───────────────────────────────────────────────

export function renderTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let rendered = template;
  for (const [key, value] of Object.entries(variables)) {
    const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    rendered = rendered.replace(pattern, value);
  }
  return rendered;
}

// ── Channel Resolution ───────────────────────────────────────────────

export function resolveChannel(
  preferences: ClientPreferences,
  requestedChannel?: MessageChannel
): { channel: MessageChannel | null; reason?: string } {
  // If specific channel requested, validate opt-in
  if (requestedChannel === 'sms') {
    if (!preferences.smsOptIn) return { channel: null, reason: 'Client not opted in to SMS' };
    if (!preferences.phone) return { channel: null, reason: 'No phone number on file' };
    return { channel: 'sms' };
  }

  if (requestedChannel === 'email') {
    if (!preferences.emailOptIn) return { channel: null, reason: 'Client not opted in to email' };
    if (!preferences.email) return { channel: null, reason: 'No email address on file' };
    return { channel: 'email' };
  }

  // Auto-detect: use preferred channel first, fall back to the other
  if (preferences.preferredChannel === 'sms' && preferences.smsOptIn && preferences.phone) {
    return { channel: 'sms' };
  }
  if (preferences.preferredChannel === 'email' && preferences.emailOptIn && preferences.email) {
    return { channel: 'email' };
  }

  // Fallback
  if (preferences.smsOptIn && preferences.phone) return { channel: 'sms' };
  if (preferences.emailOptIn && preferences.email) return { channel: 'email' };

  return { channel: null, reason: 'Client has no valid opt-in channel' };
}

// ── Delivery Logging ─────────────────────────────────────────────────

export interface DeliveryLog {
  messageId: string;
  clientId: string;
  channel: MessageChannel;
  status: MessageStatus;
  providerMessageId?: string;
  sentAt: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  failureReason?: string;
}

const deliveryLogs: DeliveryLog[] = [];

export function logDelivery(log: DeliveryLog): void {
  deliveryLogs.push(log);
  // In production, persist to Airtable Messages Log table
}

export function getDeliveryLogs(clientId?: string): DeliveryLog[] {
  if (clientId) {
    return deliveryLogs.filter(l => l.clientId === clientId);
  }
  return [...deliveryLogs];
}

// ── Message Router ───────────────────────────────────────────────────

export class MessageRouter {
  private smsProvider: SMSProvider | null = null;
  private emailProvider: EmailProvider | null = null;
  private rateLimitConfig: RateLimitConfig;
  private fromEmail: string;

  constructor(config?: {
    smsProvider?: SMSProvider;
    emailProvider?: EmailProvider;
    rateLimitConfig?: RateLimitConfig;
    fromEmail?: string;
  }) {
    this.smsProvider = config?.smsProvider ?? null;
    this.emailProvider = config?.emailProvider ?? null;
    this.rateLimitConfig = config?.rateLimitConfig ?? {
      maxMessagesPerDay: 3,
      maxPromotionalPerWeek: 1,
      quietHoursStart: 20,
      quietHoursEnd: 9,
      quietHoursTimezone: 'America/Los_Angeles',
    };
    this.fromEmail = config?.fromEmail ?? 'Rani Beauty Clinic <noreply@ranibeautyclinic.com>';
  }

  /**
   * Send a single message to a client
   */
  async sendMessage(
    request: SendMessageRequest,
    preferences: ClientPreferences
  ): Promise<SendResult> {
    // 1. Check quiet hours
    if (isQuietHours(this.rateLimitConfig) && !preferences.quietHoursOverride) {
      return {
        success: false,
        channel: request.channel || preferences.preferredChannel,
        status: 'queued',
        quietHours: true,
        error: 'Message queued - outside sending hours (9 AM - 8 PM PST)',
      };
    }

    // 2. Check rate limits
    const rateCheck = checkRateLimit(
      request.clientId,
      request.isPromotional,
      this.rateLimitConfig
    );
    if (!rateCheck.allowed) {
      return {
        success: false,
        channel: request.channel || preferences.preferredChannel,
        status: 'failed',
        rateLimited: true,
        error: rateCheck.reason,
      };
    }

    // 3. Resolve channel
    const { channel, reason } = resolveChannel(preferences, request.channel);
    if (!channel) {
      return {
        success: false,
        channel: request.channel || 'sms',
        status: 'failed',
        error: reason || 'No valid channel',
      };
    }

    // 4. Render template variables
    const body = request.variables
      ? renderTemplate(request.body, request.variables)
      : request.body;

    const subject = request.subject && request.variables
      ? renderTemplate(request.subject, request.variables)
      : request.subject;

    // 5. Send via provider
    try {
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      if (channel === 'sms' && this.smsProvider && preferences.phone) {
        const result = await this.smsProvider.send(preferences.phone, body);
        const counts = getClientCounts(request.clientId);
        counts.daily++;
        if (request.isPromotional) counts.weeklyPromotional++;

        logDelivery({
          messageId,
          clientId: request.clientId,
          channel: 'sms',
          status: 'sent',
          providerMessageId: result.sid,
          sentAt: new Date().toISOString(),
        });

        return { success: true, messageId, channel: 'sms', status: 'sent' };
      }

      if (channel === 'email' && this.emailProvider && preferences.email) {
        const result = await this.emailProvider.send({
          to: preferences.email,
          from: this.fromEmail,
          subject: subject || 'Message from Rani Beauty Clinic',
          html: body,
        });
        const counts = getClientCounts(request.clientId);
        counts.daily++;
        if (request.isPromotional) counts.weeklyPromotional++;

        logDelivery({
          messageId,
          clientId: request.clientId,
          channel: 'email',
          status: 'sent',
          providerMessageId: result.id,
          sentAt: new Date().toISOString(),
        });

        return { success: true, messageId, channel: 'email', status: 'sent' };
      }

      return {
        success: false,
        channel,
        status: 'failed',
        error: `No provider configured for ${channel}`,
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown send error';
      logDelivery({
        messageId: `msg_failed_${Date.now()}`,
        clientId: request.clientId,
        channel,
        status: 'failed',
        sentAt: new Date().toISOString(),
        failureReason: error,
      });

      return { success: false, channel, status: 'failed', error };
    }
  }

  /**
   * Send messages to multiple clients (batch/campaign)
   * Queues up to 500 messages
   */
  async sendBatch(
    request: BatchSendRequest,
    preferencesMap: Map<string, ClientPreferences>
  ): Promise<BatchSendResult> {
    const maxBatch = 500;
    const clientIds = request.clientIds.slice(0, maxBatch);

    const results: SendResult[] = [];
    let queued = 0;
    let skipped = 0;
    let rateLimited = 0;
    let optedOut = 0;

    for (const clientId of clientIds) {
      const prefs = preferencesMap.get(clientId);
      if (!prefs) {
        skipped++;
        results.push({
          success: false,
          channel: request.channel || 'sms',
          status: 'failed',
          error: 'Client preferences not found',
        });
        continue;
      }

      // Check if client has opted out
      if (request.channel === 'sms' && !prefs.smsOptIn) {
        optedOut++;
        results.push({
          success: false,
          channel: 'sms',
          status: 'failed',
          error: 'Client opted out of SMS',
        });
        continue;
      }
      if (request.channel === 'email' && !prefs.emailOptIn) {
        optedOut++;
        results.push({
          success: false,
          channel: 'email',
          status: 'failed',
          error: 'Client opted out of email',
        });
        continue;
      }

      const result = await this.sendMessage(
        {
          clientId,
          channel: request.channel,
          templateId: request.templateId,
          subject: request.subject,
          body: request.body,
          variables: request.variables,
          isPromotional: request.isPromotional,
          campaignId: request.campaignId,
        },
        prefs
      );

      results.push(result);
      if (result.success) queued++;
      if (result.rateLimited) rateLimited++;

      // Small delay between sends to avoid provider rate limits
      await new Promise(r => setTimeout(r, 50));
    }

    return {
      total: clientIds.length,
      queued,
      skipped,
      rateLimited,
      optedOut,
      results,
    };
  }

  /**
   * Reset rate limit counts (for testing)
   */
  resetRateLimits(): void {
    messageCounts.clear();
  }
}

// ── Singleton instance ───────────────────────────────────────────────

let _router: MessageRouter | null = null;

export function getMessageRouter(): MessageRouter {
  if (!_router) {
    _router = new MessageRouter();
  }
  return _router;
}

export function createMessageRouter(config?: ConstructorParameters<typeof MessageRouter>[0]): MessageRouter {
  return new MessageRouter(config);
}
