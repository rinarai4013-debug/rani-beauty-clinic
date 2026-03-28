'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Clock, AlertTriangle, User, Phone, FileText, Calendar, CreditCard } from 'lucide-react';
import type { CRMTask, TaskPriority, TaskStatus, TaskType } from '@/types/crm';
import { TASK_TYPE_LABELS, TASK_PRIORITY_COLORS } from '@/types/crm';

interface TaskBoardProps {
  tasks: CRMTask[];
  onComplete?: (taskId: string) => void;
  onStart?: (taskId: string) => void;
  onReassign?: (taskId: string, assignee: string) => void;
  onClick?: (task: CRMTask) => void;
}

const TASK_ICONS: Record<TaskType, typeof Phone> = {
  follow_up_call: Phone,
  send_info: FileText,
  confirm_appointment: Calendar,
  review_chart: FileText,
  approve_treatment_plan: FileText,
  send_consent_form: FileText,
  schedule_follow_up: Calendar,
  process_payment: CreditCard,
  update_records: FileText,
  custom: FileText,
};

const STATUS_COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'overdue', label: 'Overdue', color: 'border-red-300 bg-red-50/50' },
  { status: 'pending', label: 'Pending', color: 'border-yellow-300 bg-yellow-50/50' },
  { status: 'in_progress', label: 'In Progress', color: 'border-blue-300 bg-blue-50/50' },
  { status: 'completed', label: 'Completed', color: 'border-green-300 bg-green-50/50' },
];

function TaskCard({
  task,
  onComplete,
  onStart,
  onClick,
}: {
  task: CRMTask;
  onComplete?: (id: string) => void;
  onStart?: (id: string) => void;
  onClick?: (task: CRMTask) => void;
}) {
  const Icon = TASK_ICONS[task.type] || FileText;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-lg border p-3 cursor-pointer hover:shadow-sm transition-shadow ${
        task.isOverdue ? 'border-red-300' : 'border-rani-border'
      }`}
      onClick={() => onClick?.(task)}
    >
      <div className="flex items-start gap-2 mb-2">
        <div className={`p-1 rounded ${task.isOverdue ? 'bg-red-100' : 'bg-gray-100'}`}>
          <Icon className={`w-3.5 h-3.5 ${task.isOverdue ? 'text-red-600' : 'text-rani-muted'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-semibold text-rani-navy truncate">{task.title}</h4>
          {task.clientName && (
            <p className="text-[10px] text-rani-muted">{task.clientName}</p>
          )}
        </div>
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${TASK_PRIORITY_COLORS[task.priority]}`}>
          {task.priority}
        </span>
      </div>

      <div className="flex items-center justify-between text-[10px] text-rani-muted">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-0.5">
            <User className="w-3 h-3" />
            {task.assignedTo}
          </span>
          <span className="flex items-center gap-0.5">
            <Clock className="w-3 h-3" />
            {task.dueDate}
          </span>
        </div>

        {task.isOverdue && task.hoursOverdue && (
          <span className="flex items-center gap-0.5 text-red-600 font-medium">
            <AlertTriangle className="w-3 h-3" />
            {task.hoursOverdue}h overdue
          </span>
        )}
      </div>

      {/* Action buttons */}
      {task.status !== 'completed' && task.status !== 'cancelled' && (
        <div className="mt-2 pt-2 border-t border-gray-100 flex gap-2">
          {task.status === 'pending' && onStart && (
            <button
              className="text-[10px] text-blue-600 hover:text-blue-800 font-medium"
              onClick={(e) => { e.stopPropagation(); onStart(task.id); }}
            >
              Start
            </button>
          )}
          {onComplete && (
            <button
              className="flex items-center gap-0.5 text-[10px] text-green-600 hover:text-green-800 font-medium"
              onClick={(e) => { e.stopPropagation(); onComplete(task.id); }}
            >
              <CheckCircle2 className="w-3 h-3" />
              Complete
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function TaskBoard({ tasks, onComplete, onStart, onReassign, onClick }: TaskBoardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {STATUS_COLUMNS.map(({ status, label, color }) => {
        const columnTasks = tasks.filter(t => {
          if (status === 'overdue') return t.isOverdue && t.status !== 'completed';
          if (status === 'pending') return t.status === 'pending' && !t.isOverdue;
          return t.status === status;
        });

        return (
          <div key={status} className={`rounded-xl border p-3 ${color}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-rani-navy">{label}</h3>
              <span className="text-xs font-medium text-rani-muted bg-white px-1.5 py-0.5 rounded">
                {columnTasks.length}
              </span>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {columnTasks.length === 0 ? (
                <p className="text-xs text-rani-muted text-center py-4">No tasks</p>
              ) : (
                columnTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onComplete={onComplete}
                    onStart={onStart}
                    onClick={onClick}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
