/**
 * Dose & Titration Management
 * Rani Beauty Clinic
 *
 * Tracks current dose levels, titration schedules, side effects,
 * dose adjustment recommendations, monthly check-ins, and quarterly labs.
 */

import type {
  DoseLevel,
  SemaglutideDose,
  TirzepatideDose,
  DoseRecord,
  TitrationEntry,
  SideEffectReport,
  SideEffectSeverity,
  CheckInRecord,
} from './types';

// ============================================================
// DOSE DEFINITIONS
// ============================================================

/** Semaglutide dose levels with mg amounts */
export const SEMAGLUTIDE_DOSES: Record<SemaglutideDose, { mg: number; label: string; weeklyDose: string }> = {
  'SEMA-D1': { mg: 0.25, label: 'Starting Dose', weeklyDose: '0.25mg weekly' },
  'SEMA-D2': { mg: 0.5, label: 'Titration 1', weeklyDose: '0.5mg weekly' },
  'SEMA-D3': { mg: 1.0, label: 'Titration 2', weeklyDose: '1.0mg weekly' },
  'SEMA-D4': { mg: 2.4, label: 'Maintenance Dose', weeklyDose: '2.4mg weekly' },
};

/** Tirzepatide dose levels with mg amounts */
export const TIRZEPATIDE_DOSES: Record<TirzepatideDose, { mg: number; label: string; weeklyDose: string }> = {
  'TIRZ-D1': { mg: 2.5, label: 'Starting Dose', weeklyDose: '2.5mg weekly' },
  'TIRZ-D2': { mg: 5.0, label: 'Titration 1', weeklyDose: '5.0mg weekly' },
  'TIRZ-D3': { mg: 10.0, label: 'Titration 2', weeklyDose: '10.0mg weekly' },
  'TIRZ-D4': { mg: 15.0, label: 'Maintenance Dose', weeklyDose: '15.0mg weekly' },
};

/** Ordered dose levels for each medication */
export const SEMAGLUTIDE_DOSE_ORDER: SemaglutideDose[] = ['SEMA-D1', 'SEMA-D2', 'SEMA-D3', 'SEMA-D4'];
export const TIRZEPATIDE_DOSE_ORDER: TirzepatideDose[] = ['TIRZ-D1', 'TIRZ-D2', 'TIRZ-D3', 'TIRZ-D4'];

// ============================================================
// TITRATION SCHEDULE
// ============================================================

/** Titration schedule: weeks at each dose before eligible to increase */
export interface TitrationSchedule {
  doseLevel: DoseLevel;
  minWeeksAtDose: number;
  maxWeeksAtDose: number;
  recommendedWeeks: number;
  canHoldAtDose: boolean;
  notes: string;
}

/** Semaglutide titration schedule */
export const SEMAGLUTIDE_TITRATION: TitrationSchedule[] = [
  {
    doseLevel: 'SEMA-D1',
    minWeeksAtDose: 4,
    maxWeeksAtDose: 8,
    recommendedWeeks: 4,
    canHoldAtDose: true,
    notes: 'Starting dose. Most patients tolerate well. 4 weeks minimum before titration.',
  },
  {
    doseLevel: 'SEMA-D2',
    minWeeksAtDose: 4,
    maxWeeksAtDose: 8,
    recommendedWeeks: 4,
    canHoldAtDose: true,
    notes: 'First titration. Monitor for nausea. Can hold longer if needed.',
  },
  {
    doseLevel: 'SEMA-D3',
    minWeeksAtDose: 4,
    maxWeeksAtDose: 12,
    recommendedWeeks: 4,
    canHoldAtDose: true,
    notes: 'Second titration. Many patients achieve good results here. Holding is common.',
  },
  {
    doseLevel: 'SEMA-D4',
    minWeeksAtDose: 0,
    maxWeeksAtDose: Infinity,
    recommendedWeeks: 0,
    canHoldAtDose: true,
    notes: 'Maintenance dose. Maximum therapeutic dose. Ongoing treatment.',
  },
];

