/**
 * Shared types for all medical modules
 * Rani Beauty Clinic - Medical Weight Loss & Wellness
 */

// ============================================================
// PIPELINE TYPES
// ============================================================

/** GLP-1 pipeline stages in strict order */
export type GLP1Stage =
  | 'PIPELINE_NEW'
  | 'LABS_NEEDED'
  | 'GFE_PENDING'
  | 'RX_APPROVED'
  | 'MED_SHIPPED'
  | 'ACTIVE_PATIENT';

/** Stage transition event */
export interface StageTransition {
  patientId: string;
  fromStage: GLP1Stage;
  toStage: GLP1Stage;
  transitionedAt: Date;
  transitionedBy: string;
  notes?: string;
}

/** SLA definition per stage */
export interface StageSLA {
  stage: GLP1Stage;
  expectedDays: { min: number; max: number };
  nudgeDays: number;
  escalationDays: number;
  description: string;
}

/** Pipeline velocity metrics */
export interface VelocityMetrics {
  stage: GLP1Stage;
  avgDays: number;
  medianDays: number;
  p90Days: number;
  sampleSize: number;
}

/** Pipeline snapshot */
export interface PipelineSnapshot {
  timestamp: Date;
  stageCounts: Record<GLP1Stage, number>;
  totalPatients: number;
  totalMRR: number;
  overdueByStage: Record<GLP1Stage, number>;
  conversionRate: number;
  avgDaysToActive: number;
}

