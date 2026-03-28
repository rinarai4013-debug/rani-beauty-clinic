'use client';

import {
  FileText, ArrowRight, Calendar, DollarSign, Crown, CheckSquare,
  Zap, Award, Star, Phone, Mail, MessageSquare, Users,
} from 'lucide-react';
import type { ClientTimeline as ClientTimelineType, TimelineEvent, TimelineEventType } from '@/types/crm';

interface ClientTimelineProps {
  timeline: ClientTimelineType;
  maxEvents?: number;
}

const ICON_MAP: Record<string, typeof FileText> = {
  FileText, ArrowRight, Calendar, DollarSign, Crown, CheckSquare,
  Zap, Award, Star, Phone, Mail, MessageSquare, Users,
};

function getIcon(iconName: string) {
  return ICON_MAP[iconName] || FileText;
}

function formatTimestamp(ts: string): string {
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffHours < 1) return `${Math.round(diffMs / 60000)}m ago`;
  if (diffHours < 24) return `${Math.round(diffHours)}h ago`;
  if (diffDays < 7) return `${Math.round(diffDays)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function TimelineItem({ event }: { event: TimelineEvent }) {
  const Icon = getIcon(event.icon);

  return (
    <div className="flex gap-3">
      {/* Timeline dot + line */}
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${event.color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="w-px flex-1 bg-gray-200 mt-1" />
      </div>

      {/* Content */}
      <div className="pb-4 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="text-xs font-semibold text-rani-navy">{event.title}</h4>
            <p className="text-[10px] text-rani-muted mt-0.5 line-clamp-2">{event.description}</p>
          </div>
          <span className="text-[10px] text-rani-muted whitespace-nowrap shrink-0">
            {formatTimestamp(event.timestamp)}
          </span>
        </div>
        {event.actor && event.actor !== 'system' && (
          <span className="text-[10px] text-rani-muted mt-1 inline-block">by {event.actor}</span>
        )}
      </div>
    </div>
  );
}

export default function ClientTimeline({ timeline, maxEvents = 20 }: ClientTimelineProps) {
  const visibleEvents = timeline.events.slice(0, maxEvents);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider">
          Activity Timeline
        </h3>
        <span className="text-xs text-rani-muted">{timeline.totalEvents} events</span>
      </div>

      {visibleEvents.length === 0 ? (
        <p className="text-xs text-rani-muted text-center py-8">No activity recorded yet</p>
      ) : (
        <div className="space-y-0">
          {visibleEvents.map((event) => (
            <TimelineItem key={event.id} event={event} />
          ))}
        </div>
      )}

      {timeline.totalEvents > maxEvents && (
        <div className="text-center pt-2">
          <button className="text-xs text-rani-gold hover:text-rani-gold/80 font-medium">
            View all {timeline.totalEvents} events
          </button>
        </div>
      )}
    </div>
  );
}