/** Tirzepatide titration schedule */
export const TIRZEPATIDE_TITRATION: TitrationSchedule[] = [
  {
    doseLevel: 'TIRZ-D1',
    minWeeksAtDose: 4,
    maxWeeksAtDose: 8,
    recommendedWeeks: 4,
    canHoldAtDose: true,
    notes: 'Starting dose. Generally well tolerated. 4 weeks minimum.',
  },
  {
    doseLevel: 'TIRZ-D2',
    minWeeksAtDose: 4,
    maxWeeksAtDose: 8,
    recommendedWeeks: 4,
    canHoldAtDose: true,
    notes: 'First titration. Watch for GI side effects.',
  },
  {
    doseLevel: 'TIRZ-D3',
    minWeeksAtDose: 4,
    maxWeeksAtDose: 12,
    recommendedWeeks: 4,
    canHoldAtDose: true,
    notes: 'Second titration. Strong therapeutic effect. Many patients maintain here.',
  },
  {
    doseLevel: 'TIRZ-D4',
    minWeeksAtDose: 0,
    maxWeeksAtDose: Infinity,
    recommendedWeeks: 0,
    canHoldAtDose: true,
    notes: 'Maximum dose. Only if needed for continued weight loss.',
  },
];

// ============================================================
// SIDE EFFECTS DATABASE
// ============================================================

/** Known side effects by dose level */
export interface DoseSideEffectProfile {
  doseLevel: DoseLevel;
  commonEffects: string[];
  uncommonEffects: string[];
  seriousEffects: string[];
  frequency: string;
}

export const SEMAGLUTIDE_SIDE_EFFECTS: DoseSideEffectProfile[] = [
  {
    doseLevel: 'SEMA-D1',
    commonEffects: ['Mild nausea', 'Decreased appetite', 'Injection site redness'],
    uncommonEffects: ['Headache', 'Fatigue', 'Mild constipation'],
    seriousEffects: ['Severe nausea/vomiting', 'Allergic reaction'],
    frequency: 'Common effects in ~30% of patients at this dose',
  },
  {
    doseLevel: 'SEMA-D2',
    commonEffects: ['Nausea', 'Decreased appetite', 'Diarrhea', 'Constipation'],
    uncommonEffects: ['Headache', 'Abdominal pain', 'Fatigue', 'Dizziness'],
    seriousEffects: ['Severe abdominal pain', 'Pancreatitis symptoms', 'Allergic reaction'],
    frequency: 'Common effects in ~40% of patients at this dose',
  },
  {
    doseLevel: 'SEMA-D3',
    commonEffects: ['Nausea', 'Vomiting', 'Diarrhea', 'Constipation', 'Decreased appetite'],
    uncommonEffects: ['Abdominal pain', 'GERD', 'Hair thinning', 'Fatigue'],
    seriousEffects: ['Severe abdominal pain', 'Pancreatitis', 'Gallbladder issues', 'Allergic reaction'],
    frequency: 'Common effects in ~45% of patients at this dose',
  },
  {
    doseLevel: 'SEMA-D4',
    commonEffects: ['Nausea', 'Vomiting', 'Diarrhea', 'Constipation', 'Significant appetite suppression'],
    uncommonEffects: ['Abdominal pain', 'GERD', 'Hair thinning', 'Muscle loss', 'Fatigue'],
    seriousEffects: ['Severe abdominal pain', 'Pancreatitis', 'Gallbladder issues', 'Thyroid concerns'],
    frequency: 'Common effects in ~50% of patients at this dose',
  },
];

