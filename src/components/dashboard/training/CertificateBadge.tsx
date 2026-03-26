'use client';

import { motion } from 'framer-motion';
import { Award, Shield, Star, CheckCircle } from 'lucide-react';
import { ROLE_COLORS, ROLE_LABELS } from '@/data/training/modules';
import type { TrainingRole } from '@/data/training/modules';

interface CertificateBadgeProps {
  staffName: string;
  moduleTitle: string;
  role: TrainingRole;
  score: number;
  completedAt: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function CertificateBadge({
  staffName,
  moduleTitle,
  role,
  score,
  completedAt,
  size = 'md',
}: CertificateBadgeProps) {
  const passed = score >= 80;
  const excellent = score >= 95;
  const roleColor = ROLE_COLORS[role];

  const sizeClasses = {
    sm: 'p-3 w-48',
    md: 'p-5 w-64',
    lg: 'p-8 w-80',
  };

  const iconSize = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const BadgeIcon = excellent ? Star : passed ? Award : Shield;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.02 }}
      className={`${sizeClasses[size]} rounded-xl border-2 text-center relative overflow-hidden ${
        excellent
          ? 'border-yellow-400 bg-gradient-to-b from-yellow-50 to-white'
          : passed
          ? 'border-emerald-400 bg-gradient-to-b from-emerald-50 to-white'
          : 'border-gray-300 bg-gradient-to-b from-gray-50 to-white'
      }`}
    >
      {/* Decorative top banner */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5"
        style={{ backgroundColor: roleColor }}
      />

      {/* Badge icon */}
      <div className="flex justify-center mb-2 mt-1">
        <div className={`${iconSize[size]} rounded-full flex items-center justify-center ${
          excellent
            ? 'bg-yellow-100 text-yellow-600'
            : passed
            ? 'bg-emerald-100 text-emerald-600'
            : 'bg-gray-100 text-gray-500'
        }`}>
          <BadgeIcon className={size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-6 h-6' : 'w-8 h-8'} />
        </div>
      </div>

      {/* Certificate text */}
      <p className={`font-['Playfair_Display'] font-bold text-[#0F1D2C] ${
        size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
      }`}>
        {excellent ? 'Excellence' : passed ? 'Certified' : 'Completed'}
      </p>

      <p className={`text-gray-500 mt-1 ${size === 'sm' ? 'text-[10px]' : 'text-xs'}`}>
        {moduleTitle}
      </p>

      <div className="flex items-center justify-center gap-1 mt-2">
        <CheckCircle className={`${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} ${
          passed ? 'text-emerald-500' : 'text-gray-400'
        }`} />
        <span className={`font-bold ${size === 'sm' ? 'text-xs' : 'text-sm'} ${
          excellent ? 'text-yellow-600' : passed ? 'text-emerald-600' : 'text-gray-500'
        }`}>
          {score}%
        </span>
      </div>

      <p className={`text-gray-700 font-medium mt-2 ${size === 'sm' ? 'text-[10px]' : 'text-xs'}`}>
        {staffName}
      </p>

      <p className={`text-gray-400 ${size === 'sm' ? 'text-[9px]' : 'text-[10px]'}`}>
        {new Date(completedAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}
      </p>

      {/* Role tag */}
      <span
        className={`inline-block mt-2 px-2 py-0.5 rounded-full text-white ${
          size === 'sm' ? 'text-[9px]' : 'text-[10px]'
        } font-semibold`}
        style={{ backgroundColor: roleColor }}
      >
        {ROLE_LABELS[role]}
      </span>
    </motion.div>
  );
}
