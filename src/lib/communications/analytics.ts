/**
 * Communication Analytics Engine
 *
 * Message volume trends, delivery metrics, engagement metrics,
 * revenue attribution, best send time analysis, and provider comparison.
 */

import type {
  CommunicationAnalytics,
  ChannelMetrics,
  DailyMetric,
  SendTimeSlot,
  CampaignType,
  MessageChannel,
} from '@/types/communications';
import { getDeliveryLogs, type DeliveryLog } from './message-router';
import { getAllCampaigns } from './campaign-builder';

// ── Metric Calculations ──────────────────────────────────────────────

function calculateChannelMetrics(logs: DeliveryLog[]): ChannelMetrics {
  const sent = logs.length;
  const delivered = logs.filter(l => l.status === 'delivered' || l.status === 'opened' || l.status === 'clicked').length;
  const opened = logs.filter(l => l.status === 'opened' || l.status === 'clicked').length;
  const clicked = logs.filter(l => l.status === 'clicked').length;
  const bounced = logs.filter(l => l.status === 'bounced').length;
  const failed = logs.filter(l => l.status === 'failed').length;
  const replied = 0; // tracked separately via conversation engine

  return {
    sent,
    delivered,
    opened,
    clicked,
    replied,
    bounced,
    failed,
    deliveryRate: sent > 0 ? (delivered / sent) * 100 : 0,
    openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
    clickRate: opened > 0 ? (clicked / opened) * 100 : 0,
  };
}

// ── Daily Volume Aggregation ─────────────────────────────────────────

function aggregateDailyVolume(logs: DeliveryLog[], days: number = 30): DailyMetric[] {
  const now = new Date();
  const dailyMap = new Map<string, DailyMetric>();

  // Initialize all days
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    dailyMap.set(dateStr, {
      date: dateStr,
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
    });
  }

  // Aggregate logs
  for (const log of logs) {
    const dateStr = log.sentAt.split('T')[0];
    const day = dailyMap.get(dateStr);
    if (day) {
      day.sent++;
      if (log.status === 'delivered' || log.status === 'opened' || log.status === 'clicked') {
        day.delivered++;
      }
      if (log.status === 'opened' || log.status === 'clicked') {
        day.opened++;
      }
      if (log.status === 'clicked') {
        day.clicked++;
      }
      if (log.status === 'bounced') {
        day.bounced++;
      }
    }
  }

  return Array.from(dailyMap.values());
}

// ── Best Send Time Analysis ──────────────────────────────────────────

export function analyzeBestSendTimes(logs: DeliveryLog[]): SendTimeSlot[] {
  const slotMap = new Map<string, { engagements: number; total: number }>();

  // Initialize all slots
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      slotMap.set(`${day}-${hour}`, { engagements: 0, total: 0 });
    }
  }

  // Aggregate
  for (const log of logs) {
    const sentDate = new Date(log.sentAt);
    const day = sentDate.getDay();
    const hour = sentDate.getHours();
    const key = `${day}-${hour}`;
    const slot = slotMap.get(key);
    if (slot) {
      slot.total++;
      if (log.status === 'opened' || log.status === 'clicked') {
        slot.engagements++;
      }
    }
  }

  const result: SendTimeSlot[] = [];
  for (const [key, data] of slotMap) {
    const [day, hour] = key.split('-').map(Number);
    result.push({
      day,
      hour,
      engagementScore: data.total > 0 ? Math.round((data.engagements / data.total) * 100) : 0,
      sampleSize: data.total,
    });
  }

  return result;
}

// ── Revenue Attribution ──────────────────────────────────────────────

function calculateRevenueAttribution(): {
  total: number;
  byChannel: { sms: number; email: number };
  byCampaign: { campaignId: string; campaignName: string; revenue: number }[];
} {
  const campaigns = getAllCampaigns();
  let total = 0;
  const byChannel = { sms: 0, email: 0 };
  const byCampaign: { campaignId: string; campaignName: string; revenue: number }[] = [];

  for (const campaign of campaigns) {
    if (campaign.metrics.revenueAttributed > 0) {
      total += campaign.metrics.revenueAttributed;
      byCampaign.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        revenue: campaign.metrics.revenueAttributed,
      });

      if (campaign.channel === 'sms') {
        byChannel.sms += campaign.metrics.revenueAttributed;
      } else if (campaign.channel === 'email') {
        byChannel.email += campaign.metrics.revenueAttributed;
      } else {
        // Split evenly for 'both'
        byChannel.sms += campaign.metrics.revenueAttributed / 2;
        byChannel.email += campaign.metrics.revenueAttributed / 2;
      }
    }
  }

  return {
    total,
    byChannel,
    byCampaign: byCampaign.sort((a, b) => b.revenue - a.revenue),
  };
}

// ── Unsubscribe Trend ────────────────────────────────────────────────

function calculateUnsubscribeTrend(days: number = 30): DailyMetric[] {
  // Placeholder: in production, query Airtable unsubscribe events
  const result: DailyMetric[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    result.push({
      date: date.toISOString().split('T')[0],
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
    });
  }

  return result;
}

// ── Main Analytics Function ──────────────────────────────────────────