export const TIRZEPATIDE_SIDE_EFFECTS: DoseSideEffectProfile[] = [
  {
    doseLevel: 'TIRZ-D1',
    commonEffects: ['Mild nausea', 'Decreased appetite', 'Injection site redness'],
    uncommonEffects: ['Diarrhea', 'Headache', 'Mild constipation'],
    seriousEffects: ['Severe nausea/vomiting', 'Allergic reaction'],
    frequency: 'Common effects in ~25% of patients at this dose',
  },
  {
    doseLevel: 'TIRZ-D2',
    commonEffects: ['Nausea', 'Decreased appetite', 'Diarrhea'],
    uncommonEffects: ['Abdominal pain', 'Constipation', 'Fatigue', 'GERD'],
    seriousEffects: ['Severe abdominal pain', 'Pancreatitis symptoms', 'Allergic reaction'],
    frequency: 'Common effects in ~35% of patients at this dose',
  },
  {
    doseLevel: 'TIRZ-D3',
    commonEffects: ['Nausea', 'Diarrhea', 'Constipation', 'Decreased appetite'],
    uncommonEffects: ['Vomiting', 'Abdominal pain', 'GERD', 'Hair thinning'],
    seriousEffects: ['Severe abdominal pain', 'Pancreatitis', 'Gallbladder issues'],
    frequency: 'Common effects in ~40% of patients at this dose',
  },
  {
    doseLevel: 'TIRZ-D4',
    commonEffects: ['Nausea', 'Vomiting', 'Diarrhea', 'Constipation', 'Significant appetite suppression'],
    uncommonEffects: ['Abdominal pain', 'GERD', 'Hair thinning', 'Fatigue', 'Muscle loss'],
    seriousEffects: ['Severe abdominal pain', 'Pancreatitis', 'Gallbladder issues', 'Thyroid concerns'],
    frequency: 'Common effects in ~45% of patients at this dose',
  },
];

// ============================================================
// DOSE RECORD MANAGEMENT
// ============================================================

/**
 * Creates a new dose record for a patient starting treatment.
 */
export function createDoseRecord(
  patientId: string,
  medication: 'semaglutide' | 'tirzepatide'
): DoseRecord {
  const startDose: DoseLevel = medication === 'semaglutide' ? 'SEMA-D1' : 'TIRZ-D1';
  const doseMg = medication === 'semaglutide'
    ? SEMAGLUTIDE_DOSES['SEMA-D1'].mg
    : TIRZEPATIDE_DOSES['TIRZ-D1'].mg;

  const now = new Date();
  const nextTitration = new Date(now);
  nextTitration.setDate(nextTitration.getDate() + 28); // 4 weeks

  return {
    patientId,
    medication,
    currentDose: startDose,
    doseMg,
    startedAt: now,
    nextTitrationDate: nextTitration,
    titrationHistory: [],
  };
}

/**
 * Gets the dose info (mg, label) for a given dose level.
 */
export function getDoseInfo(doseLevel: DoseLevel): { mg: number; label: string; weeklyDose: string } {
  if (doseLevel.startsWith('SEMA')) {
    return SEMAGLUTIDE_DOSES[doseLevel as SemaglutideDose];
  }
  return TIRZEPATIDE_DOSES[doseLevel as TirzepatideDose];
}

/**
 * Gets the medication type from a dose level.
 */
export function getMedicationType(doseLevel: DoseLevel): 'semaglutide' | 'tirzepatide' {
  return doseLevel.startsWith('SEMA') ? 'semaglutide' : 'tirzepatide';
}

/**
 * Returns the next dose level, or null if at maximum.
 */
export function getNextDoseLevel(currentDose: DoseLevel): DoseLevel | null {
  if (currentDose.startsWith('SEMA')) {
    const index = SEMAGLUTIDE_DOSE_ORDER.indexOf(currentDose as SemaglutideDose);
    if (index < 0 || index >= SEMAGLUTIDE_DOSE_ORDER.length - 1) return null;
    return SEMAGLUTIDE_DOSE_ORDER[index + 1];
  }
  const index = TIRZEPATIDE_DOSE_ORDER.indexOf(currentDose as TirzepatideDose);
  if (index < 0 || index >= TIRZEPATIDE_DOSE_ORDER.length - 1) return null;
  return TIRZEPATIDE_DOSE_ORDER[index + 1];
}

/**
 * Returns the previous dose level, or null if at minimum.
 */
