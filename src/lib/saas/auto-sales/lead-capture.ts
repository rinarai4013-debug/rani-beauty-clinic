// =============================================================================
// RaniOS Lead Generation Engine
// Multi-step signup funnel, lead scoring, drip sequences, trial management
// =============================================================================

import type {
  Lead,
  LeadStatus,
  LeadSource,
  LeadScoreFactor,
  BusinessInfo,
  NeedsAssessment,
  DemoBooking,
  TrialInfo,
  DripSequenceStatus,
  DripEmail,
  ActivationMetric,
  UtmParams,
  SignupFunnelStep,
  FormField,
  ValidationRule,
  Vertical,
  TierSlug,
} from './types';

// =============================================================================
// Multi-Step Signup Funnel
// =============================================================================

export function getSignupFunnelSteps(): SignupFunnelStep[] {
  return [
    {
      step: 1,
      name: 'Email Capture',
      fields: [
        { name: 'email', label: 'Work Email', type: 'email', required: true, options: null, placeholder: 'you@yourclinic.com', helpText: null },
        { name: 'firstName', label: 'First Name', type: 'text', required: true, options: null, placeholder: 'Jane', helpText: null },
      ],
      validationRules: [
        { field: 'email', rule: 'required', value: null, message: 'Email is required' },
        { field: 'email', rule: 'email', value: null, message: 'Enter a valid email address' },
        { field: 'firstName', rule: 'required', value: null, message: 'First name is required' },
      ],
      skipCondition: null,
    },
    {
      step: 2,
      name: 'Business Info',
      fields: [
        { name: 'clinicName', label: 'Practice Name', type: 'text', required: true, options: null, placeholder: 'Radiance Medical Spa', helpText: null },
        { name: 'vertical', label: 'Practice Type', type: 'select', required: true, options: ['Medical Spa', 'Dental Practice', 'Dermatology', 'Wellness Center', 'Chiropractic', 'Plastic Surgery', 'Ophthalmology', 'Veterinary', 'Other'], placeholder: 'Select your specialty', helpText: null },
        { name: 'providerCount', label: 'Number of Providers', type: 'select', required: true, options: ['1 (Solo)', '2-3', '4-7', '8-15', '15+'], placeholder: 'Select', helpText: null },
        { name: 'revenue', label: 'Monthly Revenue', type: 'select', required: false, options: ['Under $30K', '$30K - $75K', '$75K - $150K', '$150K - $300K', '$300K+', 'Prefer not to say'], placeholder: 'Select range', helpText: 'This helps us customize your demo' },
      ],
      validationRules: [
        { field: 'clinicName', rule: 'required', value: null, message: 'Practice name is required' },
        { field: 'vertical', rule: 'required', value: null, message: 'Select your practice type' },
        { field: 'providerCount', rule: 'required', value: null, message: 'Select provider count' },
      ],
      skipCondition: null,
    },
    {
      step: 3,
      name: 'Needs Assessment',
      fields: [
        { name: 'topChallenges', label: 'Top Challenges', type: 'multi_select', required: true, options: ['Client retention', 'No-shows', 'Manual follow-ups', 'Marketing ROI', 'Staff efficiency', 'Revenue visibility', 'Review management', 'Scheduling gaps', 'Intake processing', 'Inventory management'], placeholder: 'Select up to 3', helpText: 'What are you most looking to solve?' },
        { name: 'currentSoftware', label: 'Current Software', type: 'select', required: false, options: ['Mangomint', 'Boulevard', 'Vagaro', 'MindBody', 'Zenoti', 'Jane App', 'None', 'Other'], placeholder: 'Select', helpText: null },
        { name: 'timeline', label: 'Decision Timeline', type: 'select', required: false, options: ['Ready now', 'Within 1 month', 'Within 3 months', '6+ months', 'Just exploring'], placeholder: 'Select', helpText: null },
      ],
      validationRules: [
        { field: 'topChallenges', rule: 'required', value: null, message: 'Select at least one challenge' },
      ],
      skipCondition: null,
    },
    {
      step: 4,
      name: 'Demo Booking',
      fields: [
        { name: 'phone', label: 'Phone Number', type: 'phone', required: false, options: null, placeholder: '(555) 123-4567', helpText: 'For scheduling confirmation only' },
        { name: 'demoType', label: 'How would you like to start?', type: 'select', required: true, options: ['Start free trial (explore on your own)', 'Book a live demo (30-min guided tour)', 'Watch a recorded demo first'], placeholder: 'Select', helpText: null },
        { name: 'notes', label: 'Anything specific you want to see?', type: 'textarea', required: false, options: null, placeholder: 'Tell us what matters most to your practice...', helpText: null },
      ],
      validationRules: [
        { field: 'demoType', rule: 'required', value: null, message: 'Select how you want to start' },
      ],
      skipCondition: null,
    },
  ];
}

