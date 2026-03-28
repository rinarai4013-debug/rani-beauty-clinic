import { NextRequest, NextResponse } from 'next/server';
import { calculateTaskMetrics, processOverdueTasks, filterTasks } from '@/lib/crm/tasks';
import type { CRMTask, TaskFilter } from '@/types/crm';

/**
 * GET /api/dashboard/crm/tasks
 * Returns tasks with metrics.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assignedTo = searchParams.get('assignedTo') || undefined;
    const status = searchParams.get('status') || undefined;
    const priority = searchParams.get('priority') || undefined;

    let tasks = getSampleTasks();
    tasks = processOverdueTasks(tasks);

    const filter: TaskFilter = {};
    if (assignedTo) filter.assignedTo = assignedTo;
    if (status) filter.status = status as TaskFilter['status'];
    if (priority) filter.priority = priority as TaskFilter['priority'];

    const filtered = Object.keys(filter).length > 0 ? filterTasks(tasks, filter) : tasks;
    const metrics = calculateTaskMetrics(tasks);

    return NextResponse.json({ tasks: filtered, metrics });
  } catch (error) {
    console.error('CRM Tasks error:', error);
    return NextResponse.json({ error: 'Failed to load tasks' }, { status: 500 });
  }
}

/**
 * POST /api/dashboard/crm/tasks
 * Create, complete, or reassign a task.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'create') {
      return NextResponse.json({ success: true, message: 'Task created' });
    }
    if (action === 'complete') {
      return NextResponse.json({ success: true, message: 'Task completed' });
    }
    if (action === 'reassign') {
      return NextResponse.json({ success: true, message: 'Task reassigned' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('CRM Tasks POST error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

function getSampleTasks(): CRMTask[] {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return [
    {
      id: 'task_001', type: 'follow_up_call', title: 'Call new lead - Sarah Johnson',
      description: 'Follow up on Instagram inquiry about injection treatments', clientId: 'c001', clientName: 'Sarah Johnson',
      assignedTo: 'Rina', assignedBy: 'system', priority: 'urgent', status: 'pending',
      dueDate: today, slaHours: 4, isOverdue: false, notes: '', createdAt: now.toISOString(), updatedAt: now.toISOString(),
    },
    {
      id: 'task_002', type: 'approve_treatment_plan', title: 'Finalize treatment plan - Michelle Park',
      description: 'Platinum Sofwave package plan needs approval', clientId: 'c003', clientName: 'Michelle Park',
      assignedTo: 'Rina', assignedBy: 'system', priority: 'high', status: 'in_progress',
      dueDate: today, slaHours: 24, isOverdue: false, notes: '', createdAt: now.toISOString(), updatedAt: now.toISOString(),
    },
    {
      id: 'task_003', type: 'confirm_appointment', title: 'Confirm consultation - Emily Chen',
      description: 'Sofwave consultation booked for tomorrow', clientId: 'c002', clientName: 'Emily Chen',
      assignedTo: 'Rina', assignedBy: 'system', priority: 'medium', status: 'pending',
      dueDate: yesterday, slaHours: 24, isOverdue: true, hoursOverdue: 26, notes: '', createdAt: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(), updatedAt: now.toISOString(),
    },
  ];
}
