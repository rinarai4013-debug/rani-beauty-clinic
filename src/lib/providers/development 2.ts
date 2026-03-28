/**
 * Provider Professional Development Engine
 *
 * CE credit tracking, training modules, skill certification matrix,
 * mentorship pairing, training budget tracking, career path visualization,
 * performance review cycles, and 360 feedback collection.
 */

import type {
  CECredit,
  CECreditSummary,
  TrainingModule,
  TrainingProgress,
  SkillCertification,
  MentorshipPairing,
  CareerPath,
  CareerLevel,
  CareerRequirement,
  PerformanceReview,
  FeedbackEntry,
  TrainingBudget,
} from '@/types/providers';

// ── CE CREDIT REQUIREMENTS ──

// Washington State requirements for estheticians/nurse injectors
export const CE_REQUIREMENTS: Record<string, { credits: number; cycleLengthYears: number }> = {
  esthetician: { credits: 20, cycleLengthYears: 2 },
  nurse_injector: { credits: 30, cycleLengthYears: 2 },
  nurse_practitioner: { credits: 45, cycleLengthYears: 3 },
  medical_director: { credits: 50, cycleLengthYears: 2 },
};

// ── TRAINING MODULES ──

export const TRAINING_MODULES: TrainingModule[] = [
  {
    id: 'botox-basic', title: 'Botox Injection Fundamentals', description: 'Core injection technique, anatomy, dosing protocols',
    category: 'Injectable', estimatedHours: 8, requiredFor: ['Botox'], prerequisites: [],
  },
  {
    id: 'filler-basic', title: 'Dermal Filler Fundamentals', description: 'Filler types, injection planes, volume assessment',
    category: 'Injectable', estimatedHours: 12, requiredFor: ['Fillers'], prerequisites: ['botox-basic'],
  },
  {
    id: 'sofwave-cert', title: 'Sofwave Certification', description: 'Sofwave SUPERB device training and protocols',
    category: 'Device', estimatedHours: 6, requiredFor: ['Sofwave'], prerequisites: [],
  },
  {
    id: 'hydrafacial-cert', title: 'HydraFacial Certification', description: 'HydraFacial device operation and treatment protocols',
    category: 'Facial', estimatedHours: 4, requiredFor: ['HydraFacial'], prerequisites: [],
  },
  {
    id: 'laser-safety', title: 'Laser Safety Officer Training', description: 'Laser physics, safety protocols, protective equipment',
    category: 'Laser', estimatedHours: 8, requiredFor: ['PicoWay', 'Laser Hair Removal'], prerequisites: [],
  },
  {
    id: 'picoway-cert', title: 'PicoWay Certification', description: 'PicoWay laser operation, settings, pigment protocols',
    category: 'Laser', estimatedHours: 6, requiredFor: ['PicoWay'], prerequisites: ['laser-safety'],
  },
  {
    id: 'rf-micro-cert', title: 'RF Microneedling Certification', description: 'Radiofrequency microneedling technique and protocols',
    category: 'Device', estimatedHours: 6, requiredFor: ['RF Microneedling'], prerequisites: [],
  },
  {
    id: 'chemical-peels', title: 'Chemical Peel Mastery', description: 'Peel types, skin assessment, post-treatment management',
    category: 'Facial', estimatedHours: 6, requiredFor: ['VI Peel', 'PRX-T33'], prerequisites: [],
  },
  {
    id: 'wellness-injections', title: 'Wellness Injection Protocols', description: 'IM injection technique for vitamin and wellness formulas',
    category: 'Wellness', estimatedHours: 4, requiredFor: ['Wellness Injections'], prerequisites: [],
  },
  {
    id: 'glp1-training', title: 'GLP-1 Weight Management', description: 'GLP-1 agonist protocols, patient selection, monitoring',
    category: 'Wellness', estimatedHours: 8, requiredFor: ['GLP-1 Weight Loss'], prerequisites: ['wellness-injections'],
  },
  {
    id: 'client-consult', title: 'Aesthetic Consultation Excellence', description: 'Consultation techniques, treatment planning, patient communication',
    category: 'Clinical', estimatedHours: 4, requiredFor: [], prerequisites: [],
  },
  {
    id: 'hipaa-annual', title: 'Annual HIPAA Compliance', description: 'Patient privacy, data handling, breach protocols',
    category: 'Compliance', estimatedHours: 2, requiredFor: [], prerequisites: [],
  },
  {
    id: 'bls-cert', title: 'BLS Certification', description: 'Basic Life Support certification and renewal',
    category: 'Safety', estimatedHours: 4, requiredFor: [], prerequisites: [],
  },
  {
    id: 'adverse-events', title: 'Managing Adverse Events', description: 'Recognizing and managing treatment complications',
    category: 'Safety', estimatedHours: 4, requiredFor: [], prerequisites: [],
  },
];

