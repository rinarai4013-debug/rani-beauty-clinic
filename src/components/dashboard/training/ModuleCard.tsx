'use client';

import { motion } from 'framer-motion';
import { Clock, BookOpen, CheckCircle, Lock, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { TrainingModule, TrainingRole } from '@/data/training/modules';
import { ROLE_COLORS, ROLE_LABELS } from '@/data/training/modules';

interface ModuleCardProps {
  module: TrainingModule;
  progress?: {
    completedSections: number;
    totalSections: number;
    quizScores: number[];
    completed: boolean;
  };
  locked?: boolean;
}

export default function ModuleCard({ module, progress, locked = false }: ModuleCardProps) {
  const roleColor = ROLE_COLORS[module.role];
  const roleLabel = ROLE_LABELS[module.role];
  const completedSections = progress?.completedSections ?? 0;
  const totalSections = module.sections.length;
  const progressPercent = totalSections > 0 ? (completedSections / totalSections) * 100 : 0;
  const isComplete = progress?.completed ?? false;
  const avgScore = progress?.quizScores && progress.quizScores.length > 0
    ? Math.round(progress.quizScores.reduce((a, b) => a + b, 0) / progress.quizScores.length)
    : null;

  const CardContent = (
    <motion.div
      whileHover={locked ? {} : { y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
      className={`relative bg-white rounded-xl border border-gray-200 p-6 transition-all ${
        locked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-[#C9A96E]/40'
      } ${isComplete ? 'ring-2 ring-emerald-200' : ''}`}
    >
      {/* Role badge */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
          style={{ backgroundColor: roleColor }}
        >
          {roleLabel}
        </span>
        {isComplete && (
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
            <CheckCircle className="w-4 h-4" />
            Complete
          </span>
        )}
        {locked && (
          <span className="flex items-center gap-1 text-xs font-medium text-gray-400">
            <Lock className="w-4 h-4" />
            Locked
          </span>
        )}
      </div>

      {/* Title & description */}
      <h3 className="text-lg font-semibold text-[#0F1D2C] mb-2 font-['Playfair_Display']">
        {module.title}
      </h3>
      <p className="text-sm text-gray-500 mb-4 line-clamp-2">
        {module.description}
      </p>

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {module.duration} min
        </span>
        <span className="flex items-center gap-1">
          <BookOpen className="w-3.5 h-3.5" />
          {totalSections} sections
        </span>
        {avgScore !== null && (
          <span className={`font-medium ${avgScore >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
            Score: {avgScore}%
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${
            isComplete ? 'bg-emerald-500' : 'bg-[#C9A96E]'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {completedSections}/{totalSections} sections
        </span>
        {!locked && !isComplete && (
          <span className="text-xs text-rani-gold-accessible font-medium flex items-center gap-0.5">
            {completedSections > 0 ? 'Continue' : 'Start'} <ChevronRight className="w-3 h-3" />
          </span>
        )}
      </div>

      {/* Prerequisites note */}
      {module.prerequisites.length > 0 && locked && (
        <p className="text-xs text-gray-400 mt-3 italic">
          Requires: {module.prerequisites.join(', ')}
        </p>
      )}
    </motion.div>
  );

  if (locked) {
    return CardContent;
  }

  return (
    <Link href={`/dashboard/training/${module.slug}`}>
      {CardContent}
    </Link>
  );
}