export function getPreviousDoseLevel(currentDose: DoseLevel): DoseLevel | null {
  if (currentDose.startsWith('SEMA')) {
    const index = SEMAGLUTIDE_DOSE_ORDER.indexOf(currentDose as SemaglutideDose);
    if (index <= 0) return null;
    return SEMAGLUTIDE_DOSE_ORDER[index - 1];
  }
  const index = TIRZEPATIDE_DOSE_ORDER.indexOf(currentDose as TirzepatideDose);
  if (index <= 0) return null;
  return TIRZEPATIDE_DOSE_ORDER[index - 1];
}

// ============================================================
// TITRATION LOGIC
// ============================================================

/**
 * Gets the titration schedule for a dose level.
 */
export function getTitrationSchedule(doseLevel: DoseLevel): TitrationSchedule | undefined {
  const isSema = doseLevel.startsWith('SEMA');
  const schedules = isSema ? SEMAGLUTIDE_TITRATION : TIRZEPATIDE_TITRATION;
  return schedules.find((s) => s.doseLevel === doseLevel);
}

/**
 * Checks if a patient is eligible for dose titration (increase).
 */
export function isEligibleForTitration(record: DoseRecord, asOf?: Date): {
  eligible: boolean;
  reason: string;
  weeksAtCurrentDose: number;
  minWeeksRequired: number;
} {
  const now = asOf ?? new Date();
  const schedule = getTitrationSchedule(record.currentDose);
  const nextDose = getNextDoseLevel(record.currentDose);

  if (!nextDose) {
    return {
      eligible: false,
      reason: 'Patient is already at maximum dose.',
      weeksAtCurrentDose: 0,
      minWeeksRequired: 0,
    };
  }

  if (!schedule) {
    return {
      eligible: false,
      reason: 'No titration schedule found for current dose.',
      weeksAtCurrentDose: 0,
      minWeeksRequired: 0,
    };
  }

  // Find when they started current dose
  const lastTitration = record.titrationHistory.length > 0
    ? record.titrationHistory[record.titrationHistory.length - 1].date
    : record.startedAt;

  const weeksAtDose = Math.floor(
    (now.getTime() - lastTitration.getTime()) / (1000 * 60 * 60 * 24 * 7)
  );

  if (weeksAtDose < schedule.minWeeksAtDose) {
    return {
      eligible: false,
      reason: `Patient needs ${schedule.minWeeksAtDose - weeksAtDose} more week(s) at current dose before titration.`,
      weeksAtCurrentDose: weeksAtDose,
      minWeeksRequired: schedule.minWeeksAtDose,
    };
  }

  return {
    eligible: true,
    reason: `Patient has completed ${weeksAtDose} weeks at current dose. Eligible for titration to ${nextDose}.`,
    weeksAtCurrentDose: weeksAtDose,
    minWeeksRequired: schedule.minWeeksAtDose,
  };
}

/** Result of a titration action */
export interface TitrationResult {
  success: boolean;
  record: DoseRecord;
  error?: string;
  newDose?: DoseLevel;
  newDoseMg?: number;
}

/**
 * Increases the patient's dose to the next level.
 */
export function titrateDoseUp(
  record: DoseRecord,
  reason: TitrationEntry['reason'] = 'scheduled',
  notes?: string
): TitrationResult {
  const eligibility = isEligibleForTitration(record);
  const nextDose = getNextDoseLevel(record.currentDose);

  if (!eligibility.eligible || !nextDose) {
    return {
      success: false,
      record,
      error: eligibility.reason,
    };
  }

  const doseInfo = getDoseInfo(nextDose);
  const now = new Date();

  const entry: TitrationEntry = {
    fromDose: record.currentDose,
    toDose: nextDose,
    date: now,
    reason,
    notes,
  };

  const nextNextDose = getNextDoseLevel(nextDose);
  let nextTitrationDate: Date | null = null;
  if (nextNextDose) {
    const schedule = getTitrationSchedule(nextDose);
    if (schedule) {
      nextTitrationDate = new Date(now);
      nextTitrationDate.setDate(nextTitrationDate.getDate() + schedule.recommendedWeeks * 7);
    }
  }

  const updatedRecord: DoseRecord = {
    ...record,
    currentDose: nextDose,
    doseMg: doseInfo.mg,
    nextTitrationDate,
    titrationHistory: [...record.titrationHistory, entry],
  };

  return {
    success: true,
    record: updatedRecord,
    newDose: nextDose,
    newDoseMg: doseInfo.mg,
  };
}

