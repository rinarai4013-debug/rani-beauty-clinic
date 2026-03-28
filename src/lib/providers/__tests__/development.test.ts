// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  calculateCECreditSummary,
  getTrainingStatus,
  buildCertificationMatrix,
  calculateCareerPath,
  getUpcomingReviews,
  calculateReviewScore,
  aggregate360Feedback,
  suggestMentorPairings,
  calculateTrainingBudget,
  CE_REQUIREMENTS,
  TRAINING_MODULES,
  CAREER_LEVEL_ORDER,
  CAREER_REQUIREMENTS,
} from '../development';
import type { CECredit, TrainingProgress, SkillCertification, PerformanceReview, FeedbackEntry, MentorshipPairing, TrainingBudget } from '@/types/providers';

// ── CE CREDITS ──

describe('calculateCECreditSummary', () => {
  const credits: CECredit[] = [
    { id: 'ce-1', providerId: 'rina', title: 'Course A', provider: 'AMAA', credits: 8, completedDate: '2026-01-15', status: 'completed', category: 'Injectable' },
    { id: 'ce-2', providerId: 'rina', title: 'Course B', provider: 'ASLMS', credits: 4, completedDate: '2026-02-10', status: 'completed', category: 'Laser' },
    { id: 'ce-3', providerId: 'rina', title: 'Course C', provider: 'AmSpa', credits: 6, status: 'in_progress', category: 'Business' },
    { id: 'ce-4', providerId: 'mom', title: 'Course D', provider: 'NCEA', credits: 4, status: 'completed', category: 'Facial', completedDate: '2026-01-01' },
  ];

  it('calculates completed credits', () => {
    const result = calculateCECreditSummary('rina', credits, 20, '2027-06-30');
    expect(result.completedCredits).toBe(12);
  });

  it('calculates pending credits', () => {
    const result = calculateCECreditSummary('rina', credits, 20, '2027-06-30');
    expect(result.pendingCredits).toBe(6);
  });

  it('determines on-track status', () => {
    const result = calculateCECreditSummary('rina', credits, 20, '2027-06-30');
    expect(result.onTrack).toBe(true); // 12 completed + 6 pending = 18, close to 20
  });

  it('flags behind schedule', () => {
    const result = calculateCECreditSummary('rina', [credits[0]], 20, '2026-04-01'); // deadline very soon
    expect(result.onTrack).toBe(false);
  });

  it('filters by provider', () => {
    const result = calculateCECreditSummary('mom', credits, 20, '2027-06-30');
    expect(result.credits.length).toBe(1);
  });

  it('includes all provider credits', () => {
    const result = calculateCECreditSummary('rina', credits, 20, '2027-06-30');
    expect(result.credits.length).toBe(3);
  });
});

// ── TRAINING STATUS ──

describe('getTrainingStatus', () => {
  const progress: TrainingProgress[] = [
    { moduleId: 'botox-basic', providerId: 'rina', status: 'completed', completedAt: '2025-06-01', score: 95 },
    { moduleId: 'filler-basic', providerId: 'rina', status: 'completed', completedAt: '2025-08-01', score: 92 },
    { moduleId: 'glp1-training', providerId: 'rina', status: 'in_progress', startedAt: '2026-03-01' },
  ];

  it('categorizes completed modules', () => {
    const result = getTrainingStatus('rina', progress);
    expect(result.completed.length).toBe(2);
  });

  it('categorizes in-progress modules', () => {
    const result = getTrainingStatus('rina', progress);
    expect(result.inProgress.length).toBe(1);
  });

  it('lists available modules with met prerequisites', () => {
    const result = getTrainingStatus('rina', progress);
    expect(result.available.length).toBeGreaterThan(0);
  });

  it('calculates completion rate', () => {
    const result = getTrainingStatus('rina', progress);
    expect(result.completionRate).toBeGreaterThan(0);
    expect(result.completionRate).toBeLessThanOrEqual(100);
  });

  it('handles empty progress', () => {
    const result = getTrainingStatus('rina', []);
    expect(result.completed.length).toBe(0);
    expect(result.completionRate).toBe(0);
  });

  it('respects prerequisites', () => {
    // filler-basic requires botox-basic
    const minProgress: TrainingProgress[] = [];
    const result = getTrainingStatus('rina', minProgress);
    const fillerAvailable = result.available.find(m => m.id === 'filler-basic');
    expect(fillerAvailable).toBeUndefined(); // botox-basic not completed
  });

  it('unlocks modules when prereqs completed', () => {
    const withPrereq: TrainingProgress[] = [
      { moduleId: 'botox-basic', providerId: 'rina', status: 'completed' },
    ];
    const result = getTrainingStatus('rina', withPrereq);
    const fillerAvailable = result.available.find(m => m.id === 'filler-basic');
    expect(fillerAvailable).toBeDefined();
  });
});

