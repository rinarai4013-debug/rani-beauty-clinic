'use client';

import { motion } from 'framer-motion';
import { Calendar, DollarSign, UserPlus, Star, Bell, FileText, Award, Inbox } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils/formatters';
import { PanelSkeleton } from '@/components/dashboard/shared';
import { useDashboardData } from '@/hooks/useDashboardData';
import type { ActivityItem } from '@/types/dashboard';

const ACTIVITY_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  booking: { icon: Calendar, color: 'text-blue-500 bg-blue-50' },
  payment: { icon: DollarSign, color: 'text-green-500 bg-green-50' },
  lead: { icon: UserPlus, color: 'text-purple-500 bg-purple-50' },
  review: { icon: Star, color: 'text-amber-500 bg-amber-50' },
  alert: { icon: Bell, color: 'text-red-500 bg-red-50' },
  form: { icon: FileText, color: 'text-rani-gold-accessible bg-rani-gold/10' },
  achievement: { icon: Award, color: 'text-rani-gold-accessible bg-rani-gold/10' },
};

export default function RecentActivity() {
  const { data, isLoading } = useDashboardData<{ activities: ActivityItem[] }>('/activity', { refreshInterval: 30000 });
  const activities = data?.activities ?? [];

  if (isLoading) return <PanelSkeleton rows={5} />;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
      <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
        Recent Activity
      </h3>

      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-10 h-10 rounded-full bg-rani-cream flex items-center justify-center mb-3">
            <Inbox className="w-5 h-5 text-rani-muted" />
          </div>
          <p className="text-sm font-body font-medium text-rani-text">No recent activity</p>
          <p className="text-xs font-body text-rani-muted mt-1">Activity will appear here as events happen.</p>
        </div>
      ) : (
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {activities.map((activity, i) => {
            const config = ACTIVITY_ICONS[activity.type] || ACTIVITY_ICONS.form;
            const Icon = config.icon;
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 py-2.5 border-b border-rani-border/50 last:border-0"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body font-medium text-rani-text leading-tight">
                    {activity.title}
                  </p>
                  <p className="text-xs font-body text-rani-muted mt-0.5 truncate">
                    {activity.description}
                  </p>
                </div>
                <span className="text-[10px] font-body text-rani-muted whitespace-nowrap flex-shrink-0">
                  {formatRelativeTime(activity.timestamp)}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
