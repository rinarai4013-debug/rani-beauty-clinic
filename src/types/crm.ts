/**
 * CRM Type Definitions for Rani Beauty Clinic
 *
 * Complete type system for the medical aesthetics CRM:
 * Pipeline, Lifecycle, Segments, Automations, Tasks, Notes
 */

// ─────────────────────────────────────────────────────────────
// PIPELINE TYPES
// ─────────────────────────────────────────────────────────────

export const PIPELINE_STAGES = [
  'new_lead',
  'contacted',
  'consultation_booked',
  'consulted',
  'treatment_planned',
  'converted',
  'vip',
] as const;

export type PipelineStage = typeof PIPELINE_STAGES[number];

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = {
  new_lead: 'New Lead',
  contacted: 'Contacted',
  consultation_booked: 'Consultation Booked',
  consulted: 'Consulted',
  treatment_planned: 'Treatment Planned',
  converted: 'Converted',
  vip: 'VIP',
};

export const PIPELINE_STAGE_COLORS: Record<PipelineStage, string> = {
  new_lead: 'bg-purple-100 text-purple-700 border-purple-300',
  contacted: 'bg-blue-100 text-blue-700 border-blue-300',
  consultation_booked: 'bg-cyan-100 text-cyan-700 border-cyan-300',
  consulted: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  treatment_planned: 'bg-orange-100 text-orange-700 border-orange-300',
  converted: 'bg-green-100 text-green-700 border-green-300',
  vip: 'bg-amber-100 text-amber-800 border-amber-400',
};

export interface PipelineLead {
  id: string;
  clientId: string;
  clientName: string;
  email: string;
  phone: string;
  stage: PipelineStage;
  previousStage?: PipelineStage;
  source: LeadSource;
  assignedTo: string;
  estimatedValue: number;
  actualValue?: number;
  enteredAt: string;       // ISO date when entered current stage
  createdAt: string;       // ISO date of initial lead creation
  lastActivityAt: string;  // ISO date of last activity
  stageHistory: StageTransition[];
  tags: string[];
  notes: string;
  score: number;           // 0-100 lead quality score
  isStale: boolean;
  daysInStage: number;
  lostReason?: LostReason;
  lostAt?: string;
}

export interface StageTransition {
  from: PipelineStage | 'lost';
  to: PipelineStage | 'lost';
  at: string;
  by: string;
  note?: string;
  automationTriggered?: string;
}

export type LeadSource =
  | 'website'
  | 'google'
  | 'instagram'
  | 'facebook'
  | 'referral'
  | 'walk_in'
  | 'phone'
  | 'mangomint'
  | 'event'
  | 'yelp'
  | 'tiktok'
  | 'other';

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  website: 'Website',
  google: 'Google',
  instagram: 'Instagram',
  facebook: 'Facebook',
  referral: 'Referral',
  walk_in: 'Walk-in',
  phone: 'Phone Call',
  mangomint: 'Mangomint',
  event: 'Event',
  yelp: 'Yelp',
  tiktok: 'TikTok',
  other: 'Other',
};

export type LostReason =
  | 'price'
  | 'timing'
  | 'competitor'
  | 'no_show'
  | 'ghosted'
  | 'not_ready'
  | 'medical_contraindication'
  | 'moved'
  | 'bad_experience'
  | 'other';

export const LOST_REASON_LABELS: Record<LostReason, string> = {
  price: 'Price Concern',
  timing: 'Timing Issue',
  competitor: 'Went to Competitor',
  no_show: 'No-Show',
  ghosted: 'Ghosted / Unresponsive',
  not_ready: 'Not Ready',
  medical_contraindication: 'Medical Contraindication',
  moved: 'Moved Away',
  bad_experience: 'Negative Experience',
  other: 'Other',
};

export type AssignmentStrategy = 'round_robin' | 'capacity_based' | 'specialty_based';

export interface AssignmentRule {
  strategy: AssignmentStrategy;
  teamMembers: TeamMember[];
  specialtyMap?: Record<string, string[]>; // service category → team member IDs
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  capacity: number;        // max active leads
  currentLoad: number;     // current active leads
  specialties: string[];
  isAvailable: boolean;
}

