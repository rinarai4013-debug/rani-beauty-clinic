'use client';

import type { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export default function FormField({ label, required, error, hint, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-body font-medium text-rani-navy">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs font-body text-rani-muted">{hint}</p>
      )}
      {error && (
        <p className="text-xs font-body text-red-500">{error}</p>
      )}
    </div>
  );
}
