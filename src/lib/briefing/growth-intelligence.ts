import type { MarketingSnapshot, ReferralSnapshot, RevenueSnapshot } from './types';
import type { BookingAttributionSnapshot } from './data-fetchers';

export interface GrowthChannelSummary {
  channel: string;
  leads: number;
  bookings: number;
  attributedRevenue: number;
  estimatedRevenue: number;
  leadToBookingRate: number;
  efficiency: 'strong' | 'watch' | 'weak';
}

export interface GrowthIntelligence {
  topChannel: string | null;
  weakestChannel: string | null;
  referralRevenue: number;
  topChannels: GrowthChannelSummary[];
}

function normalizeChannelName(channel: string): string {
  const lower = channel.toLowerCase();
  if (lower.includes('phone')) return 'phone';
  if (lower.includes('email')) return 'email';
  if (lower.includes('instagram')) return 'instagram';
  if (lower.includes('facebook') || lower.includes('meta')) return 'meta';
  return lower;
}

function getEfficiency(leads: number, estimatedRevenue: number): GrowthChannelSummary['efficiency'] {
  if (leads === 0) return 'weak';
  const revenuePerLead = estimatedRevenue / leads;
  if (revenuePerLead >= 500) return 'strong';
  if (revenuePerLead >= 250) return 'watch';
  return 'weak';
}

export function buildGrowthIntelligence(
  marketing: MarketingSnapshot,
  referrals: ReferralSnapshot,
  revenue: RevenueSnapshot,
  attribution: BookingAttributionSnapshot,
): GrowthIntelligence {
  const avgTicket = revenue.avgTicket > 0 ? revenue.avgTicket : 300;
  const channelFactors: Record<string, number> = {
    phone: 0.9,
    referral: 0.95,
    meta: 0.75,
    instagram: 0.7,
    email: 0.55,
  };

  const normalizedLeadSources = Object.entries(marketing.leadsBySource).reduce<Record<string, number>>((acc, [channel, leads]) => {
    const normalized = normalizeChannelName(channel);
    acc[normalized] = (acc[normalized] || 0) + leads;
    return acc;
  }, {});

  const normalizedAttribution = Object.entries(attribution.bySource).reduce<Record<string, { bookings: number; revenue: number }>>(
    (acc, [channel, stats]) => {
      const normalized = normalizeChannelName(channel);
      if (!acc[normalized]) acc[normalized] = { bookings: 0, revenue: 0 };
      acc[normalized].bookings += stats.bookings;
      acc[normalized].revenue += stats.revenue;
      return acc;
    },
    {}
  );

  const channels = [...new Set([...Object.keys(normalizedLeadSources), ...Object.keys(normalizedAttribution)])];

  const topChannels = channels.map((channel) => {
    const leads = normalizedLeadSources[channel] || 0;
    const attributed = normalizedAttribution[channel] || { bookings: 0, revenue: 0 };
    const factor = channelFactors[channel] ?? 0.65;
    const estimatedRevenue =
      attributed.revenue > 0
        ? Math.round(attributed.revenue)
        : Math.round(Math.max(attributed.bookings, leads) * avgTicket * factor);
    const leadToBookingRate = leads > 0 ? Math.round((attributed.bookings / leads) * 100) : 0;

    return {
      channel,
      leads,
      bookings: attributed.bookings,
      attributedRevenue: Math.round(attributed.revenue),
      estimatedRevenue,
      leadToBookingRate,
      efficiency: getEfficiency(Math.max(leads, 1), estimatedRevenue),
    };
  });

  if (referrals.conversions > 0 || referrals.revenueAttributed > 0) {
    topChannels.push({
      channel: 'referral',
      leads: referrals.conversions,
      bookings: referrals.conversions,
      attributedRevenue: referrals.revenueAttributed,
      estimatedRevenue: referrals.revenueAttributed,
      leadToBookingRate: 100,
      efficiency: getEfficiency(Math.max(referrals.conversions, 1), referrals.revenueAttributed),
    });
  }

  const rankedChannels = topChannels
    .sort((a, b) => b.estimatedRevenue - a.estimatedRevenue)
    .slice(0, 5);

  const weakestChannel = [...rankedChannels]
    .sort((a, b) => a.estimatedRevenue - b.estimatedRevenue)[0]?.channel ?? null;

  return {
    topChannel: rankedChannels[0]?.channel ?? null,
    weakestChannel,
    referralRevenue: referrals.revenueAttributed,
    topChannels: rankedChannels,
  };
}
