import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { TRAINING_MODULES, ROLE_LABELS } from '@/data/training/modules';

// Mock staff data - in production, this comes from Airtable/Mangomint
const MOCK_STAFF = [
  { id: 'rina', name: 'Rina', role: 'CEO', avatarInitials: 'RI' },
  { id: 'mom', name: 'Mom (Provider)', role: 'Provider', avatarInitials: 'MP' },
  { id: 'jessica', name: 'Jessica', role: 'Front Desk', avatarInitials: 'JT' },
  { id: 'sarah', name: 'Sarah', role: 'Front Desk', avatarInitials: 'SK' },
  { id: 'maria', name: 'Maria', role: 'Marketing', avatarInitials: 'MA' },
];

// Mock progress data - in production, this comes from Airtable
function generateMockProgress() {
  const progress: Array<{
    moduleId: string;
    staffId: string;
    completedSections: number;
    totalSections: number;
    quizScores: number[];
    completed: boolean;
    completedAt?: string;
  }> = [];

  for (const staff of MOCK_STAFF) {
    for (const mod of TRAINING_MODULES) {
      // Randomize progress for demo
      const rand = Math.random();
      const totalSections = mod.sections.length;

      if (rand > 0.6) {
        // Completed
        const scores = mod.sections.map(() => Math.floor(Math.random() * 30) + 70);
        progress.push({
          moduleId: mod.id,
          staffId: staff.id,
          completedSections: totalSections,
          totalSections,
          quizScores: scores,
          completed: true,
          completedAt: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString(),
        });
      } else if (rand > 0.3) {
        // In progress
        const completed = Math.floor(Math.random() * totalSections);
        const scores = Array.from({ length: completed }, () => Math.floor(Math.random() * 30) + 70);
        progress.push({
          moduleId: mod.id,
          staffId: staff.id,
          completedSections: completed,
          totalSections,
          quizScores: scores,
          completed: false,
        });
      }
      // else: not started (no record)
    }
  }

  return progress;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get('staffId');

    const allProgress = generateMockProgress();
    const staff = MOCK_STAFF;

    // If staffId specified, filter to that staff member
    const filteredProgress = staffId
      ? allProgress.filter(p => p.staffId === staffId)
      : allProgress;

    // Compute aggregate stats
    const totalModules = TRAINING_MODULES.length;
    const staffStats = staff.map(s => {
      const memberProgress = allProgress.filter(p => p.staffId === s.id);
      const completedModules = memberProgress.filter(p => p.completed).length;
      const inProgressModules = memberProgress.filter(p => !p.completed && p.completedSections > 0).length;
      const allScores = memberProgress.flatMap(p => p.quizScores);
      const avgScore = allScores.length > 0
        ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
        : 0;
      const lowScoreModules = memberProgress.filter(p => {
        if (!p.completed || p.quizScores.length === 0) return false;
        const avg = p.quizScores.reduce((a, b) => a + b, 0) / p.quizScores.length;
        return avg < 80;
      });

      return {
        ...s,
        completedModules,
        inProgressModules,
        notStarted: totalModules - completedModules - inProgressModules,
        avgScore,
        completionRate: Math.round((completedModules / totalModules) * 100),
        alerts: lowScoreModules.map(p => ({
          moduleId: p.moduleId,
          moduleTitle: TRAINING_MODULES.find(m => m.id === p.moduleId)?.title || '',
          avgScore: Math.round(p.quizScores.reduce((a, b) => a + b, 0) / p.quizScores.length),
        })),
      };
    });

    // Team-wide stats
    const teamCompleted = staffStats.reduce((acc, s) => acc + s.completedModules, 0);
    const teamTotal = staff.length * totalModules;
    const teamAvgScore = staffStats.filter(s => s.avgScore > 0).length > 0
      ? Math.round(staffStats.filter(s => s.avgScore > 0).reduce((acc, s) => acc + s.avgScore, 0) / staffStats.filter(s => s.avgScore > 0).length)
      : 0;
    const alertCount = staffStats.reduce((acc, s) => acc + s.alerts.length, 0);

    // Overdue detection (modules not started for "all-staff" category)
    const overdue = staff.flatMap(s => {
      const allStaffModules = TRAINING_MODULES.filter(m => m.role === 'all-staff');
      return allStaffModules
        .filter(m => !allProgress.some(p => p.staffId === s.id && p.moduleId === m.id))
        .map(m => ({
          staffId: s.id,
          staffName: s.name,
          moduleId: m.id,
          moduleTitle: m.title,
        }));
    });

    return NextResponse.json({
      staff,
      progress: filteredProgress,
      staffStats,
      teamStats: {
        totalStaff: staff.length,
        totalModules,
        completedAssignments: teamCompleted,
        totalAssignments: teamTotal,
        completionRate: Math.round((teamCompleted / teamTotal) * 100),
        avgScore: teamAvgScore,
        alertCount,
      },
      overdue,
    });
  } catch (error) {
    console.error('Training progress API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
