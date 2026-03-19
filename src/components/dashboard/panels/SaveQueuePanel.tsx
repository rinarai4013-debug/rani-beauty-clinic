'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Zap, ShieldAlert, AlertTriangle, ShieldCheck, Send, Loader2 } from 'lucide-react';
import { useNoShowRisk } from '@/hooks/useDashboardData';

interface SaveQueueItem {
  id: string;
  clientName: string;
  service: string;
  time: string;
  provider: string;
  score: number;
  level: 'low' | 'moderate' | 'high';
  recommendation: string;
  isConsult: boolean;
  noShowRisk: {
    score: number;
    risk: 'low' | 'moderate' | 'high';
    recommendation: string;
  };
}

const RISK_CONFIG = {
  high: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-700',
    icon: ShieldAlert,
  },
  moderate: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-700',
    icon: AlertTriangle,
  },
  low: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    badge: 'bg-green-100 text-green-700',
    icon: ShieldCheck,
  },
};

export default function SaveQueuePanel() {
  const { data, isLoading } = useNoShowRisk();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const allItems = (data as { appointments?: SaveQueueItem[] })?.appointments || [];

  // Filter to score >= 50 (moderate or high risk)
  const queueItems = allItems.filter(a => {
    const score = a.score ?? a.noShowRisk?.score ?? 0;
    return score >= 50;
  });

  const handleSendReminder = async (item: SaveQueueItem) => {
    setSendingId(item.id);
    try {
      const webhookUrl = '/api/dashboard/save-queue/reminder';
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: item.id,
          clientName: item.clientName,
          service: item.service,
          time: item.time,
          provider: item.provider,
          riskScore: item.score ?? item.noShowRisk?.score,
        }),
      });
      setSentIds(prev => new Set(prev).add(item.id));
    } catch (err) {
      console.error('Failed to send reminder:', err);
    } finally {
      setSendingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-gray-200 rounded w-48" />
          <div className="h-16 bg-gray-100 rounded" />
          <div className="h-16 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (queueItems.length === 0) {
    return null;
  }

  const highCount = queueItems.filter(a => (a.level || a.noShowRisk?.risk) === 'high').length;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider">
            Today&apos;s Save Queue
          </h3>
          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-body font-semibold">
            {queueItems.length}
          </span>
          {highCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-body font-semibold">
              {highCount} High
            </span>
          )}
        </div>
        {isCollapsed ? (
          <ChevronDown className="w-4 h-4 text-rani-muted" />
        ) : (
          <ChevronUp className="w-4 h-4 text-rani-muted" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 mt-4">
              {queueItems.map((item, i) => {
                const level = item.level || item.noShowRisk?.risk || 'moderate';
                const score = item.score ?? item.noShowRisk?.score ?? 0;
                const recommendation = item.recommendation || item.noShowRisk?.recommendation || '';
                const config = RISK_CONFIG[level];
                const RiskIcon = config.icon;
                const isSent = sentIds.has(item.id);
                const isSending = sendingId === item.id;

                return (
                  <motion.div
                    key={item.id || i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`p-3 rounded-lg border ${config.bg} ${config.border}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.badge}`}>
                        <RiskIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-body font-medium text-rani-navy">
                            {item.clientName}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-body font-semibold ${config.badge}`}>
                            {score}%
                          </span>
                          {item.isConsult && (
                            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-body font-semibold rounded">
                              CONSULT
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-body text-rani-muted mt-0.5">
                          {item.time} &middot; {item.service} &middot; {item.provider}
                        </p>
                        <p className="text-xs font-body text-rani-navy/70 mt-1 leading-relaxed">
                          {recommendation}
                        </p>
                      </div>
                      <button
                        onClick={() => handleSendReminder(item)}
                        disabled={isSent || isSending}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body font-semibold transition-all flex-shrink-0 ${
                          isSent
                            ? 'bg-green-100 text-green-700 cursor-default'
                            : isSending
                            ? 'bg-rani-gold/30 text-rani-navy cursor-wait'
                            : 'bg-rani-navy text-white hover:bg-rani-navy-light'
                        }`}
                      >
                        {isSent ? (
                          <>
                            <ShieldCheck className="w-3 h-3" />
                            Sent
                          </>
                        ) : isSending ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Sending
                          </>
                        ) : (
                          <>
                            <Send className="w-3 h-3" />
                            Send Reminder
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