// ── CERTIFICATION MATRIX ──

describe('buildCertificationMatrix', () => {
  const certs: SkillCertification[] = [
    { providerId: 'rina', service: 'Botox', certified: true, level: 'expert', certifiedDate: '2025-06-01' },
    { providerId: 'mom', service: 'HydraFacial', certified: true, level: 'expert', certifiedDate: '2025-06-01' },
  ];

  it('builds matrix for all providers and services', () => {
    const { matrix } = buildCertificationMatrix(certs, ['Botox', 'HydraFacial'], ['rina', 'mom']);
    expect(matrix['rina']['Botox']?.certified).toBe(true);
    expect(matrix['rina']['HydraFacial']).toBeNull();
    expect(matrix['mom']['HydraFacial']?.certified).toBe(true);
  });

  it('identifies coverage gaps', () => {
    const { coverageGaps } = buildCertificationMatrix(certs, ['Botox', 'HydraFacial', 'Sofwave'], ['rina', 'mom']);
    expect(coverageGaps.some(g => g.service === 'Sofwave')).toBe(true);
  });

  it('handles empty certifications', () => {
    const { matrix, coverageGaps } = buildCertificationMatrix([], ['Botox'], ['rina']);
    expect(matrix['rina']['Botox']).toBeNull();
    expect(coverageGaps.length).toBe(1);
  });
});

// ── CAREER PATH ──

describe('calculateCareerPath', () => {
  it('calculates progress for next level', () => {
    const result = calculateCareerPath('rina', 'provider', { tenure: 12, training: 4, performance: 75, quality: 4.6 });
    expect(result.nextLevel).toBe('senior');
    expect(result.progressPercent).toBeGreaterThanOrEqual(0);
    expect(result.progressPercent).toBeLessThanOrEqual(100);
  });

  it('returns null nextLevel for director', () => {
    const result = calculateCareerPath('rina', 'director', {});
    expect(result.nextLevel).toBeNull();
    expect(result.progressPercent).toBe(100);
  });

  it('marks met requirements', () => {
    const result = calculateCareerPath('rina', 'associate', { tenure: 12, training: 5, performance: 80, quality: 4.8 });
    expect(result.requirements.some(r => r.met)).toBe(true);
  });

  it('estimates promotion date', () => {
    const result = calculateCareerPath('rina', 'associate', { tenure: 2 });
    if (result.estimatedPromotion) {
      expect(new Date(result.estimatedPromotion).getTime()).toBeGreaterThan(Date.now());
    }
  });

  it('handles all career levels', () => {
    CAREER_LEVEL_ORDER.forEach(level => {
      const result = calculateCareerPath('test', level, {});
      expect(result.currentLevel).toBe(level);
    });
  });
});

// ── PERFORMANCE REVIEWS ──

describe('getUpcomingReviews', () => {
  it('returns reviews within specified days', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15);
    const reviews: PerformanceReview[] = [{
      id: 'r1', providerId: 'rina', reviewerId: 'admin', period: 'Q1 2026',
      scheduledDate: futureDate.toISOString().split('T')[0], status: 'scheduled',
      categories: [], goals: [], developmentPlan: [],
    }];
    const result = getUpcomingReviews(reviews);
    expect(result.length).toBe(1);
  });

  it('excludes completed reviews', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15);
    const reviews: PerformanceReview[] = [{
      id: 'r1', providerId: 'rina', reviewerId: 'admin', period: 'Q1',
      scheduledDate: futureDate.toISOString().split('T')[0], status: 'completed',
      completedDate: '2026-03-15', overallRating: 4.5,
      categories: [], goals: [], developmentPlan: [],
    }];
    expect(getUpcomingReviews(reviews).length).toBe(0);
  });

  it('excludes past reviews', () => {
    const reviews: PerformanceReview[] = [{
      id: 'r1', providerId: 'rina', reviewerId: 'admin', period: 'Q1',
      scheduledDate: '2025-01-01', status: 'scheduled',
      categories: [], goals: [], developmentPlan: [],
    }];
    expect(getUpcomingReviews(reviews).length).toBe(0);
  });
});

