'use client';

import {
  Calendar,
  Users,
  DollarSign,
  BarChart3,
  Package,
  MessageSquare,
  Star,
  TrendingUp,
  Shield,
  Brain,
  Phone,
  Megaphone,
  ShoppingBag,
  Clock,
  FileText,
  type LucideIcon,
} from 'lucide-react';

/* ─── Icon map for easy lookup ──────────────────────────────────────── */
const ICON_MAP: Record<string, LucideIcon> = {
  calendar: Calendar,
  users: Users,
  dollar: DollarSign,
  chart: BarChart3,
  package: Package,
  message: MessageSquare,
  star: Star,
  trending: TrendingUp,
  shield: Shield,
  brain: Brain,
  phone: Phone,
  megaphone: Megaphone,
  cart: ShoppingBag,
  clock: Clock,
  file: FileText,
};

interface DashboardEmptyStateProps {
  icon?: keyof typeof ICON_MAP | LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  compact?: boolean;
}

/**
 * Unified empty state component for dashboard pages.
 * Shows a branded illustration + helpful message when data is unavailable.
 */
export default function DashboardEmptyState({
  icon = 'chart',
  title,
  description,
  action,
  compact = false,
}: DashboardEmptyStateProps) {
  const Icon = typeof icon === 'string' ? ICON_MAP[icon] ?? BarChart3 : icon;

  if (compact) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="w-10 h-10 rounded-full bg-rani-cream flex items-center justify-center mb-3">
          <Icon className="w-5 h-5 text-rani-muted" />
        </div>
        <p className="text-sm font-body text-rani-muted">{title}</p>
        {description && (
          <p className="text-xs font-body text-rani-muted/70 mt-1 max-w-xs">{description}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rani-cream to-rani-gold-light flex items-center justify-center mb-5">
        <Icon className="w-8 h-8 text-rani-navy/40" />
      </div>
      <h3 className="text-lg font-heading text-rani-navy mb-2">{title}</h3>
      {description && (
        <p className="text-sm font-body text-rani-muted max-w-md leading-relaxed">{description}</p>
      )}
      {action && (
        action.href ? (
          <a
            href={action.href}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rani-navy text-white text-sm font-body hover:bg-rani-navy-light transition-colors"
          >
            {action.label}
          </a>
        ) : (
          <button
            onClick={action.onClick}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rani-navy text-white text-sm font-body hover:bg-rani-navy-light transition-colors"
          >
            {action.label}
          </button>
        )
      )}
    </div>
  );
}
