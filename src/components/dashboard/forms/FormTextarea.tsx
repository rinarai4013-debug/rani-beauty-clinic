'use client';

import type { TextareaHTMLAttributes } from 'react';

export default function FormTextarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full px-3 py-2 text-sm font-body text-rani-navy border border-rani-border rounded-lg outline-none focus:ring-2 focus:ring-rani-gold/30 focus:border-rani-gold transition-all placeholder:text-rani-muted/50 resize-y min-h-[80px] ${className}`}
      {...props}
    />
  );
}