// ── CAREER LEVELS ──

export const CAREER_LEVEL_ORDER: CareerLevel[] = ['associate', 'provider', 'senior', 'lead', 'director'];

export const CAREER_REQUIREMENTS: Record<CareerLevel, CareerRequirement[]> = {
  associate: [],
  provider: [
    { category: 'Tenure', description: 'Minimum 6 months at clinic', targetValue: 6, currentValue: 0, met: false },
    { category: 'Training', description: 'Complete 3+ core certifications', targetValue: 3, currentValue: 0, met: false },
    { category: 'Performance', description: 'Maintain 70%+ rebook rate for 3 months', targetValue: 70, currentValue: 0, met: false },
    { category: 'Quality', description: 'Average review rating 4.5+', targetValue: 4.5, currentValue: 0, met: false },
  ],
  senior: [
    { category: 'Tenure', description: 'Minimum 18 months as provider', targetValue: 18, currentValue: 0, met: false },
    { category: 'Revenue', description: 'Consistently generate $30K+/month', targetValue: 30000, currentValue: 0, met: false },
    { category: 'Training', description: 'Complete 6+ certifications', targetValue: 6, currentValue: 0, met: false },
    { category: 'Performance', description: 'Maintain 80%+ rebook rate for 6 months', targetValue: 80, currentValue: 0, met: false },
    { category: 'Quality', description: 'Average review rating 4.7+', targetValue: 4.7, currentValue: 0, met: false },
    { category: 'Mentorship', description: 'Mentor 1+ associate provider', targetValue: 1, currentValue: 0, met: false },
  ],
  lead: [
    { category: 'Tenure', description: 'Minimum 12 months as senior', targetValue: 12, currentValue: 0, met: false },
    { category: 'Revenue', description: 'Consistently generate $50K+/month', targetValue: 50000, currentValue: 0, met: false },
    { category: 'Training', description: 'Complete 10+ certifications', targetValue: 10, currentValue: 0, met: false },
    { category: 'Leadership', description: 'Lead 2+ successful mentorships', targetValue: 2, currentValue: 0, met: false },
    { category: 'Quality', description: 'Average review rating 4.8+', targetValue: 4.8, currentValue: 0, met: false },
    { category: 'Innovation', description: 'Introduce 1+ new service or protocol', targetValue: 1, currentValue: 0, met: false },
  ],
  director: [
    { category: 'Tenure', description: 'Minimum 24 months as lead', targetValue: 24, currentValue: 0, met: false },
    { category: 'Revenue', description: 'Team generates $100K+/month', targetValue: 100000, currentValue: 0, met: false },
    { category: 'Leadership', description: 'Manage 3+ providers', targetValue: 3, currentValue: 0, met: false },
    { category: 'Business', description: 'Complete business management training', targetValue: 1, currentValue: 0, met: false },
  ],
};

// ── CE CREDIT TRACKING ──

export function calculateCECreditSummary(
  providerId: string,
  credits: CECredit[],
  requiredCredits: number,
  renewalDeadline: string,
): CECreditSummary {
  const providerCredits = credits.filter(c => c.providerId === providerId);
  const completedCredits = providerCredits
    .filter(c => c.status === 'completed')
    .reduce((sum, c) => sum + c.credits, 0);
  const pendingCredits = providerCredits
    .filter(c => c.status === 'in_progress' || c.status === 'planned')
    .reduce((sum, c) => sum + c.credits, 0);

  const deadline = new Date(renewalDeadline);
  const now = new Date();
  const monthsRemaining = (deadline.getTime() - now.getTime()) / (30 * 86400000);
  const creditsNeeded = requiredCredits - completedCredits;

  // On track if completed + pending >= required, or if pace is sufficient
  const onTrack = completedCredits >= requiredCredits ||
    (completedCredits + pendingCredits >= requiredCredits) ||
    (monthsRemaining > 6 && creditsNeeded <= monthsRemaining * 3);

  return {
    providerId,
    requiredCredits,
    completedCredits,
    pendingCredits,
    renewalDeadline,
    onTrack,
    credits: providerCredits,
  };
}

// ── TRAINING PROGRESS ──

