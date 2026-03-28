// =============================================================================
// RaniOS Auto-Sales Types
// =============================================================================

export type Vertical =
  | 'medspa'
  | 'dental'
  | 'dermatology'
  | 'wellness'
  | 'chiropractic'
  | 'plastic_surgery'
  | 'ophthalmology'
  | 'veterinary';

export type TierSlug = 'starter' | 'pro' | 'enterprise';

export interface PricingTier {
  slug: TierSlug;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  highlight: string;
  features: TierFeature[];
  limits: TierLimits;
  cta: string;
  isPopular: boolean;
}

export interface TierFeature {
  name: string;
  included: boolean;
  detail: string | null;
}

export interface TierLimits {
  providers: number | 'unlimited';
  locations: number | 'unlimited';
  apiCalls: number | 'unlimited';
  storage: string;
  integrations: number | 'unlimited';
  aiCalls: number | 'unlimited';
  emailsPerMonth: number | 'unlimited';
  automations: number | 'unlimited';
}

export interface LandingPageContent {
  vertical: Vertical;
  hero: HeroSection;
  painPoints: PainPoint[];
  features: FeatureBlock[];
  socialProof: SocialProofSection;
  pricing: PricingSection;
  faq: FaqItem[];
  cta: CtaSection;
  seo: SeoMeta;
}

export interface HeroSection {
  headline: string;
  subheadline: string;
  ctaPrimary: string;
  ctaSecondary: string;
  badgeText: string;
  stats: Array<{ label: string; value: string }>;
}

export interface PainPoint {
  icon: string;
  title: string;
  description: string;
  solution: string;
}

export interface FeatureBlock {
  title: string;
  description: string;
  icon: string;
  screenshot: string;
  benefits: string[];
}

export interface SocialProofSection {
  testimonials: Testimonial[];
  logos: string[];
  stats: Array<{ label: string; value: string }>;
}

export interface Testimonial {
  id: string;
  name: string;
  title: string;
  company: string;
  avatar: string;
  quote: string;
  rating: number;
  vertical: Vertical;
  metrics: Array<{ label: string; value: string }>;
}

export interface PricingSection {
  headline: string;
  subheadline: string;
  tiers: PricingTier[];
  comparisonTable: ComparisonRow[];
}

export interface ComparisonRow {
  feature: string;
  category: string;
  starter: boolean | string;
  pro: boolean | string;
  enterprise: boolean | string;
}

export interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

export interface CtaSection {
  headline: string;
  subheadline: string;
  buttonText: string;
  buttonUrl: string;
  trialDuration: number;
  noCardRequired: boolean;
}

export interface SeoMeta {
  title: string;
  description: string;
  keywords: string[];
  ogImage: string;
  canonical: string;
}

export interface RoiCalculatorInput {
  currentMonthlyRevenue: number;
  currentPatients: number;
  providersCount: number;
  currentSoftwareCost: number;
  hoursOnAdmin: number;
  noShowRate: number;
  vertical: Vertical;
}

export interface RoiCalculatorResult {
  projectedRevenueIncrease: number;
  projectedRevenueIncreasePercent: number;
  timeSavedHours: number;
  timeSavedValue: number;
  noShowReduction: number;
  noShowSavings: number;
  adminCostReduction: number;
  totalAnnualBenefit: number;
  roiMultiple: number;
  paybackPeriodDays: number;
  breakdown: RoiBreakdownItem[];
}

export interface RoiBreakdownItem {
  category: string;
  currentCost: number;
  projectedCost: number;
  savings: number;
  description: string;
}

// Lead capture types

export type LeadStatus =
  | 'new'
  | 'email_captured'
  | 'info_submitted'
  | 'needs_assessed'
  | 'demo_scheduled'
  | 'demo_completed'
  | 'trial_started'
  | 'trial_active'
  | 'trial_expiring'
  | 'converted'
  | 'churned'
  | 'disqualified';

export type LeadSource =
  | 'organic'
  | 'paid_search'
  | 'paid_social'
  | 'referral'
  | 'affiliate'
  | 'partner'
  | 'content'
  | 'event'
  | 'cold_outreach'
  | 'word_of_mouth';

export interface Lead {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  clinicName: string;
  vertical: Vertical;
  status: LeadStatus;
  source: LeadSource;
  score: number;
  scoreFactors: LeadScoreFactor[];
  businessInfo: BusinessInfo | null;
  needsAssessment: NeedsAssessment | null;
  demoBooking: DemoBooking | null;
  trial: TrialInfo | null;
  dripSequence: DripSequenceStatus;
  activationTracking: ActivationMetric[];
  assignedTo: string | null;
  tags: string[];
  notes: string[];
  utmParams: UtmParams | null;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
}

export interface LeadScoreFactor {
  factor: string;
  weight: number;
  score: number;
  maxScore: number;
  detail: string;
}

