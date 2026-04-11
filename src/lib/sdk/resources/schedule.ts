/**
 * RaniOS SDK - Schedule Resource
 *
 * Access daily schedules and schedule optimization results.
 */

import type { RaniOSClient, SDKResponse } from '../client';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ScheduleEntry {
  id: string;
  clientName: string;
  clientId: string;
  service: string;
  category: string;
  provider: string;
  time: string;
  duration: number;
  status: 'scheduled' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  room: string | null;
  estimatedRevenue: number;
  isConsult: boolean;
  noShowRiskScore: number | null;
  notes: string | null;
}

export interface DailySchedule {
  date: string;
  entries: ScheduleEntry[];
  summary: {
    totalAppointments: number;
    totalConsults: number;
    estimatedRevenue: number;
    utilization: number;
    providers: { name: string; appointmentCount: number; utilization: number }[];
  };
}

export interface ScheduleGap {
  provider: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  revenuePotential: number;
  suggestedServices: string[];
}

export interface ScheduleConflict {
  type: 'double_booking' | 'room_conflict' | 'equipment_conflict' | 'insufficient_buffer' | 'overtime';
  severity: 'low' | 'medium' | 'high';
  appointmentIds: string[];
  description: string;
  resolution: string;
}

export interface ProviderBalance {
  provider: string;
  appointmentCount: number;
  utilization: number;
  revenueShare: number;
  status: 'underloaded' | 'balanced' | 'overloaded';
}

export interface RevenueOpportunity {
  type: 'upgrade' | 'addon' | 'reschedule' | 'fill_gap' | 'waitlist';
  description: string;
  potentialRevenue: number;
  clientId: string | null;
  clientName: string | null;
  priority: 'high' | 'medium' | 'low';
}

export interface ScheduleOptimization {
  date: string;
  efficiencyScore: number;
  gaps: ScheduleGap[];
  conflicts: ScheduleConflict[];
  providerBalance: ProviderBalance[];
  revenueOpportunities: RevenueOpportunity[];
  recommendations: string[];
}

// ─── Resource ───────────────────────────────────────────────────────────────

export class ScheduleResource {
  constructor(private readonly client: RaniOSClient) {}

  /**
   * Get today's schedule with all appointments, provider summaries,
   * and utilization data.
   *
   * @example
   * ```ts
   * const { data } = await client.schedule.getToday();
   * console.log(`${data.summary.totalAppointments} appointments today`);
   * console.log(`Estimated revenue: $${data.summary.estimatedRevenue}`);
   * ```
   */
  async getToday(): Promise<SDKResponse<DailySchedule>> {
    return this.client.request<DailySchedule>('/schedule/today');
  }

  /**
   * Get schedule for a specific date.
   *
   * @example
   * ```ts
   * const { data } = await client.schedule.getByDate('2026-03-28');
   * ```
   */
  async getByDate(date: string): Promise<SDKResponse<DailySchedule>> {
    return this.client.request<DailySchedule>('/schedule', {
      params: { date },
    });
  }

  /**
   * Run schedule optimization analysis.
   * Detects gaps, conflicts, provider balance issues, and revenue opportunities.
   *
   * @example
   * ```ts
   * const { data } = await client.schedule.optimize();
   * console.log(`Efficiency: ${data.efficiencyScore}/100`);
   * console.log(`${data.gaps.length} scheduling gaps found`);
   * console.log(`${data.conflicts.length} conflicts detected`);
   * data.revenueOpportunities.forEach(opp => {
   *   console.log(`$${opp.potentialRevenue} opportunity: ${opp.description}`);
   * });
   * ```
   */
  async optimize(date?: string): Promise<SDKResponse<ScheduleOptimization>> {
    return this.client.request<ScheduleOptimization>('/schedule/optimize', {
      params: { date },
    });
  }
}
