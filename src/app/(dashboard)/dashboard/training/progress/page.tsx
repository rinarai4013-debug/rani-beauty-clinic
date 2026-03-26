'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Award, AlertTriangle, TrendingUp, BookOpen, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { useDashboardData } from '@/hooks/useDashboardData';
import { TRAINING_MODULES, ROLE_LABELS } from '@/data/training/modules';
import type { TrainingRole } from '@/data/training/modules';
import ProgressMatrix from '@/components/dashboard/training/ProgressMatrix';
import CertificateBadge from '@/components/dashboard/training/CertificateBadge';
import { DashboardErrorBoundary, PanelSkeleton, SkeletonBar, InlineError } from '@/components/dashboard/shared';

interface ProgressData {
  staff: Array<{ id: string; name: string; role: string; avatarInitials: string }>;
  progress: Array<{
    moduleId: string;
    staffId: string;
    completedSections: number;
    totalSections: number;
    quizScores: number[];
    completed: boolean;
    completedAt?: string;
  }>;
  staffStats: Array<{
    id: string;
    name: string;
    role: string;
    avatarInitials: string;
    completedModules: number;
    inProgressModules: number;
    notStarted: number;
    avgScore: number;
    completionRate: number;
    alerts: Array<{ moduleId: string; moduleTitle: string; avgScore: number }>;
  }>;
  teamStats: {
    totalStaff: number;
    totalModules: number;
    completedAssignments: number;
    totalAssignments: number;
    completionRate: number;
    avgScore: number;
    alertCount: number;
  };
  overdue: Array<{
    staffId: string;
    staffName: string;
    moduleId: string;
    moduleTitle: string;
  }>;
}

export default function TrainingProgressPage() {
  const { data, isLoading, error, mutate } = useDashboardData<ProgressData>('/api/dashboard/training/progress');
  const [selectedRole, setSelectedRole] = useState<TrainingRole | 'all'>('all');

  if (error) {
    return (
      <DashboardErrorBoundary pageName="Training Progress">
        <InlineError message="Failed to load training progress" onRetry={() => mutate()} />
      </DashboardErrorBoundary>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse space-y-2">
          <SkeletonBar className="h-7 w-48" />
          <SkeletonBar className="h-3 w-64" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <PanelSkeleton key={i} rows={2} />)}
        </div>
        <PanelSkeleton rows={8} />
      </div>
    );
  }

  const { staff, progress, staffStats, teamStats, overdue } = data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <Link
            href="/dashboard/training"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Training Center
          </Link>
          <h1 className="text-2xl font-bold text-[#0F1D2C] font-['Playfair_Display']">
            Staff Training Progress
          </h1>
          <p className="text-gray-500 mt-1">
            Track completion, scores, and identify training gaps across the team
          </p>
        </div>
      </div>

      {/* Team stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Team Completion', value: `${teamStats.completionRate}%`, icon: TrendingUp, color: '#059669' },
          { label: 'Average Score', value: `${teamStats.avgScore}%`, icon: Award, color: '#C9A96E' },
          { label: 'Staff Members', value: teamStats.totalStaff, icon: Users, color: '#3B82F6' },
          { label: 'Alerts', value: teamStats.alertCount, icon: AlertTriangle, color: teamStats.alertCount > 0 ? '#DC2626' : '#059669' },
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

      {/* Staff individual stats */}
      <div>
        <h2 className="text-lg font-semibold text-[#0F1D2C] mb-4">Individual Progress</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffStats.map((member, idx) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#0F1D2C] flex items-center justify-center text-sm font-bold text-[#C9A96E]">
                  {member.avatarInitials}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{member.name}</p>
                  <p className="text-xs text-gray-500">{member.role}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center">
                  <p className="text-lg font-bold text-emerald-600">{member.completedModules}</p>
                  <p className="text-[10px] text-gray-400">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-blue-600">{member.inProgressModules}</p>
                  <p className="text-[10px] text-gray-400">In Progress</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-400">{member.notStarted}</p>
                  <p className="text-[10px] text-gray-400">Not Started</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-[#C9A96E] to-emerald-500 transition-all"
                  style={{ width: `${member.completionRate}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">{member.completionRate}% complete</span>
                <span className={`font-medium ${member.avgScore >= 80 ? 'text-emerald-600' : member.avgScore > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                  {member.avgScore > 0 ? `Avg: ${member.avgScore}%` : 'No scores'}
                </span>
              </div>

              {/* Alerts */}
              {member.alerts.length > 0 && (
                <div className="mt-3 p-2 bg-red-50 rounded-lg border border-red-100">
                  <p className="text-xs font-medium text-red-700 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {member.alerts.length} low score{member.alerts.length > 1 ? 's' : ''}
                  </p>
                  {member.alerts.map(alert => (
                    <p key={alert.moduleId} className="text-[10px] text-red-600 mt-0.5">
                      {alert.moduleTitle}: {alert.avgScore}%
                    </p>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Role filter for matrix */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#0F1D2C]">Completion Matrix</h2>
          <div className="flex gap-2">
            {(['all', 'front-desk', 'provider', 'all-staff', 'management'] as const).map(role => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  selectedRole === role
                    ? 'bg-[#0F1D2C] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {role === 'all' ? 'All' : ROLE_LABELS[role]}
              </button>
            ))}
          </div>
        </div>
        <ProgressMatrix
          staff={staff}
          progress={progress}
          selectedRole={selectedRole}
        />
      </div>

      {/* Overdue modules */}
      {overdue.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-[#0F1D2C] mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Overdue Training ({overdue.length})
          </h2>
          <div className="bg-amber-50 rounded-xl border border-amber-200 divide-y divide-amber-100">
            {overdue.slice(0, 10).map((item, idx) => (
              <div key={idx} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{item.staffName}</p>
                  <p className="text-xs text-gray-500">{item.moduleTitle}</p>
                </div>
                <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                  Not started
                </span>
              </div>
            ))}
            {overdue.length > 10 && (
              <div className="px-5 py-3 text-xs text-amber-600 text-center">
                +{overdue.length - 10} more overdue items
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
