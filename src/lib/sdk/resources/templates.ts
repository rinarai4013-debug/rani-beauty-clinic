/**
 * RaniOS SDK - Templates Resource
 *
 * Access and render communication templates for post-treatment follow-ups,
 * reactivation campaigns, and pre-consult sequences.
 */

import type { RaniOSClient, SDKResponse } from '../client';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TemplateStep {
  step: number;
  name: string;
  channel: 'email' | 'sms';
  delay: string;
  subject: string | null;
  body: string;
  htmlBody: string | null;
}

export interface PostTreatmentTemplate {
  service: string;
  category: string;
  clientName: string;
  providerName: string;
  steps: TemplateStep[];
  aftercareLink: string | null;
  variables: Record<string, string>;
}

export interface PostTreatmentRequest {
  clientName: string;
  service: string;
  provider: string;
  appointmentDate: string;
  email?: string;
  phone?: string;
}

export interface ReactivationTemplate {
  tier: 'lapsed_30' | 'lapsed_60' | 'lapsed_90';
  clientName: string;
  daysSinceLastVisit: number;
  lastService: string;
  steps: TemplateStep[];
  urgency: 'gentle' | 'moderate' | 'urgent';
  incentive: {
    type: 'discount' | 'addon' | 'priority' | 'none';
    value: string;
    description: string;
  };
  variables: Record<string, string>;
}

export interface ReactivationRequest {
  clientName: string;
  email?: string;
  phone?: string;
  daysSinceLastVisit?: number;
  lastService?: string;
  tier?: 'lapsed_30' | 'lapsed_60' | 'lapsed_90';
}

export interface PreConsultTemplate {
  service: string;
  category: 'laser' | 'injectable' | 'facial' | 'wellness' | 'body' | 'consult';
  clientName: string;
  isNewClient: boolean;
  steps: TemplateStep[];
  prepInstructions: string[];
  whatToBring: string[];
  estimatedDuration: string;
  variables: Record<string, string>;
}

export interface PreConsultRequest {
  clientName: string;
  service: string;
  appointmentDate: string;
  appointmentTime: string;
  isNewClient?: boolean;
  email?: string;
  phone?: string;
  provider?: string;
}

// ─── Resource ───────────────────────────────────────────────────────────────

export class TemplatesResource {
  constructor(private readonly client: RaniOSClient) {}

  /**
   * Render post-treatment follow-up templates.
   * Returns a 5-step sequence: immediate, 24h, 72h, 7-day, 30-day
   * with branded HTML emails and service-specific aftercare.
   *
   * @example
   * ```ts
   * const { data } = await client.templates.postTreatment({
   *   clientName: 'Jane Doe',
   *   service: 'Sofwave',
   *   provider: 'Dr. Kim',
   *   appointmentDate: '2026-03-25',
   * });
   * console.log(`${data.steps.length}-step follow-up sequence`);
   * data.steps.forEach(s => console.log(`Step ${s.step}: ${s.name} (${s.delay})`));
   * ```
   */
  async postTreatment(
    request: PostTreatmentRequest,
  ): Promise<SDKResponse<PostTreatmentTemplate>> {
    return this.client.request<PostTreatmentTemplate>('/templates/post-treatment', {
      method: 'POST',
      body: request,
    });
  }

  /**
   * Render reactivation campaign templates.
   * Auto-detects tier (30/60/90 days lapsed) from daysSinceLastVisit.
   * Returns urgency-appropriate messaging with tiered incentives.
   *
   * @example
   * ```ts
   * const { data } = await client.templates.reactivation({
   *   clientName: 'Jane Doe',
   *   daysSinceLastVisit: 45,
   *   lastService: 'HydraFacial',
   * });
   * console.log(`Tier: ${data.tier} (${data.urgency} urgency)`);
   * console.log(`Incentive: ${data.incentive.description}`);
   * ```
   */
  async reactivation(
    request: ReactivationRequest,
  ): Promise<SDKResponse<ReactivationTemplate>> {
    return this.client.request<ReactivationTemplate>('/templates/reactivation', {
      method: 'POST',
      body: request,
    });
  }

  /**
   * Render pre-consult communication templates.
   * Returns a 3-step sequence (booking confirmation, 24h reminder, 2h reminder)
   * with service-specific preparation instructions.
   *
   * @example
   * ```ts
   * const { data } = await client.templates.preConsult({
   *   clientName: 'Jane Doe',
   *   service: 'PicoWay Laser',
   *   appointmentDate: '2026-03-28',
   *   appointmentTime: '10:00 AM',
   *   isNewClient: true,
   * });
   * console.log(`Prep instructions: ${data.prepInstructions.join(', ')}`);
   * console.log(`Estimated duration: ${data.estimatedDuration}`);
   * ```
   */
  async preConsult(
    request: PreConsultRequest,
  ): Promise<SDKResponse<PreConsultTemplate>> {
    return this.client.request<PreConsultTemplate>('/templates/pre-consult', {
      method: 'POST',
      body: request,
    });
  }
}
