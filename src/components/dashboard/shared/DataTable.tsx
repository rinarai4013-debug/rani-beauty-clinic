'use client';

import { useState, useMemo, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronUp, ChevronDown, ChevronsUpDown,
  Search, X, ChevronLeft, ChevronRight, Download,
  Filter as FilterIcon,
} from 'lucide-react';
import { TableSkeleton } from './LoadingSkeleton';
import { InlineError } from './ErrorState';
import EmptyState, { NoSearchResults, NoFilterResults } from './EmptyState';

/* ─── DataTable ────────────────────────────────────────────────────────
 *  Reusable sortable, filterable, paginated table.
 *  Handles loading, error, empty, and no-results states.
 *  Responsive: horizontally scrollable on mobile with sticky first col.
 * ──────────────────────────────────────────────────────────────────── */

// ── Column definition ─────────────────────────────────────────────────

export interface DataTableColumn<T> {
  key: string;
  header: string;
  /** Render function - receives the row data */
  render?: (row: T, index: number) => ReactNode;
  /** Simple accessor for sorting - if not provided, uses key as object path */
  accessor?: (row: T) => string | number;
  sortable?: boolean;
  /** Alignment */
  align?: 'left' | 'center' | 'right';
  /** Width class e.g. 'w-40', 'min-w-[200px]' */
  width?: string;
  /** Hide on mobile */
  hideOnMobile?: boolean;
  /** Sticky first column */
  sticky?: boolean;
}

// ── Props ─────────────────────────────────────────────────────────────

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  /** Unique key extractor */
  rowKey: (row: T) => string;

  // ── Data states ─────────────────────────────────────────────────
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;

  // ── Features ────────────────────────────────────────────────────
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Fields to search across - defaults to all string fields */
  searchFields?: string[];
  paginate?: boolean;
  pageSize?: number;
  /** Custom row click handler */
  onRowClick?: (row: T) => void;
  /** Custom empty state */
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: string;
  /** Header actions (buttons, filters) */
  headerActions?: ReactNode;
  /** Export handler */
  onExport?: () => void;

  title?: string;
  subtitle?: string;
  className?: string;
}

