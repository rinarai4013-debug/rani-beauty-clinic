'use client';

import {
  Check, CheckCheck, Eye, MousePointerClick, X, AlertTriangle,
  Clock, Send, Ban,
} from 'lucide-react';
import type { MessageStatus } from '@/types/communications';

const STATUS_CONFIG: Record<MessageStatus, {
  label: string;
  icon: typeof Check;
  bg: string;
  text: string;
}> = {
  queued: {
    label: 'Queued',
    icon: Clock,
    bg: 'bg-gray-50',
    text: 'text-gray-600',
  },
  sent: {
    label: 'Sent',
    icon: Send,
    bg: 'bg-blue-50',
    text: 'text-blue-600',
  },
  delivered: {
    label: 'Delivered',
    icon: CheckCheck,
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
  },
  opened: {
    label: 'Opened',
    icon: Eye,
    bg: 'bg-purple-50',
    text: 'text-purple-600',
  },
  clicked: {
    label: 'Clicked',
    icon: MousePointerClick,
    bg: 'bg-indigo-50',
    text: 'text-indigo-600',
  },
  failed: {
    label: 'Failed',
    icon: X,
    bg: 'bg-red-50',
    text: 'text-red-500',
  },
  bounced: {
    label: 'Bounced',
    icon: AlertTriangle,
    bg: 'bg-amber-50',
    text: 'text-amber-600',
  },
  unsubscribed: {
    label: 'Unsubscribed',
    icon: Ban,
    bg: 'bg-gray-100',
    text: 'text-gray-500',
  },
};

interface DeliveryStatusBadgeProps {
  status: MessageStatus;
  compact?: boolean;
  className?: string;
}

export default function DeliveryStatusBadge({
  status,
  compact = false,
  className = '',
}: DeliveryStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  if (compact) {
    return (
      <span title={config.label} className={`${config.text} ${className}`}>
        <Icon className="w-3.5 h-3.5" />
      </span>
    );
  }

  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded-full
        text-[11px] font-body font-medium
        ${config.bg} ${config.text} ${className}
      `}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}
