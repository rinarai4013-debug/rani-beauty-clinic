/**
 * Task Management Engine for Rani Beauty Clinic CRM
 *
 * Task types: follow-up call, send info, confirm appointment, review chart, approve treatment plan.
 * Auto-generated tasks from pipeline changes, SLA tracking, overdue escalation, daily digest.
 */

import type {
  CRMTask,
  TaskType,
  TaskPriority,
  TaskStatus,
  TaskDigest,
  TaskMetrics,
  PipelineStage,
} from '@/types/crm';

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

/** Default SLA hours by task type */
export const TASK_SLA_HOURS: Record<TaskType, number> = {
  follow_up_call: 4,
  send_info: 2,
  confirm_appointment: 24,
  review_chart: 48,
  approve_treatment_plan: 24,
  send_consent_form: 2,
  schedule_follow_up: 24,
  process_payment: 4,
  update_records: 48,
  custom: 24,
};

/** Task priority escalation rules: hours overdue → new priority */
export const ESCALATION_RULES: { hoursOverdue: number; newPriority: TaskPriority }[] = [
  { hoursOverdue: 24, newPriority: 'urgent' },
  { hoursOverdue: 12, newPriority: 'high' },
  { hoursOverdue: 4, newPriority: 'medium' },
];

/** Auto-generated tasks by pipeline stage transition */
export const STAGE_TASKS: Record<PipelineStage, { type: TaskType; title: string; priority: TaskPriority; slaHours: number }[]> = {
  new_lead: [
    { type: 'follow_up_call', title: 'Call new lead within 1 hour', priority: 'urgent', slaHours: 1 },
    { type: 'send_info', title: 'Send service information packet', priority: 'high', slaHours: 2 },
  ],
  contacted: [
    { type: 'schedule_follow_up', title: 'Book consultation appointment', priority: 'high', slaHours: 24 },
  ],
  consultation_booked: [
    { type: 'confirm_appointment', title: 'Confirm consultation appointment', priority: 'medium', slaHours: 24 },
    { type: 'send_consent_form', title: 'Send pre-consultation forms', priority: 'medium', slaHours: 24 },
  ],
  consulted: [
    { type: 'approve_treatment_plan', title: 'Prepare and send treatment plan', priority: 'high', slaHours: 24 },
    { type: 'follow_up_call', title: 'Follow up on consultation', priority: 'high', slaHours: 48 },
  ],
  treatment_planned: [
    { type: 'follow_up_call', title: 'Follow up on treatment plan decision', priority: 'high', slaHours: 48 },
    { type: 'process_payment', title: 'Collect deposit if applicable', priority: 'medium', slaHours: 72 },
  ],
  converted: [
    { type: 'update_records', title: 'Update client records post-conversion', priority: 'low', slaHours: 48 },
    { type: 'schedule_follow_up', title: 'Schedule first treatment appointment', priority: 'high', slaHours: 24 },
  ],
  vip: [
    { type: 'follow_up_call', title: 'VIP welcome call', priority: 'medium', slaHours: 48 },
  ],
};

// ─────────────────────────────────────────────────────────────
// TASK CREATION
// ─────────────────────────────────────────────────────────────

/**
 * Create a new CRM task.
 */