describe('calculateReviewScore', () => {
  it('averages category ratings', () => {
    const review: PerformanceReview = {
      id: 'r1', providerId: 'rina', reviewerId: 'admin', period: 'Q1',
      scheduledDate: '2026-03-15', status: 'completed',
      categories: [
        { name: 'Technical', rating: 4.5, comments: '' },
        { name: 'Communication', rating: 5.0, comments: '' },
      ],
      goals: [], developmentPlan: [],
    };
    expect(calculateReviewScore(review)).toBe(4.75);
  });

  it('returns 0 for no categories', () => {
    const review: PerformanceReview = {
      id: 'r1', providerId: 'rina', reviewerId: 'admin', period: 'Q1',
      scheduledDate: '2026-03-15', status: 'completed',
      categories: [], goals: [], developmentPlan: [],
    };
    expect(calculateReviewScore(review)).toBe(0);
  });
});

// ── 360 FEEDBACK ──

describe('aggregate360Feedback', () => {
  const feedback: FeedbackEntry[] = [
    { id: 'f1', providerId: 'rina', fromId: 'mom', fromRole: 'provider', type: 'peer', rating: 4.5, strengths: ['Technical skill', 'Communication'], improvements: ['Time management'], comments: '', submittedAt: '2026-03-01', anonymous: false },
    { id: 'f2', providerId: 'rina', fromId: 'admin', fromRole: 'manager', type: 'manager', rating: 4.8, strengths: ['Technical skill', 'Leadership'], improvements: ['Delegation'], comments: '', submittedAt: '2026-03-02', anonymous: false },
    { id: 'f3', providerId: 'rina', fromId: 'rina', fromRole: 'self', type: 'self', rating: 4.2, strengths: ['Communication'], improvements: ['Time management'], comments: '', submittedAt: '2026-03-03', anonymous: false },
  ];

  it('calculates overall rating', () => {
    const result = aggregate360Feedback(feedback, 'rina');
    expect(result.overallRating).toBe(4.5); // (4.5 + 4.8 + 4.2) / 3
  });

  it('breaks down by type', () => {
    const result = aggregate360Feedback(feedback, 'rina');
    expect(result.byType['peer']).toBeDefined();
    expect(result.byType['manager']).toBeDefined();
    expect(result.byType['self']).toBeDefined();
  });

  it('identifies top strengths', () => {
    const result = aggregate360Feedback(feedback, 'rina');
    expect(result.topStrengths[0]).toBe('Technical skill'); // mentioned 2x
  });

  it('identifies top improvements', () => {
    const result = aggregate360Feedback(feedback, 'rina');
    expect(result.topImprovements[0]).toBe('Time management'); // mentioned 2x
  });

  it('counts feedback entries', () => {
    const result = aggregate360Feedback(feedback, 'rina');
    expect(result.feedbackCount).toBe(3);
  });

  it('handles no feedback', () => {
    const result = aggregate360Feedback([], 'rina');
    expect(result.overallRating).toBe(0);
    expect(result.feedbackCount).toBe(0);
  });

  it('filters by provider', () => {
    const result = aggregate360Feedback(feedback, 'mom');
    expect(result.feedbackCount).toBe(0);
  });
});

// ── MENTORSHIP ──

describe('suggestMentorPairings', () => {
  it('pairs seniors with juniors based on specialties', () => {
    const providers = [
      { id: 'rina', level: 'lead' as const, specialties: ['Injectable', 'Laser'], certifications: ['Botox', 'PicoWay'] },
      { id: 'new-hire', level: 'associate' as const, specialties: ['Injectable'], certifications: [] },
    ];
    const result = suggestMentorPairings(providers, []);
    expect(result.length).toBe(1);
    expect(result[0].mentorId).toBe('rina');
    expect(result[0].menteeId).toBe('new-hire');
  });

  it('skips already paired mentees', () => {
    const providers = [
      { id: 'rina', level: 'lead' as const, specialties: ['Injectable'], certifications: [] },
      { id: 'new-hire', level: 'associate' as const, specialties: ['Injectable'], certifications: [] },
    ];
    const existing: MentorshipPairing[] = [
      { id: 'm1', mentorId: 'rina', menteeId: 'new-hire', startDate: '2026-01-01', goals: [], status: 'active', notes: [] },
    ];
    const result = suggestMentorPairings(providers, existing);
    expect(result.length).toBe(0);
  });

  it('limits mentors to 2 mentees', () => {
    const providers = [
      { id: 'rina', level: 'senior' as const, specialties: ['Injectable'], certifications: [] },
      { id: 'a1', level: 'associate' as const, specialties: ['Injectable'], certifications: [] },
      { id: 'a2', level: 'associate' as const, specialties: ['Injectable'], certifications: [] },
      { id: 'a3', level: 'associate' as const, specialties: ['Injectable'], certifications: [] },
    ];
    const existing: MentorshipPairing[] = [
      { id: 'm1', mentorId: 'rina', menteeId: 'a1', startDate: '2026-01-01', goals: [], status: 'active', notes: [] },
      { id: 'm2', mentorId: 'rina', menteeId: 'a2', startDate: '2026-01-01', goals: [], status: 'active', notes: [] },
    ];
    const result = suggestMentorPairings(providers, existing);
    expect(result.length).toBe(0);
  });
});