/** Escalation action */
export interface EscalationAction {
  type: 'nudge' | 'escalation' | 'owner_alert';
  patientId: string;
  stage: GLP1Stage;
  daysInStage: number;
  message: string;
  channel: 'sms' | 'email' | 'internal';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

// ============================================================
// PATIENT TYPES
// ============================================================

export type Gender = 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';

export interface PatientProfile {
  id: string;
  firstName: string;
  lastName: string;
  dob: string; // ISO date
  gender: Gender;
  phone: string;
  email: string;
  address: PatientAddress;
  heightInches: number;
  weightLbs: number;
  bmi: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PatientAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface MedicalHistory {
  patientId: string;
  conditions: string[];
  currentMedications: string[];
  allergies: string[];
  pregnancyStatus: PregnancyStatus;
  familyHistory: string[];
  surgeries: string[];
  notes?: string;
}

export type PregnancyStatus = 'not_pregnant' | 'pregnant' | 'breastfeeding' | 'planning' | 'na';

// ============================================================
// SERVICE TYPES
// ============================================================

export type ServiceCategory = 'glp1' | 'peptide' | 'hormone' | 'wellness_injection';

export interface ServiceDefinition {
  id: string;
  name: string;
  category: ServiceCategory;
  priceRange: { min: number; max: number };
  margin: number; // percentage (0-100)
  requiresLabs: boolean;
  requiresGFE: boolean;
  contraindications: string[];
  labsRequired: string[];
  refillCadence: number | null; // days, null = one-time
  description: string;
  isActive: boolean;
}

// ============================================================
// DOSE TYPES
// ============================================================

export type SemaglutideDose = 'SEMA-D1' | 'SEMA-D2' | 'SEMA-D3' | 'SEMA-D4';
export type TirzepatideDose = 'TIRZ-D1' | 'TIRZ-D2' | 'TIRZ-D3' | 'TIRZ-D4';
export type DoseLevel = SemaglutideDose | TirzepatideDose;

export interface DoseRecord {
  patientId: string;
  medication: 'semaglutide' | 'tirzepatide';
  currentDose: DoseLevel;
  doseMg: number;
  startedAt: Date;
  nextTitrationDate: Date | null;
  titrationHistory: TitrationEntry[];
}

export interface TitrationEntry {
  fromDose: DoseLevel;
  toDose: DoseLevel;
  date: Date;
  reason: 'scheduled' | 'side_effects' | 'md_decision' | 'patient_request';
  notes?: string;
}

export type SideEffectSeverity = 'mild' | 'moderate' | 'severe';

export interface SideEffectReport {
  patientId: string;
  doseLevel: DoseLevel;
  reportedAt: Date;
  symptoms: string[];
  severity: SideEffectSeverity;
  actionTaken: string;
  resolvedAt?: Date;
}

export interface CheckInRecord {
  patientId: string;
  date: Date;
  type: 'monthly' | 'weekly' | 'quarterly_labs';
  weightLbs: number;
  sideEffects: string[];
  satisfaction: number; // 1-10
  notes?: string;
  completed: boolean;
}

// ============================================================
// COMPLIANCE TYPES
// ============================================================

export type ContraindicationLevel = 'hard_stop' | 'soft_flag';

export interface ContraindicationCheck {
  condition: string;
  level: ContraindicationLevel;
  description: string;
  action: string;
}

export interface ContraindicationResult {
  patientId: string;
  serviceId: string;
  checkedAt: Date;
  hardStops: ContraindicationCheck[];
  softFlags: ContraindicationCheck[];
  isCleared: boolean;
  requiresMDReview: boolean;
  notes?: string;
}

export type LabStatus = 'needed' | 'ordered' | 'pending_results' | 'received' | 'expired';

export interface LabRequirement {
  patientId: string;
  labType: string;
  status: LabStatus;
  orderedAt?: Date;
  receivedAt?: Date;
  expiresAt?: Date;
  results?: Record<string, string | number>;
}

export type GFEStatus = 'pending' | 'scheduled' | 'completed' | 'expired';

export interface GFERecord {
  patientId: string;
  status: GFEStatus;
  scheduledAt?: Date;
  completedAt?: Date;
  expiresAt?: Date;
  provider: string;
  platform: 'qualiphy';
  notes?: string;
}

export type EmergencyType =
  | 'severe_abdominal_pain'
  | 'allergic_reaction'
  | 'suicidal_ideation'
  | 'severe_vomiting'
  | 'chest_pain';

export interface EmergencyProtocol {
  type: EmergencyType;
  severity: 'critical';
  instructions: string[];
  notifyOwner: boolean;
  directToER: boolean;
}

// ============================================================
// CROSS-SELL TYPES
// ============================================================

export interface CrossSellRule {
  id: string;
  name: string;
  triggerService: string;
  triggerCondition: CrossSellTrigger;
  recommendedService: string;
  revenueUplift: number;
  priority: number;
  message: string;
}

export interface CrossSellTrigger {
  minMonthsActive: number;
  minSatisfaction?: number;
  requiredTags?: string[];
  excludeTags?: string[];
}

export interface CrossSellRecommendation {
  patientId: string;
  rule: CrossSellRule;
  estimatedUplift: number;
  generatedAt: Date;
  presented: boolean;
  accepted: boolean | null;
}

// ============================================================
// REFILL TYPES
// ============================================================

export type RefillStatus =
  | 'upcoming'
  | 'due'
  | 'overdue'
  | 'processing'
  | 'shipped'
  | 'completed'
  | 'cancelled'
  | 'payment_failed';

export interface RefillRecord {
  id: string;
  patientId: string;
  medicationId: string;
  medicationName: string;
  doseLevel: DoseLevel;
  dueDate: Date;
  status: RefillStatus;
  orderedAt?: Date;
  shippedAt?: Date;
  completedAt?: Date;
  price: number;
  paymentStatus: 'pending' | 'charged' | 'failed' | 'refunded';
  retryCount: number;
  notes?: string;
}

export interface RefillBatch {
  generatedAt: Date;
  refills: RefillRecord[];
  totalRevenue: number;
  totalPatients: number;
}

// ============================================================
// QUALIPHY TYPES
// ============================================================

export interface QualiphyQuickEntry {
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  phone: string;
  email: string;
  servicesRequested: string[];
  medicalHistory: string;
  currentMedications: string;
  allergies: string;
}

export interface QualiphyReminder {
  patientId: string;
  type: 'initial' | 'follow_up' | 'final';
  sentAt: Date;
  channel: 'sms' | 'email';
  message: string;
}

// ============================================================
// INTAKE TYPES
// ============================================================

export interface IntakeFormData {
  firstName: string;
  lastName: string;
  dob: string;
  gender: Gender;
  phone: string;
  email: string;
  heightFeet: number;
  heightInches: number;
  weightLbs: number;
  address: PatientAddress;
  servicesRequested: string[];
  medicalHistory: string[];
  currentMedications: string[];
  allergies: string[];
  pregnancyStatus: PregnancyStatus;
  familyHistory: string[];
  preferredContactMethod: 'sms' | 'email' | 'phone';
  referralSource?: string;
}

export interface IntakeResult {
  patient: PatientProfile;
  medicalHistory: MedicalHistory;
  contraindicationResult: ContraindicationResult;
  requiredLabs: string[];
  qualiphyEntry: QualiphyQuickEntry;
  welcomeText: string;
  welcomeEmail: string;
  mangomintTags: string[];
  estimatedMonthlyRevenue: number;
  estimatedAnnualRevenue: number;
  crossSellOpportunities: string[];
  pipelineStage: GLP1Stage;
  flagged: boolean;
  flagReasons: string[];
}

// ============================================================
// VOICE / MESSAGING TYPES
// ============================================================

export type MessageStage =
  | 'welcome'
  | 'lab_reminder'
  | 'gfe_reminder'
  | 'approval_celebration'
  | 'shipping'
  | 'first_dose_instructions'
  | 'week1_checkin'
  | 'month1_review'
  | 'refill_reminder'
  | 'at_risk_reengagement'
  | 'win_back';

export type MessageChannel = 'sms' | 'email';

export interface VoiceConfig {
  senderName: string;
  clinicName: string;
  clinicPhone: string;
  toneKeywords: string[];
  bannedWords: string[];
  maxSmsLength: number;
  emojiUsage: 'sparingly' | 'none';
}

export interface FormattedMessage {
  channel: MessageChannel;
  subject?: string; // email only
  body: string;
  recipientName: string;
  stage: MessageStage;
  characterCount: number;
  isCompliant: boolean;
  complianceIssues: string[];
}

// ============================================================
// MANGOMINT TAG TYPES
// ============================================================

export type TagCategory = 'service' | 'dose' | 'status' | 'revenue';

export interface MangomintTag {
  id: string;
  name: string;
  category: TagCategory;
  description: string;
  autoApply: boolean;
  triggerCondition?: string;
}

// ============================================================
// SOP TYPES
// ============================================================

export interface SOPStep {
  stepNumber: number;
  title: string;
  description: string;
  owner: string;
  estimatedMinutes: number;
  systemActions: string[];
  requiredBefore: string[];
}

export interface SOP {
  id: string;
  name: string;
  description: string;
  triggerEvent: string;
  steps: SOPStep[];
  totalEstimatedMinutes: number;
  tags: string[];
}

// ============================================================
// KPI TYPES
// ============================================================

export interface KPITarget {
  id: string;
  name: string;
  metric: string;
  target: number;
  unit: string;
  direction: 'above' | 'below';
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
}

export interface KPISnapshot {
  kpiId: string;
  value: number;
  target: number;
  date: Date;
  onTrack: boolean;
  delta: number;
  trend: 'up' | 'down' | 'flat';
}

// ============================================================
// DAILY RHYTHM TYPES
// ============================================================

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface DailyRhythm {
  day: DayOfWeek;
  theme: string;
  focusAreas: string[];
  tasks: RhythmTask[];
  isAutoPilot: boolean;
}

export interface RhythmTask {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedMinutes: number;
  automated: boolean;
  toolsUsed: string[];
}

// ============================================================
// UTILITY TYPES
// ============================================================

/** Airtable record wrapper */
export interface AirtableRecord<T> {
  id: string;
  fields: T;
  createdTime: string;
}

/** Generic paginated result */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/** Date range filter */
export interface DateRange {
  start: Date;
  end: Date;
}

/** Revenue calculation */
export interface RevenueCalc {
  monthly: number;
  quarterly: number;
  annual: number;
  perVisit: number;
}
