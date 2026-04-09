import type { MarketingSnapshot, ReferralSnapshot, RevenueSnapshot } from './types';

export interface GrowthChannelSummary {
  channel: string;
  leads: number;
  estimatedRevenue: number;
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
): GrowthIntelligence {
  const avgTicket = revenue.avgTicket > 0 ? revenue.avgTicket : 300;
  const channelFactors: Record<string, number> = {
    phone: 0.9,
    referral: 0.95,
    meta: 0.75,
    instagram: 0.7,
    email: 0.55,
  };

  const topChannels = Object.entries(marketing.leadsBySource)
    .map(([channel, leads]) => {
      const normalized = normalizeChannelName(channel);
      const factor = channelFactors[normalized] ?? 0.65;
      const estimatedRevenue = Math.round(leads * avgTicket * factor);
      return {
        channel: normalized,
        leads,
        estimatedRevenue,
        efficiency: getEfficiency(leads, estimatedRevenue),
      };
    });

  if (referrals.conversions > 0 || referrals.revenueAttributed > 0) {
    topChannels.push({
      channel: 'referral',
      leads: referrals.conversions,
      estimatedRevenue: referrals.revenueAttributed,
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