export function getTrainingStatus(
  providerId: string,
  progress: TrainingProgress[],
  modules: TrainingModule[] = TRAINING_MODULES,
): {
  completed: TrainingModule[];
  inProgress: TrainingModule[];
  available: TrainingModule[];
  completionRate: number;
} {
  const providerProgress = progress.filter(p => p.providerId === providerId);
  const progressMap = new Map(providerProgress.map(p => [p.moduleId, p]));
  const completedIds = new Set(
    providerProgress.filter(p => p.status === 'completed').map(p => p.moduleId),
  );

  const completed: TrainingModule[] = [];
  const inProgress: TrainingModule[] = [];
  const available: TrainingModule[] = [];

  for (const mod of modules) {
    const status = progressMap.get(mod.id);
    if (status?.status === 'completed') {
      completed.push(mod);
    } else if (status?.status === 'in_progress') {
      inProgress.push(mod);
    } else {
      // Check prerequisites
      const prereqsMet = mod.prerequisites.every(p => completedIds.has(p));
      if (prereqsMet) {
        available.push(mod);
      }
    }
  }

  const completionRate = modules.length > 0
    ? Math.round((completed.length / modules.length) * 1000) / 10
    : 0;

  return { completed, inProgress, available, completionRate };
}

// ── SKILL CERTIFICATION MATRIX ──

export function buildCertificationMatrix(
  certifications: SkillCertification[],
  services: string[],
  providerIds: string[],
): {
  matrix: Record<string, Record<string, SkillCertification | null>>;
  coverageGaps: { service: string; certifiedCount: number }[];
} {
  const matrix: Record<string, Record<string, SkillCertification | null>> = {};

  for (const providerId of providerIds) {
    matrix[providerId] = {};
    for (const service of services) {
      const cert = certifications.find(
        c => c.providerId === providerId && c.service === service && c.certified,
      );
      matrix[providerId][service] = cert ?? null;
    }
  }

  const coverageGaps = services.map(service => ({
    service,
    certifiedCount: providerIds.filter(
      pid => matrix[pid][service]?.certified,
    ).length,
  })).filter(g => g.certifiedCount < 1);

  return { matrix, coverageGaps };
}

// ── CAREER PATH ──

export function calculateCareerPath(
  providerId: string,
  currentLevel: CareerLevel,
  currentMetrics: Record<string, number>,
): CareerPath {
  const levelIndex = CAREER_LEVEL_ORDER.indexOf(currentLevel);
  const nextLevel = levelIndex < CAREER_LEVEL_ORDER.length - 1
    ? CAREER_LEVEL_ORDER[levelIndex + 1]
    : null;

  if (!nextLevel) {
    return {
      providerId,
      currentLevel,
      nextLevel: null,
      requirements: [],
      progressPercent: 100,
    };
  }

  const requirements = CAREER_REQUIREMENTS[nextLevel].map(req => {
    const metricKey = req.category.toLowerCase();
    const currentValue = currentMetrics[metricKey] ?? 0;
    return {
      ...req,
      currentValue,
      met: currentValue >= req.targetValue,
    };
  });

  const metCount = requirements.filter(r => r.met).length;
  const progressPercent = requirements.length > 0
    ? Math.round((metCount / requirements.length) * 100)
    : 0;

  // Estimate promotion timeline (months)
  const unmetRequirements = requirements.filter(r => !r.met);
  let maxMonthsNeeded = 0;
  for (const req of unmetRequirements) {
    if (req.category === 'Tenure') {
      maxMonthsNeeded = Math.max(maxMonthsNeeded, req.targetValue - req.currentValue);
    } else {
      // Rough estimate: 3 months per unmet requirement
      maxMonthsNeeded = Math.max(maxMonthsNeeded, 3);
    }
  }

  const estimatedPromotion = maxMonthsNeeded > 0
    ? new Date(Date.now() + maxMonthsNeeded * 30 * 86400000).toISOString().split('T')[0]
    : undefined;

  return {
    providerId,
    currentLevel,
    nextLevel,
    requirements,
    progressPercent,
    estimatedPromotion,
  };
}

// ── PERFORMANCE REVIEWS ──

export function getUpcomingReviews(
  reviews: PerformanceReview[],
  withinDays: number = 30,
): PerformanceReview[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + withinDays);
  const now = new Date();

  return reviews
    .filter(r => r.status === 'scheduled' && new Date(r.scheduledDate) <= cutoff && new Date(r.scheduledDate) >= now)
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
}

