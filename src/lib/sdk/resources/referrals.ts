/**
 * RaniOS SDK - Referrals Resource
 *
 * Generate referral codes/links and track referral statistics.
 */

import type { RaniOSClient, SDKResponse } from '../client';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ReferralCode {
  id: string;
  code: string;
  link: string;
  referrerId: string;
  referrerName: string;
  referrerReward: {
    type: 'points' | 'discount' | 'credit';
    value: number;
    description: string;
  };
  refereeReward: {
    type: 'discount' | 'credit' | 'free_addon';
    value: number;
    description: string;
  };
  usageCount: number;
  maxUses: number | null;
  expiresAt: string | null;
  status: 'active' | 'expired' | 'maxed' | 'revoked';
  createdAt: string;
}

export interface ReferralConversion {
  id: string;
  referralCodeId: string;
  referrerId: string;
  referrerName: string;
  refereeId: string;
  refereeName: string;
  status: 'pending' | 'booked' | 'completed' | 'rewarded';
  appointmentId: string | null;
  revenueGenerated: number;
  referrerRewardIssued: boolean;
  refereeRewardIssued: boolean;
  convertedAt: string;
}

export interface ReferralStats {
  totalReferrals: number;
  activeReferrers: number;
  conversionRate: number;
  totalRevenueGenerated: number;
  avgRevenuePerReferral: number;
  topReferrers: {
    clientId: string;
    clientName: string;
    referralCount: number;
    revenueGenerated: number;
    conversionRate: number;
  }[];
  byMonth: {
    month: string;
    referrals: number;
    conversions: number;
    revenue: number;
  }[];
  rewardsSummary: {
    pointsAwarded: number;
    discountsGiven: number;
    creditsIssued: number;
    totalRewardCost: number;
  };
}

export interface GenerateReferralParams {
  clientId: string;
  referrerReward?: {
    type: 'points' | 'discount' | 'credit';
    value: number;
  };
  refereeReward?: {
    type: 'discount' | 'credit' | 'free_addon';
    value: number;
  };
  maxUses?: number;
  expiresInDays?: number;
  campaignTag?: string;
}

// ─── Resource ───────────────────────────────────────────────────────────────

export class ReferralsResource {
  constructor(private readonly client: RaniOSClient) {}

  /**
   * Generate a new referral code and shareable link for a client.
   *
   * @example
   * ```ts
   * const { data } = await client.referrals.generate({
   *   clientId: 'rec_abc123',
   *   referrerReward: { type: 'points', value: 500 },
   *   refereeReward: { type: 'discount', value: 50 },
   *   maxUses: 10,
   *   expiresInDays: 90,
   * });
   * console.log(`Share this link: ${data.link}`);
   * console.log(`Code: ${data.code}`);
   * ```
   */
  async generate(params: GenerateReferralParams): Promise<SDKResponse<ReferralCode>> {
    return this.client.request<ReferralCode>('/referrals', {
      method: 'POST',
      body: params,
    });
  }

  /**
   * Get referral code details.
   */
  async getCode(codeId: string): Promise<SDKResponse<ReferralCode>> {
    return this.client.request<ReferralCode>(`/referrals/${codeId}`);
  }

  /**
   * Look up a referral by its code string.
   */
  async lookupCode(code: string): Promise<SDKResponse<ReferralCode>> {
    return this.client.request<ReferralCode>('/referrals/lookup', {
      params: { code },
    });
  }

  /**
   * List conversions (referees who used a referral code).
   */
  async getConversions(
    codeId: string,
    options?: { status?: string },
  ): Promise<SDKResponse<ReferralConversion[]>> {
    return this.client.request<ReferralConversion[]>(
      `/referrals/${codeId}/conversions`,
      { params: { status: options?.status } },
    );
  }

  /**
   * Get comprehensive referral program statistics.
   *
   * @example
   * ```ts
   * const { data } = await client.referrals.getStats();
   * console.log(`${data.totalReferrals} total referrals`);
   * console.log(`Conversion rate: ${data.conversionRate}%`);
   * console.log(`Revenue generated: $${data.totalRevenueGenerated}`);
   * ```
   */
  async getStats(
    options?: { period?: '30d' | '90d' | '12m' | 'all' },
  ): Promise<SDKResponse<ReferralStats>> {
    return this.client.request<ReferralStats>('/referrals/stats', {
      params: { period: options?.period },
    });
  }

  /**
   * Revoke a referral code.
   */
  async revoke(codeId: string): Promise<SDKResponse<{ revoked: boolean }>> {
    return this.client.request<{ revoked: boolean }>(`/referrals/${codeId}/revoke`, {
      method: 'POST',
    });
  }
}
