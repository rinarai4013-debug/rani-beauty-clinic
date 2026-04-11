/**
 * RaniOS SDK - Clients Resource
 *
 * Access client profiles, churn risk predictions, treatment recommendations,
 * and at-risk client segments.
 */

import type { RaniOSClient, SDKPaginatedResponse, SDKResponse, SDKListParams } from '../client';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  preferredContact: 'email' | 'phone' | 'sms';
  status: 'lead' | 'booked' | 'active' | 'lapsed' | 'churned' | 'vip';
  segment: 'new' | 'regular' | 'vip' | 'at_risk';
  ltv: number;
  totalVisits: number;
  lastVisitDate: string | null;
  membershipStatus: 'none' | 'active' | 'cancelled' | 'expired';
  membershipTier: string | null;
  averageTicket: number;
  rebookRate: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ClientDetail extends Client {
  appointments: {
    id: string;
    service: string;
    date: string;
    status: string;
    provider: string;
    amount: number;
  }[];
  transactions: {
    id: string;
    amount: number;
    type: string;
    date: string;
    description: string;
  }[];
  memberships: {
    id: string;
    tier: string;
    status: string;
    startDate: string;
    renewalDate: string;
  }[];
  messages: {
    id: string;
    channel: 'sms' | 'email';
    direction: 'inbound' | 'outbound';
    content: string;
    sentAt: string;
  }[];
  reviews: {
    id: string;
    rating: number;
    text: string;
    source: string;
    date: string;
  }[];
}

export interface ChurnRisk {
  clientId: string;
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: {
    name: string;
    weight: number;
    score: number;
    description: string;
  }[];
  daysSinceLastVisit: number;
  predictedChurnDate: string | null;
  suggestedActions: string[];
}

export interface TreatmentRecommendation {
  service: string;
  category: string;
  strategy: 'pathway' | 'category_gap' | 'goal_based' | 'timing' | 'membership_upsell';
  confidence: number;
  reason: string;
  estimatedPrice: number;
  priority: 'high' | 'medium' | 'low';
}

export interface AtRiskClient {
  client: Pick<Client, 'id' | 'name' | 'email' | 'phone' | 'status' | 'ltv'>;
  churnRisk: ChurnRisk;
  urgency: 'immediate' | 'this_week' | 'this_month';
  reactivationTemplate: string;
}

export interface ClientsListParams extends SDKListParams {
  status?: string;
  segment?: string;
  search?: string;
  membershipStatus?: string;
  minLTV?: number;
  maxLTV?: number;
  lastVisitBefore?: string;
  lastVisitAfter?: string;
}

// ─── Resource ───────────────────────────────────────────────────────────────

export class ClientsResource {
  constructor(private readonly client: RaniOSClient) {}

  /**
   * List clients with filtering, pagination, and sorting.
   *
   * @example
   * ```ts
   * const { data, pagination } = await client.clients.list({
   *   status: 'active',
   *   segment: 'vip',
   *   page: 1,
   *   pageSize: 25,
   *   sortBy: 'ltv',
   *   sortOrder: 'desc',
   * });
   * ```
   */
  async list(params?: ClientsListParams): Promise<SDKPaginatedResponse<Client>> {
    return this.client.requestList<Client>('/clients', params);
  }

  /**
   * Get a single client by ID with full 360-degree profile.
   *
   * @example
   * ```ts
   * const { data } = await client.clients.get('rec_abc123', { full: true });
   * ```
   */
  async get(
    clientId: string,
    options?: { full?: boolean },
  ): Promise<SDKResponse<ClientDetail>> {
    return this.client.request<ClientDetail>(`/clients/${clientId}`, {
      params: { full: options?.full },
    });
  }

  /**
   * Get churn risk prediction for a specific client.
   * Uses 5-factor weighted model: recency (40%), frequency (20%),
   * monetary (15%), membership (15%), engagement (10%).
   *
   * @example
   * ```ts
   * const { data } = await client.clients.getChurnRisk('rec_abc123');
   * console.log(`Churn risk: ${data.level} (${data.score}/100)`);
   * ```
   */
  async getChurnRisk(clientId: string): Promise<SDKResponse<ChurnRisk>> {
    return this.client.request<ChurnRisk>(`/clients/${clientId}/churn`);
  }

  /**
   * Get AI-powered next-best-treatment recommendations for a client.
   * Uses 5 strategies: pathway continuation, category gaps, goal-based,
   * timing/overdue, and membership upsell.
   *
   * @example
   * ```ts
   * const { data } = await client.clients.getRecommendations('rec_abc123');
   * data.forEach(rec => console.log(`${rec.service}: ${rec.reason}`));
   * ```
   */
  async getRecommendations(
    clientId: string,
    options?: { limit?: number },
  ): Promise<SDKResponse<TreatmentRecommendation[]>> {
    return this.client.request<TreatmentRecommendation[]>(
      `/clients/${clientId}/recommend`,
      { params: { limit: options?.limit } },
    );
  }

  /**
   * Get all at-risk clients ranked by urgency.
   * Returns clients with churn risk scores and suggested reactivation actions.
   *
   * @example
   * ```ts
   * const { data } = await client.clients.getAtRisk({ urgency: 'immediate' });
   * console.log(`${data.length} clients need immediate attention`);
   * ```
   */
  async getAtRisk(
    options?: { urgency?: 'immediate' | 'this_week' | 'this_month'; limit?: number },
  ): Promise<SDKResponse<AtRiskClient[]>> {
    return this.client.request<AtRiskClient[]>('/clients/at-risk', {
      params: { urgency: options?.urgency, limit: options?.limit },
    });
  }
}
