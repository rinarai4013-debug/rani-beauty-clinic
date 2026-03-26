'use client';

import { motion } from 'framer-motion';
import {
  Calendar, Users, DollarSign, BarChart3, Package, MessageSquare,
  Star, TrendingUp, Shield, Brain, Phone, Megaphone, ShoppingBag,
  Clock, FileText, Inbox, Search, Zap, Bell, Filter,
  type LucideIcon,
} from 'lucide-react';

/* ─── Empty State ──────────────────────────────────────────────────────
 *  Premium empty states with subtle animation.
 *  Supports icon presets, custom icons, CTA actions, and compact mode.
 * ──────────────────────────────────────────────────────────────────── */

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
  inbox: Inbox,
  search: Search,
  zap: Zap,
  bell: Bell,
  filter: Filter,
};

interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

interface EmptyStateProps {
  icon?: keyof typeof ICON_MAP | LucideIcon;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  compact?: boolean;
  className?: string;
  /** Illustration variant - affects the icon background */
  mood?: 'neutral' | 'positive' | 'attention';
}

export default function EmptyState({
  icon = 'chart',
  title,
  description,
  action,
  secondaryAction,
  compact = false,
  className = '',
  mood = 'neutral',
}: EmptyStateProps) {
  const Icon = typeof icon === 'string' ? ICON_MAP[icon] ?? BarChart3 : icon;

  const moodStyles = {
    neutral: 'from-rani-cream to-rani-border/30',
    positive: 'from-green-50 to-emerald-100/40',
    attention: 'from-amber-50 to-rani-gold/10',
  };

  const iconColor = {
    neutral: 'text-rani-navy/30',
    positive: 'text-emerald-400',
    attention: 'text-rani-gold',
  };

  // ── Compact variant ───────────────────────────────────────────────

  if (compact) {
    return (
      <div className={`flex flex-col items-center justify-center py-8 text-center ${className}`}>
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${moodStyles[mood]} flex items-center justify-center mb-3`}>
          <Icon className={`w-5 h-5 ${iconColor[mood]}`} />
        </div>
        <p className="text-sm font-body font-medium text-rani-muted">{title}</p>
        {description && (
          <p className="text-xs font-body text-rani-muted/60 mt-1 max-w-xs leading-relaxed">{description}</p>
        )}
        {action && (
          <ActionButton action={action} size="sm" className="mt-3" />
        )}
      </div>
    );
  }

  // ── Full variant ──────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center justify-center py-14 sm:py-20 px-6 text-center ${className}`}
    >
      {/* Floating icon with decorative ring */}
      <motion.div
        initial={{ scale: 0.85 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="relative mb-6"
      >
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${moodStyles[mood]} flex items-center justify-center shadow-sm`}>
          <Icon className={`w-8 h-8 ${iconColor[mood]}`} />
        </div>
        {/* Subtle floating ring */}
        <div className="absolute -inset-2 rounded-3xl border border-rani-border/20 pointer-events-none" />
      </motion.div>

      <h3 className="text-lg font-heading text-rani-navy mb-2">{title}</h3>
      {description && (
        <p className="text-sm font-body text-rani-muted max-w-md leading-relaxed">{description}</p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 mt-6">
          {action && <ActionButton action={action} />}
          {secondaryAction && <ActionButton action={secondaryAction} variant="ghost" />}
        </div>
      )}
    </motion.div>
  );
}

// ── Action button sub-component ─────────────────────────────────────

function ActionButton({
  action,
  variant,
  size = 'md',
  className = '',
}: {
  action: EmptyStateAction;
  variant?: 'primary' | 'ghost';
  size?: 'sm' | 'md';
  className?: string;
}) {
  const resolvedVariant = variant || action.variant || 'primary';
  const sizeClasses = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';

  const variantClasses = resolvedVariant === 'primary'
    ? 'bg-rani-navy text-white hover:bg-rani-navy/90 shadow-sm'
    : 'text-rani-navy hover:bg-rani-cream border border-rani-border';

  const shared = `inline-flex items-center gap-2 rounded-lg font-body font-medium transition-all duration-200 active:scale-[0.97] ${sizeClasses} ${variantClasses} ${className}`;

  if (action.href) {
    return (
      <a href={action.href} className={shared}>
        {action.label}
      </a>
    );
  }

  return (
    <button onClick={action.onClick} className={shared}>
      {action.label}
    </button>
  );
}

// ── Prebuilt empty states for common scenarios ────────────────────────

export function NoSearchResults({
  query,
  onClear,
}: {
  query: string;
  onClear?: () => void;
}) {
  return (
    <EmptyState
      icon="search"
      title={`No results for "${query}"`}
      description="Try adjusting your search terms or clearing filters."
      action={onClear ? { label: 'Clear Search', onClick: onClear } : undefined}
      compact
    />
  );
}

export function NoFilterResults({ onClear }: { onClear?: () => void }) {
  return (
    <EmptyState
      icon="filter"
      title="No items match current filters"
      description="Try broadening your filter criteria."
      action={onClear ? { label: 'Clear Filters', onClick: onClear } : undefined}
      compact
    />
  );
}

export function NoNotifications() {
  return (
    <EmptyState
      icon="bell"
      title="All caught up"
      description="No new notifications right now."
      compact
      mood="positive"
    />
  );
}
