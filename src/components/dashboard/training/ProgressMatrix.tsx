'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertTriangle, XCircle } from 'lucide-react';
import { TRAINING_MODULES, ROLE_LABELS, ROLE_COLORS } from '@/data/training/modules';
import type { TrainingRole } from '@/data/training/modules';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  avatarInitials: string;
}

interface ModuleProgress {
  moduleId: string;
  staffId: string;
  completedSections: number;
  totalSections: number;
  quizScores: number[];
  completed: boolean;
  completedAt?: string;
}

interface ProgressMatrixProps {
  staff: StaffMember[];
  progress: ModuleProgress[];
  selectedRole?: TrainingRole | 'all';
}

export default function ProgressMatrix({ staff, progress, selectedRole = 'all' }: ProgressMatrixProps) {
  const filteredModules = selectedRole === 'all'
    ? TRAINING_MODULES
    : TRAINING_MODULES.filter(m => m.role === selectedRole || m.role === 'all-staff');

  const getProgress = (staffId: string, moduleId: string): ModuleProgress | undefined => {
    return progress.find(p => p.staffId === staffId && p.moduleId === moduleId);
  };

  const getStatusIcon = (prog: ModuleProgress | undefined) => {
    if (!prog) return <XCircle className="w-4 h-4 text-gray-300" />;
    if (prog.completed) {
      const avgScore = prog.quizScores.length > 0
        ? Math.round(prog.quizScores.reduce((a, b) => a + b, 0) / prog.quizScores.length)
        : 0;
      if (avgScore >= 80) return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    }
    if (prog.completedSections > 0) return <Clock className="w-4 h-4 text-blue-500" />;
    return <XCircle className="w-4 h-4 text-gray-300" />;
  };

  const getStatusBg = (prog: ModuleProgress | undefined) => {
    if (!prog) return 'bg-gray-50';
    if (prog.completed) {
      const avgScore = prog.quizScores.length > 0
        ? Math.round(prog.quizScores.reduce((a, b) => a + b, 0) / prog.quizScores.length)
        : 0;
      if (avgScore >= 80) return 'bg-emerald-50';
      return 'bg-amber-50';
    }
    if (prog.completedSections > 0) return 'bg-blue-50';
    return 'bg-gray-50';
  };

  const getStaffStats = (staffId: string) => {
    const staffProgress = progress.filter(p => p.staffId === staffId);
    const completed = staffProgress.filter(p => p.completed).length;
    const inProgress = staffProgress.filter(p => !p.completed && p.completedSections > 0).length;
    const allScores = staffProgress.flatMap(p => p.quizScores);
    const avgScore = allScores.length > 0
      ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
      : 0;
    const lowScores = staffProgress.filter(p => {
      const avg = p.quizScores.length > 0
        ? p.quizScores.reduce((a, b) => a + b, 0) / p.quizScores.length
        : 100;
      return p.completed && avg < 80;
    });
    return { completed, inProgress, avgScore, alerts: lowScores.length };
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Legend */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center gap-6 flex-wrap">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Legend:</span>
        <span className="flex items-center gap-1.5 text-xs text-gray-600">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Passed (80%+)
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-600">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Completed (below 80%)
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-600">
          <Clock className="w-3.5 h-3.5 text-blue-500" /> In Progress
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-600">
          <XCircle className="w-3.5 h-3.5 text-gray-300" /> Not Started
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="sticky left-0 bg-white z-10 px-4 py-3 text-left font-semibold text-gray-700 min-w-[180px]">
                Staff Member
              </th>
              <th className="px-3 py-3 text-center font-semibold text-gray-700 min-w-[80px]">
                Score
              </th>
              {filteredModules.map(mod => (
                <th
                  key={mod.id}
                  className="px-2 py-3 text-center min-w-[44px]"
                  title={mod.title}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: ROLE_COLORS[mod.role] }}
                    />
                    <span className="text-[10px] text-gray-400 font-medium leading-tight max-w-[60px] truncate">
                      {mod.slug.split('-')[0]}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staff.map((member, idx) => {
              const stats = getStaffStats(member.id);
              return (
                <motion.tr
                  key={member.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="border-b border-gray-100 hover:bg-gray-50/50"
                >
                  <td className="sticky left-0 bg-white z-10 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#0F1D2C] flex items-center justify-center text-xs font-bold text-[#C9A96E]">
                        {member.avatarInitials}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{member.name}</p>
                        <p className="text-xs text-gray-400">{member.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex flex-col items-center">
                      <span className={`text-sm font-bold ${
                        stats.avgScore >= 80 ? 'text-emerald-600' : stats.avgScore >= 60 ? 'text-amber-600' : 'text-gray-400'
                      }`}>
                        {stats.avgScore > 0 ? `${stats.avgScore}%` : '--'}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {stats.completed}/{filteredModules.length}
                      </span>
                      {stats.alerts > 0 && (
                        <span className="text-[10px] text-red-500 font-medium">
                          {stats.alerts} alert{stats.alerts > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </td>
                  {filteredModules.map(mod => {
                    const prog = getProgress(member.id, mod.id);
                    return (
                      <td
                        key={mod.id}
                        className={`px-2 py-3 text-center ${getStatusBg(prog)}`}
                        title={`${member.name} - ${mod.title}: ${
                          prog?.completed
                            ? `Completed (${prog.quizScores.length > 0 ? Math.round(prog.quizScores.reduce((a, b) => a + b, 0) / prog.quizScores.length) : 0}%)`
                            : prog?.completedSections
                            ? `In progress (${prog.completedSections}/${prog.totalSections})`
                            : 'Not started'
                        }`}
                      >
                        {getStatusIcon(prog)}
                      </td>
                    );
                  })}
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
