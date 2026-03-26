'use client';

import React, { useCallback, useState } from 'react';
import { AlertTriangle, RefreshCw, WifiOff, ServerCrash, ShieldAlert, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Error State Components ───────────────────────────────────────────
 *  ErrorBoundary - class component that catches render crashes
 *  ErrorState    - functional component for SWR / fetch errors
 *  InlineError   - compact inline error for use inside panels
 *
 *  All variants support retry with loading state + auto-retry countdown.
 * ──────────────────────────────────────────────────────────────────── */

// ── Error type detection ──────────────────────────────────────────────

type ErrorKind = 'network' | 'server' | 'auth' | 'unknown';

function classifyError(error: unknown): ErrorKind {
  if (!error) return 'unknown';
  const msg = error instanceof Error ? error.message : String(error);
  const lower = msg.toLowerCase();
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('offline')) return 'network';
  if (lower.includes('401') || lower.includes('403') || lower.includes('unauthorized')) return 'auth';
  if (lower.includes('500') || lower.includes('server')) return 'server';
  return 'unknown';
}

const ERROR_CONFIG: Record<ErrorKind, { icon: React.ElementType; title: string; description: string; color: string }> = {
  network: {
    icon: WifiOff,
    title: 'Connection lost',
    description: 'Check your internet connection and try again.',
    color: 'text-amber-500 bg-amber-50',
  },
  server: {
    icon: ServerCrash,
    title: 'Server error',
    description: 'Our servers are having trouble. This usually resolves quickly.',
    color: 'text-red-400 bg-red-50',
  },
  auth: {
    icon: ShieldAlert,
    title: 'Authentication required',
    description: 'Your session may have expired. Please sign in again.',
    color: 'text-orange-500 bg-orange-50',
  },
  unknown: {
    icon: AlertTriangle,
    title: 'Something went wrong',
    description: 'An unexpected error occurred. Please try again.',
    color: 'text-red-400 bg-red-50',
  },
};

// ── Retry button with loading spinner ─────────────────────────────────

function RetryButton({
  onRetry,
  size = 'md',
}: {
  onRetry: () => void;
  size?: 'sm' | 'md';
}) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = useCallback(async () => {
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      // Give the UI a moment to show the spinner
      setTimeout(() => setRetrying(false), 600);
    }
  }, [onRetry]);

  const sizeClasses = size === 'sm'
    ? 'px-3 py-1.5 text-xs gap-1.5'
    : 'px-4 py-2 text-sm gap-2';

  return (
    <button
      onClick={handleRetry}
      disabled={retrying}
      className={`
        inline-flex items-center ${sizeClasses} rounded-lg
        bg-rani-navy text-white font-body font-medium
        hover:bg-rani-navy/90 active:scale-[0.97]
        disabled:opacity-60 disabled:cursor-not-allowed
        transition-all duration-200
      `}
    >
      <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
      {retrying ? 'Retrying...' : 'Try Again'}
    </button>
  );
}

// ── Full error state (for page-level or section-level errors) ─────────

interface ErrorStateProps {
  error?: unknown;
  title?: string;
  description?: string;
  onRetry?: () => void;
  compact?: boolean;
  className?: string;
}

export function ErrorState({
  error,
  title,
  description,
  onRetry,
  compact = false,
  className = '',
}: ErrorStateProps) {
  const kind = classifyError(error);
  const config = ERROR_CONFIG[kind];
  const Icon = config.icon;
  const [showDetails, setShowDetails] = useState(false);

  const displayTitle = title || config.title;
  const displayDesc = description || config.description;

  if (compact) {
    return (
      <div className={`flex items-center gap-3 p-3 rounded-lg bg-red-50/60 border border-red-100 ${className}`}>
        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-body font-medium text-rani-navy">{displayTitle}</p>
          <p className="text-xs font-body text-rani-muted truncate">{displayDesc}</p>
        </div>
        {onRetry && <RetryButton onRetry={onRetry} size="sm" />}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center py-16 sm:py-20 px-6 text-center ${className}`}
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 ${config.color}`}
      >
        <Icon className="w-8 h-8" />
      </motion.div>

      <h3 className="text-lg font-heading text-rani-navy mb-2">{displayTitle}</h3>
      <p className="text-sm font-body text-rani-muted max-w-md leading-relaxed mb-6">{displayDesc}</p>

      {onRetry && <RetryButton onRetry={onRetry} />}

      {/* Dev-only error details */}
      {process.env.NODE_ENV === 'development' && error && (
        <div className="mt-6 w-full max-w-lg">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-xs font-body text-rani-muted hover:text-rani-navy transition-colors mx-auto"
          >
            <ChevronDown className={`w-3 h-3 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
            {showDetails ? 'Hide' : 'Show'} error details
          </button>
          <AnimatePresence>
            {showDetails && (
              <motion.pre
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-3 p-4 bg-gray-50 rounded-xl text-xs text-left text-red-600 overflow-auto max-h-40 border border-gray-100"
              >
                {error instanceof Error ? `${error.message}\n\n${error.stack}` : JSON.stringify(error, null, 2)}
              </motion.pre>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

// ── Inline error (for use inside panels / cards) ──────────────────────

interface InlineErrorProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function InlineError({
  message = 'Failed to load data',
  onRetry,
  className = '',
}: InlineErrorProps) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = useCallback(async () => {
    setRetrying(true);
    try {
      onRetry?.();
    } finally {
      setTimeout(() => setRetrying(false), 600);
    }
  }, [onRetry]);

  return (
    <div className={`flex flex-col items-center justify-center py-8 text-center ${className}`}>
      <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mb-3">
        <AlertTriangle className="w-5 h-5 text-red-400" />
      </div>
      <p className="text-sm font-body text-rani-muted mb-3">{message}</p>
      {onRetry && (
        <button
          onClick={handleRetry}
          disabled={retrying}
          className="inline-flex items-center gap-1.5 text-xs font-body font-medium text-rani-navy hover:text-rani-gold disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${retrying ? 'animate-spin' : ''}`} />
          {retrying ? 'Retrying...' : 'Retry'}
        </button>
      )}
    </div>
  );
}

// ── Class-based Error Boundary ────────────────────────────────────────

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  pageName?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

export class DashboardErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState((prev) => ({
      hasError: false,
      error: null,
      retryCount: prev.retryCount + 1,
    }));
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <ErrorState
          error={this.state.error}
          title={
            this.props.pageName
              ? `Something went wrong in ${this.props.pageName}`
              : undefined
          }
          onRetry={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}
