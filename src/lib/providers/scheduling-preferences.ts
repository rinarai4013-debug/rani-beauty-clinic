/**
 * Provider Schedule Management Engine
 *
 * Working hours, time-off requests, PTO balance tracking,
 * shift swaps, overtime calculation, schedule templates,
 * coverage requirements, and holiday schedule bidding.
 */

import type {
  WorkingHours,
  TimeOffRequest,
  TimeOffBalance,
  TimeOffType,
  TimeOffStatus,
  ShiftSwapRequest,
  OvertimeRecord,
  ScheduleTemplate,
  CoverageCheck,
} from '@/types/providers';

function parseDateUtc(date: string): Date {
  const value = date.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00Z`);
  }
  return new Date(value);
}

function formatDateUtc(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ── DEFAULTS ──

export const DEFAULT_WORKING_HOURS: Omit<WorkingHours, 'providerId'>[] = [
  { dayOfWeek: 0, startTime: '00:00', endTime: '00:00', isWorkday: false },
  { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', isWorkday: true },
  { dayOfWeek: 2, startTime: '09:00', endTime: '18:00', isWorkday: true },
  { dayOfWeek: 3, startTime: '09:00', endTime: '18:00', isWorkday: true },
  { dayOfWeek: 4, startTime: '09:00', endTime: '18:00', isWorkday: true },
  { dayOfWeek: 5, startTime: '09:00', endTime: '17:00', isWorkday: true },
  { dayOfWeek: 6, startTime: '10:00', endTime: '15:00', isWorkday: true },
];

export const DEFAULT_PTO_ALLOWANCES: Record<TimeOffType, number> = {
  pto: 80, // 10 days
  sick: 40, // 5 days
  personal: 24, // 3 days
  bereavement: 24, // 3 days
  jury_duty: 40, // 5 days
  holiday: 48, // 6 days (clinic-observed)
};

export const OVERTIME_THRESHOLD_WEEKLY = 40; // hours
export const OVERTIME_RATE_MULTIPLIER = 1.5;
export const MINIMUM_PROVIDERS_ON_DUTY = 1;

// ── WORKING HOURS ──

export function getProviderWorkingHours(
  allHours: WorkingHours[],
  providerId: string,
): WorkingHours[] {
  return allHours.filter(h => h.providerId === providerId);
}

export function getHoursForDay(
  workingHours: WorkingHours[],
  dayOfWeek: number,
): WorkingHours | null {
  return workingHours.find(h => h.dayOfWeek === dayOfWeek) ?? null;
}

export function calculateDailyHours(hours: WorkingHours): number {
  if (!hours.isWorkday) return 0;
  const [startH, startM] = hours.startTime.split(':').map(Number);
  const [endH, endM] = hours.endTime.split(':').map(Number);
  return (endH + endM / 60) - (startH + startM / 60);
}

export function calculateWeeklyHours(workingHours: WorkingHours[]): number {
  return workingHours.reduce((total, h) => total + calculateDailyHours(h), 0);
}

export function isProviderAvailable(
  workingHours: WorkingHours[],
  date: string,
  timeOffRequests: TimeOffRequest[],
): boolean {
  const d = parseDateUtc(date);
  const dayOfWeek = d.getUTCDay();
  const hours = getHoursForDay(workingHours, dayOfWeek);

  if (!hours || !hours.isWorkday) return false;

  // Check time-off
  const dateStr = date.split('T')[0];
  const hasApprovedTimeOff = timeOffRequests.some(
    req => req.status === 'approved' &&
      dateStr >= req.startDate &&
      dateStr <= req.endDate,
  );

  return !hasApprovedTimeOff;
}

// ── TIME-OFF MANAGEMENT ──

export function calculateTimeOffHours(startDate: string, endDate: string, workingHours: WorkingHours[]): number {
  let totalHours = 0;
  const start = parseDateUtc(startDate);
  const end = parseDateUtc(endDate);

  const current = new Date(start);
  while (current <= end) {
    const dayOfWeek = current.getUTCDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
    const hours = workingHours.find(h => h.dayOfWeek === dayOfWeek);
    if (hours && hours.isWorkday) {
      totalHours += calculateDailyHours(hours);
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return Math.round(totalHours * 100) / 100;
}

export function calculateTimeOffBalance(
  requests: TimeOffRequest[],
  type: TimeOffType,
  annualAllowance: number,
  carryOver: number = 0,
): TimeOffBalance {
  const typeRequests = requests.filter(r => r.type === type);
  const used = typeRequests
    .filter(r => r.status === 'approved')
    .reduce((sum, r) => sum + r.hours, 0);
  const pending = typeRequests
    .filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + r.hours, 0);

  return {
    providerId: '',
    type,
    annualAllowance,
    used,
    pending,
    available: annualAllowance + carryOver - used,
    carryOver,
  };
}

export function getAllTimeOffBalances(
  requests: TimeOffRequest[],
  allowances: Record<TimeOffType, number> = DEFAULT_PTO_ALLOWANCES,
  carryOvers: Record<TimeOffType, number> = {} as Record<TimeOffType, number>,
): TimeOffBalance[] {
  return (Object.keys(allowances) as TimeOffType[]).map(type =>
    calculateTimeOffBalance(requests, type, allowances[type], carryOvers[type] ?? 0),
  );
}

export function validateTimeOffRequest(
  request: Omit<TimeOffRequest, 'id' | 'status' | 'requestedAt'>,
  balance: TimeOffBalance,
  existingRequests: TimeOffRequest[],
): { valid: boolean; reason?: string } {
  // Check sufficient balance
  if (request.hours > balance.available) {
    return {
      valid: false,
      reason: `Insufficient ${request.type} balance. Available: ${balance.available}h, Requested: ${request.hours}h`,
    };
  }

  // Check for overlapping approved requests
  const hasOverlap = existingRequests.some(
    existing =>
      existing.providerId === request.providerId &&
      existing.status === 'approved' &&
      request.startDate <= existing.endDate &&
      request.endDate >= existing.startDate,
  );

  if (hasOverlap) {
    return { valid: false, reason: 'Overlapping approved time-off request exists' };
  }

  // Check minimum notice (at least 2 weeks for PTO)
  if (request.type === 'pto') {
    const requestDate = parseDateUtc(request.startDate);
    const now = new Date();
    const daysNotice = (requestDate.getTime() - now.getTime()) / 86400000;
    if (daysNotice < 14) {
      return { valid: false, reason: 'PTO requests require at least 14 days notice' };
    }
  }

  return { valid: true };
}

// ── SHIFT SWAP ──

export function validateShiftSwap(
  swap: Omit<ShiftSwapRequest, 'id' | 'status' | 'requestedAt'>,
  requesterHours: WorkingHours[],
  targetHours: WorkingHours[],
): { valid: boolean; reason?: string } {
  const originalDate = parseDateUtc(swap.originalDate);
  const swapDate = parseDateUtc(swap.swapDate);
  const originalDay = originalDate.getUTCDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const swapDay = swapDate.getUTCDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;

  const requesterOriginal = requesterHours.find(h => h.dayOfWeek === originalDay);
  const targetSwap = targetHours.find(h => h.dayOfWeek === swapDay);

  if (!requesterOriginal?.isWorkday) {
    return { valid: false, reason: 'Requester is not scheduled on the original date' };
  }

  if (!targetSwap?.isWorkday) {
    return { valid: false, reason: 'Target provider is not scheduled on the swap date' };
  }

  // Check dates are in the future
  const now = new Date();
  if (originalDate < now || swapDate < now) {
    return { valid: false, reason: 'Swap dates must be in the future' };
  }

  return { valid: true };
}

// ── OVERTIME ──

export function calculateOvertime(
  hoursWorked: number,
  hourlyRate: number,
  threshold: number = OVERTIME_THRESHOLD_WEEKLY,
  multiplier: number = OVERTIME_RATE_MULTIPLIER,
): OvertimeRecord {
  const regularHours = Math.min(hoursWorked, threshold);
  const overtimeHours = Math.max(0, hoursWorked - threshold);
  const overtimeRate = hourlyRate * multiplier;
  const overtimePay = Math.round(overtimeHours * overtimeRate * 100) / 100;

  return {
    providerId: '',
    weekStartDate: '',
    regularHours,
    overtimeHours,
    overtimeRate,
    overtimePay,
  };
}

// ── COVERAGE CHECKING ──

export function checkCoverage(
  date: string,
  allProviderHours: Map<string, WorkingHours[]>,
  timeOffRequests: TimeOffRequest[],
  minimumProviders: number = MINIMUM_PROVIDERS_ON_DUTY,
): CoverageCheck {
  const d = parseDateUtc(date);
  const dayOfWeek = d.getUTCDay();
  const dateStr = formatDateUtc(d);

  const providersAvailable: string[] = [];

  for (const [providerId, hours] of allProviderHours) {
    const dayHours = hours.find(h => h.dayOfWeek === dayOfWeek);
    if (!dayHours || !dayHours.isWorkday) continue;

    const hasTimeOff = timeOffRequests.some(
      req => req.providerId === providerId &&
        req.status === 'approved' &&
        dateStr >= req.startDate &&
        dateStr <= req.endDate,
    );

    if (!hasTimeOff) {
      providersAvailable.push(providerId);
    }
  }

  // Simple gap detection - check 1-hour blocks from 9-18
  const gaps: { time: string; duration: number }[] = [];
  if (providersAvailable.length < minimumProviders) {
    gaps.push({ time: '09:00-18:00', duration: 9 });
  }

  return {
    date: dateStr,
    timeSlot: '09:00-18:00',
    providersAvailable,
    meetsMinimum: providersAvailable.length >= minimumProviders,
    minimumRequired: minimumProviders,
    gaps,
  };
}

export function checkWeekCoverage(
  weekStartDate: string,
  allProviderHours: Map<string, WorkingHours[]>,
  timeOffRequests: TimeOffRequest[],
  minimumProviders: number = MINIMUM_PROVIDERS_ON_DUTY,
): CoverageCheck[] {
  const results: CoverageCheck[] = [];
  const start = parseDateUtc(weekStartDate);

  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setUTCDate(date.getUTCDate() + i);
    results.push(checkCoverage(formatDateUtc(date), allProviderHours, timeOffRequests, minimumProviders));
  }

  return results;
}

// ── SCHEDULE TEMPLATES ──

export function applyScheduleTemplate(
  template: ScheduleTemplate,
  startDate: string,
): { providerId: string; date: string; startTime: string; endTime: string }[] {
  const assignments: { providerId: string; date: string; startTime: string; endTime: string }[] = [];
  const start = parseDateUtc(startDate);

  for (let week = 0; week < template.weeks; week++) {
    for (const shift of template.shifts) {
      const date = new Date(start);
      date.setUTCDate(date.getUTCDate() + week * 7 + shift.dayOfWeek);

      assignments.push({
        providerId: shift.providerId,
        date: formatDateUtc(date),
        startTime: shift.startTime,
        endTime: shift.endTime,
      });
    }
  }

  return assignments;
}

// ── HOLIDAY BIDDING ──

export interface HolidayBid {
  providerId: string;
  holiday: string;
  date: string;
  preference: 'work' | 'off';
  priority: number; // 1 = highest
}

export function resolveHolidayBids(
  bids: HolidayBid[],
  minimumProviders: number = MINIMUM_PROVIDERS_ON_DUTY,
): { assigned: { providerId: string; date: string; working: boolean }[]; conflicts: string[] } {
  const byDate = new Map<string, HolidayBid[]>();
  for (const bid of bids) {
    const existing = byDate.get(bid.date) || [];
    existing.push(bid);
    byDate.set(bid.date, existing);
  }

  const assigned: { providerId: string; date: string; working: boolean }[] = [];
  const conflicts: string[] = [];

  for (const [date, dateBids] of byDate) {
    const wantOff = dateBids.filter(b => b.preference === 'off').sort((a, b) => a.priority - b.priority);
    const wantWork = dateBids.filter(b => b.preference === 'work').sort((a, b) => a.priority - b.priority);

    // Ensure minimum coverage
    const totalProviders = dateBids.length;
    const maxOff = totalProviders - minimumProviders;

    if (wantOff.length > maxOff) {
      conflicts.push(`${date}: ${wantOff.length} providers requested off, only ${maxOff} can be accommodated`);
    }

    // Grant off to highest priority first
    let offGranted = 0;
    for (const bid of wantOff) {
      if (offGranted < maxOff) {
        assigned.push({ providerId: bid.providerId, date, working: false });
        offGranted++;
      } else {
        assigned.push({ providerId: bid.providerId, date, working: true });
      }
    }

    for (const bid of wantWork) {
      assigned.push({ providerId: bid.providerId, date, working: true });
    }
  }

  return { assigned, conflicts };
}
