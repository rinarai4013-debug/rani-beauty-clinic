'use client';

import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, AlertTriangle, Clock, XCircle } from 'lucide-react';
import type { QuarterlyPayment } from '@/lib/finance/tax-planning';

interface TaxCalendarProps {
  payments: QuarterlyPayment[];
  ytdPaid: number;
  remainingBalance: number;
}

const STATUS_CONFIG = {
  paid: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'Paid' },
  due: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Due Now' },
  upcoming: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Upcoming' },
  overdue: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Overdue' },
};

export default function TaxCalendar({ payments, ytdPaid, remainingBalance }: TaxCalendarProps) {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex flex-wrap gap-4 p-4 bg-rani-cream/50 rounded-lg">
        <div className="flex-1 min-w-[120px]">
          <p className="text-xs text-rani-muted font-body">YTD Paid</p>
          <p className="text-lg font-heading text-green-700">${ytdPaid.toLocaleString()}</p>
        </div>
        <div className="flex-1 min-w-[120px]">
          <p className="text-xs text-rani-muted font-body">Remaining</p>
          <p className="text-lg font-heading text-rani-navy">${remainingBalance.toLocaleString()}</p>
        </div>
        <div className="flex-1 min-w-[120px]">
          <p className="text-xs text-rani-muted font-body">Total Estimated</p>
          <p className="text-lg font-heading text-rani-navy">${(ytdPaid + remainingBalance).toLocaleString()}</p>
        </div>
      </div>

      {/* Quarter cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {payments.map((q, i) => {
          const config = STATUS_CONFIG[q.status];
          const Icon = config.icon;

          return (
            <motion.div
              key={q.quarter}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`p-4 rounded-xl border ${config.border} ${config.bg}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-heading font-semibold text-rani-navy">Q{q.quarter}</span>
                <span className={`flex items-center gap-1 text-xs font-body font-medium ${config.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                  {config.label}
                </span>
              </div>
              <p className="text-xl font-heading text-rani-navy">${q.amount.toLocaleString()}</p>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-rani-muted font-body">
                <Calendar className="w-3 h-3" />
                {formatDate(q.dueDate)}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
