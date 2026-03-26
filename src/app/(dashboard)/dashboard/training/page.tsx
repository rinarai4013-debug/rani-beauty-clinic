'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Clock, Award, Users, GraduationCap, ClipboardList, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { TRAINING_MODULES, ROLE_LABELS, ROLE_COLORS, getModulesByRole } from '@/data/training/modules';
import type { TrainingRole } from '@/data/training/modules';
import ModuleCard from '@/components/dashboard/training/ModuleCard';

const ROLE_TABS: { key: TrainingRole | 'all'; label: string; icon: React.ElementType }[] = [
  { key: 'all', label: 'All Modules', icon: BookOpen },
  { key: 'front-desk', label: 'Front Desk', icon: Users },
  { key: 'provider', label: 'Provider', icon: GraduationCap },
  { key: 'all-staff', label: 'All Staff', icon: Award },
  { key: 'management', label: 'Management', icon: BarChart3 },
];

export default function TrainingHubPage() {
  const [selectedRole, setSelectedRole] = useState<TrainingRole | 'all'>('all');

  const filteredModules = selectedRole === 'all'
    ? TRAINING_MODULES
    : getModulesByRole(selectedRole);

  const stats = {
    totalModules: TRAINING_MODULES.length,
    totalSections: TRAINING_MODULES.reduce((acc, m) => acc + m.sections.length, 0),
    totalDuration: TRAINING_MODULES.reduce((acc, m) => acc + m.duration, 0),
    totalQuizzes: TRAINING_MODULES.reduce(
      (acc, m) => acc + m.sections.reduce((a, s) => a + s.quiz.length, 0),
      0
    ),
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0F1D2C] font-['Playfair_Display']">
          Staff Training Center
        </h1>
        <p className="text-gray-500 mt-1">
          Comprehensive training modules for every role at Rani Beauty Clinic
        </p>
      </div>

      {/* Quick links */}
      <div className="flex gap-3 flex-wrap">
        <Link
          href="/dashboard/training/progress"
          className="flex items-center gap-2 px-4 py-2 bg-[#0F1D2C] text-white rounded-lg text-sm font-medium hover:bg-[#1a2d42] transition-colors"
        >
          <BarChart3 className="w-4 h-4" /> Staff Progress
        </Link>
        <Link
          href="/dashboard/training/sops"
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <ClipboardList className="w-4 h-4" /> SOP Library
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Modules', value: stats.totalModules, icon: BookOpen, color: '#C9A96E' },
          { label: 'Content Sections', value: stats.totalSections, icon: ClipboardList, color: '#3B82F6' },
          { label: 'Quiz Questions', value: stats.totalQuizzes, icon: GraduationCap, color: '#8B5CF6' },
          { label: 'Total Duration', value: `${Math.round(stats.totalDuration / 60)}h ${stats.totalDuration % 60}m`, icon: Clock, color: '#059669' },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-xl border border-gray-200 p-5"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${stat.color}15` }}
              >
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0F1D2C]">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Role tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {ROLE_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setSelectedRole(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              selectedRole === tab.key
                ? 'bg-[#0F1D2C] text-white shadow-md'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${
              selectedRole === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
            }`}>
              {tab.key === 'all' ? TRAINING_MODULES.length : getModulesByRole(tab.key as TrainingRole).length}
            </span>
          </button>
        ))}
      </div>

      {/* Module grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredModules.map((module, idx) => (
          <motion.div
            key={module.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <ModuleCard module={module} />
          </motion.div>
        ))}
      </div>

      {filteredModules.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No modules found for this category.</p>
        </div>
      )}
    </div>
  );
}