/**
 * Decreases the patient's dose to the previous level (due to side effects).
 */
export function titrateDoseDown(
  record: DoseRecord,
  reason: TitrationEntry['reason'] = 'side_effects',
  notes?: string
): TitrationResult {
  const prevDose = getPreviousDoseLevel(record.currentDose);

  if (!prevDose) {
    return {
      success: false,
      record,
      error: 'Patient is already at the minimum dose.',
    };
  }

  const doseInfo = getDoseInfo(prevDose);
  const now = new Date();

  const entry: TitrationEntry = {
    fromDose: record.currentDose,
    toDose: prevDose,
    date: now,
    reason,
    notes,
  };

  // After stepping down, set next titration to 4 weeks from now
  const nextTitrationDate = new Date(now);
  nextTitrationDate.setDate(nextTitrationDate.getDate() + 28);

  const updatedRecord: DoseRecord = {
    ...record,
    currentDose: prevDose,
    doseMg: doseInfo.mg,
    nextTitrationDate,
    titrationHistory: [...record.titrationHistory, entry],
  };

  return {
    success: true,
    record: updatedRecord,
    newDose: prevDose,
    newDoseMg: doseInfo.mg,
  };
}

// ============================================================
// SIDE EFFECT TRACKING
// ============================================================

/**
 * Gets the side effect profile for a dose level.
 */
export function getSideEffectProfile(doseLevel: DoseLevel): DoseSideEffectProfile | undefined {
  const isSema = doseLevel.startsWith('SEMA');
  const profiles = isSema ? SEMAGLUTIDE_SIDE_EFFECTS : TIRZEPATIDE_SIDE_EFFECTS;
  return profiles.find((p) => p.doseLevel === doseLevel);
}

/**
 * Creates a new side effect report.
 */
export function createSideEffectReport(
  patientId: string,
  doseLevel: DoseLevel,
  symptoms: string[],
  severity: SideEffectSeverity,
  actionTaken: string
): SideEffectReport {
  return {
    patientId,
    doseLevel,
    reportedAt: new Date(),
    symptoms,
    severity,
    actionTaken,
  };
}

/** Dose adjustment recommendation */
export interface DoseAdjustmentRecommendation {
  action: 'hold' | 'increase' | 'decrease' | 'discontinue' | 'emergency';
  reason: string;
  details: string;
  urgency: 'routine' | 'soon' | 'immediate';
}

/**
 * Generates a dose adjustment recommendation based on side effect reports.
 */