export interface BusinessInfo {
  revenue: string;
  providerCount: number;
  locationCount: number;
  currentSoftware: string;
  yearsFounded: number | null;
  website: string | null;
  address: string | null;
}

export interface NeedsAssessment {
  topChallenges: string[];
  desiredFeatures: string[];
  timeline: 'immediate' | '1_month' | '3_months' | '6_months' | 'exploring';
  budget: string;
  decisionMaker: boolean;
  competitorsEvaluating: string[];
}

export interface DemoBooking {
  scheduledAt: string;
  duration: number;
  type: 'live_demo' | 'sandbox' | 'recorded';
  meetingUrl: string;
  attendees: string[];
  status: 'scheduled' | 'completed' | 'no_show' | 'rescheduled' | 'cancelled';
  notes: string;
  followUpScheduled: boolean;
}

export interface TrialInfo {
  startedAt: string;
  expiresAt: string;
  tier: TierSlug;
  isActive: boolean;
  daysRemaining: number;
  activationScore: number;
  keyActionsCompleted: string[];
  conversionProbability: number;
}

export interface DripSequenceStatus {
  sequenceId: string;
  currentStep: number;
  totalSteps: number;
  lastSentAt: string | null;
  nextSendAt: string | null;
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
  isComplete: boolean;
  isPaused: boolean;
}

export interface DripEmail {
  step: number;
  dayOffset: number;
  subject: string;
  preheader: string;
  templateId: string;
  cta: string;
  ctaUrl: string;
  personalizations: Record<string, string>;
}

export interface ActivationMetric {
  action: string;
  completed: boolean;
  completedAt: string | null;
  weight: number;
  description: string;
}

export interface UtmParams {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  term: string | null;
  content: string | null;
}

export interface SignupFunnelStep {
  step: number;
  name: string;
  fields: FormField[];
  validationRules: ValidationRule[];
  skipCondition: string | null;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'multi_select' | 'textarea' | 'number' | 'checkbox';
  required: boolean;
  options: string[] | null;
  placeholder: string;
  helpText: string | null;
}

export interface ValidationRule {
  field: string;
  rule: 'required' | 'email' | 'phone' | 'min_length' | 'max_length' | 'pattern';
  value: string | number | null;
  message: string;
}

// Affiliate types

export type AffiliateStatus = 'pending' | 'approved' | 'active' | 'suspended' | 'terminated';

export type CommissionTier = 'bronze' | 'silver' | 'gold';

export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed';

export interface Affiliate {
  id: string;
  userId: string;
  name: string;
  email: string;
  company: string | null;
  website: string | null;
  status: AffiliateStatus;
  commissionTier: CommissionTier;
  commissionRate: number;
  referralCode: string;
  referralLink: string;
  cookieWindowDays: number;
  totalReferrals: number;
  totalConversions: number;
  totalRevenue: number;
  totalCommission: number;
  pendingCommission: number;
  paidCommission: number;
  payoutMethod: 'bank_transfer' | 'paypal' | 'check';
  payoutDetails: Record<string, string>;
  performance: AffiliatePerformance;
  promotionalMaterials: PromotionalMaterial[];
  createdAt: string;
  updatedAt: string;
}

export interface AffiliatePerformance {
  clicksLast30Days: number;
  conversionsLast30Days: number;
  revenueLast30Days: number;
  conversionRate: number;
  avgDealSize: number;
  avgTimeToConvert: number;
  topReferralSources: Array<{ source: string; clicks: number; conversions: number }>;
  monthlyTrend: Array<{ month: string; clicks: number; conversions: number; revenue: number }>;
}

export interface AffiliateReferral {
  id: string;
  affiliateId: string;
  leadId: string;
  clickedAt: string;
  convertedAt: string | null;
  status: 'clicked' | 'signed_up' | 'trial' | 'converted' | 'expired';
  attributionSource: string;
  ipAddress: string;
  userAgent: string;
  landingPage: string;
  commission: number | null;
}

export interface AffiliatePayout {
  id: string;
  affiliateId: string;
  amount: number;
  status: PayoutStatus;
  referralIds: string[];
  periodStart: string;
  periodEnd: string;
  scheduledAt: string;
  processedAt: string | null;
  transactionId: string | null;
  notes: string;
}

export interface PromotionalMaterial {
  id: string;
  type: 'banner' | 'email_template' | 'social_post' | 'landing_page' | 'video';
  name: string;
  description: string;
  assetUrl: string;
  previewUrl: string;
  dimensions: string | null;
  createdAt: string;
}

export interface AffiliateApplication {
  name: string;
  email: string;
  company: string;
  website: string;
  audience: string;
  promotionPlan: string;
  expectedReferrals: string;
  experience: string;
  agreeToTerms: boolean;
}
