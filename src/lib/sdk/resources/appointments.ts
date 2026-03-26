/**
 * RaniOS SDK - Appointments Resource
 *
 * Access appointment data, upcoming schedules, and no-show risk predictions.
 */

import type { RaniOSClient, SDKPaginatedResponse, SDKResponse, SDKListParams } from '../client';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  service: string;
  category: string;
  provider: string;
  date: string;
  time: string;
  duration: number;
  status: 'scheduled' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  isConsult: boolean;
  consultType: string | null;
  consultOutcome: string | null;
  depositAmount: number;
  depositPaid: boolean;
  estimatedRevenue: number;
  notes: string | null;
  source: 'online' | 'phone' | 'walk_in' | 'referral' | 'mangomint';
  createdAt: string;
}

export interface NoShowRisk {
  appointmentId: string;
  clientId: string;
  clientName: string;
  service: string;
  date: string;
  time: string;
  score: number;
  level: 'low' | 'moderate' | 'high';
  factors: {
    name: string;
    weight: number;
    score: number;
    description: string;
  }[];
  suggestedActions: string[];
}

export interface AppointmentsListParams extends SDKListParams {
  status?: string;
  provider?: string;
  service?: string;
  dateFrom?: string;
  dateTo?: string;
  isConsult?: boolean;
  clientId?: string;
}

export interface UpcomingOptions {
  days?: number;
  provider?: string;
  includeNoShowRisk?: boolean;
}

// ─── Resource ───────────────────────────────────────────────────────────────

export class AppointmentsResource {
  constructor(private readonly client: RaniOSClient) {}

  /**
   * List appointments with filtering and pagination.
   *
   * @example
   * ```ts
   * const { data } = await client.appointments.list({
   *   status: 'scheduled',
   *   dateFrom: '2026-03-25',
   *   dateTo: '2026-03-31',
   *   provider: 'Dr. Mom',
   * });
   * ```
   */
  async list(params?: AppointmentsListParams): Promise<SDKPaginatedResponse<Appointment>> {
    return this.client.requestList<Appointment>('/appointments', params as Record<string, string | number | boolean | undefined>);
  }

  /**
   * Get a single appointment by ID.
   *
   * @example
   * ```ts
   * const { data } = await client.appointments.get('apt_abc123');
   * ```
   */
  async get(appointmentId: string): Promise<SDKResponse<Appointment>> {
    return this.client.request<Appointment>(`/appointments/${appointmentId}`);
  }

  /**
   * Get upcoming appointments for the next N days (default: 7).
   *
   * @example
   * ```ts
   * const { data } = await client.appointments.getUpcoming({
   *   days: 7,
   *   provider: 'Rina',
   *   includeNoShowRisk: true,
   * });
   * ```
   */
  async getUpcoming(
    options?: UpcomingOptions,
  ): Promise<SDKResponse<(Appointment & { noShowRisk?: NoShowRisk })[]>> {
    return this.client.request<(Appointment & { noShowRisk?: NoShowRisk })[]>(
      '/appointments/upcoming',
      {
        params: {
          days: options?.days,
          provider: options?.provider,
          includeNoShowRisk: options?.includeNoShowRisk,
        },
      },
    );
  }

  /**
   * Get no-show risk scores for all upcoming appointments on a given date.
   * Uses 6-factor weighted model: history (35%), deposit (20%), lead time (15%),
   * membership (10%), timing (10%), source (10%).
   *
   * @example
   * ```ts
   * const { data } = await client.appointments.getNoShowRisk('2026-03-25');
   * const highRisk = data.filter(r => r.level === 'high');
   * console.log(`${highRisk.length} appointments at high no-show risk`);
   * ```
   */
  async getNoShowRisk(
    date?: string,
  ): Promise<SDKResponse<NoShowRisk[]>> {
    return this.client.request<NoShowRisk[]>('/appointments/no-show-risk', {
      params: { date },
    });
  }
}
