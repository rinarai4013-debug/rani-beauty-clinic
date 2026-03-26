/**
 * Communication Analytics Tests
 * Tests for analytics aggregation, best send time analysis,
 * revenue attribution, and provider comparison.
 */

import {
  getCommunicationAnalytics,
  analyzeBestSendTimes,
  getProviderComparison,
} from '../analytics';
import type { DeliveryLog } from '../message-router';

describe('Communication Analytics', () => {
  // ── Analytics Aggregation ──────────────────────────────────────

  describe('getCommunicationAnalytics', () => {
    test('returns complete analytics structure', () => {
      const analytics = getCommunicationAnalytics();

      expect(typeof analytics.totalSent).toBe('number');
      expect(typeof analytics.totalDelivered).toBe('number');
      expect(typeof analytics.totalOpened).toBe('number');
      expect(typeof analytics.totalClicked).toBe('number');
      expect(typeof analytics.totalBounced).toBe('number');
      expect(typeof analytics.totalFailed).toBe('number');
      expect(analytics.byChannel).toBeDefined();
      expect(analytics.byChannel.sms).toBeDefined();
      expect(analytics.byChannel.email).toBeDefined();
      expect(Array.isArray(analytics.dailyVolume)).toBe(true);
      expect(Array.isArray(analytics.bestSendTimes)).toBe(true);
      expect(typeof analytics.avgOpenRate).toBe('number');
      expect(typeof analytics.avgClickRate).toBe('number');
      expect(typeof analytics.totalRevenueAttributed).toBe('number');
    });

    test('returns channel metrics with correct shape', () => {
      const analytics = getCommunicationAnalytics();

      for (const channel of ['sms', 'email'] as const) {
        const metrics = analytics.byChannel[channel];
        expect(typeof metrics.sent).toBe('number');
        expect(typeof metrics.delivered).toBe('number');
        expect(typeof metrics.opened).toBe('number');
        expect(typeof metrics.clicked).toBe('number');
        expect(typeof metrics.bounced).toBe('number');
        expect(typeof metrics.failed).toBe('number');
        expect(typeof metrics.deliveryRate).toBe('number');
        expect(typeof metrics.openRate).toBe('number');
        expect(typeof metrics.clickRate).toBe('number');
      }
    });

    test('returns daily volume for 30 days', () => {
      const analytics = getCommunicationAnalytics();

      expect(analytics.dailyVolume.length).toBe(30);

      for (const day of analytics.dailyVolume) {
        expect(day.date).toBeDefined();
        expect(typeof day.sent).toBe('number');
        expect(typeof day.delivered).toBe('number');
        expect(typeof day.opened).toBe('number');
        expect(typeof day.clicked).toBe('number');
        expect(typeof day.bounced).toBe('number');
      }
    });

    test('returns revenue attribution', () => {
      const analytics = getCommunicationAnalytics();

      expect(typeof analytics.totalRevenueAttributed).toBe('number');
      expect(typeof analytics.revenueByChannel.sms).toBe('number');
      expect(typeof analytics.revenueByChannel.email).toBe('number');
      expect(Array.isArray(analytics.revenueByCampaign)).toBe(true);
    });

    test('respects date range filter', () => {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const analytics = getCommunicationAnalytics({
        start: weekAgo.toISOString(),
        end: now.toISOString(),
      });

      expect(analytics).toBeDefined();
      // Should still return valid structure
      expect(typeof analytics.totalSent).toBe('number');
    });

    test('returns unsubscribe metrics', () => {
      const analytics = getCommunicationAnalytics();

      expect(typeof analytics.unsubscribeRate).toBe('number');
      expect(analytics.unsubscribeRate).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(analytics.unsubscribeTrend)).toBe(true);
    });
  });

  // ── Best Send Time Analysis ────────────────────────────────────

  describe('analyzeBestSendTimes', () => {
    test('returns time slots for all days and hours', () => {
      const slots = analyzeBestSendTimes([]);

      // 7 days * 24 hours = 168 slots
      expect(slots.length).toBe(168);
    });

    test('each slot has correct structure', () => {
      const slots = analyzeBestSendTimes([]);

      for (const slot of slots) {
        expect(slot.day).toBeGreaterThanOrEqual(0);
        expect(slot.day).toBeLessThanOrEqual(6);
        expect(slot.hour).toBeGreaterThanOrEqual(0);
        expect(slot.hour).toBeLessThanOrEqual(23);
        expect(typeof slot.engagementScore).toBe('number');
        expect(typeof slot.sampleSize).toBe('number');
      }
    });

    test('calculates engagement scores from logs', () => {
      const now = new Date();
      const logs: DeliveryLog[] = [
        {
          messageId: 'msg_1',
          clientId: 'c1',
          channel: 'sms',
          status: 'opened',
          sentAt: now.toISOString(),
        },
        {
          messageId: 'msg_2',
          clientId: 'c2',
          channel: 'sms',
          status: 'sent',
          sentAt: now.toISOString(),
        },
      ];

      const slots = analyzeBestSendTimes(logs);
      const currentSlot = slots.find(
        s => s.day === now.getDay() && s.hour === now.getHours()
      );

      expect(currentSlot).toBeDefined();
      expect(currentSlot!.sampleSize).toBe(2);
      expect(currentSlot!.engagementScore).toBe(50); // 1 opened out of 2
    });

    test('handles empty logs gracefully', () => {
      const slots = analyzeBestSendTimes([]);
      const allZero = slots.every(s => s.engagementScore === 0);
      expect(allZero).toBe(true);
    });
  });

  // ── Provider Comparison ────────────────────────────────────────

  describe('getProviderComparison', () => {
    test('returns Twilio and Resend stats', () => {
      const providers = getProviderComparison();

      expect(providers.length).toBe(2);

      const twilio = providers.find(p => p.provider === 'Twilio');
      const resend = providers.find(p => p.provider === 'Resend');

      expect(twilio).toBeDefined();
      expect(twilio?.channel).toBe('sms');
      expect(typeof twilio?.messagesSent).toBe('number');
      expect(typeof twilio?.deliveryRate).toBe('number');
      expect(typeof twilio?.costPerMessage).toBe('number');

      expect(resend).toBeDefined();
      expect(resend?.channel).toBe('email');
      expect(typeof resend?.messagesSent).toBe('number');
      expect(typeof resend?.costPerMessage).toBe('number');
    });

    test('provider rates are within valid range', () => {
      const providers = getProviderComparison();

      for (const provider of providers) {
        expect(provider.deliveryRate).toBeGreaterThanOrEqual(0);
        expect(provider.deliveryRate).toBeLessThanOrEqual(100);
        expect(provider.failureRate).toBeGreaterThanOrEqual(0);
        expect(provider.failureRate).toBeLessThanOrEqual(100);
        expect(provider.costPerMessage).toBeGreaterThan(0);
      }
    });
  });
});
