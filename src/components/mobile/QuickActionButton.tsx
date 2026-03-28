'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface QuickActionButtonProps {
  icon: LucideIcon;
  label: string;
  href: string;
  color?: string;
  badge?: string;
}

export default function QuickActionButton({
  icon: Icon,
  label,
  href,
  color = '#C9A96E',
  badge,
}: QuickActionButtonProps) {
  return (
    <Link href={href}>
      <motion.div
        whileTap={{ scale: 0.92 }}
        className="flex flex-col items-center gap-1.5"
      >
        <div className="relative">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon size={22} style={{ color }} />
          </div>
          {badge && (
            <div className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-[9px] text-white font-body font-bold">{badge}</span>
            </div>
          )}
        </div>
        <span className="text-[11px] text-rani-text font-body font-medium text-center leading-tight">
          {label}
        </span>
      </motion.div>
    </Link>
  );
}
