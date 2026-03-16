'use client';

import type { InputHTMLAttributes } from 'react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  prefix?: string;
  suffix?: string;
}

export default function FormInput({ prefix, suffix, className = '', ...props }: FormInputProps) {
  if (prefix || suffix) {
    return (
      <div className="flex items-center border border-rani-border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-rani-gold/30 focus-within:border-rani-gold transition-all">
        {prefix && (
          <span className="px-3 py-2 bg-rani-cream/50 text-sm font-body text-rani-muted border-r border-rani-border">
            {prefix}
          </span>
        )}
        <input
          className={`flex-1 px-3 py-2 text-sm font-body text-rani-navy bg-transparent outline-none placeholder:text-rani-muted/50 ${className}`}
          {...props}
        />
        {suffix && (
          <span className="px-3 py-2 bg-rani-cream/50 text-sm font-body text-rani-muted border-l border-rani-border">
            {suffix}
          </span>
        )}
      </div>
    );
  }

  return (
    <input
      className={`w-full px-3 py-2 text-sm font-body text-rani-navy border border-rani-border rounded-lg outline-none focus:ring-2 focus:ring-rani-gold/30 focus:border-rani-gold transition-all placeholder:text-rani-muted/50 ${className}`}
      {...props}
    />
  );
}
