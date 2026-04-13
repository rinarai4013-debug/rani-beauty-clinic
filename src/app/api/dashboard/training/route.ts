import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { TRAINING_MODULES, ROLE_LABELS, ROLE_COLORS } from '@/data/training/modules';
import type { TrainingRole } from '@/data/training/modules';
import { withSentry } from '@/lib/sentry-utils';

const TRAINING_ROLES: TrainingRole[] = ['front-desk', 'provider', 'all-staff', 'management'];

export async function GET(req: NextRequest) {
  return withSentry('dashboard/training', async () => {
    try {
      const session = await getSession();
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

    const { searchParams } = new URL(req.url);
    const rawRole = searchParams.get('role');
    const roleFilter = rawRole?.trim() ? rawRole.trim().toLowerCase() : null;

    if (roleFilter && !TRAINING_ROLES.includes(roleFilter as TrainingRole)) {
      return NextResponse.json({ error: 'Invalid role parameter' }, { status: 400 });
    }

    // Filter modules by role if specified
    let modules = TRAINING_MODULES;
    if (roleFilter) {
      modules = modules.filter(m => m.role === roleFilter);
    }

    // Map to summary format (exclude full section content for list view)
    const moduleSummaries = modules.map(m => ({
      id: m.id,
      slug: m.slug,
      title: m.title,
      description: m.description,
      role: m.role,
      roleLabel: ROLE_LABELS[m.role],
      roleColor: ROLE_COLORS[m.role],
      duration: m.duration,
      sectionCount: m.sections.length,
      quizCount: m.sections.reduce((acc, s) => acc + s.quiz.length, 0),
      prerequisites: m.prerequisites,
    }));

    // Group by role
    const byRole = {
      'front-desk': moduleSummaries.filter(m => m.role === 'front-desk'),
      'provider': moduleSummaries.filter(m => m.role === 'provider'),
      'all-staff': moduleSummaries.filter(m => m.role === 'all-staff'),
      'management': moduleSummaries.filter(m => m.role === 'management'),
    };

    // Stats
    const stats = {
      totalModules: TRAINING_MODULES.length,
      totalSections: TRAINING_MODULES.reduce((acc, m) => acc + m.sections.length, 0),
      totalQuizQuestions: TRAINING_MODULES.reduce(
        (acc, m) => acc + m.sections.reduce((a, s) => a + s.quiz.length, 0),
        0
      ),
      totalDuration: TRAINING_MODULES.reduce((acc, m) => acc + m.duration, 0),
      byRole: {
        'front-desk': TRAINING_MODULES.filter(m => m.role === 'front-desk').length,
        'provider': TRAINING_MODULES.filter(m => m.role === 'provider').length,
        'all-staff': TRAINING_MODULES.filter(m => m.role === 'all-staff').length,
        'management': TRAINING_MODULES.filter(m => m.role === 'management').length,
      },
    };

      return NextResponse.json({
        modules: moduleSummaries,
        byRole,
        stats,
        roleLabels: ROLE_LABELS,
        roleColors: ROLE_COLORS,
      });
    } catch (error) {
      console.error('Training API error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
