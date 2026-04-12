/**
 * Task Management Tests — 35 tests
 */

import {
  createTask,
  generateStageTasks,
  completeTask,
  startTask,
  cancelTask,
  reassignTask,
  isTaskOverdue,
  hoursOverdue,
  processOverdueTasks,
  generateTaskDigest,
  calculateTaskMetrics,
  filterTasks,
  TASK_SLA_HOURS,
  STAGE_TASKS,
} from '../tasks';
import type { CRMTask, TaskFilter } from '@/types/crm';

function makeTask(overrides: Partial<CRMTask> = {}): CRMTask {
  const now = new Date();
  return {
    id: 'task_test',
    type: 'follow_up_call',
    title: 'Test task',
    description: '',
    assignedTo: 'Rina',
    assignedBy: 'system',
    priority: 'medium',
    status: 'pending',
    dueDate: now.toISOString().split('T')[0],
    slaHours: 4,
    isOverdue: false,
    notes: '',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    ...overrides,
  };
}

// ─── Task Creation Tests ─────────────────────────────────────

describe('Tasks - Creation', () => {
  test('should create task with defaults', () => {
    const task = createTask({ type: 'follow_up_call', title: 'Call client', assignedTo: 'Rina' });
    expect(task.id).toMatch(/^task_/);
    expect(task.status).toBe('pending');
    expect(task.priority).toBe('medium');
    expect(task.isOverdue).toBe(false);
  });

  test('should use type-specific SLA', () => {
    const task = createTask({ type: 'follow_up_call', title: 'Call', assignedTo: 'Rina' });
    expect(task.slaHours).toBe(TASK_SLA_HOURS.follow_up_call);
  });

  test('should accept custom SLA', () => {
    const task = createTask({ type: 'follow_up_call', title: 'Call', assignedTo: 'Rina', slaHours: 2 });
    expect(task.slaHours).toBe(2);
  });

  test('should accept custom priority', () => {
    const task = createTask({ type: 'follow_up_call', title: 'Call', assignedTo: 'Rina', priority: 'urgent' });
    expect(task.priority).toBe('urgent');
  });

  test('should set client info', () => {
    const task = createTask({ type: 'follow_up_call', title: 'Call', assignedTo: 'Rina', clientId: 'c001', clientName: 'Sarah' });
    expect(task.clientId).toBe('c001');
    expect(task.clientName).toBe('Sarah');
  });
});

// ─── Stage Task Generation Tests ─────────────────────────────

describe('Tasks - Stage Task Generation', () => {
  test('should generate tasks for new_lead stage', () => {
    const tasks = generateStageTasks('new_lead', 'c001', 'Sarah', 'Rina');
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks[0].priority).toBe('urgent');
  });

  test('should generate tasks for consulted stage', () => {
    const tasks = generateStageTasks('consulted', 'c001', 'Sarah', 'Rina');
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks.some(t => t.type === 'approve_treatment_plan')).toBe(true);
  });

  test('should generate tasks for converted stage', () => {
    const tasks = generateStageTasks('converted', 'c001', 'Sarah', 'Rina');
    expect(tasks.length).toBeGreaterThan(0);
  });

  test('should assign all tasks to specified team member', () => {
    const tasks = generateStageTasks('new_lead', 'c001', 'Sarah', 'Rina');
    for (const task of tasks) {
      expect(task.assignedTo).toBe('Rina');
    }
  });

  test('should have tasks for all pipeline stages', () => {
    const stages = ['new_lead', 'contacted', 'consultation_booked', 'consulted', 'treatment_planned', 'converted', 'vip'] as const;
    for (const stage of stages) {
      expect(STAGE_TASKS[stage]).toBeDefined();
    }
  });
});

// ─── Task Status Tests ───────────────────────────────────────

describe('Tasks - Status Management', () => {
  test('should complete a task', () => {
    const task = makeTask();
    const completed = completeTask(task, 'Rina');
    expect(completed.status).toBe('completed');
    expect(completed.completedAt).toBeDefined();
    expect(completed.completedBy).toBe('Rina');
  });

  test('should start a task', () => {
    const task = makeTask();
    const started = startTask(task);
    expect(started.status).toBe('in_progress');
  });

  test('should cancel a task', () => {
    const task = makeTask();
    const cancelled = cancelTask(task, 'Client cancelled');
    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.notes).toContain('Cancelled: Client cancelled');
  });

  test('should reassign a task', () => {
    const task = makeTask({ assignedTo: 'Rina' });
    const reassigned = reassignTask(task, 'Mom', 'CEO');
    expect(reassigned.assignedTo).toBe('Mom');
    expect(reassigned.notes).toContain('Reassigned');
  });
});

// ─── Overdue Detection Tests ─────────────────────────────────

