/**
 * GLP-1 Medical Weight Loss Pipeline Engine
 * Rani Beauty Clinic
 *
 * Complete 6-stage pipeline for managing patients from intake through active treatment.
 * Handles stage transitions, SLA tracking, velocity metrics, and auto-escalation.
 */

import type {
  GLP1Stage,
  StageTransition,
  StageSLA,
  VelocityMetrics,
  PipelineSnapshot,
  EscalationAction,
  PatientProfile,
  DoseLevel,
  RefillRecord,
  DateRange,
} from './types';

// ============================================================
// CONSTANTS
// ============================================================

/** Ordered list of pipeline stages */
export const PIPELINE_STAGES: GLP1Stage[] = [
  'PIPELINE_NEW',
  'LABS_NEEDED',
  'GFE_PENDING',
  'RX_APPROVED',
  'MED_SHIPPED',
  'ACTIVE_PATIENT',
];

/** Stage index map for quick lookups */
const STAGE_INDEX: Record<GLP1Stage, number> = {
  PIPELINE_NEW: 0,
  LABS_NEEDED: 1,
  GFE_PENDING: 2,
  RX_APPROVED: 3,
  MED_SHIPPED: 4,
  ACTIVE_PATIENT: 5,
};

/** Human-readable stage labels */
export const STAGE_LABELS: Record<GLP1Stage, string> = {
  PIPELINE_NEW: 'New Patient',
  LABS_NEEDED: 'Labs Needed',
  GFE_PENDING: 'GFE Pending',
  RX_APPROVED: 'Prescription Approved',
  MED_SHIPPED: 'Medication Shipped',
  ACTIVE_PATIENT: 'Active Patient',
};

/** Stage descriptions for internal dashboards */
export const STAGE_DESCRIPTIONS: Record<GLP1Stage, string> = {
  PIPELINE_NEW: 'Patient has completed intake form and entered the pipeline.',
  LABS_NEEDED: 'Waiting for patient to complete required lab work.',
  GFE_PENDING: 'Labs received, awaiting Good Faith Exam via Qualiphy.',
  RX_APPROVED: 'GFE completed, prescription approved by provider.',
  MED_SHIPPED: 'Compounded medication has been shipped to patient.',
  ACTIVE_PATIENT: 'Patient has received medication and started treatment.',
};

// ============================================================
// SLA DEFINITIONS
// ============================================================

/** SLA definitions for each pipeline stage */
export const STAGE_SLAS: Record<GLP1Stage, StageSLA> = {
  PIPELINE_NEW: {
    stage: 'PIPELINE_NEW',
    expectedDays: { min: 0, max: 1 },
    nudgeDays: 1,
    escalationDays: 2,
    description: 'Patient enters pipeline on Day 0. Should move to Labs Needed within 24 hours.',
  },
  LABS_NEEDED: {
    stage: 'LABS_NEEDED',
    expectedDays: { min: 1, max: 5 },
    nudgeDays: 3,
    escalationDays: 5,
    description: 'Patient needs to complete lab work. Nudge at Day 3, escalate at Day 5.',
  },
  GFE_PENDING: {
    stage: 'GFE_PENDING',
    expectedDays: { min: 3, max: 7 },
    nudgeDays: 5,
    escalationDays: 7,
    description: 'Good Faith Exam via Qualiphy. Nudge at Day 5, escalate at Day 7.',
  },
  RX_APPROVED: {
    stage: 'RX_APPROVED',
    expectedDays: { min: 5, max: 9 },
    nudgeDays: 7,
    escalationDays: 9,
    description: 'Prescription approved. Pharmacy should process within 2-4 days.',
  },
  MED_SHIPPED: {
    stage: 'MED_SHIPPED',
    expectedDays: { min: 7, max: 12 },
    nudgeDays: 10,
    escalationDays: 12,
    description: 'Medication shipped. Patient should receive within 3-5 days.',
  },
  ACTIVE_PATIENT: {
    stage: 'ACTIVE_PATIENT',
    expectedDays: { min: 10, max: 14 },
    nudgeDays: 30, // monthly check-in
    escalationDays: 45,
    description: 'Patient is active. Monthly check-ins required.',
  },
};

// ============================================================
// PIPELINE PATIENT
// ============================================================