export interface PipelineMetrics {
  totalLeads: number;
  leadsByStage: Record<PipelineStage, number>;
  conversionRates: Record<PipelineStage, number>;  // % converting to next stage
  avgTimePerStage: Record<PipelineStage, number>;   // avg days in each stage
  pipelineVelocity: number;     // avg days from lead to conversion
  totalPipelineValue: number;   // sum of estimated values
  forecastedRevenue: number;    // weighted by stage probability
  revenueBySource: Record<LeadSource, number>;
  staleLeadCount: number;
  staleLeads?: unknown[];
  lostLeadsByReason: Record<LostReason, number>;
  winRate: number;              // overall conversion %
  avgDealSize: number;
}

export interface PipelineForecast {
  period: string;
  expectedRevenue: number;
  bestCase: number;
  worstCase: number;
  dealCount: number;
  weightedProbability: number;
}

// ─────────────────────────────────────────────────────────────
// LIFECYCLE TYPES
// ─────────────────────────────────────────────────────────────

export const LIFECYCLE_STAGES = [
  'prospect',
  'first_visit',
  'active',
  'loyal',
  'vip',
  'at_risk',
  'dormant',
  'lost',
  'reactivated',
] as const;

export type LifecycleStage = typeof LIFECYCLE_STAGES[number];

export const LIFECYCLE_STAGE_LABELS: Record<LifecycleStage, string> = {
  prospect: 'Prospect',
  first_visit: 'First Visit',
  active: 'Active',
  loyal: 'Loyal',
  vip: 'VIP',
  at_risk: 'At-Risk',
  dormant: 'Dormant',
  lost: 'Lost',
  reactivated: 'Reactivated',
};

export const LIFECYCLE_STAGE_COLORS: Record<LifecycleStage, string> = {
  prospect: 'bg-slate-100 text-slate-700',
  first_visit: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  loyal: 'bg-emerald-100 text-emerald-700',
  vip: 'bg-amber-100 text-amber-800',
  at_risk: 'bg-orange-100 text-orange-700',
  dormant: 'bg-red-100 text-red-700',
  lost: 'bg-gray-100 text-gray-500',
  reactivated: 'bg-teal-100 text-teal-700',
};

export interface ClientLifecycle {
  clientId: string;
  clientName: string;
  stage: LifecycleStage;
  previousStage?: LifecycleStage;
  enteredStageAt: string;
  daysInStage: number;
  totalVisits: number;
  totalSpend: number;
  avgTicket: number;
  lastVisitDate: string;
  daysSinceLastVisit: number;
  projectedLTV: number;
  retentionRiskScore: number;    // 0-100
  hasMembership: boolean;
  membershipTier?: string;
  milestones: Milestone[];
  nextMilestone?: Milestone;
  communicationPreference: 'email' | 'sms' | 'phone';
}

export type MilestoneType =
  | 'visit_count'
  | 'anniversary'
  | 'birthday'
  | 'spend_threshold'
  | 'membership_anniversary'
  | 'referral_milestone';

export interface Milestone {
  type: MilestoneType;
  label: string;
  targetValue: number;
  currentValue: number;
  achieved: boolean;
  achievedAt?: string;
  rewardOffered?: string;
}

export interface LifecycleTransitionRule {
  from: LifecycleStage | '*';
  to: LifecycleStage;
  conditions: TransitionCondition[];
  priority: number;
}

export interface TransitionCondition {
  field: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'between' | 'in';
  value: number | string | number[] | string[];
}

export interface LifecycleMetrics {
  clientsByStage: Record<LifecycleStage, number>;
  avgLTVByStage: Record<LifecycleStage, number>;
  retentionRateByStage: Record<LifecycleStage, number>;
  transitionsThisMonth: LifecycleMovement[];
  atRiskCount: number;
  reactivationRate: number;
}

export interface LifecycleMovement {
  clientId: string;
  clientName: string;
  from: LifecycleStage;
  to: LifecycleStage;
  at: string;
}

// ─────────────────────────────────────────────────────────────
// SEGMENTATION TYPES
// ─────────────────────────────────────────────────────────────

