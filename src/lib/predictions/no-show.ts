/**
 * No-Show Prediction Engine
 *
 * Scores upcoming appointments 0–100 on no-show risk.
 * Higher score = more likely to no-show.
 *
 * Used by:
 * - Dashboard schedule view (flag risky appointments)
 * - n8n WF3 (send extra reminder for high-risk)
 * - Provider daily briefing
 *
 * Factors:
 * 1. Client history (35%) — Past no-show rate
 * 2. Booking lead time (15%) — How far in advance they booked
 * 3. Deposit status (20%) — Paid deposit = much lower risk
 * 4. Membership status (10%) — Members rarely no-show
 * 5. Day & time patterns (10%) — Monday AM, Friday PM = higher
 * 6. Booking source (10%) — Online vs phone vs walk-in
 */

export interface NoShowInput {
  // Client factors
  totalAppointments: number;
  totalNoShows: number;
  isNewClient: boolean;
  hasMembership: boolean;
  daysSinceLastVisit: number;

  // Appointment factors
  depositPaid: boolean;
  depositAmount: number;
  bookingLeadDays: number; // How many days before appt was booked
  bookingSource: string; // Mangomint, Typeform, phone, walk-in
  dayOfWeek: number; // 0=Sun, 1=Mon, ... 6=Sat
  hourOfDay: number; // 0-23
  serviceCategory: string;
  isConsult: boolean;
}

export interface NoShowScore {
  score: number; // 0-100
  risk: 'low' | 'moderate' | 'high';
  factors: NoShowFactor[];
  recommendation: string;
}

export interface NoShowFactor {
  name: string;
  score: number;
  weight: number;
  detail: string;
}

const WEIGHTS = {
  history: 0.35,
  leadTime: 0.15,
  deposit: 0.20,
  membership: 0.10,
  timing: 0.10,
  source: 0.10,
};

// ── SCORING FUNCTIONS ──

function scoreHistory(totalAppts: number, totalNoShows: number, isNewClient: boolean): { score: number; detail: string } {
  if (isNewClient || totalAppts === 0) {
    return { score: 35, detail: 'New client — no history to analyze' };
  }

  const noShowRate = totalNoShows / totalAppts;

  if (noShowRate === 0) return { score: 5, detail: `Perfect attendance (${totalAppts} visits, 0 no-shows)` };
  if (noShowRate < 0.05) return { score: 10, detail: `Excellent (${totalNoShows}/${totalAppts} no-shows)` };
  if (noShowRate < 0.10) return { score: 25, detail: `Good (${totalNoShows}/${totalAppts} no-shows)` };
  if (noShowRate < 0.20) return { score: 50, detail: `Some no-shows (${totalNoShows}/${totalAppts})` };
  if (noShowRate < 0.35) return { score: 75, detail: `Frequent no-shows (${totalNoShows}/${totalAppts})` };
  return { score: 95, detail: `Chronic no-show (${totalNoShows}/${totalAppts} = ${Math.round(noShowRate * 100)}%)` };
}

function scoreLeadTime(days: number): { score: number; detail: string } {
  // Same-day bookings rarely no-show; far-out bookings forget
  if (days <= 0) return { score: 10, detail: 'Same-day booking' };
  if (days <= 2) return { score: 15, detail: `Booked ${days}d ago — recent` };
  if (days <= 7) return { score: 25, detail: `Booked ${days}d ago` };
  if (days <= 14) return { score: 40, detail: `Booked ${days}d ago — moderate gap` };
  if (days <= 30) return { score: 55, detail: `Booked ${days}d ago — may forget` };
  return { score: 70, detail: `Booked ${days}d ago — high forget risk` };
}

function scoreDeposit(paid: boolean, amount: number): { score: number; detail: string } {
  if (paid && amount >= 150) return { score: 5, detail: `$${amount} deposit paid — strong commitment` };
  if (paid && amount > 0) return { score: 15, detail: `$${amount} deposit paid` };
  return { score: 60, detail: 'No deposit — lower commitment signal' };
}

function scoreMembership(hasMembership: boolean): { score: number; detail: string } {
  if (hasMembership) return { score: 8, detail: 'Active member — very reliable' };
  return { score: 45, detail: 'Non-member' };
}

function scoreTiming(dayOfWeek: number, hour: number): { score: number; detail: string } {
  // Industry data: Monday mornings and Friday afternoons have higher no-show rates
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const day = dayNames[dayOfWeek] || 'Unknown';

  let score = 30; // baseline

  // Monday morning effect
  if (dayOfWeek === 1 && hour < 11) {
    score = 55;
    return { score, detail: `${day} morning — historically higher no-show rate` };
  }

  // Friday afternoon effect
  if (dayOfWeek === 5 && hour >= 15) {
    score = 50;
    return { score, detail: `${day} afternoon — weekend plans compete` };
  }

  // Weekend = lower no-show (people plan weekend appointments intentionally)
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    score = 15;
    return { score, detail: `${day} — weekend appointments are typically kept` };
  }

  // Midweek midday = best
  if (dayOfWeek >= 2 && dayOfWeek <= 4 && hour >= 10 && hour <= 15) {
    score = 20;
    return { score, detail: `${day} midday — optimal slot` };
  }

  // Early morning
  if (hour < 9) {
    score = 45;
    return { score, detail: `Early ${day} morning — slightly higher risk` };
  }

  // Late evening
  if (hour >= 18) {
    score = 40;
    return { score, detail: `${day} evening — end-of-day fatigue factor` };
  }

  return { score, detail: `${day} at ${hour > 12 ? hour - 12 : hour}${hour >= 12 ? 'PM' : 'AM'}` };
}