export function recommendDoseAdjustment(
  record: DoseRecord,
  recentReports: SideEffectReport[]
): DoseAdjustmentRecommendation {
  if (recentReports.length === 0) {
    const eligibility = isEligibleForTitration(record);
    if (eligibility.eligible) {
      return {
        action: 'increase',
        reason: 'No side effects reported. Patient is eligible for titration.',
        details: `Consider increasing from ${record.currentDose} to ${getNextDoseLevel(record.currentDose) ?? 'max'}.`,
        urgency: 'routine',
      };
    }
    return {
      action: 'hold',
      reason: 'Patient needs more time at current dose.',
      details: eligibility.reason,
      urgency: 'routine',
    };
  }

  // Check for severe side effects
  const severeReports = recentReports.filter((r) => r.severity === 'severe');
  if (severeReports.length > 0) {
    const hasEmergencySymptom = severeReports.some((r) =>
      r.symptoms.some((s) =>
        ['severe abdominal pain', 'allergic reaction', 'suicidal ideation', 'chest pain'].includes(
          s.toLowerCase()
        )
      )
    );

    if (hasEmergencySymptom) {
      return {
        action: 'emergency',
        reason: 'Emergency symptoms reported. Direct to ER immediately.',
        details: 'Instruct patient to call 911 or go to nearest ER. Notify clinic owner. Do NOT administer next dose.',
        urgency: 'immediate',
      };
    }

    return {
      action: 'decrease',
      reason: 'Severe side effects reported.',
      details: `Step down from ${record.currentDose} to ${getPreviousDoseLevel(record.currentDose) ?? 'minimum'}. Schedule follow-up in 1 week.`,
      urgency: 'soon',
    };
  }

  // Check for moderate side effects
  const moderateReports = recentReports.filter((r) => r.severity === 'moderate');
  if (moderateReports.length >= 2) {
    return {
      action: 'hold',
      reason: 'Multiple moderate side effects reported.',
      details: `Hold at ${record.currentDose}. Reassess in 2 weeks. If symptoms persist, consider stepping down.`,
      urgency: 'soon',
    };
  }

  if (moderateReports.length === 1) {
    return {
      action: 'hold',
      reason: 'Moderate side effect reported.',
      details: `Hold at current dose (${record.currentDose}). Monitor for 1-2 weeks. If resolved, proceed with titration.`,
      urgency: 'routine',
    };
  }

  // Mild side effects only
  return {
    action: 'hold',
    reason: 'Mild side effects reported. Normal for current dose.',
    details: `Continue at ${record.currentDose}. Side effects typically resolve within 2-3 weeks. Proceed with titration when eligible.`,
    urgency: 'routine',
  };
}

// ============================================================
// CHECK-IN MANAGEMENT
// ============================================================

/**
 * Creates a check-in record.
 */
export function createCheckIn(
  patientId: string,
  type: CheckInRecord['type'],
  weightLbs: number,
  sideEffects: string[] = [],
  satisfaction: number = 7
): CheckInRecord {
  return {
    patientId,
    date: new Date(),
    type,
    weightLbs,
    sideEffects,
    satisfaction,
    completed: true,
  };
}

/**
 * Calculates the next monthly check-in date for a patient.
 */
export function getNextMonthlyCheckInDate(lastCheckIn: Date): Date {
  const next = new Date(lastCheckIn);
  next.setDate(next.getDate() + 30);
  return next;
}

/**
 * Calculates the next quarterly lab date for a patient.
 * Labs are on a 90-day cycle from treatment start.
 */