/** A patient record within the GLP-1 pipeline */
export interface PipelinePatient {
  patientId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  currentStage: GLP1Stage;
  stageEnteredAt: Date;
  pipelineEnteredAt: Date;
  transitions: StageTransition[];
  monthlyRevenue: number;
  medication: 'semaglutide' | 'tirzepatide' | null;
  doseLevel: DoseLevel | null;
  isOverdue: boolean;
  isEscalated: boolean;
  lastContactAt: Date | null;
  nextActionDue: Date | null;
  tags: string[];
  notes: string[];
}

/** Options for creating a new pipeline patient */
export interface CreatePipelinePatientOptions {
  patientId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  medication?: 'semaglutide' | 'tirzepatide';
  monthlyRevenue?: number;
  tags?: string[];
}

// ============================================================
// PIPELINE ENGINE
// ============================================================

/**
 * Creates a new pipeline patient at the PIPELINE_NEW stage.
 */
export function createPipelinePatient(options: CreatePipelinePatientOptions): PipelinePatient {
  const now = new Date();
  return {
    patientId: options.patientId,
    firstName: options.firstName,
    lastName: options.lastName,
    email: options.email,
    phone: options.phone,
    currentStage: 'PIPELINE_NEW',
    stageEnteredAt: now,
    pipelineEnteredAt: now,
    transitions: [],
    monthlyRevenue: options.monthlyRevenue ?? 0,
    medication: options.medication ?? null,
    doseLevel: null,
    isOverdue: false,
    isEscalated: false,
    lastContactAt: null,
    nextActionDue: calculateNextActionDue('PIPELINE_NEW', now),
    tags: options.tags ?? ['GLP1-PATIENT'],
    notes: [],
  };
}

/**
 * Calculates the next action due date based on the stage SLA.
 */
export function calculateNextActionDue(stage: GLP1Stage, stageEnteredAt: Date): Date {
  const sla = STAGE_SLAS[stage];
  const due = new Date(stageEnteredAt);
  due.setDate(due.getDate() + sla.nudgeDays);
  return due;
}

// ============================================================
// STAGE TRANSITIONS
// ============================================================

/** Result of a transition attempt */
export interface TransitionResult {
  success: boolean;
  patient: PipelinePatient;
  transition?: StageTransition;
  error?: string;
}

/**
 * Validates whether a stage transition is allowed.
 * Patients can only move forward one stage at a time (no skipping).
 */
export function isValidTransition(fromStage: GLP1Stage, toStage: GLP1Stage): boolean {
  const fromIndex = STAGE_INDEX[fromStage];
  const toIndex = STAGE_INDEX[toStage];
  // Must move exactly one stage forward
  return toIndex === fromIndex + 1;
}

/**
 * Returns the next stage in the pipeline, or null if already at ACTIVE_PATIENT.
 */
export function getNextStage(currentStage: GLP1Stage): GLP1Stage | null {
  const currentIndex = STAGE_INDEX[currentStage];
  if (currentIndex >= PIPELINE_STAGES.length - 1) return null;
  return PIPELINE_STAGES[currentIndex + 1];
}

/**
 * Returns the previous stage in the pipeline, or null if at PIPELINE_NEW.
 */
export function getPreviousStage(currentStage: GLP1Stage): GLP1Stage | null {
  const currentIndex = STAGE_INDEX[currentStage];
  if (currentIndex <= 0) return null;
  return PIPELINE_STAGES[currentIndex - 1];
}

/**
 * Transitions a patient to the next stage in the pipeline.
 * Validates the transition and records it.
 */
export function transitionPatient(
  patient: PipelinePatient,
  toStage: GLP1Stage,
  transitionedBy: string,
  notes?: string
): TransitionResult {
  // Validate transition
  if (!isValidTransition(patient.currentStage, toStage)) {
    return {
      success: false,
      patient,
      error: `Invalid transition: ${patient.currentStage} -> ${toStage}. Patients must advance one stage at a time.`,
    };
  }

  const now = new Date();
  const transition: StageTransition = {
    patientId: patient.patientId,
    fromStage: patient.currentStage,
    toStage,
    transitionedAt: now,
    transitionedBy,
    notes,
  };

  const updatedPatient: PipelinePatient = {
    ...patient,
    currentStage: toStage,
    stageEnteredAt: now,
    transitions: [...patient.transitions, transition],
    isOverdue: false,
    isEscalated: false,
    lastContactAt: now,
    nextActionDue: calculateNextActionDue(toStage, now),
  };

  return {
    success: true,
    patient: updatedPatient,
    transition,
  };
}