function scoreSource(source: string): { score: number; detail: string } {
  const s = source.toLowerCase();
  if (s.includes('walk-in') || s.includes('walkin')) {
    return { score: 5, detail: 'Walk-in — already present' };
  }
  if (s.includes('phone') || s.includes('call')) {
    return { score: 20, detail: 'Phone booking — personal commitment' };
  }
  if (s.includes('mangomint') || s.includes('online')) {
    return { score: 35, detail: 'Online booking — moderate commitment' };
  }
  if (s.includes('typeform') || s.includes('form') || s.includes('website')) {
    return { score: 40, detail: 'Web form — lower personal commitment' };
  }
  if (s.includes('referral')) {
    return { score: 15, detail: 'Referral — social commitment' };
  }
  return { score: 35, detail: `Source: ${source}` };
}

// ── MAIN ENGINE ──

export function predictNoShow(input: NoShowInput): NoShowScore {
  const history = scoreHistory(input.totalAppointments, input.totalNoShows, input.isNewClient);
  const leadTime = scoreLeadTime(input.bookingLeadDays);
  const deposit = scoreDeposit(input.depositPaid, input.depositAmount);
  const membership = scoreMembership(input.hasMembership);
  const timing = scoreTiming(input.dayOfWeek, input.hourOfDay);
  const source = scoreSource(input.bookingSource);

  const weightedScore = Math.round(
    history.score * WEIGHTS.history +
    leadTime.score * WEIGHTS.leadTime +
    deposit.score * WEIGHTS.deposit +
    membership.score * WEIGHTS.membership +
    timing.score * WEIGHTS.timing +
    source.score * WEIGHTS.source
  );

  const score = Math.min(100, Math.max(0, weightedScore));

  const risk: NoShowScore['risk'] =
    score >= 60 ? 'high' :
    score >= 35 ? 'moderate' :
    'low';

  const factors: NoShowFactor[] = [
    { name: 'Client History', score: history.score, weight: WEIGHTS.history * 100, detail: history.detail },
    { name: 'Deposit Status', score: deposit.score, weight: WEIGHTS.deposit * 100, detail: deposit.detail },
    { name: 'Booking Lead Time', score: leadTime.score, weight: WEIGHTS.leadTime * 100, detail: leadTime.detail },
    { name: 'Membership', score: membership.score, weight: WEIGHTS.membership * 100, detail: membership.detail },
    { name: 'Day & Time', score: timing.score, weight: WEIGHTS.timing * 100, detail: timing.detail },
    { name: 'Booking Source', score: source.score, weight: WEIGHTS.source * 100, detail: source.detail },
  ];

  const recommendation = getRecommendation(score, input);

  return { score, risk, factors, recommendation };
}

function getRecommendation(score: number, input: NoShowInput): string {
  if (score < 35) {
    return 'Low risk. Standard appointment reminders are sufficient.';
  }

  if (score >= 60) {
    const actions: string[] = [];
    if (!input.depositPaid) actions.push('Request deposit to confirm commitment');
    if (input.bookingLeadDays > 7) actions.push('Send extra reminder 48h before');
    actions.push('Consider personal call from provider day-before');
    if (input.isConsult) actions.push('Overbook this slot or add to waitlist backfill');
    return `HIGH RISK: ${actions.join('. ')}.`;
  }

  // Moderate
  if (!input.depositPaid) {
    return 'Moderate risk. Send additional SMS reminder and consider requesting a deposit.';
  }
  return 'Moderate risk. Send an extra reminder 24h before with prep instructions.';
}

/**
 * Quick score for batch processing (schedule view).
 * Returns just the score and risk level without detailed factors.
 */
export function quickNoShowScore(input: Partial<NoShowInput>): { score: number; risk: 'low' | 'moderate' | 'high' } {
  const full: NoShowInput = {
    totalAppointments: input.totalAppointments ?? 0,
    totalNoShows: input.totalNoShows ?? 0,
    isNewClient: input.isNewClient ?? true,
    hasMembership: input.hasMembership ?? false,
    daysSinceLastVisit: input.daysSinceLastVisit ?? 999,
    depositPaid: input.depositPaid ?? false,
    depositAmount: input.depositAmount ?? 0,
    bookingLeadDays: input.bookingLeadDays ?? 7,
    bookingSource: input.bookingSource ?? 'online',
    dayOfWeek: input.dayOfWeek ?? new Date().getDay(),
    hourOfDay: input.hourOfDay ?? 12,
    serviceCategory: input.serviceCategory ?? '',
    isConsult: input.isConsult ?? false,
  };
  const result = predictNoShow(full);
  return { score: result.score, risk: result.risk };
}
