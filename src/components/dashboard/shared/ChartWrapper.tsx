'use client';

import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, Minimize2, RefreshCw, Download } from 'lucide-react';
import { ChartSkeleton } from './LoadingSkeleton';
import { InlineError } from './ErrorState';
import EmptyState from './EmptyState';

/* ─── ChartWrapper ─────────────────────────────────────────────────────
 *  Premium chart container with:
 *  - Loading skeleton (bar, line, pie, area variants)
 *  - Error state with retry
 *  - Empty state
 *  - Optional fullscreen expand
 *  - Optional date range tabs
 *  - Responsive height
 * ──────────────────────────────────────────────────────────────────── */

interface DateRangeOption {
  label: string;
  value: string;
}

interface ChartWrapperProps {
  children: ReactNode;
  title: string;
  subtitle?: string;

  // ── Data states ─────────────────────────────────────────────────
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: string;

  // ── Chart config ────────────────────────────────────────────────
  /** Skeleton variant while loading */
  chartType?: 'bar' | 'line' | 'pie' | 'area';
  /** Chart area height */
  height?: string;

  // ── Features ────────────────────────────────────────────────────
  /** Date range selector tabs */
  dateRanges?: DateRangeOption[];
  activeRange?: string;
  onRangeChange?: (range: string) => void;
  /** Whether chart can be expanded fullscreen */
  expandable?: boolean;
  /** Optional header actions (legend, download button, etc.) */
  headerActions?: ReactNode;
  /** Download handler */
  onDownload?: () => void;
  /** Show refresh button */
  refreshing?: boolean;
  onRefresh?: () => void;

  className?: string;
}

export default function ChartWrapper({
  children,
  title,
  subtitle,
  loading = false,
  error,
  onRetry,
  isEmpty = false,
  emptyTitle = 'No chart data',
  emptyDescription,
  emptyIcon = 'chart',
  chartType = 'bar',
  height = 'h-48 sm:h-64',
  dateRanges,
  activeRange,
  onRangeChange,
  expandable = false,
  headerActions,
  onDownload,
  refreshing = false,
  onRefresh,
  className = '',
}: ChartWrapperProps) {
  const [expanded, setExpanded] = useState(false);

  // ── Loading ─────────────────────────────────────────────────────

  if (loading) {
    return <ChartSkeleton type={chartType} className={className} />;
  }

  // ── Error ───────────────────────────────────────────────────────

  if (error) {
    return (
      <div className={`bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5 ${className}`}>
        <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">{title}</h3>
        <InlineError message={`Failed to load ${title.toLowerCase()}`} onRetry={onRetry} />
      </div>
    );
  }

  // ── Wrapper - fullscreen overlay or inline card ─────────────────

  const content = (
    <div
      className={`
        bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border
        ${expanded ? 'fixed inset-4 z-50 flex flex-col overflow-auto shadow-2xl' : ''}
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 sm:p-5 pb-0">
        <div className="min-w-0">
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs font-body text-rani-muted mt-0.5">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Date range tabs */}
          {dateRanges && onRangeChange && (
            <div className="flex gap-0.5 bg-rani-cream/80 rounded-lg p-0.5">
              {dateRanges.map((range) => (
                <button
                  key={range.value}
                  onClick={() => onRangeChange(range.value)}
                  className={`
                    px-2 sm:px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-body font-medium transition-all whitespace-nowrap
                    ${activeRange === range.value
                      ? 'bg-white text-rani-navy shadow-sm'
                      : 'text-rani-muted hover:text-rani-text'
                    }
                  `}
                >
                  {range.label}
                </button>
              ))}
            </div>
          )}

          {headerActions}

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-rani-muted hover:text-rani-navy hover:bg-rani-cream transition-all"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          )}

          {onDownload && (
            <button
              onClick={onDownload}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-rani-muted hover:text-rani-navy hover:bg-rani-cream transition-all"
              title="Download"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}

          {expandable && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-rani-muted hover:text-rani-navy hover:bg-rani-cream transition-all"
              title={expanded ? 'Minimize' : 'Expand'}
            >
              {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Chart area */}
      <div className={`p-4 sm:p-5 ${expanded ? 'flex-1' : ''}`}>
        {isEmpty ? (
          <EmptyState
            icon={emptyIcon as never}
            title={emptyTitle}
            description={emptyDescription}
            compact
          />
        ) : (
          <div className={expanded ? 'h-full' : height}>
            {children}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {content}
      {/* Fullscreen backdrop */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpanded(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ── Chart Legend Helper ────────────────────────────────────────────────

interface LegendItem {
  label: string;
  color: string;
}

export function ChartLegend({ items }: { items: LegendItem[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
          <span className="text-xs font-body text-rani-muted">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