export function createTask(input: {
  type: TaskType;
  title: string;
  description?: string;
  clientId?: string;
  clientName?: string;
  leadId?: string;
  assignedTo: string;
  assignedBy?: string;
  priority?: TaskPriority;
  dueDate?: string;
  dueTime?: string;
  slaHours?: number;
  automationId?: string;
  pipelineStage?: PipelineStage;
  notes?: string;
}): CRMTask {
  const now = new Date();
  const slaHours = input.slaHours || TASK_SLA_HOURS[input.type];
  const dueDate = input.dueDate || new Date(now.getTime() + slaHours * 60 * 60 * 1000).toISOString().split('T')[0];

  return {
    id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: input.type,
    title: input.title,
    description: input.description || '',
    clientId: input.clientId,
    clientName: input.clientName,
    leadId: input.leadId,
    assignedTo: input.assignedTo,
    assignedBy: input.assignedBy || 'system',
    priority: input.priority || 'medium',
    status: 'pending',
    dueDate,
    dueTime: input.dueTime,
    slaHours,
    isOverdue: false,
    automationId: input.automationId,
    pipelineStage: input.pipelineStage,
    notes: input.notes || '',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

/**
 * Generate tasks from a pipeline stage transition.
 */
export function generateStageTasks(
  stage: PipelineStage,
  clientId: string,
  clientName: string,
  assignedTo: string,
  leadId?: string,
): CRMTask[] {
  const taskTemplates = STAGE_TASKS[stage] || [];

  return taskTemplates.map(template =>
    createTask({
      type: template.type,
      title: template.title,
      clientId,
      clientName,
      leadId,
      assignedTo,
      priority: template.priority,
      slaHours: template.slaHours,
      pipelineStage: stage,
    }),
  );
}

// ─────────────────────────────────────────────────────────────
// TASK STATUS MANAGEMENT
// ─────────────────────────────────────────────────────────────

/**
 * Complete a task.
 */
export function completeTask(task: CRMTask, completedBy: string): CRMTask {
  return {
    ...task,
    status: 'completed',
    completedAt: new Date().toISOString(),
    completedBy,
    updatedAt: new Date().toISOString(),
    isOverdue: false,
  };
}

/**
 * Start working on a task.
 */
export function startTask(task: CRMTask): CRMTask {
  return {
    ...task,
    status: 'in_progress',
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Cancel a task.
 */
export function cancelTask(task: CRMTask, reason?: string): CRMTask {
  return {
    ...task,
    status: 'cancelled',
    notes: reason ? `${task.notes}\nCancelled: ${reason}` : task.notes,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Reassign a task.
 */
export function reassignTask(task: CRMTask, newAssignee: string, reassignedBy: string): CRMTask {
  return {
    ...task,
    assignedTo: newAssignee,
    notes: `${task.notes}\nReassigned from ${task.assignedTo} to ${newAssignee} by ${reassignedBy}`,
    updatedAt: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────
// OVERDUE DETECTION & ESCALATION
// ─────────────────────────────────────────────────────────────

/**
 * Check if a task is overdue based on SLA.
 */
export function isTaskOverdue(task: CRMTask): boolean {
  if (task.status === 'completed' || task.status === 'cancelled') return false;

  const dueDateTime = new Date(`${task.dueDate}T${task.dueTime || '23:59:59'}`);
  return new Date() > dueDateTime;
}

/**
 * Calculate hours overdue.
 */
export function hoursOverdue(task: CRMTask): number {
  if (!isTaskOverdue(task)) return 0;

  const dueDateTime = new Date(`${task.dueDate}T${task.dueTime || '23:59:59'}`);
  const now = new Date();
  return Math.round((now.getTime() - dueDateTime.getTime()) / (1000 * 60 * 60) * 10) / 10;
}

/**
 * Process overdue tasks: mark overdue, escalate priority, set escalation target.
 */
export function processOverdueTasks(tasks: CRMTask[]): CRMTask[] {
  return tasks.map(task => {
    if (task.status === 'completed' || task.status === 'cancelled') return task;

    const overdue = isTaskOverdue(task);
    if (!overdue) return { ...task, isOverdue: false };

    const hours = hoursOverdue(task);
    let newPriority = task.priority;
    let escalatedTo = task.escalatedTo;

    // Find appropriate escalation level
    for (const rule of ESCALATION_RULES) {
      if (hours >= rule.hoursOverdue && priorityLevel(rule.newPriority) > priorityLevel(task.priority)) {
        newPriority = rule.newPriority;
        if (hours >= 24 && !task.escalatedTo) {
          escalatedTo = 'manager';
        }
        break;
      }
    }

    return {
      ...task,
      isOverdue: true,
      hoursOverdue: hours,
      priority: newPriority,
      status: 'overdue' as TaskStatus,
      escalatedTo,
      updatedAt: new Date().toISOString(),
    };
  });
}

function priorityLevel(priority: TaskPriority): number {
  const levels: Record<TaskPriority, number> = { low: 1, medium: 2, high: 3, urgent: 4 };
  return levels[priority];
}

// ─────────────────────────────────────────────────────────────
// DAILY TASK DIGEST
// ─────────────────────────────────────────────────────────────

/**
 * Generate a daily task digest for a team member.
 */
export function generateTaskDigest(
  tasks: CRMTask[],
  teamMember: string,
  date?: string,
): TaskDigest {
  const targetDate = date || new Date().toISOString().split('T')[0];
  const memberTasks = tasks.filter(t => t.assignedTo === teamMember);

  const dueTasks = memberTasks.filter(t =>
    t.dueDate === targetDate &&
    t.status !== 'completed' &&
    t.status !== 'cancelled',
  );

  const overdueTasks = memberTasks.filter(t =>
    t.isOverdue &&
    t.status !== 'completed' &&
    t.status !== 'cancelled',
  );

  const completedToday = memberTasks.filter(t =>
    t.completedAt && t.completedAt.startsWith(targetDate),
  ).length;

  const totalPending = memberTasks.filter(t =>
    t.status === 'pending' || t.status === 'in_progress',
  ).length;

  // Average completion time (hours) for completed tasks
  const completedTasks = memberTasks.filter(t => t.completedAt);
  const avgCompletionTime = completedTasks.length > 0
    ? completedTasks.reduce((sum, t) => {
        const created = new Date(t.createdAt).getTime();
        const completed = new Date(t.completedAt!).getTime();
        return sum + (completed - created) / (1000 * 60 * 60);
      }, 0) / completedTasks.length
    : 0;

  // Combine due + overdue, sorted by priority then due date
  const allTasks = [...dueTasks, ...overdueTasks]
    .sort((a, b) => {
      const priorityDiff = priorityLevel(b.priority) - priorityLevel(a.priority);
      if (priorityDiff !== 0) return priorityDiff;
      return a.dueDate.localeCompare(b.dueDate);
    });

  return {
    teamMember,
    date: targetDate,
    tasks: allTasks,
    overdueTasks,
    completedToday,
    totalPending,
    avgCompletionTime: Math.round(avgCompletionTime * 10) / 10,
  };
}

// ─────────────────────────────────────────────────────────────
// TASK METRICS
// ─────────────────────────────────────────────────────────────

/**
 * Calculate task management metrics.
 */
export function calculateTaskMetrics(tasks: CRMTask[]): TaskMetrics {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const overdueTasks = tasks.filter(t => t.isOverdue && t.status !== 'completed' && t.status !== 'cancelled');
  const completedToday = tasks.filter(t => t.completedAt && t.completedAt.startsWith(todayStr)).length;
  const completedThisWeek = tasks.filter(t => t.completedAt && t.completedAt >= weekAgo).length;

  // Completion rate (last 30 days)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const recentTasks = tasks.filter(t => t.createdAt >= thirtyDaysAgo);
  const recentCompleted = recentTasks.filter(t => t.status === 'completed').length;
  const completionRate = recentTasks.length > 0
    ? Math.round((recentCompleted / recentTasks.length) * 100)
    : 0;

  // Average completion time
  const completedWithTime = tasks.filter(t => t.completedAt);
  const avgCompletionTime = completedWithTime.length > 0
    ? completedWithTime.reduce((sum, t) => {
        const hours = (new Date(t.completedAt!).getTime() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60);
        return sum + hours;
      }, 0) / completedWithTime.length
    : 0;

  // Tasks by type
  const tasksByType: Record<TaskType, number> = {
    follow_up_call: 0, send_info: 0, confirm_appointment: 0, review_chart: 0,
    approve_treatment_plan: 0, send_consent_form: 0, schedule_follow_up: 0,
    process_payment: 0, update_records: 0, custom: 0,
  };
  for (const task of pendingTasks) {
    tasksByType[task.type]++;
  }

  // Tasks by priority
  const tasksByPriority: Record<TaskPriority, number> = { low: 0, medium: 0, high: 0, urgent: 0 };
  for (const task of pendingTasks) {
    tasksByPriority[task.priority]++;
  }

  // Tasks by assignee
  const tasksByAssignee: Record<string, number> = {};
  for (const task of pendingTasks) {
    tasksByAssignee[task.assignedTo] = (tasksByAssignee[task.assignedTo] || 0) + 1;
  }

  return {
    totalPending: pendingTasks.length,
    totalOverdue: overdueTasks.length,
    completedToday,
    completedThisWeek,
    avgCompletionTime: Math.round(avgCompletionTime * 10) / 10,
    completionRate,
    tasksByType,
    tasksByPriority,
    tasksByAssignee,
    overdueTasks,
  };
}

// ─────────────────────────────────────────────────────────────
// TASK FILTERING & SORTING
// ─────────────────────────────────────────────────────────────

export interface TaskFilter {
  assignedTo?: string;
  type?: TaskType;
  priority?: TaskPriority;
  status?: TaskStatus;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
  overdueOnly?: boolean;
}

/**
 * Filter and sort tasks.
 */
export function filterTasks(tasks: CRMTask[], filter: TaskFilter): CRMTask[] {
  let filtered = [...tasks];

  if (filter.assignedTo) {
    filtered = filtered.filter(t => t.assignedTo === filter.assignedTo);
  }
  if (filter.type) {
    filtered = filtered.filter(t => t.type === filter.type);
  }
  if (filter.priority) {
    filtered = filtered.filter(t => t.priority === filter.priority);
  }
  if (filter.status) {
    filtered = filtered.filter(t => t.status === filter.status);
  }
  if (filter.clientId) {
    filtered = filtered.filter(t => t.clientId === filter.clientId);
  }
  if (filter.dateFrom) {
    filtered = filtered.filter(t => t.dueDate >= filter.dateFrom!);
  }
  if (filter.dateTo) {
    filtered = filtered.filter(t => t.dueDate <= filter.dateTo!);
  }
  if (filter.overdueOnly) {
    filtered = filtered.filter(t => t.isOverdue);
  }

  // Sort: urgent first, then by due date
  return filtered.sort((a, b) => {
    const priorityDiff = priorityLevel(b.priority) - priorityLevel(a.priority);
    if (priorityDiff !== 0) return priorityDiff;
    return a.dueDate.localeCompare(b.dueDate);
  });
}