// ── TRAINING BUDGET ──

describe('calculateTrainingBudget', () => {
  it('calculates utilization rate', () => {
    const budget: TrainingBudget = {
      providerId: 'rina', annualBudget: 5000, spent: 2000, committed: 500, available: 2500, items: [],
    };
    const result = calculateTrainingBudget(budget);
    expect(result.utilizationRate).toBe(50); // (2000 + 500) / 5000 * 100
  });

  it('detects over-budget', () => {
    const budget: TrainingBudget = {
      providerId: 'rina', annualBudget: 3000, spent: 2500, committed: 1000, available: -500, items: [],
    };
    const result = calculateTrainingBudget(budget);
    expect(result.overBudget).toBe(true);
  });

  it('projects year-end spend', () => {
    const budget: TrainingBudget = {
      providerId: 'rina', annualBudget: 5000, spent: 1000, committed: 0, available: 4000, items: [],
    };
    const result = calculateTrainingBudget(budget);
    expect(result.projectedYearEnd).toBeGreaterThan(0);
  });

  it('handles zero budget', () => {
    const budget: TrainingBudget = {
      providerId: 'rina', annualBudget: 0, spent: 0, committed: 0, available: 0, items: [],
    };
    const result = calculateTrainingBudget(budget);
    expect(result.utilizationRate).toBe(0);
    expect(result.overBudget).toBe(false);
  });
});

// ── CONSTANTS ──

describe('CE_REQUIREMENTS', () => {
  it('has requirements for standard roles', () => {
    expect(CE_REQUIREMENTS['esthetician']).toBeDefined();
    expect(CE_REQUIREMENTS['nurse_injector']).toBeDefined();
    expect(CE_REQUIREMENTS['nurse_practitioner']).toBeDefined();
  });

  it('each requirement has credits and cycle length', () => {
    Object.values(CE_REQUIREMENTS).forEach(req => {
      expect(req.credits).toBeGreaterThan(0);
      expect(req.cycleLengthYears).toBeGreaterThan(0);
    });
  });
});

describe('TRAINING_MODULES', () => {
  it('has at least 10 modules', () => {
    expect(TRAINING_MODULES.length).toBeGreaterThanOrEqual(10);
  });

  it('each module has required fields', () => {
    TRAINING_MODULES.forEach(m => {
      expect(m.id).toBeTruthy();
      expect(m.title).toBeTruthy();
      expect(m.category).toBeTruthy();
      expect(m.estimatedHours).toBeGreaterThan(0);
    });
  });

  it('covers multiple categories', () => {
    const categories = new Set(TRAINING_MODULES.map(m => m.category));
    expect(categories.size).toBeGreaterThanOrEqual(5);
  });

  it('has valid prerequisites (all reference existing modules)', () => {
    const ids = new Set(TRAINING_MODULES.map(m => m.id));
    TRAINING_MODULES.forEach(m => {
      m.prerequisites.forEach(p => {
        expect(ids.has(p)).toBe(true);
      });
    });
  });
});

describe('CAREER_LEVEL_ORDER', () => {
  it('has 5 levels', () => {
    expect(CAREER_LEVEL_ORDER.length).toBe(5);
  });

  it('starts with associate and ends with director', () => {
    expect(CAREER_LEVEL_ORDER[0]).toBe('associate');
    expect(CAREER_LEVEL_ORDER[4]).toBe('director');
  });
});

describe('CAREER_REQUIREMENTS', () => {
  it('has requirements for all non-associate levels', () => {
    expect(CAREER_REQUIREMENTS['provider'].length).toBeGreaterThan(0);
    expect(CAREER_REQUIREMENTS['senior'].length).toBeGreaterThan(0);
    expect(CAREER_REQUIREMENTS['lead'].length).toBeGreaterThan(0);
    expect(CAREER_REQUIREMENTS['director'].length).toBeGreaterThan(0);
  });

  it('associate has no requirements', () => {
    expect(CAREER_REQUIREMENTS['associate'].length).toBe(0);
  });

  it('higher levels have more requirements', () => {
    expect(CAREER_REQUIREMENTS['senior'].length).toBeGreaterThan(CAREER_REQUIREMENTS['provider'].length);
    expect(CAREER_REQUIREMENTS['lead'].length).toBeGreaterThanOrEqual(CAREER_REQUIREMENTS['senior'].length);
  });
});
