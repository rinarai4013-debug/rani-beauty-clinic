'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Clock, AlertTriangle, Shield, Ban, Droplets, Eye } from 'lucide-react';
import type { AftercareItem } from '@/types/mobile';

interface AftercareChecklistProps {
  items: AftercareItem[];
  onToggle?: (_itemId: string, _completed: boolean) => void;
}

const categoryIcons: Record<string, typeof Check> = {
  do: Shield,
  avoid: Ban,
  apply: Droplets,
  watch: Eye,
};

const categoryColors: Record<string, string> = {
  do: 'text-emerald-600 bg-emerald-50',
  avoid: 'text-red-500 bg-red-50',
  apply: 'text-blue-500 bg-blue-50',
  watch: 'text-amber-500 bg-amber-50',
};

const priorityBadge: Record<string, string> = {
  required: 'bg-red-100 text-red-700',
  recommended: 'bg-amber-100 text-amber-700',
  optional: 'bg-gray-100 text-gray-600',
};

export default function AftercareChecklist({ items, onToggle }: AftercareChecklistProps) {
  const [timers, setTimers] = useState<Record<string, number>>({});

  // Countdown timers
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((key) => {
          if (next[key] > 0) next[key] -= 1;
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const startTimer = (itemId: string, minutes: number) => {
    setTimers((prev) => ({ ...prev, [itemId]: minutes * 60 }));
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const grouped = items.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, AftercareItem[]>,
  );

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([category, categoryItems]) => {
        const Icon = categoryIcons[category] || Check;
        const colorClass = categoryColors[category] || 'text-gray-600 bg-gray-50';

        return (
          <div key={category}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${colorClass}`}>
                <Icon size={12} />
              </div>
              <h4 className="text-xs font-body font-semibold text-rani-navy uppercase tracking-wider">
                {category === 'do' ? 'Do This' : category === 'avoid' ? 'Avoid' : category === 'apply' ? 'Apply' : 'Watch For'}
              </h4>
            </div>

            <div className="space-y-2">
              {categoryItems.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  className={`flex items-start gap-3 p-3 rounded-xl border ${
                    item.completed
                      ? 'bg-emerald-50/50 border-emerald-200/50'
                      : 'bg-white border-rani-border/30'
                  }`}
                >
                  {/* Checkbox */}
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => onToggle?.(item.id, !item.completed)}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      item.completed
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-rani-border'
                    }`}
                  >
                    {item.completed && <Check size={10} className="text-white" strokeWidth={3} />}
                  </motion.button>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-body ${
                        item.completed ? 'text-rani-muted line-through' : 'text-rani-text'
                      }`}
                    >
                      {item.instruction}
                    </p>

                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-[10px] text-rani-muted font-body flex items-center gap-1">
                        <Clock size={10} />
                        {item.timeframe}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-body font-medium ${
                          priorityBadge[item.priority]
                        }`}
                      >
                        {item.priority}
                      </span>
                    </div>

                    {/* Timer */}
                    {item.timerMinutes && !item.completed && (
                      <div className="mt-2">
                        {timers[item.id] && timers[item.id] > 0 ? (
                          <div className="flex items-center gap-2">
                            <motion.div
                              animate={{ opacity: [1, 0.5, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                              className="text-sm font-mono text-[#C9A96E] font-bold"
                            >
                              {formatTimer(timers[item.id])}
                            </motion.div>
                          </div>
                        ) : (
                          <button
                            onClick={() => startTimer(item.id, item.timerMinutes!)}
                            className="text-[10px] text-[#C9A96E] font-body font-semibold flex items-center gap-1"
                          >
                            <Clock size={10} />
                            Start {item.timerMinutes}min timer
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