export function calculateReviewScore(review: PerformanceReview): number {
  if (!review.categories || review.categories.length === 0) return 0;
  const avg = review.categories.reduce((sum, c) => sum + c.rating, 0) / review.categories.length;
  return Math.round(avg * 100) / 100;
}

// ── 360 FEEDBACK ──

export function aggregate360Feedback(
  feedback: FeedbackEntry[],
  providerId: string,
): {
  overallRating: number;
  byType: Record<string, { avgRating: number; count: number }>;
  topStrengths: string[];
  topImprovements: string[];
  feedbackCount: number;
} {
  const providerFeedback = feedback.filter(f => f.providerId === providerId);

  if (providerFeedback.length === 0) {
    return { overallRating: 0, byType: {}, topStrengths: [], topImprovements: [], feedbackCount: 0 };
  }

  const overallRating = Math.round(
    (providerFeedback.reduce((sum, f) => sum + f.rating, 0) / providerFeedback.length) * 100,
  ) / 100;

  // By type
  const typeGroups = new Map<string, number[]>();
  for (const f of providerFeedback) {
    const group = typeGroups.get(f.type) || [];
    group.push(f.rating);
    typeGroups.set(f.type, group);
  }

  const byType: Record<string, { avgRating: number; count: number }> = {};
  for (const [type, ratings] of typeGroups) {
    byType[type] = {
      avgRating: Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100) / 100,
      count: ratings.length,
    };
  }

  // Aggregate strengths and improvements
  const strengthCounts = new Map<string, number>();
  const improvementCounts = new Map<string, number>();

  for (const f of providerFeedback) {
    for (const s of f.strengths) {
      strengthCounts.set(s, (strengthCounts.get(s) || 0) + 1);
    }
    for (const i of f.improvements) {
      improvementCounts.set(i, (improvementCounts.get(i) || 0) + 1);
    }
  }

  const topStrengths = Array.from(strengthCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([s]) => s);

  const topImprovements = Array.from(improvementCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([s]) => s);

  return {
    overallRating,
    byType,
    topStrengths,
    topImprovements,
    feedbackCount: providerFeedback.length,
  };
}

// ── MENTORSHIP ──

export function suggestMentorPairings(
  providers: { id: string; level: CareerLevel; specialties: string[]; certifications: string[] }[],
  existingPairings: MentorshipPairing[],
): { mentorId: string; menteeId: string; reason: string }[] {
  const suggestions: { mentorId: string; menteeId: string; reason: string }[] = [];
  const activePairings = existingPairings.filter(p => p.status === 'active');

  const seniors = providers.filter(p => ['senior', 'lead', 'director'].includes(p.level));
  const juniors = providers.filter(p => ['associate', 'provider'].includes(p.level));

  for (const junior of juniors) {
    // Skip if already paired
    if (activePairings.some(p => p.menteeId === junior.id)) continue;

    for (const senior of seniors) {
      // Skip if already mentoring 2+
      const mentorCount = activePairings.filter(p => p.mentorId === senior.id).length;
      if (mentorCount >= 2) continue;

      // Match on overlapping specialties
      const overlap = senior.specialties.filter(s => junior.specialties.includes(s));
      if (overlap.length > 0) {
        suggestions.push({
          mentorId: senior.id,
          menteeId: junior.id,
          reason: `Shared specialties: ${overlap.join(', ')}`,
        });
        break;
      }

      // Match on certifications the junior needs
      const neededCerts = senior.certifications.filter(c => !junior.certifications.includes(c));
      if (neededCerts.length > 0) {
        suggestions.push({
          mentorId: senior.id,
          menteeId: junior.id,
          reason: `Can help with: ${neededCerts.slice(0, 3).join(', ')}`,
        });
        break;
      }
    }
  }

  return suggestions;
}

// ── TRAINING BUDGET ──

export function calculateTrainingBudget(budget: TrainingBudget): {
  utilizationRate: number;
  remainingBudget: number;
  overBudget: boolean;
  projectedYearEnd: number;
} {
  const utilized = budget.spent + budget.committed;
  const utilizationRate = budget.annualBudget > 0
    ? Math.round((utilized / budget.annualBudget) * 1000) / 10
    : 0;

  const now = new Date();
  const monthsElapsed = now.getMonth() + 1;
  const monthlyRunRate = monthsElapsed > 0 ? budget.spent / monthsElapsed : 0;
  const projectedYearEnd = Math.round(monthlyRunRate * 12 * 100) / 100;

  return {
    utilizationRate,
    remainingBudget: budget.available,
    overBudget: utilized > budget.annualBudget,
    projectedYearEnd,
  };
}
