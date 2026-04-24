'use client';

import { motion } from 'framer-motion';
import { Calendar, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import type { TimeOffRequest, TimeOffStatus } from '@/types/providers';

interface TimeOffCalendarProps {
  requests: TimeOffRequest[];
  onApprove?: (_id: string) => void;
  onDeny?: (_id: string) => void;
  isManager?: boolean;
}

const STATUS_STYLES: Record<TimeOffStatus, { color: string; bg: string; icon: typeof CheckCircle2 }> = {
  approved: { color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle2 },
  denied: { color: 'text-red-500', bg: 'bg-red-50', icon: XCircle },
  pending: { color: 'text-amber-500', bg: 'bg-amber-50', icon: AlertCircle },
  cancelled: { color: 'text-gray-400', bg: 'bg-gray-50', icon: XCircle },
};

const TYPE_LABELS: Record<string, string> = {
  pto: 'PTO', sick: 'Sick', personal: 'Personal',
  bereavement: 'Bereavement', jury_duty: 'Jury Duty', holiday: 'Holiday',
};

export default function TimeOffCalendar({ requests, onApprove, onDeny, isManager }: TimeOffCalendarProps) {
  const sorted = [...requests].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  return (
    <div className="space-y-3">
      {sorted.length === 0 && (
        <div className="text-center py-8">
          <Calendar className="w-8 h-8 mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-rani-muted font-body">No time-off requests</p>
        </div>
      )}

      {sorted.map((request, i) => {
        const style = STATUS_STYLES[request.status];
        const StatusIcon = style.icon;
        const startDate = new Date(request.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endDate = new Date(request.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        return (
          <motion.div
            key={request.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-lg border border-gray-100 p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${style.bg}`}>
                  <StatusIcon className={`w-4 h-4 ${style.color}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-body font-semibold text-rani-navy">
                      {TYPE_LABELS[request.type] || request.type}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${style.bg} ${style.color}`}>
                      {request.status}
                    </span>
                  </div>
                  <p className="text-xs text-rani-muted font-body mt-0.5">
                    {startDate} — {endDate} ({request.hours}h)
                  </p>
                  {request.reason && (
                    <p className="text-xs text-rani-muted font-body mt-1">{request.reason}</p>
                  )}
                </div>
              </div>

              {isManager && request.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => onApprove?.(request.id)}
                    className="px-3 py-1 text-xs font-body bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => onDeny?.(request.id)}
                    className="px-3 py-1 text-xs font-body bg-red-50 text-red-500 rounded-md hover:bg-red-100 transition-colors"
                  >
                    Deny
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