export interface RFMScores {
  recency: number;    // 1-5 (5 = most recent)
  frequency: number;  // 1-5 (5 = most frequent)
  monetary: number;   // 1-5 (5 = highest spend)
  combined: string;   // e.g., "555", "321"
}

export type BehavioralSegment =
  | 'champions'
  | 'loyal'
  | 'potential_loyalists'
  | 'new_customers'
  | 'promising'
  | 'need_attention'
  | 'about_to_sleep'
  | 'at_risk'
  | 'cant_lose'
  | 'hibernating'
  | 'lost'
  | 'new';

export const BEHAVIORAL_SEGMENT_LABELS: Record<BehavioralSegment, string> = {
  champions: 'Champions',
  loyal: 'Loyal Customers',
  potential_loyalists: 'Potential Loyalists',
  new_customers: 'New Customers',
  promising: 'Promising',
  need_attention: 'Need Attention',
  about_to_sleep: 'About to Sleep',
  at_risk: 'At Risk',
  cant_lose: "Can't Lose Them",
  hibernating: 'Hibernating',
  lost: 'Lost',
  new: 'Brand New',
};

export const BEHAVIORAL_SEGMENT_COLORS: Record<BehavioralSegment, string> = {
  champions: 'bg-green-500 text-white',
  loyal: 'bg-green-400 text-white',
  potential_loyalists: 'bg-emerald-400 text-white',
  new_customers: 'bg-blue-400 text-white',
  promising: 'bg-cyan-400 text-white',
  need_attention: 'bg-yellow-400 text-yellow-900',
  about_to_sleep: 'bg-orange-400 text-white',
  at_risk: 'bg-red-400 text-white',
  cant_lose: 'bg-red-600 text-white',
  hibernating: 'bg-gray-400 text-white',
  lost: 'bg-gray-600 text-white',
  new: 'bg-purple-400 text-white',
};

export interface ClientSegment {
  clientId: string;
  clientName: string;
  rfm: RFMScores;
  segment: BehavioralSegment;
  totalSpend: number;
  visitCount: number;
  lastVisitDate: string;
  daysSinceLastVisit: number;
  avgTicket: number;
  serviceAffinities: ServiceAffinity[];
}

export interface ServiceAffinity {
  category: string;
  serviceName: string;
  visitCount: number;
  totalSpend: number;
  lastDate: string;
  affinityScore: number; // 0-100
}

export type SegmentConditionField =
  | 'totalSpend'
  | 'visitCount'
  | 'daysSinceLastVisit'
  | 'avgTicket'
  | 'membershipStatus'
  | 'membershipTier'
  | 'age'
  | 'source'
  | 'serviceCategory'
  | 'lastService'
  | 'rfmRecency'
  | 'rfmFrequency'
  | 'rfmMonetary'
  | 'segment'
  | 'lifecycleStage'
  | 'pipelineStage'
  | 'hasPackage'
  | 'churnRisk'
  | 'tags'
  | 'preferredContact'
  | 'referralCount';

export type SegmentOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'between'
  | 'contains'
  | 'not_contains'
  | 'in'
  | 'not_in'
  | 'is_true'
  | 'is_false';

export interface SegmentCondition {
  field: SegmentConditionField;
  operator: SegmentOperator;
  value: string | number | boolean | string[] | number[];
}

export interface SegmentGroup {
  logic: 'AND' | 'OR';
  conditions: SegmentCondition[];
}