/**
 * Attempts to advance a patient to the next stage.
 * Convenience wrapper around transitionPatient.
 */
export function advancePatient(
  patient: PipelinePatient,
  transitionedBy: string,
  notes?: string
): TransitionResult {
  const nextStage = getNextStage(patient.currentStage);
  if (!nextStage) {
    return {
      success: false,
      patient,
      error: `Patient ${patient.patientId} is already at the final stage (ACTIVE_PATIENT).`,
    };
  }
  return transitionPatient(patient, nextStage, transitionedBy, notes);
}

// ============================================================
// SLA TRACKING
// ============================================================

/**
 * Calculates how many days a patient has been in their current stage.
 */
export function daysInCurrentStage(patient: PipelinePatient, asOf?: Date): number {
  const now = asOf ?? new Date();
  const diffMs = now.getTime() - patient.stageEnteredAt.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Calculates the total number of days a patient has been in the pipeline.
 */
export function totalDaysInPipeline(patient: PipelinePatient, asOf?: Date): number {
  const now = asOf ?? new Date();
  const diffMs = now.getTime() - patient.pipelineEnteredAt.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Checks if a patient is overdue for their current stage based on SLA.
 */
export function isPatientOverdue(patient: PipelinePatient, asOf?: Date): boolean {
  const days = daysInCurrentStage(patient, asOf);
  const sla = STAGE_SLAS[patient.currentStage];
  return days > sla.expectedDays.max;
}

/**
 * Checks if a patient needs a nudge (approaching SLA deadline).
 */
export function needsNudge(patient: PipelinePatient, asOf?: Date): boolean {
  const days = daysInCurrentStage(patient, asOf);
  const sla = STAGE_SLAS[patient.currentStage];
  return days >= sla.nudgeDays && days < sla.escalationDays;
}

/**
 * Checks if a patient needs escalation (past SLA deadline).
 */
export function needsEscalation(patient: PipelinePatient, asOf?: Date): boolean {
  const days = daysInCurrentStage(patient, asOf);
  const sla = STAGE_SLAS[patient.currentStage];
  return days >= sla.escalationDays;
}

/** Overdue patient summary */
export interface OverduePatient {
  patient: PipelinePatient;
  daysOverdue: number;
  sla: StageSLA;
  requiredAction: 'nudge' | 'escalation';
}

/**
 * Finds all overdue patients from a list.
 */
export function findOverduePatients(patients: PipelinePatient[], asOf?: Date): OverduePatient[] {
  const results: OverduePatient[] = [];

  for (const patient of patients) {
    if (patient.currentStage === 'ACTIVE_PATIENT') continue;

    const days = daysInCurrentStage(patient, asOf);
    const sla = STAGE_SLAS[patient.currentStage];

    if (days >= sla.nudgeDays) {
      results.push({
        patient,
        daysOverdue: days - sla.expectedDays.max,
        sla,
        requiredAction: days >= sla.escalationDays ? 'escalation' : 'nudge',
      });
    }
  }

  // Sort by most overdue first
  results.sort((a, b) => b.daysOverdue - a.daysOverdue);
  return results;
}

/**
 * Flags overdue patients in-place and returns the updated list.
 */
export function updateOverdueFlags(patients: PipelinePatient[], asOf?: Date): PipelinePatient[] {
  return patients.map((patient) => ({
    ...patient,
    isOverdue: isPatientOverdue(patient, asOf),
    isEscalated: needsEscalation(patient, asOf),
  }));
}

// ============================================================
// VELOCITY METRICS
// ============================================================

/**
 * Calculates velocity metrics for a specific stage based on historical transitions.
 */
export function calculateStageVelocity(
  transitions: StageTransition[],
  stage: GLP1Stage
): VelocityMetrics {
  // Find transitions OUT of this stage
  const stageTransitions = transitions.filter((t) => t.fromStage === stage);

  if (stageTransitions.length === 0) {
    return {
      stage,
      avgDays: 0,
      medianDays: 0,
      p90Days: 0,
      sampleSize: 0,
    };
  }

  // Group by patient to calculate time in stage
  const patientDurations: Map<string, number[]> = new Map();
  for (const t of stageTransitions) {
    const existing = patientDurations.get(t.patientId) ?? [];
    existing.push(t.transitionedAt.getTime());
    patientDurations.set(t.patientId, existing);
  }

  // Find matching entry transitions to calculate duration
  const entryTransitions = transitions.filter((t) => t.toStage === stage);
  const durations: number[] = [];

  for (const exit of stageTransitions) {
    const entry = entryTransitions.find(
      (e) => e.patientId === exit.patientId && e.transitionedAt.getTime() < exit.transitionedAt.getTime()
    );
    if (entry) {
      const durationMs = exit.transitionedAt.getTime() - entry.transitionedAt.getTime();
      durations.push(durationMs / (1000 * 60 * 60 * 24));
    }
  }

  if (durations.length === 0) {
    return { stage, avgDays: 0, medianDays: 0, p90Days: 0, sampleSize: 0 };
  }

  durations.sort((a, b) => a - b);

  const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
  const median =
    durations.length % 2 === 0
      ? (durations[durations.length / 2 - 1] + durations[durations.length / 2]) / 2
      : durations[Math.floor(durations.length / 2)];
  const p90Index = Math.ceil(durations.length * 0.9) - 1;
  const p90 = durations[Math.min(p90Index, durations.length - 1)];

  return {
    stage,
    avgDays: Math.round(avg * 10) / 10,
    medianDays: Math.round(median * 10) / 10,
    p90Days: Math.round(p90 * 10) / 10,
    sampleSize: durations.length,
  };
}

/**
 * Calculates velocity metrics for all stages.
 */
export function calculateAllVelocityMetrics(transitions: StageTransition[]): VelocityMetrics[] {
  return PIPELINE_STAGES.map((stage) => calculateStageVelocity(transitions, stage));
}

/**
 * Calculates average total days from PIPELINE_NEW to ACTIVE_PATIENT.
 */
export function calculatePipelineThroughput(patients: PipelinePatient[]): number {
  const activePatients = patients.filter((p) => p.currentStage === 'ACTIVE_PATIENT');
  if (activePatients.length === 0) return 0;

  const totalDays = activePatients.reduce((sum, p) => {
    const entryToActive = p.transitions.find((t) => t.toStage === 'ACTIVE_PATIENT');
    if (!entryToActive) return sum;
    const days = (entryToActive.transitionedAt.getTime() - p.pipelineEnteredAt.getTime()) / (1000 * 60 * 60 * 24);
    return sum + days;
  }, 0);

  return Math.round((totalDays / activePatients.length) * 10) / 10;
}

// ============================================================
// PIPELINE SNAPSHOT
// ============================================================

/**
 * Generates a complete pipeline snapshot showing current state.
 */
export function generatePipelineSnapshot(patients: PipelinePatient[]): PipelineSnapshot {
  const stageCounts: Record<GLP1Stage, number> = {
    PIPELINE_NEW: 0,
    LABS_NEEDED: 0,
    GFE_PENDING: 0,
    RX_APPROVED: 0,
    MED_SHIPPED: 0,
    ACTIVE_PATIENT: 0,
  };

  const overdueByStage: Record<GLP1Stage, number> = {
    PIPELINE_NEW: 0,
    LABS_NEEDED: 0,
    GFE_PENDING: 0,
    RX_APPROVED: 0,
    MED_SHIPPED: 0,
    ACTIVE_PATIENT: 0,
  };

  let totalMRR = 0;

  for (const patient of patients) {
    stageCounts[patient.currentStage]++;
    if (isPatientOverdue(patient)) {
      overdueByStage[patient.currentStage]++;
    }
    if (patient.currentStage === 'ACTIVE_PATIENT') {
      totalMRR += patient.monthlyRevenue;
    }
  }

  const totalPatients = patients.length;
  const activePatients = stageCounts.ACTIVE_PATIENT;
  const conversionRate = totalPatients > 0 ? (activePatients / totalPatients) * 100 : 0;
  const avgDaysToActive = calculatePipelineThroughput(patients);

  return {
    timestamp: new Date(),
    stageCounts,
    totalPatients,
    totalMRR,
    overdueByStage,
    conversionRate: Math.round(conversionRate * 10) / 10,
    avgDaysToActive,
  };
}

/**
 * Generates a summary string of the pipeline snapshot (for dashboards / reports).
 */
export function formatPipelineSnapshot(snapshot: PipelineSnapshot): string {
  const lines: string[] = [
    `Pipeline Snapshot - ${snapshot.timestamp.toLocaleDateString()}`,
    '='.repeat(50),
    '',
    `Total Patients: ${snapshot.totalPatients}`,
    `Total MRR: $${snapshot.totalMRR.toLocaleString()}`,
    `Conversion Rate: ${snapshot.conversionRate}%`,
    `Avg Days to Active: ${snapshot.avgDaysToActive}`,
    '',
    'Stage Breakdown:',
  ];

  for (const stage of PIPELINE_STAGES) {
    const count = snapshot.stageCounts[stage];
    const overdue = snapshot.overdueByStage[stage];
    const label = STAGE_LABELS[stage].padEnd(22);
    const overdueStr = overdue > 0 ? ` (${overdue} overdue)` : '';
    lines.push(`  ${label} ${count}${overdueStr}`);
  }

  return lines.join('\n');
}

// ============================================================
// AUTO-ESCALATION ENGINE
// ============================================================

/** Escalation rule definition */
export interface EscalationRule {
  stage: GLP1Stage;
  daysThreshold: number;
  type: 'nudge' | 'escalation' | 'owner_alert';
  channel: 'sms' | 'email' | 'internal';
  priority: 'low' | 'medium' | 'high' | 'critical';
  messageTemplate: string;
}

/** Default escalation rules */
export const ESCALATION_RULES: EscalationRule[] = [
  // PIPELINE_NEW
  {
    stage: 'PIPELINE_NEW',
    daysThreshold: 1,
    type: 'nudge',
    channel: 'internal',
    priority: 'medium',
    messageTemplate: 'New patient {{firstName}} has not been moved to Labs Needed. Process intake ASAP.',
  },
  {
    stage: 'PIPELINE_NEW',
    daysThreshold: 2,
    type: 'escalation',
    channel: 'internal',
    priority: 'high',
    messageTemplate: 'OVERDUE: {{firstName}} {{lastName}} stuck in New Patient for {{days}} days. Immediate action required.',
  },

  // LABS_NEEDED
  {
    stage: 'LABS_NEEDED',
    daysThreshold: 3,
    type: 'nudge',
    channel: 'sms',
    priority: 'medium',
    messageTemplate: 'Hey {{firstName}}! Just checking in on your labs. We need those results to get your treatment started. Need help finding a lab? Reply and I\'ll send you options! - Rina @ Rani',
  },
  {
    stage: 'LABS_NEEDED',
    daysThreshold: 5,
    type: 'escalation',
    channel: 'sms',
    priority: 'high',
    messageTemplate: '{{firstName}}, we want to make sure we don\'t lose your spot! Your labs are needed to move forward with your weight loss program. Can we help schedule them? Call us at (425) 539-4440 - Rina @ Rani',
  },
  {
    stage: 'LABS_NEEDED',
    daysThreshold: 7,
    type: 'owner_alert',
    channel: 'internal',
    priority: 'critical',
    messageTemplate: 'CRITICAL: {{firstName}} {{lastName}} has not submitted labs in {{days}} days. At risk of dropping off. Manual outreach needed.',
  },

  // GFE_PENDING
  {
    stage: 'GFE_PENDING',
    daysThreshold: 5,
    type: 'nudge',
    channel: 'sms',
    priority: 'medium',
    messageTemplate: '{{firstName}}, your lab results look great! Just one more step - complete your virtual exam and we can get your prescription started. It only takes about 10 minutes! - Rina @ Rani',
  },
  {
    stage: 'GFE_PENDING',
    daysThreshold: 7,
    type: 'escalation',
    channel: 'email',
    priority: 'high',
    messageTemplate: '{{firstName}}, your Good Faith Exam is still pending. We need this completed before we can approve your prescription. Please schedule at your earliest convenience.',
  },

  // RX_APPROVED
  {
    stage: 'RX_APPROVED',
    daysThreshold: 7,
    type: 'nudge',
    channel: 'internal',
    priority: 'medium',
    messageTemplate: '{{firstName}} {{lastName}} was approved {{days}} days ago but medication has not shipped. Check pharmacy status.',
  },
  {
    stage: 'RX_APPROVED',
    daysThreshold: 9,
    type: 'escalation',
    channel: 'internal',
    priority: 'high',
    messageTemplate: 'OVERDUE: {{firstName}} {{lastName}} prescription approved but no shipment in {{days}} days. Contact pharmacy immediately.',
  },

  // MED_SHIPPED
  {
    stage: 'MED_SHIPPED',
    daysThreshold: 10,
    type: 'nudge',
    channel: 'sms',
    priority: 'medium',
    messageTemplate: '{{firstName}}, just checking - did your medication arrive? Let us know so we can get you started with your first dose instructions! - Rina @ Rani',
  },
  {
    stage: 'MED_SHIPPED',
    daysThreshold: 12,
    type: 'escalation',
    channel: 'internal',
    priority: 'high',
    messageTemplate: 'OVERDUE: {{firstName}} {{lastName}} medication shipped {{days}} days ago, no confirmation of receipt. Check tracking and contact patient.',
  },

  // ACTIVE_PATIENT (monthly check-ins)
  {
    stage: 'ACTIVE_PATIENT',
    daysThreshold: 30,
    type: 'nudge',
    channel: 'sms',
    priority: 'low',
    messageTemplate: '{{firstName}}, time for your monthly check-in! How are you feeling? Any side effects or questions? Reply and let us know. - Rina @ Rani (425) 539-4440',
  },
  {
    stage: 'ACTIVE_PATIENT',
    daysThreshold: 45,
    type: 'escalation',
    channel: 'email',
    priority: 'medium',
    messageTemplate: '{{firstName}}, we haven\'t heard from you in a while. Your check-in is overdue. Please reach out so we can make sure your treatment is going well.',
  },
];

/**
 * Generates escalation actions for a list of patients.
 * Returns only the highest-priority action per patient.
 */
export function generateEscalationActions(
  patients: PipelinePatient[],
  asOf?: Date
): EscalationAction[] {
  const actions: EscalationAction[] = [];

  for (const patient of patients) {
    const days = daysInCurrentStage(patient, asOf);
    const applicableRules = ESCALATION_RULES
      .filter((rule) => rule.stage === patient.currentStage && days >= rule.daysThreshold)
      .sort((a, b) => b.daysThreshold - a.daysThreshold);

    if (applicableRules.length > 0) {
      const rule = applicableRules[0]; // highest threshold = most urgent
      const message = rule.messageTemplate
        .replace(/\{\{firstName\}\}/g, patient.firstName)
        .replace(/\{\{lastName\}\}/g, patient.lastName)
        .replace(/\{\{days\}\}/g, String(days));

      actions.push({
        type: rule.type,
        patientId: patient.patientId,
        stage: patient.currentStage,
        daysInStage: days,
        message,
        channel: rule.channel,
        priority: rule.priority,
      });
    }
  }

  // Sort by priority (critical first)
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return actions;
}

/**
 * Filters escalation actions to only those that have not been sent recently.
 * Prevents spamming patients with repeated messages.
 */
export function deduplicateEscalations(
  actions: EscalationAction[],
  recentlySent: Map<string, Date>,
  cooldownHours: number = 48
): EscalationAction[] {
  const cooldownMs = cooldownHours * 60 * 60 * 1000;
  const now = new Date();

  return actions.filter((action) => {
    const key = `${action.patientId}-${action.stage}-${action.type}`;
    const lastSent = recentlySent.get(key);
    if (!lastSent) return true;
    return now.getTime() - lastSent.getTime() > cooldownMs;
  });
}

// ============================================================
// PIPELINE QUERIES
// ============================================================

/**
 * Returns patients at a specific stage.
 */
export function getPatientsByStage(
  patients: PipelinePatient[],
  stage: GLP1Stage
): PipelinePatient[] {
  return patients.filter((p) => p.currentStage === stage);
}

/**
 * Returns patients who entered the pipeline within a date range.
 */
export function getPatientsByEntryDate(
  patients: PipelinePatient[],
  range: DateRange
): PipelinePatient[] {
  return patients.filter(
    (p) => p.pipelineEnteredAt >= range.start && p.pipelineEnteredAt <= range.end
  );
}

/**
 * Returns patients with a specific tag.
 */
export function getPatientsByTag(
  patients: PipelinePatient[],
  tag: string
): PipelinePatient[] {
  return patients.filter((p) => p.tags.includes(tag));
}

/**
 * Returns the conversion funnel: count at each stage and drop-off rate.
 */
export function calculateConversionFunnel(
  patients: PipelinePatient[]
): Array<{ stage: GLP1Stage; count: number; dropOffRate: number }> {
  const stageCounts: Record<GLP1Stage, number> = {
    PIPELINE_NEW: 0,
    LABS_NEEDED: 0,
    GFE_PENDING: 0,
    RX_APPROVED: 0,
    MED_SHIPPED: 0,
    ACTIVE_PATIENT: 0,
  };

  // Count patients at or past each stage
  for (const patient of patients) {
    const patientIndex = STAGE_INDEX[patient.currentStage];
    for (let i = 0; i <= patientIndex; i++) {
      stageCounts[PIPELINE_STAGES[i]]++;
    }
  }

  return PIPELINE_STAGES.map((stage, index) => {
    const count = stageCounts[stage];
    const previousCount = index > 0 ? stageCounts[PIPELINE_STAGES[index - 1]] : count;
    const dropOffRate = previousCount > 0 ? ((previousCount - count) / previousCount) * 100 : 0;
    return {
      stage,
      count,
      dropOffRate: Math.round(dropOffRate * 10) / 10,
    };
  });
}

/**
 * Calculates estimated future MRR based on patients in the pipeline.
 * Applies conversion probability by stage.
 */
export function calculateProjectedMRR(patients: PipelinePatient[]): number {
  const conversionProbability: Record<GLP1Stage, number> = {
    PIPELINE_NEW: 0.3,
    LABS_NEEDED: 0.45,
    GFE_PENDING: 0.6,
    RX_APPROVED: 0.85,
    MED_SHIPPED: 0.95,
    ACTIVE_PATIENT: 1.0,
  };

  return patients.reduce((total, patient) => {
    const probability = conversionProbability[patient.currentStage];
    return total + patient.monthlyRevenue * probability;
  }, 0);
}

/**
 * Returns a daily action list: patients that need attention today.
 */
export function getDailyActionList(
  patients: PipelinePatient[],
  asOf?: Date
): {
  nudges: PipelinePatient[];
  escalations: PipelinePatient[];
  overduePatients: PipelinePatient[];
  checkInsDue: PipelinePatient[];
} {
  const now = asOf ?? new Date();

  const nudges: PipelinePatient[] = [];
  const escalations: PipelinePatient[] = [];
  const overduePatients: PipelinePatient[] = [];
  const checkInsDue: PipelinePatient[] = [];

  for (const patient of patients) {
    if (needsEscalation(patient, now)) {
      escalations.push(patient);
    } else if (needsNudge(patient, now)) {
      nudges.push(patient);
    }

    if (isPatientOverdue(patient, now)) {
      overduePatients.push(patient);
    }

    // Check-ins due for active patients
    if (patient.currentStage === 'ACTIVE_PATIENT' && patient.nextActionDue) {
      if (patient.nextActionDue <= now) {
        checkInsDue.push(patient);
      }
    }
  }

  return { nudges, escalations, overduePatients, checkInsDue };
}

// ============================================================
// STAGE COMPLETION CHECKLIST
// ============================================================

/** Requirements that must be met before transitioning to the next stage */
export interface StageRequirement {
  id: string;
  description: string;
  isMet: boolean;
}

/**
 * Returns the checklist of requirements for transitioning out of a stage.
 */
export function getStageRequirements(stage: GLP1Stage): StageRequirement[] {
  switch (stage) {
    case 'PIPELINE_NEW':
      return [
        { id: 'intake_complete', description: 'Intake form completed and reviewed', isMet: false },
        { id: 'contraindication_check', description: 'Contraindication screening passed', isMet: false },
        { id: 'labs_identified', description: 'Required labs identified', isMet: false },
      ];
    case 'LABS_NEEDED':
      return [
        { id: 'labs_ordered', description: 'Lab order sent to patient', isMet: false },
        { id: 'labs_completed', description: 'Lab results received', isMet: false },
        { id: 'labs_reviewed', description: 'Lab results reviewed by provider', isMet: false },
      ];
    case 'GFE_PENDING':
      return [
        { id: 'qualiphy_entry', description: 'Patient data entered in Qualiphy', isMet: false },
        { id: 'gfe_scheduled', description: 'GFE appointment scheduled', isMet: false },
        { id: 'gfe_completed', description: 'GFE completed and approved', isMet: false },
      ];
    case 'RX_APPROVED':
      return [
        { id: 'rx_written', description: 'Prescription written', isMet: false },
        { id: 'pharmacy_order', description: 'Order placed with pharmacy', isMet: false },
        { id: 'payment_collected', description: 'Payment collected', isMet: false },
      ];
    case 'MED_SHIPPED':
      return [
        { id: 'tracking_received', description: 'Tracking number received', isMet: false },
        { id: 'patient_notified', description: 'Patient notified of shipment', isMet: false },
        { id: 'delivery_confirmed', description: 'Delivery confirmed by patient', isMet: false },
      ];
    case 'ACTIVE_PATIENT':
      return [
        { id: 'first_dose', description: 'First dose instructions sent', isMet: false },
        { id: 'dose_confirmed', description: 'Patient confirmed first dose taken', isMet: false },
        { id: 'follow_up_scheduled', description: 'Follow-up check-in scheduled', isMet: false },
      ];
  }
}

// ============================================================
// REPORTING
// ============================================================

/** Weekly pipeline report */
export interface WeeklyPipelineReport {
  weekOf: Date;
  snapshot: PipelineSnapshot;
  newPatients: number;
  conversions: number;
  dropOffs: number;
  avgDaysToActive: number;
  revenueAdded: number;
  revenueAtRisk: number;
  topActions: EscalationAction[];
}

/**
 * Generates a weekly pipeline report.
 */
export function generateWeeklyReport(
  patients: PipelinePatient[],
  previousWeekPatients: PipelinePatient[],
  weekOf: Date
): WeeklyPipelineReport {
  const snapshot = generatePipelineSnapshot(patients);
  const previousSnapshot = generatePipelineSnapshot(previousWeekPatients);

  const previousIds = new Set(previousWeekPatients.map((p) => p.patientId));
  const newPatients = patients.filter((p) => !previousIds.has(p.patientId)).length;

  const currentActive = patients.filter((p) => p.currentStage === 'ACTIVE_PATIENT').length;
  const previousActive = previousWeekPatients.filter((p) => p.currentStage === 'ACTIVE_PATIENT').length;
  const conversions = Math.max(0, currentActive - previousActive);

  const dropOffs = previousWeekPatients.filter(
    (pp) => !patients.find((p) => p.patientId === pp.patientId)
  ).length;

  const revenueAdded = snapshot.totalMRR - previousSnapshot.totalMRR;
  const atRiskPatients = patients.filter(
    (p) => p.currentStage !== 'ACTIVE_PATIENT' && isPatientOverdue(p)
  );
  const revenueAtRisk = atRiskPatients.reduce((sum, p) => sum + p.monthlyRevenue, 0);

  const topActions = generateEscalationActions(patients).slice(0, 10);

  return {
    weekOf,
    snapshot,
    newPatients,
    conversions,
    dropOffs,
    avgDaysToActive: snapshot.avgDaysToActive,
    revenueAdded,
    revenueAtRisk,
    topActions,
  };
}

/**
 * Formats a weekly report as a readable string.
 */
export function formatWeeklyReport(report: WeeklyPipelineReport): string {
  const lines: string[] = [
    `Weekly Pipeline Report - Week of ${report.weekOf.toLocaleDateString()}`,
    '='.repeat(55),
    '',
    formatPipelineSnapshot(report.snapshot),
    '',
    'Weekly Activity:',
    `  New Patients:      ${report.newPatients}`,
    `  Conversions:       ${report.conversions}`,
    `  Drop-offs:         ${report.dropOffs}`,
    `  Avg Days to Active: ${report.avgDaysToActive}`,
    `  Revenue Added:     $${report.revenueAdded.toLocaleString()}`,
    `  Revenue at Risk:   $${report.revenueAtRisk.toLocaleString()}`,
  ];

  if (report.topActions.length > 0) {
    lines.push('', 'Top Actions Needed:');
    for (const action of report.topActions.slice(0, 5)) {
      lines.push(`  [${action.priority.toUpperCase()}] ${action.message.substring(0, 80)}...`);
    }
  }

  return lines.join('\n');
}
