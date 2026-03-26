'use client';

import { ReactNode } from 'react';

/* ─── Premium Loading Skeletons ────────────────────────────────────────
 *  Shimmer animation with gradient sweep for a polished loading state.
 *  Every variant matches the exact layout it replaces so content
 *  doesn't jump when data arrives.
 * ──────────────────────────────────────────────────────────────────── */

// ── Base shimmer bar ──────────────────────────────────────────────────

interface ShimmerProps {
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'full' | 'xl' | '2xl';
}

export function Shimmer({ className = '', rounded = 'md' }: ShimmerProps) {
  const radiusMap = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
  };
  return (
    <div
      className={`
        relative overflow-hidden bg-gradient-to-r from-rani-border/40 via-rani-border/20 to-rani-border/40
        ${radiusMap[rounded]} ${className}
      `}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  );
}

// ── Card container skeleton ───────────────────────────────────────────

interface CardSkeletonProps {
  children: ReactNode;
  className?: string;
}

function CardSkeleton({ children, className = '' }: CardSkeletonProps) {
  return (
    <div
      className={`
        bg-white/60 backdrop-blur-sm rounded-xl border border-rani-border/50
        shadow-[0_1px_3px_rgba(0,0,0,0.03)] ${className}
      `}
    >
      {children}
    </div>
  );
}

// ── KPI / Stat card skeleton ──────────────────────────────────────────

export function StatCardSkeleton({ size = 'standard' }: { size?: 'hero' | 'standard' | 'compact' }) {
  const padding = size === 'hero' ? 'p-6' : size === 'standard' ? 'p-5' : 'p-4';

  return (
    <CardSkeleton className={padding}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shimmer className="h-8 w-8" rounded="lg" />
            <Shimmer className="h-3 w-20" />
          </div>
          <Shimmer className="h-5 w-14" rounded="full" />
        </div>
        <Shimmer className={`w-28 ${size === 'hero' ? 'h-9' : size === 'compact' ? 'h-6' : 'h-7'}`} />
        <Shimmer className="h-2 w-16" />
        {size !== 'compact' && (
          <div className="pt-1">
            <Shimmer className="h-1.5 w-full" rounded="full" />
            <div className="flex justify-between mt-1.5">
              <Shimmer className="h-2 w-12" />
              <Shimmer className="h-2 w-10" />
            </div>
          </div>
        )}
      </div>
    </CardSkeleton>
  );
}

// ── KPI row skeleton ──────────────────────────────────────────────────

export function StatRowSkeleton({
  count = 4,
  size = 'hero',
}: {
  count?: number;
  size?: 'hero' | 'standard' | 'compact';
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} size={size} />
      ))}
    </div>
  );
}

// ── Panel skeleton (activity feeds, list panels) ─────────────────────

export function PanelSkeleton({
  rows = 4,
  className = '',
  showHeader = true,
}: {
  rows?: number;
  className?: string;
  showHeader?: boolean;
}) {
  return (
    <CardSkeleton className={`p-5 ${className}`}>
      <div className="space-y-4">
        {showHeader && (
          <div className="flex items-center justify-between">
            <Shimmer className="h-4 w-32" />
            <Shimmer className="h-6 w-16" rounded="full" />
          </div>
        )}
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Shimmer className="h-9 w-9 flex-shrink-0" rounded="full" />
              <div className="flex-1 space-y-1.5">
                <Shimmer className="h-3.5 w-3/4" />
                <Shimmer className="h-2.5 w-1/2" />
              </div>
              <Shimmer className="h-5 w-12" rounded="full" />
            </div>
          ))}
        </div>
      </div>
    </CardSkeleton>
  );
}

// ── Table skeleton ────────────────────────────────────────────────────

