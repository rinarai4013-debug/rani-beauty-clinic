/**
 * RaniOS SDK - Loyalty Resource
 *
 * Manage loyalty members, award points, and redeem rewards.
 */

import type { RaniOSClient, SDKResponse, SDKPaginatedResponse, SDKListParams } from '../client';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface LoyaltyMember {
  id: string;
  clientId: string;
  clientName: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  pointsBalance: number;
  lifetimePoints: number;
  pointsExpiring: number;
  pointsExpiryDate: string | null;
  memberSince: string;
  lastPointsEarned: string | null;
  nextTierThreshold: number | null;
  pointsToNextTier: number | null;
  rewardsRedeemed: number;
  referralCount: number;
  status: 'active' | 'inactive' | 'suspended';
}

export interface PointsTransaction {
  id: string;
  memberId: string;
  type: 'earned' | 'redeemed' | 'expired' | 'adjusted' | 'bonus';
  amount: number;
  balance: number;
  description: string;
  source: 'appointment' | 'referral' | 'review' | 'manual' | 'promo' | 'birthday';
  appointmentId: string | null;
  createdAt: string;
  createdBy: string;
}

export interface LoyaltyReward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  category: 'discount' | 'service' | 'product' | 'upgrade' | 'experience';
  value: number;
  available: boolean;
  minTier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  redemptionCount: number;
  imageUrl: string | null;
}

export interface AwardPointsParams {
  memberId: string;
  amount: number;
  source: 'appointment' | 'referral' | 'review' | 'manual' | 'promo' | 'birthday';
  description: string;
  appointmentId?: string;
}

export interface RedeemRewardParams {
  memberId: string;
  rewardId: string;
  notes?: string;
}

export interface RedeemRewardResult {
  transactionId: string;
  pointsDeducted: number;
  newBalance: number;
  reward: LoyaltyReward;
  redemptionCode: string;
  expiresAt: string;
}

// ─── Resource ───────────────────────────────────────────────────────────────

export class LoyaltyResource {
  constructor(private readonly client: RaniOSClient) {}

  /**
   * Get loyalty member details by member ID or client ID.
   *
   * @example
   * ```ts
   * const { data } = await client.loyalty.getMember('mem_abc123');
   * console.log(`${data.clientName}: ${data.pointsBalance} points (${data.tier})`);
   * ```
   */
  async getMember(memberId: string): Promise<SDKResponse<LoyaltyMember>> {
    return this.client.request<LoyaltyMember>(`/loyalty/members/${memberId}`);
  }

  /**
   * List all loyalty members with filtering.
   *
   * @example
   * ```ts
   * const { data } = await client.loyalty.listMembers({
   *   tier: 'gold',
   *   status: 'active',
   * });
   * ```
   */
  async listMembers(
    params?: SDKListParams & { tier?: string; status?: string },
  ): Promise<SDKPaginatedResponse<LoyaltyMember>> {
    return this.client.requestList<LoyaltyMember>('/loyalty/members', params);
  }

  /**
   * Get points transaction history for a member.
   *
   * @example
   * ```ts
   * const { data } = await client.loyalty.getPointsHistory('mem_abc123', { limit: 50 });
   * ```
   */
  async getPointsHistory(
    memberId: string,
    options?: { limit?: number; type?: string },
  ): Promise<SDKResponse<PointsTransaction[]>> {
    return this.client.request<PointsTransaction[]>(
      `/loyalty/members/${memberId}/points`,
      { params: { limit: options?.limit, type: options?.type } },
    );
  }

  /**
   * Award points to a loyalty member.
   *
   * @example
   * ```ts
   * const { data } = await client.loyalty.awardPoints({
   *   memberId: 'mem_abc123',
   *   amount: 500,
   *   source: 'appointment',
   *   description: 'Sofwave treatment completed',
   *   appointmentId: 'apt_xyz789',
   * });
   * ```
   */
  async awardPoints(params: AwardPointsParams): Promise<SDKResponse<PointsTransaction>> {
    return this.client.request<PointsTransaction>(
      `/loyalty/members/${params.memberId}/points`,
      { method: 'POST', body: params },
    );
  }

  /**
   * Redeem a reward for a loyalty member.
   *
   * @example
   * ```ts
   * const { data } = await client.loyalty.redeemReward({
   *   memberId: 'mem_abc123',
   *   rewardId: 'rwd_def456',
   *   notes: 'Client requested during checkout',
   * });
   * console.log(`Redemption code: ${data.redemptionCode}`);
   * ```
   */
  async redeemReward(params: RedeemRewardParams): Promise<SDKResponse<RedeemRewardResult>> {
    return this.client.request<RedeemRewardResult>(
      `/loyalty/members/${params.memberId}/redeem`,
      { method: 'POST', body: params },
    );
  }

  /**
   * List available rewards.
   *
   * @example
   * ```ts
   * const { data } = await client.loyalty.listRewards({ category: 'service' });
   * ```
   */
  async listRewards(
    options?: { category?: string; minTier?: string },
  ): Promise<SDKResponse<LoyaltyReward[]>> {
    return this.client.request<LoyaltyReward[]>('/loyalty/rewards', {
      params: { category: options?.category, minTier: options?.minTier },
    });
  }
}
