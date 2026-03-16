'use client';

import type { SelectHTMLAttributes } from 'react';

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
  placeholder?: string;
}

export default function FormSelect({ options, placeholder, className = '', ...props }: FormSelectProps) {
  return (
    <select
      className={`w-full px-3 py-2 text-sm font-body text-rani-navy border border-rani-border rounded-lg outline-none focus:ring-2 focus:ring-rani-gold/30 focus:border-rani-gold transition-all bg-white appearance-none ${className}`}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