type SortDirection = 'asc' | 'desc' | null;

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  rowKey,
  loading = false,
  error,
  onRetry,
  searchable = true,
  searchPlaceholder = 'Search...',
  searchFields,
  paginate = true,
  pageSize = 10,
  onRowClick,
  emptyTitle = 'No data available',
  emptyDescription,
  emptyIcon = 'inbox',
  headerActions,
  onExport,
  title,
  subtitle,
  className = '',
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [page, setPage] = useState(0);

  // ── Sorting ─────────────────────────────────────────────────────

  const handleSort = useCallback((key: string) => {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else if (sortDir === 'desc') { setSortKey(null); setSortDir(null); }
      else setSortDir('asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(0);
  }, [sortKey, sortDir]);

  // ── Filtering + sorting ─────────────────────────────────────────

  const processedData = useMemo(() => {
    let result = [...data];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((row) => {
        const fields = searchFields || Object.keys(row);
        return fields.some((field) => {
          const val = row[field];
          return val != null && String(val).toLowerCase().includes(q);
        });
      });
    }

    // Sort
    if (sortKey && sortDir) {
      const col = columns.find((c) => c.key === sortKey);
      result.sort((a, b) => {
        const aVal = col?.accessor ? col.accessor(a) : a[sortKey];
        const bVal = col?.accessor ? col.accessor(b) : b[sortKey];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        const cmp = typeof aVal === 'number' && typeof bVal === 'number'
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal));
        return sortDir === 'desc' ? -cmp : cmp;
      });
    }

    return result;
  }, [data, search, searchFields, sortKey, sortDir, columns]);

  // ── Pagination ──────────────────────────────────────────────────

  const totalPages = paginate ? Math.max(1, Math.ceil(processedData.length / pageSize)) : 1;
  const paginatedData = paginate
    ? processedData.slice(page * pageSize, (page + 1) * pageSize)
    : processedData;

  // ── Loading state ───────────────────────────────────────────────

  if (loading) {
    return <TableSkeleton rows={pageSize > 8 ? 8 : pageSize} cols={columns.length} className={className} />;
  }

  // ── Error state ─────────────────────────────────────────────────

  if (error) {
    return (
      <div className={`bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5 ${className}`}>
        <InlineError message="Failed to load table data" onRetry={onRetry} />
      </div>
    );
  }

  const hasSearch = search.trim().length > 0;

  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border overflow-hidden ${className}`}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      {(title || searchable || headerActions || onExport) && (
        <div className="p-4 sm:p-5 pb-0 space-y-3">
          {/* Title row */}
          {(title || headerActions || onExport) && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                {title && <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider">{title}</h3>}
                {subtitle && <p className="text-xs font-body text-rani-muted mt-0.5">{subtitle}</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {headerActions}
                {onExport && (
                  <button
                    onClick={onExport}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body font-medium text-rani-muted hover:text-rani-navy hover:bg-rani-cream border border-rani-border transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Search bar */}
          {searchable && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rani-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                placeholder={searchPlaceholder}
                className="w-full h-9 sm:h-10 pl-9 pr-9 rounded-lg bg-rani-cream/60 border border-rani-border/50 text-sm font-body text-rani-navy placeholder:text-rani-muted/50 focus:outline-none focus:ring-2 focus:ring-rani-gold/30 focus:border-rani-gold/50 transition-all"
              />
              {hasSearch && (
                <button
                  onClick={() => { setSearch(''); setPage(0); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-rani-border/50 flex items-center justify-center hover:bg-rani-border transition-colors"
                >
                  <X className="w-3 h-3 text-rani-muted" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-rani-border/40">
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                const alignClass = col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left';

                return (
                  <th
                    key={col.key}
                    className={`
                      px-4 sm:px-5 py-3 text-[10px] sm:text-xs font-body font-semibold uppercase tracking-wider text-rani-muted
                      ${alignClass}
                      ${col.width || ''}
                      ${col.hideOnMobile ? 'hidden md:table-cell' : ''}
                      ${col.sticky ? 'sticky left-0 bg-white/95 z-10' : ''}
                      ${col.sortable !== false ? 'cursor-pointer select-none hover:text-rani-navy group' : ''}
                    `}
                    onClick={col.sortable !== false ? () => handleSort(col.key) : undefined}
                  >
                    <div className={`inline-flex items-center gap-1 ${alignClass === 'text-right' ? 'flex-row-reverse' : ''}`}>
                      <span>{col.header}</span>
                      {col.sortable !== false && (
                        <span className="inline-flex flex-col -space-y-1.5">
                          {isSorted ? (
                            sortDir === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-rani-gold-accessible" /> : <ChevronDown className="w-3.5 h-3.5 text-rani-gold-accessible" />
                          ) : (
                            <ChevronsUpDown className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 transition-opacity" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-0">
                  {data.length === 0 ? (
                    <EmptyState icon={emptyIcon as never} title={emptyTitle} description={emptyDescription} compact />
                  ) : hasSearch ? (
                    <NoSearchResults query={search} onClear={() => setSearch('')} />
                  ) : (
                    <NoFilterResults onClear={() => setSearch('')} />
                  )}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <motion.tr
                  key={rowKey(row)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`
                    border-b border-rani-border/10 last:border-0 transition-colors
                    ${onRowClick ? 'cursor-pointer hover:bg-rani-cream/40' : ''}
                  `}
                >
                  {columns.map((col) => {
                    const alignClass = col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left';
                    return (
                      <td
                        key={col.key}
                        className={`
                          px-4 sm:px-5 py-3 text-sm font-body text-rani-text
                          ${alignClass}
                          ${col.width || ''}
                          ${col.hideOnMobile ? 'hidden md:table-cell' : ''}
                          ${col.sticky ? 'sticky left-0 bg-white/95 z-10' : ''}
                        `}
                      >
                        {col.render
                          ? col.render(row, page * pageSize + idx)
                          : (row[col.key] != null ? String(row[col.key]) : '--')}
                      </td>
                    );
                  })}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ─────────────────────────────────────────────── */}
      {paginate && processedData.length > pageSize && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 sm:px-5 py-3 border-t border-rani-border/30">
          <p className="text-xs font-body text-rani-muted">
            Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, processedData.length)} of {processedData.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-rani-muted hover:bg-rani-cream disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i;
              } else if (page < 3) {
                pageNum = i;
              } else if (page > totalPages - 4) {
                pageNum = totalPages - 5 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`
                    w-8 h-8 rounded-lg flex items-center justify-center text-xs font-body font-medium transition-all
                    ${page === pageNum
                      ? 'bg-rani-navy text-white shadow-sm'
                      : 'text-rani-muted hover:bg-rani-cream'
                    }
                  `}
                >
                  {pageNum + 1}
                </button>
              );
            })}
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-rani-muted hover:bg-rani-cream disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
