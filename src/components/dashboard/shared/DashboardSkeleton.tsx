'use client';

/* ─── Reusable Skeleton Components ──────────────────────────────────── */

/** Single pulsing bar */
export function SkeletonBar({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-200/70 ${className}`}
    />
  );
}

/** KPI Card skeleton - matches KPICard hero/standard sizing */
export function KPICardSkeleton({ size = 'hero' }: { size?: 'hero' | 'standard' | 'compact' }) {
  const pad = size === 'hero' ? 'p-6' : size === 'standard' ? 'p-5' : 'p-4';
  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border ${pad}`}>
      <div className="animate-pulse space-y-3">
        <SkeletonBar className="h-3 w-24" />
        <SkeletonBar className="h-8 w-32" />
        <SkeletonBar className="h-2 w-full" />
        {size !== 'compact' && <SkeletonBar className="h-10 w-full rounded-lg" />}
      </div>
    </div>
  );
}

/** Row of KPI card skeletons */
export function KPIRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <KPICardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Panel / card skeleton with configurable rows */
export function PanelSkeleton({
  rows = 4,
  className = '',
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5 ${className}`}>
      <div className="animate-pulse space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <SkeletonBar className="h-4 w-32" />
          <SkeletonBar className="h-4 w-16 rounded-full" />
        </div>
        {/* Rows */}
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <SkeletonBar className="h-8 w-8 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <SkeletonBar className="h-3 w-3/4" />
                <SkeletonBar className="h-2 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Table skeleton with header + rows */
export function TableSkeleton({
  rows = 5,
  cols = 4,
  className = '',
}: {
  rows?: number;
  cols?: number;
  className?: string;
}) {
  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5 ${className}`}>
      <div className="animate-pulse space-y-4">
        <SkeletonBar className="h-4 w-40" />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {Array.from({ length: cols }).map((_, i) => (
                  <th key={i} className="pb-3 text-left">
                    <SkeletonBar className="h-3 w-20" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="space-y-2">
              {Array.from({ length: rows }).map((_, r) => (
                <tr key={r}>
                  {Array.from({ length: cols }).map((_, c) => (
                    <td key={c} className="py-2">
                      <SkeletonBar className={`h-3 ${c === 0 ? 'w-28' : 'w-16'}`} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/** Chart area skeleton */
export function ChartSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5 ${className}`}>
      <div className="animate-pulse space-y-4">
        <SkeletonBar className="h-4 w-32" />
        <div className="flex items-end gap-2 h-48">
          {[40, 65, 45, 80, 55, 70, 60, 75, 50, 85, 65, 45].map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-gray-200/70 rounded-t"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between">
          <SkeletonBar className="h-2 w-8" />
          <SkeletonBar className="h-2 w-8" />
          <SkeletonBar className="h-2 w-8" />
        </div>
      </div>
    </div>
  );
}

/** Full page loading skeleton - used as the top-level fallback for any dashboard page */
export function PageSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-pulse space-y-2">
        <SkeletonBar className="h-7 w-48" />
        <SkeletonBar className="h-3 w-64" />
      </div>
      {/* KPI row */}
      <KPIRowSkeleton />
      {/* Two-column panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PanelSkeleton rows={5} />
        <PanelSkeleton rows={5} />
      </div>
      {/* Three-column panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PanelSkeleton rows={3} />
        <PanelSkeleton rows={3} />
        <PanelSkeleton rows={3} />
      </div>
    </div>
  );
}
