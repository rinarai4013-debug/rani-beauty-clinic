import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { cache, TTL } from '@/lib/cache';
import {
  calculateCECreditSummary,
  getTrainingStatus,
  buildCertificationMatrix,
  calculateCareerPath,
  TRAINING_MODULES,
} from '@/lib/providers/development';
import type { CECredit, TrainingProgress, SkillCertification } from '@/types/providers';

const SAMPLE_CE_CREDITS: CECredit[] = [
  { id: 'ce-1', providerId: 'rina', title: 'Advanced Injectable Techniques', provider: 'AMAA', credits: 8, completedDate: '2026-01-15', status: 'completed', category: 'Injectable' },
  { id: 'ce-2', providerId: 'rina', title: 'Laser Safety Recertification', provider: 'ASLMS', credits: 4, completedDate: '2026-02-10', status: 'completed', category: 'Laser' },
  { id: 'ce-3', providerId: 'rina', title: 'Aesthetic Business Management', provider: 'AmSpa', credits: 6, status: 'in_progress', category: 'Business' },
  { id: 'ce-4', providerId: 'mom', title: 'Chemical Peel Mastery', provider: 'NCEA', credits: 4, completedDate: '2026-01-20', status: 'completed', category: 'Facial' },
  { id: 'ce-5', providerId: 'mom', title: 'Wellness Injection Protocols', provider: 'AANP', credits: 6, status: 'planned', category: 'Wellness' },
];

const SAMPLE_TRAINING: TrainingProgress[] = [
  { moduleId: 'botox-basic', providerId: 'rina', status: 'completed', completedAt: '2025-06-01', score: 95 },
  { moduleId: 'filler-basic', providerId: 'rina', status: 'completed', completedAt: '2025-08-01', score: 92 },
  { moduleId: 'sofwave-cert', providerId: 'rina', status: 'completed', completedAt: '2025-07-01', score: 98 },
  { moduleId: 'laser-safety', providerId: 'rina', status: 'completed', completedAt: '2025-05-01', score: 100 },
  { moduleId: 'picoway-cert', providerId: 'rina', status: 'completed', completedAt: '2025-09-01', score: 90 },
  { moduleId: 'rf-micro-cert', providerId: 'rina', status: 'completed', completedAt: '2025-10-01', score: 93 },
  { moduleId: 'glp1-training', providerId: 'rina', status: 'in_progress', startedAt: '2026-03-01' },
  { moduleId: 'hydrafacial-cert', providerId: 'mom', status: 'completed', completedAt: '2025-06-01', score: 96 },
  { moduleId: 'chemical-peels', providerId: 'mom', status: 'completed', completedAt: '2025-07-01', score: 94 },
  { moduleId: 'wellness-injections', providerId: 'mom', status: 'completed', completedAt: '2025-08-01', score: 91 },
  { moduleId: 'hipaa-annual', providerId: 'mom', status: 'completed', completedAt: '2026-01-15', score: 100 },
  { moduleId: 'client-consult', providerId: 'mom', status: 'in_progress', startedAt: '2026-03-10' },
];

const SAMPLE_CERTIFICATIONS: SkillCertification[] = [
  { providerId: 'rina', service: 'Botox', certified: true, level: 'expert', certifiedDate: '2025-06-01' },
  { providerId: 'rina', service: 'Fillers', certified: true, level: 'advanced', certifiedDate: '2025-08-01' },
  { providerId: 'rina', service: 'Sofwave', certified: true, level: 'expert', certifiedDate: '2025-07-01' },
  { providerId: 'rina', service: 'PicoWay', certified: true, level: 'proficient', certifiedDate: '2025-09-01' },
  { providerId: 'rina', service: 'RF Microneedling', certified: true, level: 'proficient', certifiedDate: '2025-10-01' },
  { providerId: 'rina', service: 'Laser Hair Removal', certified: true, level: 'advanced', certifiedDate: '2025-05-01' },
  { providerId: 'mom', service: 'HydraFacial', certified: true, level: 'expert', certifiedDate: '2025-06-01' },
  { providerId: 'mom', service: 'VI Peel', certified: true, level: 'advanced', certifiedDate: '2025-07-01' },
  { providerId: 'mom', service: 'PRX-T33', certified: true, level: 'proficient', certifiedDate: '2025-07-01' },
  { providerId: 'mom', service: 'Wellness Injections', certified: true, level: 'proficient', certifiedDate: '2025-08-01' },
];

const SERVICES = ['Botox', 'Fillers', 'Sofwave', 'HydraFacial', 'PicoWay', 'RF Microneedling', 'VI Peel', 'PRX-T33', 'Laser Hair Removal', 'Wellness Injections', 'GLP-1 Weight Loss'];

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.role, 'view_providers')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('id');
    const type = searchParams.get('type'); // 'ce-credits', 'career-path', 'training', 'certifications', 'budget'

    if (type === 'ce-credits' && providerId) {
      const summary = calculateCECreditSummary(providerId, SAMPLE_CE_CREDITS, 20, '2027-06-30');
      return NextResponse.json(summary);
    }

    if (type === 'career-path' && providerId) {
      const currentLevel = providerId === 'rina' ? 'lead' as const : 'provider' as const;
      const metrics = providerId === 'rina'
        ? { tenure: 36, revenue: 45000, training: 6, performance: 82, quality: 4.9, mentorship: 1 }
        : { tenure: 12, revenue: 18000, training: 4, performance: 72, quality: 4.7 };
      const path = calculateCareerPath(providerId, currentLevel, metrics);
      return NextResponse.json(path);
    }

    if (type === 'training' && providerId) {
      const status = getTrainingStatus(providerId, SAMPLE_TRAINING, TRAINING_MODULES);
      return NextResponse.json({
        completed: status.completed.map(m => ({ id: m.id, title: m.title })),
        inProgress: status.inProgress.map(m => ({ id: m.id, title: m.title })),
        available: status.available.map(m => ({ id: m.id, title: m.title })),
        completionRate: status.completionRate,
      });
    }

    if (type === 'certifications') {
      const { matrix, coverageGaps } = buildCertificationMatrix(SAMPLE_CERTIFICATIONS, SERVICES, ['rina', 'mom']);
      return NextResponse.json({ matrix, coverageGaps });
    }

    if (type === 'budget' && providerId) {
      const budget = {
        providerId,
        annualBudget: providerId === 'rina' ? 5000 : 3000,
        spent: providerId === 'rina' ? 2200 : 800,
        committed: providerId === 'rina' ? 600 : 400,
        available: providerId === 'rina' ? 2200 : 1800,
        items: [],
      };
      return NextResponse.json(budget);
    }

    return NextResponse.json({ error: 'Type and provider ID required' }, { status: 400 });
  } catch (err) {
    console.error('[Provider Development API]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