export function TableSkeleton({
  rows = 5,
  cols = 5,
  className = '',
}: {
  rows?: number;
  cols?: number;
  className?: string;
}) {
  return (
    <CardSkeleton className={`p-5 ${className}`}>
      <div className="space-y-4">
        {/* Title + controls */}
        <div className="flex items-center justify-between">
          <Shimmer className="h-4 w-36" />
          <div className="flex gap-2">
            <Shimmer className="h-8 w-24" rounded="lg" />
            <Shimmer className="h-8 w-8" rounded="lg" />
          </div>
        </div>

        {/* Search bar */}
        <Shimmer className="h-10 w-full" rounded="lg" />

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-rani-border/30">
                {Array.from({ length: cols }).map((_, i) => (
                  <th key={i} className="pb-3 pr-4 text-left">
                    <Shimmer className="h-3 w-16" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }).map((_, r) => (
                <tr key={r} className="border-b border-rani-border/10 last:border-0">
                  {Array.from({ length: cols }).map((_, c) => (
                    <td key={c} className="py-3 pr-4">
                      <Shimmer className={`h-3.5 ${c === 0 ? 'w-32' : c === cols - 1 ? 'w-16' : 'w-20'}`} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between pt-2">
          <Shimmer className="h-3 w-28" />
          <div className="flex gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Shimmer key={i} className="h-8 w-8" rounded="lg" />
            ))}
          </div>
        </div>
      </div>
    </CardSkeleton>
  );
}

// ── Chart skeleton ────────────────────────────────────────────────────

export function ChartSkeleton({
  type = 'bar',
  className = '',
}: {
  type?: 'bar' | 'line' | 'pie' | 'area';
  className?: string;
}) {
  return (
    <CardSkeleton className={`p-5 ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Shimmer className="h-4 w-32" />
          <div className="flex gap-2">
            <Shimmer className="h-6 w-16" rounded="full" />
            <Shimmer className="h-6 w-16" rounded="full" />
          </div>
        </div>

        {type === 'pie' ? (
          <div className="flex items-center justify-center py-4">
            <Shimmer className="h-40 w-40" rounded="full" />
          </div>
        ) : (
          <div className="flex items-end gap-[3px] h-48">
            {Array.from({ length: 14 }).map((_, i) => {
              const heights = [35, 55, 42, 70, 48, 80, 62, 75, 45, 88, 58, 68, 52, 78];
              return (
                <div
                  key={i}
                  className={`flex-1 relative overflow-hidden bg-gradient-to-r from-rani-border/40 via-rani-border/20 to-rani-border/40 ${type === 'bar' ? 'rounded-t-sm' : 'rounded-full'}`}
                  style={{ height: `${heights[i]}%` }}
                >
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                </div>
              );
            })}
          </div>
        )}

        {/* X-axis labels */}
        {type !== 'pie' && (
          <div className="flex justify-between px-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Shimmer key={i} className="h-2 w-6" />
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 pt-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <Shimmer className="h-2.5 w-2.5" rounded="full" />
              <Shimmer className="h-2.5 w-12" />
            </div>
          ))}
        </div>
      </div>
    </CardSkeleton>
  );
}

// ── Full page skeleton ────────────────────────────────────────────────

export function PageSkeleton({
  layout = 'standard',
}: {
  layout?: 'standard' | 'table' | 'detail';
}) {
  if (layout === 'table') {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div className="space-y-2">
          <Shimmer className="h-7 w-48" />
          <Shimmer className="h-3.5 w-72" />
        </div>
        <StatRowSkeleton count={4} size="compact" />
        <TableSkeleton rows={8} cols={6} />
      </div>
    );
  }

  if (layout === 'detail') {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div className="flex items-center gap-4">
          <Shimmer className="h-16 w-16" rounded="2xl" />
          <div className="space-y-2">
            <Shimmer className="h-7 w-40" />
            <Shimmer className="h-3.5 w-56" />
          </div>
        </div>
        <StatRowSkeleton count={4} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2">
            <ChartSkeleton />
          </div>
          <PanelSkeleton rows={5} />
        </div>
        <PanelSkeleton rows={6} />
      </div>
    );
  }

  // Standard layout
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="space-y-2">
        <Shimmer className="h-7 w-48" />
        <Shimmer className="h-3.5 w-64" />
      </div>
      <StatRowSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <PanelSkeleton rows={5} />
        <PanelSkeleton rows={5} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <ChartSkeleton type="bar" className="lg:col-span-2" />
        <ChartSkeleton type="pie" />
      </div>
    </div>
  );
}