export function getNextQuarterlyLabDate(treatmentStartDate: Date, asOf?: Date): Date {
  const now = asOf ?? new Date();
  const daysSinceStart = Math.floor(
    (now.getTime() - treatmentStartDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const cyclesPassed = Math.floor(daysSinceStart / 90);
  const nextCycle = cyclesPassed + 1;

  const nextDate = new Date(treatmentStartDate);
  nextDate.setDate(nextDate.getDate() + nextCycle * 90);
  return nextDate;
}

/**
 * Checks if quarterly labs are due (within 7 days of the 90-day mark).
 */
export function areQuarterlyLabsDue(treatmentStartDate: Date, asOf?: Date): boolean {
  const nextLabDate = getNextQuarterlyLabDate(treatmentStartDate, asOf);
  const now = asOf ?? new Date();
  const daysUntil = Math.floor(
    (nextLabDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysUntil <= 7 && daysUntil >= -7;
}

/**
 * Calculates weight loss progress from check-in records.
 */
export function calculateWeightProgress(checkIns: CheckInRecord[]): {
  startWeight: number;
  currentWeight: number;
  totalLost: number;
  percentLost: number;
  avgWeeklyLoss: number;
  trend: 'losing' | 'plateau' | 'gaining';
} {
  if (checkIns.length === 0) {
    return {
      startWeight: 0,
      currentWeight: 0,
      totalLost: 0,
      percentLost: 0,
      avgWeeklyLoss: 0,
      trend: 'plateau',
    };
  }

  const sorted = [...checkIns].sort((a, b) => a.date.getTime() - b.date.getTime());
  const startWeight = sorted[0].weightLbs;
  const currentWeight = sorted[sorted.length - 1].weightLbs;
  const totalLost = startWeight - currentWeight;
  const percentLost = (totalLost / startWeight) * 100;

  const daySpan = (sorted[sorted.length - 1].date.getTime() - sorted[0].date.getTime()) / (1000 * 60 * 60 * 24);
  const weeks = Math.max(1, daySpan / 7);
  const avgWeeklyLoss = totalLost / weeks;

  // Determine trend from last 3 check-ins
  let trend: 'losing' | 'plateau' | 'gaining' = 'plateau';
  if (sorted.length >= 3) {
    const recent = sorted.slice(-3);
    const recentChange = recent[0].weightLbs - recent[recent.length - 1].weightLbs;
    if (recentChange > 1) trend = 'losing';
    else if (recentChange < -1) trend = 'gaining';
  } else if (totalLost > 1) {
    trend = 'losing';
  } else if (totalLost < -1) {
    trend = 'gaining';
  }

  return {
    startWeight,
    currentWeight,
    totalLost: Math.round(totalLost * 10) / 10,
    percentLost: Math.round(percentLost * 10) / 10,
    avgWeeklyLoss: Math.round(avgWeeklyLoss * 100) / 100,
    trend,
  };
}

// ============================================================
// DOSE SUMMARY & REPORTING
// ============================================================

/** Summary of a patient's dose journey */
export interface DoseSummary {
  patientId: string;
  medication: string;
  currentDose: DoseLevel;
  currentDoseMg: number;
  weeksOnTreatment: number;
  titrationCount: number;
  nextTitrationDate: Date | null;
  eligibleForTitration: boolean;
  sideEffectCount: number;
  lastSideEffectSeverity: SideEffectSeverity | null;
  nextCheckInDue: Date;
  nextLabsDue: Date;
}

/**
 * Generates a complete dose summary for a patient.
 */
export function generateDoseSummary(
  record: DoseRecord,
  sideEffects: SideEffectReport[],
  lastCheckIn: Date | null,
  asOf?: Date
): DoseSummary {
  const now = asOf ?? new Date();
  const weeksOnTreatment = Math.floor(
    (now.getTime() - record.startedAt.getTime()) / (1000 * 60 * 60 * 24 * 7)
  );

  const patientEffects = sideEffects.filter((se) => se.patientId === record.patientId);
  const lastEffect = patientEffects.length > 0
    ? patientEffects.sort((a, b) => b.reportedAt.getTime() - a.reportedAt.getTime())[0]
    : null;

  const eligibility = isEligibleForTitration(record, now);
  const nextCheckIn = lastCheckIn ? getNextMonthlyCheckInDate(lastCheckIn) : now;
  const nextLabs = getNextQuarterlyLabDate(record.startedAt, now);

  return {
    patientId: record.patientId,
    medication: record.medication,
    currentDose: record.currentDose,
    currentDoseMg: record.doseMg,
    weeksOnTreatment,
    titrationCount: record.titrationHistory.length,
    nextTitrationDate: record.nextTitrationDate,
    eligibleForTitration: eligibility.eligible,
    sideEffectCount: patientEffects.length,
    lastSideEffectSeverity: lastEffect?.severity ?? null,
    nextCheckInDue: nextCheckIn,
    nextLabsDue: nextLabs,
  };
}

/**
 * Returns patients whose titration is due (within 7 days).
 */
export function findTitrationsDue(
  records: DoseRecord[],
  asOf?: Date
): Array<{ record: DoseRecord; daysUntilTitration: number }> {
  const now = asOf ?? new Date();
  const results: Array<{ record: DoseRecord; daysUntilTitration: number }> = [];

  for (const record of records) {
    if (!record.nextTitrationDate) continue;

    const daysUntil = Math.floor(
      (record.nextTitrationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntil <= 7 && daysUntil >= -7) {
      results.push({ record, daysUntilTitration: daysUntil });
    }
  }

  return results.sort((a, b) => a.daysUntilTitration - b.daysUntilTitration);
}

/**
 * Returns the Mangomint dose tag for a dose level.
 */
export function getDoseTag(doseLevel: DoseLevel): string {
  return doseLevel; // Tags match dose level names directly
}