export function getCommunicationAnalytics(
  dateRange: { start: string; end: string } = {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString(),
  }
): CommunicationAnalytics {
  const allLogs = getDeliveryLogs();

  // Filter by date range
  const logs = allLogs.filter(l => {
    const sentAt = new Date(l.sentAt).getTime();
    return sentAt >= new Date(dateRange.start).getTime() &&
           sentAt <= new Date(dateRange.end).getTime();
  });

  // Split by channel
  const smsLogs = logs.filter(l => l.channel === 'sms');
  const emailLogs = logs.filter(l => l.channel === 'email');

  const smsMetrics = calculateChannelMetrics(smsLogs);
  const emailMetrics = calculateChannelMetrics(emailLogs);
  const allMetrics = calculateChannelMetrics(logs);

  // By campaign type
  const campaigns = getAllCampaigns();
  const byType: Record<string, ChannelMetrics> = {};
  const campaignTypes: (CampaignType | 'direct')[] = [
    'promotional', 'educational', 'reactivation', 'event', 'seasonal', 'birthday', 'direct',
  ];

  for (const type of campaignTypes) {
    if (type === 'direct') {
      const directLogs = logs.filter(_l=> {
        // Messages not associated with any campaign
        return !campaigns.some(c =>
          c.metrics.totalSent > 0 && c.type === type
        );
      });
      byType[type] = calculateChannelMetrics(directLogs);
    } else {
      const typeCampaigns = campaigns.filter(c => c.type === type);
      const typeMetrics: ChannelMetrics = {
        sent: 0, delivered: 0, opened: 0, clicked: 0, replied: 0,
        bounced: 0, failed: 0, deliveryRate: 0, openRate: 0, clickRate: 0,
      };
      for (const camp of typeCampaigns) {
        typeMetrics.sent += camp.metrics.totalSent;
        typeMetrics.delivered += camp.metrics.delivered;
        typeMetrics.opened += camp.metrics.opened;
        typeMetrics.clicked += camp.metrics.clicked;
        typeMetrics.bounced += camp.metrics.bounced;
        typeMetrics.failed += camp.metrics.failed;
      }
      if (typeMetrics.sent > 0) {
        typeMetrics.deliveryRate = (typeMetrics.delivered / typeMetrics.sent) * 100;
        typeMetrics.openRate = typeMetrics.delivered > 0 ? (typeMetrics.opened / typeMetrics.delivered) * 100 : 0;
        typeMetrics.clickRate = typeMetrics.opened > 0 ? (typeMetrics.clicked / typeMetrics.opened) * 100 : 0;
      }
      byType[type] = typeMetrics;
    }
  }

  const revenue = calculateRevenueAttribution();
  const bestSendTimes = analyzeBestSendTimes(logs);

  // Calculate unsubscribe rate from campaigns
  const totalUnsubscribes = campaigns.reduce((sum, c) => sum + c.metrics.unsubscribed, 0);
  const totalCampaignSent = campaigns.reduce((sum, c) => sum + c.metrics.totalSent, 0);

  return {
    totalSent: allMetrics.sent,
    totalDelivered: allMetrics.delivered,
    totalOpened: allMetrics.opened,
    totalClicked: allMetrics.clicked,
    totalReplied: 0,
    totalBounced: allMetrics.bounced,
    totalFailed: allMetrics.failed,
    byChannel: { sms: smsMetrics, email: emailMetrics },
    byType: byType as Record<CampaignType | 'direct', ChannelMetrics>,
    dailyVolume: aggregateDailyVolume(logs),
    avgOpenRate: allMetrics.openRate,
    avgClickRate: allMetrics.clickRate,
    avgReplyRate: 0,
    totalRevenueAttributed: revenue.total,
    revenueByChannel: revenue.byChannel,
    revenueByCampaign: revenue.byCampaign,
    bestSendTimes,
    unsubscribeRate: totalCampaignSent > 0 ? (totalUnsubscribes / totalCampaignSent) * 100 : 0,
    unsubscribeTrend: calculateUnsubscribeTrend(),
  };
}

// ── Provider Comparison ──────────────────────────────────────────────

export interface ProviderStats {
  provider: string;
  channel: MessageChannel;
  messagesSent: number;
  deliveryRate: number;
  avgLatencyMs: number;
  failureRate: number;
  costPerMessage: number;
}

export function getProviderComparison(): ProviderStats[] {
  // Twilio SMS and Resend Email stats
  const allLogs = getDeliveryLogs();
  const smsLogs = allLogs.filter(l => l.channel === 'sms');
  const emailLogs = allLogs.filter(l => l.channel === 'email');

  const smsDelivered = smsLogs.filter(l => l.status !== 'failed' && l.status !== 'bounced').length;
  const emailDelivered = emailLogs.filter(l => l.status !== 'failed' && l.status !== 'bounced').length;

  return [
    {
      provider: 'Twilio',
      channel: 'sms',
      messagesSent: smsLogs.length,
      deliveryRate: smsLogs.length > 0 ? (smsDelivered / smsLogs.length) * 100 : 0,
      avgLatencyMs: 250,
      failureRate: smsLogs.length > 0
        ? (smsLogs.filter(l => l.status === 'failed').length / smsLogs.length) * 100
        : 0,
      costPerMessage: 0.0079, // Twilio SMS rate
    },
    {
      provider: 'Resend',
      channel: 'email',
      messagesSent: emailLogs.length,
      deliveryRate: emailLogs.length > 0 ? (emailDelivered / emailLogs.length) * 100 : 0,
      avgLatencyMs: 500,
      failureRate: emailLogs.length > 0
        ? (emailLogs.filter(l => l.status === 'failed').length / emailLogs.length) * 100
        : 0,
      costPerMessage: 0.001, // Resend rate
    },
  ];
}