// =============================================================================
// Lead Creation
// =============================================================================

export function createLead(
  email: string,
  firstName: string,
  source: LeadSource,
  utmParams?: UtmParams
): Lead {
  const now = new Date().toISOString();

  return {
    id: `lead-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    email: email.toLowerCase().trim(),
    firstName: firstName.trim(),
    lastName: '',
    phone: null,
    clinicName: '',
    vertical: 'medspa',
    status: 'email_captured',
    source,
    score: 10,
    scoreFactors: [],
    businessInfo: null,
    needsAssessment: null,
    demoBooking: null,
    trial: null,
    dripSequence: {
      sequenceId: `drip-${Date.now()}`,
      currentStep: 0,
      totalSteps: 7,
      lastSentAt: null,
      nextSendAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      emailsSent: 0,
      emailsOpened: 0,
      emailsClicked: 0,
      isComplete: false,
      isPaused: false,
    },
    activationTracking: getDefaultActivationMetrics(),
    assignedTo: null,
    tags: [],
    notes: [],
    utmParams: utmParams || null,
    createdAt: now,
    updatedAt: now,
    lastActivityAt: now,
  };
}

export function updateLeadBusinessInfo(lead: Lead, info: BusinessInfo): Lead {
  return {
    ...lead,
    clinicName: info.revenue ? lead.clinicName : lead.clinicName,
    businessInfo: info,
    status: 'info_submitted',
    score: calculateLeadScore({ ...lead, businessInfo: info }).totalScore,
    scoreFactors: calculateLeadScore({ ...lead, businessInfo: info }).factors,
    updatedAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
  };
}

export function updateLeadNeedsAssessment(lead: Lead, assessment: NeedsAssessment): Lead {
  return {
    ...lead,
    needsAssessment: assessment,
    status: 'needs_assessed',
    score: calculateLeadScore({ ...lead, needsAssessment: assessment }).totalScore,
    scoreFactors: calculateLeadScore({ ...lead, needsAssessment: assessment }).factors,
    updatedAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
  };
}

export function scheduleDemo(lead: Lead, booking: DemoBooking): Lead {
  return {
    ...lead,
    demoBooking: booking,
    status: 'demo_scheduled',
    updatedAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
  };
}

// =============================================================================
// Lead Scoring Model
// =============================================================================

function calculateLeadScore(lead: Lead): { totalScore: number; factors: LeadScoreFactor[] } {
  const factors: LeadScoreFactor[] = [];

  // Factor 1: Business size (25 points max)
  let sizeScore = 5;
  if (lead.businessInfo) {
    const providers = lead.businessInfo.providerCount;
    if (providers >= 8) sizeScore = 25;
    else if (providers >= 4) sizeScore = 20;
    else if (providers >= 2) sizeScore = 15;
    else sizeScore = 10;
  }
  factors.push({
    factor: 'Business Size',
    weight: 0.25,
    score: sizeScore,
    maxScore: 25,
    detail: lead.businessInfo ? `${lead.businessInfo.providerCount} providers` : 'Unknown',
  });

  // Factor 2: Revenue (20 points max)
  let revenueScore = 5;
  if (lead.businessInfo?.revenue) {
    const rev = lead.businessInfo.revenue.toLowerCase();
    if (rev.includes('300k+') || rev.includes('$300')) revenueScore = 20;
    else if (rev.includes('150k') || rev.includes('$150')) revenueScore = 18;
    else if (rev.includes('75k') || rev.includes('$75')) revenueScore = 15;
    else if (rev.includes('30k') || rev.includes('$30')) revenueScore = 10;
    else revenueScore = 5;
  }
  factors.push({
    factor: 'Revenue',
    weight: 0.20,
    score: revenueScore,
    maxScore: 20,
    detail: lead.businessInfo?.revenue || 'Unknown',
  });

  // Factor 3: Tech stack / current software (15 points max)
  let techScore = 5;
  if (lead.businessInfo?.currentSoftware) {
    const sw = lead.businessInfo.currentSoftware.toLowerCase();
    if (sw === 'none') techScore = 15; // Greenfield opportunity
    else if (['mangomint', 'boulevard', 'zenoti'].includes(sw)) techScore = 12; // Tech-savvy
    else if (['vagaro', 'mindbody'].includes(sw)) techScore = 10;
    else techScore = 8;
  }
  factors.push({
    factor: 'Tech Stack',
    weight: 0.15,
    score: techScore,
    maxScore: 15,
    detail: lead.businessInfo?.currentSoftware || 'Unknown',
  });

  // Factor 4: Urgency / timeline (20 points max)
  let urgencyScore = 5;
  if (lead.needsAssessment?.timeline) {
    const timeline = lead.needsAssessment.timeline;
    if (timeline === 'immediate') urgencyScore = 20;
    else if (timeline === '1_month') urgencyScore = 16;
    else if (timeline === '3_months') urgencyScore = 12;
    else if (timeline === '6_months') urgencyScore = 8;
    else urgencyScore = 4;
  }
  factors.push({
    factor: 'Urgency',
    weight: 0.20,
    score: urgencyScore,
    maxScore: 20,
    detail: lead.needsAssessment?.timeline || 'Unknown',
  });

  // Factor 5: Budget / decision maker (10 points max)
  let budgetScore = 5;
  if (lead.needsAssessment) {
    if (lead.needsAssessment.decisionMaker) budgetScore += 3;
    if (lead.needsAssessment.budget && !lead.needsAssessment.budget.toLowerCase().includes('none')) budgetScore += 2;
  }
  factors.push({
    factor: 'Budget Authority',
    weight: 0.10,
    score: Math.min(budgetScore, 10),
    maxScore: 10,
    detail: lead.needsAssessment?.decisionMaker ? 'Decision maker' : 'Unknown',
  });

  // Factor 6: Engagement (10 points max)
  let engagementScore = 0;
  if (lead.dripSequence.emailsOpened > 0) engagementScore += 3;
  if (lead.dripSequence.emailsClicked > 0) engagementScore += 4;
  if (lead.demoBooking) engagementScore += 3;
  factors.push({
    factor: 'Engagement',
    weight: 0.10,
    score: Math.min(engagementScore, 10),
    maxScore: 10,
    detail: `${lead.dripSequence.emailsOpened} opens, ${lead.dripSequence.emailsClicked} clicks`,
  });

  const totalScore = factors.reduce((sum, f) => sum + f.score, 0);
  return { totalScore: Math.min(totalScore, 100), factors };
}

export function getLeadScoreLabel(score: number): {
  label: string;
  color: string;
  priority: 'hot' | 'warm' | 'cool' | 'cold';
} {
  if (score >= 75) return { label: 'Hot Lead', color: '#DC2626', priority: 'hot' };
  if (score >= 50) return { label: 'Warm Lead', color: '#F59E0B', priority: 'warm' };
  if (score >= 25) return { label: 'Cool Lead', color: '#3B82F6', priority: 'cool' };
  return { label: 'Cold Lead', color: '#6B7280', priority: 'cold' };
}

// =============================================================================
// Drip Email Sequences (7 emails over 14 days)
// =============================================================================

export function getDripEmailSequence(): DripEmail[] {
  return [
    {
      step: 1,
      dayOffset: 0,
      subject: 'Welcome to RaniOS - Your practice intelligence hub',
      preheader: 'Get started in 5 minutes with our quick setup guide.',
      templateId: 'drip-welcome',
      cta: 'Start Your Setup',
      ctaUrl: '/onboarding',
      personalizations: { greeting: 'Welcome, {{firstName}}!' },
    },
    {
      step: 2,
      dayOffset: 1,
      subject: '3 ways AI is transforming {{vertical}} practices',
      preheader: 'See what your competitors are already using.',
      templateId: 'drip-ai-intro',
      cta: 'See AI Features',
      ctaUrl: '/marketing/features',
      personalizations: {},
    },
    {
      step: 3,
      dayOffset: 3,
      subject: 'How {{clinicName}} can save 15 hours a week',
      preheader: 'Based on your practice size, here is your projected impact.',
      templateId: 'drip-roi',
      cta: 'Calculate Your ROI',
      ctaUrl: '/marketing/pricing#roi',
      personalizations: {},
    },
    {
      step: 4,
      dayOffset: 5,
      subject: 'Quick question about your {{topChallenge}}',
      preheader: 'We noticed this is your #1 challenge. Here is how practices like yours solve it.',
      templateId: 'drip-challenge',
      cta: 'See the Solution',
      ctaUrl: '/marketing/features#{{challengeSlug}}',
      personalizations: {},
    },
    {
      step: 5,
      dayOffset: 7,
      subject: 'Case study: $12K monthly revenue increase in 60 days',
      preheader: 'A {{vertical}} practice just like yours achieved these results.',
      templateId: 'drip-case-study',
      cta: 'Read the Case Study',
      ctaUrl: '/marketing/case-studies',
      personalizations: {},
    },
    {
      step: 6,
      dayOffset: 10,
      subject: 'Your trial is half over - have you tried these features?',
      preheader: 'The top 3 features that convert trial users to paid.',
      templateId: 'drip-mid-trial',
      cta: 'Explore Key Features',
      ctaUrl: '/dashboard',
      personalizations: {},
    },
    {
      step: 7,
      dayOffset: 13,
      subject: 'Your RaniOS trial ends tomorrow',
      preheader: 'Lock in your rate and keep your data. Special offer inside.',
      templateId: 'drip-trial-ending',
      cta: 'Choose Your Plan',
      ctaUrl: '/marketing/pricing',
      personalizations: {},
    },
  ];
}

export function advanceDripSequence(lead: Lead): Lead {
  const sequence = lead.dripSequence;
  if (sequence.isComplete || sequence.isPaused) return lead;

  const emails = getDripEmailSequence();
  const nextStep = sequence.currentStep + 1;

  if (nextStep > emails.length) {
    return {
      ...lead,
      dripSequence: { ...sequence, isComplete: true },
      updatedAt: new Date().toISOString(),
    };
  }

  const nextEmail = emails[nextStep - 1];
  const nextSendAt = new Date(
    new Date(lead.createdAt).getTime() + nextEmail.dayOffset * 24 * 60 * 60 * 1000
  ).toISOString();

  return {
    ...lead,
    dripSequence: {
      ...sequence,
      currentStep: nextStep,
      emailsSent: sequence.emailsSent + 1,
      lastSentAt: new Date().toISOString(),
      nextSendAt,
    },
    updatedAt: new Date().toISOString(),
  };
}

export function pauseDripSequence(lead: Lead): Lead {
  return {
    ...lead,
    dripSequence: { ...lead.dripSequence, isPaused: true },
    updatedAt: new Date().toISOString(),
  };
}

export function resumeDripSequence(lead: Lead): Lead {
  return {
    ...lead,
    dripSequence: { ...lead.dripSequence, isPaused: false },
    updatedAt: new Date().toISOString(),
  };
}

// =============================================================================
// Free Trial Management
// =============================================================================

export function startFreeTrial(lead: Lead, tier: TierSlug = 'pro'): Lead {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const trial: TrialInfo = {
    startedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    tier,
    isActive: true,
    daysRemaining: 14,
    activationScore: 0,
    keyActionsCompleted: [],
    conversionProbability: 20, // Base 20%
  };

  return {
    ...lead,
    trial,
    status: 'trial_started',
    updatedAt: now.toISOString(),
    lastActivityAt: now.toISOString(),
  };
}

export function updateTrialStatus(lead: Lead): Lead {
  if (!lead.trial) return lead;

  const now = new Date();
  const expiresAt = new Date(lead.trial.expiresAt);
  const daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  const isActive = daysRemaining > 0;
  const status: LeadStatus = !isActive
    ? 'churned'
    : daysRemaining <= 3
    ? 'trial_expiring'
    : 'trial_active';

  // Calculate conversion probability based on activation
  const activationScore = calculateActivationScore(lead.activationTracking);
  const conversionProbability = calculateConversionProbability(activationScore, daysRemaining);

  return {
    ...lead,
    trial: {
      ...lead.trial,
      isActive,
      daysRemaining,
      activationScore,
      conversionProbability,
    },
    status,
    updatedAt: now.toISOString(),
  };
}

export function convertTrial(lead: Lead, tier: TierSlug): Lead {
  return {
    ...lead,
    status: 'converted',
    trial: lead.trial
      ? { ...lead.trial, isActive: false }
      : null,
    tags: [...lead.tags, `converted-${tier}`],
    updatedAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
  };
}

export function expireTrial(lead: Lead): Lead {
  return {
    ...lead,
    status: 'churned',
    trial: lead.trial
      ? { ...lead.trial, isActive: false, daysRemaining: 0 }
      : null,
    tags: [...lead.tags, 'trial-expired'],
    updatedAt: new Date().toISOString(),
  };
}

// =============================================================================
// Onboarding Checklist Generator
// =============================================================================

export function generateOnboardingChecklist(tier: TierSlug): Array<{
  step: number;
  title: string;
  description: string;
  estimatedMinutes: number;
  required: boolean;
  tier: TierSlug[];
}> {
  return [
    { step: 1, title: 'Complete business profile', description: 'Add your practice name, address, and contact info', estimatedMinutes: 3, required: true, tier: ['starter', 'pro', 'enterprise'] },
    { step: 2, title: 'Upload your logo', description: 'Add your brand assets for a customized experience', estimatedMinutes: 2, required: false, tier: ['starter', 'pro', 'enterprise'] },
    { step: 3, title: 'Connect your practice management software', description: 'Sync with Mangomint, Boulevard, Vagaro, or other tools', estimatedMinutes: 5, required: true, tier: ['starter', 'pro', 'enterprise'] },
    { step: 4, title: 'Import your service catalog', description: 'Set up your treatments, pricing, and provider assignments', estimatedMinutes: 10, required: true, tier: ['starter', 'pro', 'enterprise'] },
    { step: 5, title: 'Add your team members', description: 'Invite providers and staff with role-based access', estimatedMinutes: 5, required: true, tier: ['starter', 'pro', 'enterprise'] },
    { step: 6, title: 'Configure automated follow-ups', description: 'Set up post-treatment and reactivation sequences', estimatedMinutes: 10, required: false, tier: ['starter', 'pro', 'enterprise'] },
    { step: 7, title: 'Connect payment processor', description: 'Link Square, Stripe, or other payment system', estimatedMinutes: 5, required: false, tier: ['pro', 'enterprise'] },
    { step: 8, title: 'Set up AI engines', description: 'Configure intake intelligence and consult co-pilot preferences', estimatedMinutes: 5, required: false, tier: ['pro', 'enterprise'] },
    { step: 9, title: 'Connect marketing integrations', description: 'Link Meta Ads, Google Reviews, and email marketing', estimatedMinutes: 10, required: false, tier: ['pro', 'enterprise'] },
    { step: 10, title: 'Configure white-label branding', description: 'Customize colors, fonts, and domain for your portal', estimatedMinutes: 15, required: false, tier: ['enterprise'] },
  ].filter((step) => step.tier.includes(tier));
}

// =============================================================================
// Activation Tracking
// =============================================================================

function getDefaultActivationMetrics(): ActivationMetric[] {
  return [
    { action: 'completed_profile', completed: false, completedAt: null, weight: 10, description: 'Completed business profile' },
    { action: 'connected_integration', completed: false, completedAt: null, weight: 20, description: 'Connected first integration' },
    { action: 'imported_clients', completed: false, completedAt: null, weight: 15, description: 'Imported client data' },
    { action: 'viewed_dashboard', completed: false, completedAt: null, weight: 5, description: 'Viewed main dashboard' },
    { action: 'used_ai_feature', completed: false, completedAt: null, weight: 20, description: 'Used an AI feature (intake, consult, etc.)' },
    { action: 'sent_first_follow_up', completed: false, completedAt: null, weight: 15, description: 'Sent first automated follow-up' },
    { action: 'invited_team_member', completed: false, completedAt: null, weight: 10, description: 'Invited a team member' },
    { action: 'viewed_analytics', completed: false, completedAt: null, weight: 5, description: 'Viewed analytics page' },
  ];
}

export function trackActivation(lead: Lead, action: string): Lead {
  const updatedMetrics = lead.activationTracking.map((metric) => {
    if (metric.action === action && !metric.completed) {
      return { ...metric, completed: true, completedAt: new Date().toISOString() };
    }
    return metric;
  });

  const completedActions = updatedMetrics.filter((m) => m.completed).map((m) => m.action);

  return {
    ...lead,
    activationTracking: updatedMetrics,
    trial: lead.trial
      ? {
          ...lead.trial,
          keyActionsCompleted: completedActions,
          activationScore: calculateActivationScore(updatedMetrics),
        }
      : null,
    updatedAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
  };
}

function calculateActivationScore(metrics: ActivationMetric[]): number {
  const totalWeight = metrics.reduce((sum, m) => sum + m.weight, 0);
  const completedWeight = metrics
    .filter((m) => m.completed)
    .reduce((sum, m) => sum + m.weight, 0);

  return totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
}

// =============================================================================
// Churn Prediction for Trial Users
// =============================================================================

function calculateConversionProbability(activationScore: number, daysRemaining: number): number {
  // Base conversion rate
  let probability = 20;

  // Activation score impact (up to +50%)
  probability += (activationScore / 100) * 50;

  // Time pressure (slight boost for users still engaged with few days left)
  if (daysRemaining <= 3 && activationScore > 50) {
    probability += 10;
  }

  // Cap at 95%
  return Math.min(95, Math.max(5, Math.round(probability)));
}

export function predictTrialChurn(lead: Lead): {
  willChurn: boolean;
  probability: number;
  riskFactors: string[];
  recommendedActions: string[];
} {
  if (!lead.trial) {
    return { willChurn: false, probability: 0, riskFactors: [], recommendedActions: [] };
  }

  const riskFactors: string[] = [];
  const recommendedActions: string[] = [];
  let churnScore = 0;

  // Low activation
  if (lead.trial.activationScore < 30) {
    churnScore += 30;
    riskFactors.push('Low activation score - few key actions completed');
    recommendedActions.push('Send personalized onboarding help email');
  }

  // No integration connected
  const hasIntegration = lead.activationTracking.find(
    (m) => m.action === 'connected_integration' && m.completed
  );
  if (!hasIntegration) {
    churnScore += 20;
    riskFactors.push('No integrations connected');
    recommendedActions.push('Offer white-glove integration setup call');
  }

  // No AI feature used
  const usedAi = lead.activationTracking.find(
    (m) => m.action === 'used_ai_feature' && m.completed
  );
  if (!usedAi) {
    churnScore += 15;
    riskFactors.push('Has not tried any AI features');
    recommendedActions.push('Send showcase email highlighting AI capabilities');
  }

  // No login in 3+ days
  const daysSinceActivity = Math.floor(
    (Date.now() - new Date(lead.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceActivity >= 3) {
    churnScore += 25;
    riskFactors.push(`No activity in ${daysSinceActivity} days`);
    recommendedActions.push('Trigger re-engagement email with feature highlights');
  }

  // Email engagement
  if (lead.dripSequence.emailsSent > 3 && lead.dripSequence.emailsOpened === 0) {
    churnScore += 10;
    riskFactors.push('Not opening any emails');
    recommendedActions.push('Try SMS outreach or adjust email subject lines');
  }

  const probability = Math.min(95, Math.max(5, churnScore));

  return {
    willChurn: probability > 60,
    probability,
    riskFactors,
    recommendedActions,
  };
}

// =============================================================================
// Lead Status Transitions
// =============================================================================

export function getValidStatusTransitions(currentStatus: LeadStatus): LeadStatus[] {
  const transitions: Record<LeadStatus, LeadStatus[]> = {
    new: ['email_captured', 'disqualified'],
    email_captured: ['info_submitted', 'disqualified'],
    info_submitted: ['needs_assessed', 'demo_scheduled', 'trial_started', 'disqualified'],
    needs_assessed: ['demo_scheduled', 'trial_started', 'disqualified'],
    demo_scheduled: ['demo_completed', 'needs_assessed', 'disqualified'],
    demo_completed: ['trial_started', 'converted', 'disqualified'],
    trial_started: ['trial_active', 'converted', 'churned'],
    trial_active: ['trial_expiring', 'converted', 'churned'],
    trial_expiring: ['converted', 'churned'],
    converted: [],
    churned: ['trial_started'], // Allow restart
    disqualified: [],
  };

  return transitions[currentStatus] || [];
}

// =============================================================================
// Lead Analytics
// =============================================================================

export function getLeadFunnelMetrics(leads: Lead[]): {
  stage: string;
  count: number;
  conversionRate: number;
}[] {
  const stages: LeadStatus[] = [
    'email_captured', 'info_submitted', 'needs_assessed',
    'demo_scheduled', 'demo_completed', 'trial_started',
    'trial_active', 'converted',
  ];

  const total = leads.length;

  return stages.map((stage) => {
    const count = leads.filter((l) => l.status === stage).length;
    return {
      stage,
      count,
      conversionRate: total > 0 ? Math.round((count / total) * 100) : 0,
    };
  });
}

export function getLeadSourceBreakdown(leads: Lead[]): Array<{
  source: LeadSource;
  count: number;
  avgScore: number;
  conversionRate: number;
}> {
  const sources: LeadSource[] = [
    'organic', 'paid_search', 'paid_social', 'referral',
    'affiliate', 'partner', 'content', 'event',
  ];

  return sources.map((source) => {
    const sourceLeads = leads.filter((l) => l.source === source);
    const converted = sourceLeads.filter((l) => l.status === 'converted');

    return {
      source,
      count: sourceLeads.length,
      avgScore: sourceLeads.length > 0
        ? Math.round(sourceLeads.reduce((sum, l) => sum + l.score, 0) / sourceLeads.length)
        : 0,
      conversionRate: sourceLeads.length > 0
        ? Math.round((converted.length / sourceLeads.length) * 100)
        : 0,
    };
  }).filter((s) => s.count > 0);
}