export interface CustomSegment {
  id: string;
  name: string;
  description: string;
  groups: SegmentGroup[];   // groups are combined with AND
  clientCount: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface SegmentMetrics {
  segmentDistribution: Record<BehavioralSegment, number>;
  segmentRevenue: Record<BehavioralSegment, number>;
  segmentAvgTicket: Record<BehavioralSegment, number>;
  movementAlerts: SegmentMovement[];
  rfmMatrix: RFMMatrixCell[];
}

export interface SegmentMovement {
  clientId: string;
  clientName: string;
  from: BehavioralSegment;
  to: BehavioralSegment;
  at: string;
  significance: 'positive' | 'negative' | 'neutral';
}

export interface RFMMatrixCell {
  recency: number;
  frequency: number;
  clientCount: number;
  avgMonetary: number;
  segment: BehavioralSegment;
}

export interface LookalikeSegment {
  sourceSegment: BehavioralSegment;
  matchingClients: string[];
  similarityScore: number;
  sharedTraits: string[];
}

// ─────────────────────────────────────────────────────────────
// AUTOMATION TYPES
// ─────────────────────────────────────────────────────────────

export type AutomationTriggerType = 'time_based' | 'event_based' | 'segment_based' | 'score_based';

export type AutomationEventType =
  | 'lead_created'
  | 'stage_changed'
  | 'consultation_booked'
  | 'consultation_completed'
  | 'treatment_completed'
  | 'review_received'
  | 'membership_started'
  | 'membership_expiring'
  | 'package_started'
  | 'package_completing'
  | 'birthday_approaching'
  | 'anniversary_approaching'
  | 'booking_abandoned'
  | 'segment_entered'
  | 'segment_exited'
  | 'score_threshold'
  | 'inactivity_detected'
  | 'referral_made'
  | 'high_value_transaction'
  | 'negative_review';

export type AutomationActionType =
  | 'send_email'
  | 'send_sms'
  | 'create_task'
  | 'update_stage'
  | 'add_tag'
  | 'remove_tag'
  | 'assign_to'
  | 'add_to_segment'
  | 'trigger_webhook'
  | 'delay'
  | 'condition'
  | 'log_activity';

export type AutomationCategory =
  | 'lead_nurture'
  | 'post_treatment'
  | 'retention'
  | 'reactivation'
  | 'vip'
  | 'membership'
  | 'seasonal'
  | 'review'
  | 'referral'
  | 'operational'
  | 'birthday'
  | 'cross_sell';

export interface AutomationRecipe {
  id: string;
  name: string;
  description: string;
  category: AutomationCategory;
  trigger: AutomationTrigger;
  actions: AutomationAction[];
  isEnabled: boolean;
  isBuiltIn: boolean;
  executionCount: number;
  lastExecutedAt?: string;
  successRate: number;
  avgRevenueGenerated: number;
  abTest?: ABTest;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationTrigger {
  type: AutomationTriggerType;
  event?: AutomationEventType;
  schedule?: string;            // cron expression for time_based
  segment?: string;             // segment ID for segment_based
  scoreThreshold?: number;      // for score_based
  scoreDirection?: 'above' | 'below';
  conditions?: SegmentCondition[];
}

export interface AutomationAction {
  id: string;
  type: AutomationActionType;
  config: Record<string, unknown>;
  delayMinutes?: number;
  order: number;
}

export interface ABTest {
  id: string;
  variantA: { name: string; actions: AutomationAction[] };
  variantB: { name: string; actions: AutomationAction[] };
  splitPercentage: number;  // % going to variant A
  winner?: 'A' | 'B';
  metrics: {
    variantA: { sent: number; opened: number; clicked: number; converted: number };
    variantB: { sent: number; opened: number; clicked: number; converted: number };
  };
  startedAt: string;
  endsAt?: string;
}

export interface AutomationExecution {
  id: string;
  automationId: string;
  clientId: string;
  clientName: string;
  triggeredAt: string;
  completedAt?: string;
  status: 'running' | 'completed' | 'failed' | 'skipped';
  actionsCompleted: number;
  totalActions: number;
  error?: string;
  variant?: 'A' | 'B';
  revenue?: number;
}

export interface AutomationMetrics {
  totalAutomations: number;
  activeAutomations: number;
  executionsToday: number;
  executionsThisWeek: number;
  totalRevenueGenerated: number;
  topPerformers: AutomationRecipe[];
  recentExecutions: AutomationExecution[];
}

// ─────────────────────────────────────────────────────────────
// TASK TYPES
// ─────────────────────────────────────────────────────────────

export type TaskType =
  | 'follow_up_call'
  | 'send_info'
  | 'confirm_appointment'
  | 'review_chart'
  | 'approve_treatment_plan'
  | 'send_consent_form'
  | 'schedule_follow_up'
  | 'process_payment'
  | 'update_records'
  | 'custom';

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  follow_up_call: 'Follow-Up Call',
  send_info: 'Send Information',
  confirm_appointment: 'Confirm Appointment',
  review_chart: 'Review Chart',
  approve_treatment_plan: 'Approve Treatment Plan',
  send_consent_form: 'Send Consent Form',
  schedule_follow_up: 'Schedule Follow-Up',
  process_payment: 'Process Payment',
  update_records: 'Update Records',
  custom: 'Custom Task',
};

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';

export interface CRMTask {
  id: string;
  type: TaskType;
  title: string;
  description: string;
  clientId?: string;
  clientName?: string;
  leadId?: string;
  assignedTo: string;
  assignedBy: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  dueTime?: string;
  completedAt?: string;
  completedBy?: string;
  slaHours: number;
  isOverdue: boolean;
  hoursOverdue?: number;
  escalatedTo?: string;
  automationId?: string;    // if auto-generated
  pipelineStage?: PipelineStage;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskDigest {
  teamMember: string;
  date: string;
  tasks: CRMTask[];
  overdueTasks: CRMTask[];
  completedToday: number;
  totalPending: number;
  avgCompletionTime: number; // hours
}

export interface TaskMetrics {
  totalPending: number;
  totalOverdue: number;
  completedToday: number;
  completedThisWeek: number;
  avgCompletionTime: number;
  completionRate: number;
  tasksByType: Record<TaskType, number>;
  tasksByPriority: Record<TaskPriority, number>;
  tasksByAssignee: Record<string, number>;
  overdueTasks: CRMTask[];
}

// ─────────────────────────────────────────────────────────────
// NOTES / ACTIVITY TYPES
// ─────────────────────────────────────────────────────────────

export type NoteType = 'call' | 'email' | 'text' | 'in_person' | 'internal';

export const NOTE_TYPE_LABELS: Record<NoteType, string> = {
  call: 'Phone Call',
  email: 'Email',
  text: 'Text Message',
  in_person: 'In-Person',
  internal: 'Internal Note',
};

export const NOTE_TYPE_ICONS: Record<NoteType, string> = {
  call: 'Phone',
  email: 'Mail',
  text: 'MessageSquare',
  in_person: 'Users',
  internal: 'FileText',
};

export interface CRMNote {
  id: string;
  clientId: string;
  clientName: string;
  type: NoteType;
  subject: string;
  content: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  mentions: string[];        // team member IDs
  tags: string[];
  attachments: NoteAttachment[];
  automationId?: string;
  isAutoGenerated: boolean;
}

export interface NoteAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface NoteTemplate {
  id: string;
  name: string;
  type: NoteType;
  subject: string;
  content: string;
  variables: string[];  // e.g., ['clientName', 'serviceName', 'date']
}

export interface ClientTimeline {
  clientId: string;
  clientName: string;
  events: TimelineEvent[];
  totalEvents: number;
}

export type TimelineEventType =
  | 'note'
  | 'stage_change'
  | 'appointment'
  | 'transaction'
  | 'membership'
  | 'task'
  | 'automation'
  | 'milestone'
  | 'review';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  description: string;
  timestamp: string;
  actor: string;
  metadata?: Record<string, unknown>;
  icon: string;
  color: string;
}

// ─────────────────────────────────────────────────────────────
// CRM DASHBOARD TYPES
// ─────────────────────────────────────────────────────────────

export interface CRMOverviewData {
  pipeline: PipelineMetrics;
  lifecycle: LifecycleMetrics;
  segments: SegmentMetrics;
  automations: AutomationMetrics;
  tasks: TaskMetrics;
  recentActivity: TimelineEvent[];
}

export interface CRMKanbanData {
  stages: {
    stage: PipelineStage;
    label: string;
    leads: PipelineLead[];
    count: number;
    totalValue: number;
  }[];
  metrics: PipelineMetrics;
  forecasts: PipelineForecast[];
}

export interface CRM360Data {
  client: ClientLifecycle;
  pipeline?: PipelineLead;
  segment: ClientSegment;
  timeline: ClientTimeline;
  tasks: CRMTask[];
  automations: AutomationExecution[];
  milestones: Milestone[];
  recommendations: string[];
}
