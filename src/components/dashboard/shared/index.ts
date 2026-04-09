// ── Legacy exports (preserved for backward compatibility) ─────────────
export { default as DashboardSkeleton } from './DashboardSkeleton';

export { default as DashboardEmptyState } from './DashboardEmptyState';

export {
  DashboardErrorBoundary as LegacyErrorBoundary,
  InlineError as LegacyInlineError,
} from './DashboardErrorBoundary';

// ── Premium Shared Components ─────────────────────────────────────────

// Loading Skeletons (upgraded with shimmer animation)
export {
  Shimmer,
  Shimmer as SkeletonBar,
  StatCardSkeleton,
  StatCardSkeleton as KPICardSkeleton,
  StatRowSkeleton,
  StatRowSkeleton as KPIRowSkeleton,
  PanelSkeleton,
  TableSkeleton,
  ChartSkeleton,
  PageSkeleton,
} from './LoadingSkeleton';

// Error States (with error classification + retry spinner)
export {
  ErrorState,
  InlineError,
  DashboardErrorBoundary,
} from './ErrorState';

// Empty States (with mood variants + prebuilt scenarios)
export { default as EmptyState, NoSearchResults, NoFilterResults, NoNotifications } from './EmptyState';

// Data Table (sortable, filterable, paginated)
export { default as DataTable } from './DataTable';
export type { DataTableColumn } from './DataTable';

// Stat Card (metric card with trend indicator)
export { default as StatCard, StatCardRow } from './StatCard';
export type { StatCardProps } from './StatCard';

// Chart Wrapper (chart container with loading/error/empty)
export { default as ChartWrapper, ChartLegend } from './ChartWrapper';

// Mobile Navigation (bottom tabs + expandable drawer)
export { default as MobileNav } from './MobileNav';
