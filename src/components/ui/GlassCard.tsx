'use client';

import { forwardRef, type ReactNode } from 'react';

interface GlassCardProps {
  variant?: 'dark' | 'light' | 'gold';
  hover?: boolean;
  glow?: boolean;
  className?: string;
  children: ReactNode;
  as?: 'div' | 'section' | 'article';
  onClick?: () => void;
}

const variantStyles: Record<string, string> = {
  dark: 'glass',
  light: 'glass-light',
  gold: 'glass-gold',
};

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      variant = 'dark',
      hover = false,
      glow = false,
      className = '',
      children,
      as: Component = 'div',
      onClick,
    },
    ref
  ) => {
    const baseClasses = 'rounded-2xl p-6';
    const glassClass = variantStyles[variant] || variantStyles.dark;
    const hoverClass = hover ? 'card-hover cursor-pointer' : '';
    const glowClass = glow ? 'border-glow' : '';

    return (
      <Component
        ref={ref as never}
        className={`${baseClasses} ${glassClass} ${hoverClass} ${glowClass} ${className}`}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={
          onClick
            ? (e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
      >
        {children}
      </Component>
    );
  }
);

GlassCard.displayName = 'GlassCard';

export default GlassCard;
