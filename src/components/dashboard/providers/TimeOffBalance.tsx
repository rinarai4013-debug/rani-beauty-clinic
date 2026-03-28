'use client';

import { motion } from 'framer-motion';
import type { TimeOffBalance as TimeOffBalanceType } from '@/types/providers';

interface TimeOffBalanceProps {
  balances: TimeOffBalanceType[];
}

const TYPE_COLORS: Record<string, string> = {
  pto: '#C9A96E',
  sick: '#EF4444',
  personal: '#7C3AED',
  bereavement: '#6B7280',
  jury_duty: '#3B82F6',
  holiday: '#059669',
};

const TYPE_LABELS: Record<string, string> = {
  pto: 'PTO', sick: 'Sick Leave', personal: 'Personal',
  bereavement: 'Bereavement', jury_duty: 'Jury Duty', holiday: 'Holiday',
};

export default function TimeOffBalanceCard({ balances }: TimeOffBalanceProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {balances.map((balance, i) => {
        const color = TYPE_COLORS[balance.type] || '#6B7280';
        const total = balance.annualAllowance + balance.carryOver;
        const usedPercent = total > 0 ? (balance.used / total) * 100 : 0;
        const pendingPercent = total > 0 ? (balance.pending / total) * 100 : 0;

        return (
          <motion.div
            key={balance.type}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-lg border border-gray-100 p-3"
          >
            <p className="text-xs text-rani-muted font-body mb-1">{TYPE_LABELS[balance.type] || balance.type}</p>
            <p className="font-display font-bold text-lg text-rani-navy">{balance.available}h</p>
            <p className="text-xs text-rani-muted font-body">of {total}h available</p>

            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-2 flex">
              <motion.div
                className="h-full"
                style={{ backgroundColor: color }}
                initial={{ width: 0 }}
                animate={{ width: `${usedPercent}%` }}
                transition={{ duration: 0.5 }}
              />
              {pendingPercent > 0 && (
                <motion.div
                  className="h-full opacity-40"
                  style={{ backgroundColor: color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pendingPercent}%` }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                />
              )}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-rani-muted font-body">Used: {balance.used}h</span>
              {balance.pending > 0 && (
                <span className="text-[10px] text-amber-500 font-body">Pending: {balance.pending}h</span>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