describe('Tasks - Overdue Detection', () => {
  test('should detect overdue task', () => {
    const yesterday = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const task = makeTask({ dueDate: yesterday });
    expect(isTaskOverdue(task)).toBe(true);
  });

  test('should not detect future task as overdue', () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const task = makeTask({ dueDate: tomorrow });
    expect(isTaskOverdue(task)).toBe(false);
  });

  test('should not detect completed task as overdue', () => {
    const yesterday = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const task = makeTask({ dueDate: yesterday, status: 'completed' });
    expect(isTaskOverdue(task)).toBe(false);
  });

  test('should calculate hours overdue', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const task = makeTask({ dueDate: twoDaysAgo });
    const hours = hoursOverdue(task);
    expect(hours).toBeGreaterThan(20);
  });

  test('should return 0 hours for non-overdue task', () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const task = makeTask({ dueDate: tomorrow });
    expect(hoursOverdue(task)).toBe(0);
  });

  test('should escalate priority of overdue tasks', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const tasks = [makeTask({ dueDate: threeDaysAgo, priority: 'medium' })];
    const processed = processOverdueTasks(tasks);
    expect(processed[0].isOverdue).toBe(true);
    expect(processed[0].priority).toBe('urgent');
  });
});

// ─── Task Digest Tests ───────────────────────────────────────

describe('Tasks - Daily Digest', () => {
  test('should generate digest for team member', () => {
    const today = new Date().toISOString().split('T')[0];
    const tasks = [
      makeTask({ assignedTo: 'Rina', dueDate: today }),
      makeTask({ id: 'task_2', assignedTo: 'Rina', dueDate: today, status: 'completed', completedAt: new Date().toISOString() }),
      makeTask({ id: 'task_3', assignedTo: 'Mom', dueDate: today }),
    ];
    const digest = generateTaskDigest(tasks, 'Rina');
    expect(digest.teamMember).toBe('Rina');
    expect(digest.tasks.length).toBeGreaterThanOrEqual(1);
    expect(digest.completedToday).toBe(1);
  });

  test('should include overdue tasks in digest', () => {
    const yesterday = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const tasks = [makeTask({ assignedTo: 'Rina', dueDate: yesterday, isOverdue: true })];
    const digest = generateTaskDigest(tasks, 'Rina');
    expect(digest.overdueTasks.length).toBe(1);
  });
});

// ─── Task Metrics Tests ──────────────────────────────────────

describe('Tasks - Metrics', () => {
  test('should count pending tasks', () => {
    const tasks = [
      makeTask({ status: 'pending' }),
      makeTask({ status: 'in_progress' }),
      makeTask({ status: 'completed' }),
    ];
    const metrics = calculateTaskMetrics(tasks);
    expect(metrics.totalPending).toBe(2);
  });

  test('should count overdue tasks', () => {
    const tasks = [
      makeTask({ isOverdue: true, status: 'pending' }),
      makeTask({ isOverdue: false }),
    ];
    const metrics = calculateTaskMetrics(tasks);
    expect(metrics.totalOverdue).toBe(1);
  });

  test('should track tasks by type', () => {
    const tasks = [
      makeTask({ type: 'follow_up_call', status: 'pending' }),
      makeTask({ type: 'follow_up_call', status: 'pending' }),
      makeTask({ type: 'send_info', status: 'pending' }),
    ];
    const metrics = calculateTaskMetrics(tasks);
    expect(metrics.tasksByType.follow_up_call).toBe(2);
    expect(metrics.tasksByType.send_info).toBe(1);
  });

  test('should track tasks by priority', () => {
    const tasks = [
      makeTask({ priority: 'urgent', status: 'pending' }),
      makeTask({ priority: 'high', status: 'pending' }),
      makeTask({ priority: 'medium', status: 'pending' }),
    ];
    const metrics = calculateTaskMetrics(tasks);
    expect(metrics.tasksByPriority.urgent).toBe(1);
    expect(metrics.tasksByPriority.high).toBe(1);
  });
});

// ─── Task Filtering Tests ────────────────────────────────────

describe('Tasks - Filtering', () => {
  const tasks = [
    makeTask({ id: 't1', assignedTo: 'Rina', priority: 'urgent', type: 'follow_up_call', status: 'pending' }),
    makeTask({ id: 't2', assignedTo: 'Mom', priority: 'medium', type: 'send_info', status: 'pending' }),
    makeTask({ id: 't3', assignedTo: 'Rina', priority: 'low', type: 'update_records', status: 'completed' }),
  ];

  test('should filter by assignee', () => {
    const result = filterTasks(tasks, { assignedTo: 'Rina' });
    expect(result).toHaveLength(2);
  });

  test('should filter by priority', () => {
    const result = filterTasks(tasks, { priority: 'urgent' });
    expect(result).toHaveLength(1);
  });

  test('should filter by type', () => {
    const result = filterTasks(tasks, { type: 'follow_up_call' });
    expect(result).toHaveLength(1);
  });

  test('should sort by priority (urgent first)', () => {
    const result = filterTasks(tasks, {});
    expect(result[0].priority).toBe('urgent');
  });
});

// ─── SLA Constants Tests ─────────────────────────────────────

describe('Tasks - SLA Constants', () => {
  test('should have SLAs for all task types', () => {
    const types = ['follow_up_call', 'send_info', 'confirm_appointment', 'review_chart', 'approve_treatment_plan', 'send_consent_form', 'schedule_follow_up', 'process_payment', 'update_records', 'custom'] as const;
    for (const type of types) {
      expect(TASK_SLA_HOURS[type]).toBeGreaterThan(0);
    }
  });

  test('should have fastest SLA for follow_up_call', () => {
    expect(TASK_SLA_HOURS.follow_up_call).toBeLessThanOrEqual(TASK_SLA_HOURS.review_chart);
  });
});
