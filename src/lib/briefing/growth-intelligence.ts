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
  const financingShare = revenue.total > 0 ? revenue.financingTotal / revenue.total : 0;
  const topChannels = Object.entries(marketing.leadsBySource)
    .map(([channel, leads]) => {
      const normalized = normalizeChannelName(channel);
      const baseRevenuePerLead = normalized === 'phone' ? 450 : normalized === 'email' ? 250 : 300;
      const estimatedRevenue = Math.round(leads * baseRevenuePerLead * (1 + financingShare));
      return {
        channel: normalized,
        leads,
        estimatedRevenue,
        efficiency: getEfficiency(leads, estimatedRevenue),
      };
    })
    .sort((a, b) => b.estimatedRevenue - a.estimatedRevenue)
    .slice(0, 5);

  const weakestChannel = [...topChannels]
    .sort((a, b) => a.estimatedRevenue - b.estimatedRevenue)[0]?.channel ?? null;

  return {
    topChannel: topChannels[0]?.channel ?? null,
    weakestChannel,
    referralRevenue: referrals.revenueAttributed,
    topChannels,
  };
}
