'use client';

import Link from 'next/link';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import type { ReactNode, FormEvent } from 'react';

interface FormShellProps {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  children: ReactNode;
  onSubmit: (e: FormEvent) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  backHref?: string;
}

export default function FormShell({
  title,
  subtitle,
  icon,
  children,
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Save Entry',
  backHref = '/dashboard',
}: FormShellProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-body text-rani-muted hover:text-rani-navy transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div
        className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-6"
      >
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-rani-border">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rani-gold/10 text-rani-gold">
            {icon}
          </div>
          <div>
            <h1 className="text-xl font-heading text-rani-navy">{title}</h1>
            {subtitle && <p className="text-sm font-body text-rani-muted">{subtitle}</p>}
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          {children}

          <div className="pt-4 border-t border-rani-border flex justify-end gap-3">
            <Link
              href={backHref}
              className="px-4 py-2 text-sm font-body font-medium text-rani-muted hover:text-rani-text rounded-lg border border-rani-border hover:border-rani-border transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 text-sm font-body font-medium text-rani-navy bg-rani-gold hover:bg-rani-gold/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSubmitting ? 'Saving...' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
