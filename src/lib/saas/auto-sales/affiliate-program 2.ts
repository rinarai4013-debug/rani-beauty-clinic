// =============================================================================
// RaniOS Affiliate / Partner Program
// Registration, commissions, referral tracking, payouts, performance
// =============================================================================

import type {
  Affiliate,
  AffiliateStatus,
  CommissionTier,
  AffiliatePerformance,
  AffiliateReferral,
  AffiliatePayout,
  PayoutStatus,
  PromotionalMaterial,
  AffiliateApplication,
} from './types';

// =============================================================================
// Commission Configuration
// =============================================================================

const COMMISSION_TIERS: Record<CommissionTier, {
  name: string;
  rate: number;
  minConversions: number;
  minRevenue: number;
  perks: string[];
}> = {
  bronze: {
    name: 'Bronze Partner',
    rate: 0.10,
    minConversions: 0,
    minRevenue: 0,
    perks: ['10% recurring commission', 'Standard promotional materials', 'Monthly payout'],
  },
  silver: {
    name: 'Silver Partner',
    rate: 0.15,
    minConversions: 5,
    minRevenue: 2500,
    perks: ['15% recurring commission', 'Premium promotional materials', 'Bi-weekly payout', 'Co-branded landing page', 'Priority support'],
  },
  gold: {
    name: 'Gold Partner',
    rate: 0.20,
    minConversions: 15,
    minRevenue: 10000,
    perks: ['20% recurring commission', 'Custom promotional materials', 'Weekly payout', 'Dedicated partner manager', 'Early access to features', 'Revenue share on upsells'],
  },
};

const COOKIE_WINDOW_DAYS = 90;
const MIN_PAYOUT_AMOUNT = 50;
const PAYOUT_SCHEDULE_DAYS = 30; // Monthly payouts by default

// =============================================================================
// Affiliate Registration and Approval
// =============================================================================

export function submitAffiliateApplication(
  application: AffiliateApplication
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!application.name || application.name.length < 2) {
    errors.push('Full name is required');
  }
  if (!application.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(application.email)) {
    errors.push('Valid email is required');
  }
  if (!application.promotionPlan || application.promotionPlan.length < 20) {
    errors.push('Please describe your promotion plan in at least 20 characters');
  }
  if (!application.agreeToTerms) {
    errors.push('You must agree to the affiliate terms');
  }

  return { valid: errors.length === 0, errors };
}

export function createAffiliate(application: AffiliateApplication, userId: string): Affiliate {
  const now = new Date().toISOString();
  const referralCode = generateReferralCode(application.name);

  return {
    id: `aff-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    userId,
    name: application.name,
    email: application.email,
    company: application.company || null,
    website: application.website || null,
    status: 'pending',
    commissionTier: 'bronze',
    commissionRate: COMMISSION_TIERS.bronze.rate,
    referralCode,
    referralLink: `https://ranios.com/?ref=${referralCode}`,
    cookieWindowDays: COOKIE_WINDOW_DAYS,
    totalReferrals: 0,
    totalConversions: 0,
    totalRevenue: 0,
    totalCommission: 0,
    pendingCommission: 0,
    paidCommission: 0,
    payoutMethod: 'bank_transfer',
    payoutDetails: {},
    performance: createEmptyPerformance(),
    promotionalMaterials: getDefaultPromotionalMaterials(),
    createdAt: now,
    updatedAt: now,
  };
}

function generateReferralCode(name: string): string {
  const clean = name.toLowerCase().replace(/[^a-z]/g, '').substring(0, 6);
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${clean}${suffix}`;
}

export function approveAffiliate(affiliate: Affiliate): Affiliate {
  if (affiliate.status !== 'pending') {
    throw new Error('Only pending affiliates can be approved');
  }

  return {
    ...affiliate,
    status: 'active',
    updatedAt: new Date().toISOString(),
  };
}

export function rejectAffiliate(affiliate: Affiliate): Affiliate {
  return {
    ...affiliate,
    status: 'terminated',
    updatedAt: new Date().toISOString(),
  };
}

export function suspendAffiliate(affiliate: Affiliate, reason: string): Affiliate {
  return {
    ...affiliate,
    status: 'suspended',
    updatedAt: new Date().toISOString(),
  };
}

export function reactivateAffiliate(affiliate: Affiliate): Affiliate {
  if (affiliate.status !== 'suspended') {
    throw new Error('Only suspended affiliates can be reactivated');
  }

  return {
    ...affiliate,
    status: 'active',
    updatedAt: new Date().toISOString(),
  };
}

// =============================================================================
// Commission Tier Management
// =============================================================================

export function getCommissionTiers(): typeof COMMISSION_TIERS {
  return COMMISSION_TIERS;
}

export function evaluateCommissionTier(affiliate: Affiliate): {
  currentTier: CommissionTier;
  nextTier: CommissionTier | null;
  progressToNext: number;
  conversionsNeeded: number;
  revenueNeeded: number;
} {
  const tiers: CommissionTier[] = ['bronze', 'silver', 'gold'];
  const currentIndex = tiers.indexOf(affiliate.commissionTier);
  const nextTier = currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;

  if (!nextTier) {
    return {
      currentTier: affiliate.commissionTier,
      nextTier: null,
      progressToNext: 100,
      conversionsNeeded: 0,
      revenueNeeded: 0,
    };
  }

  const nextConfig = COMMISSION_TIERS[nextTier];
  const conversionProgress = Math.min(100, (affiliate.totalConversions / nextConfig.minConversions) * 100);
  const revenueProgress = Math.min(100, (affiliate.totalRevenue / nextConfig.minRevenue) * 100);
  const progress = Math.min(conversionProgress, revenueProgress);

  return {
    currentTier: affiliate.commissionTier,
    nextTier,
    progressToNext: Math.round(progress),
    conversionsNeeded: Math.max(0, nextConfig.minConversions - affiliate.totalConversions),
    revenueNeeded: Math.max(0, nextConfig.minRevenue - affiliate.totalRevenue),
  };
}

export function upgradeAffiliateTier(affiliate: Affiliate): Affiliate {
  const evaluation = evaluateCommissionTier(affiliate);
  if (!evaluation.nextTier || evaluation.progressToNext < 100) {
    return affiliate; // Not eligible
  }

  const newTier = evaluation.nextTier;
  const tierConfig = COMMISSION_TIERS[newTier];

  return {
    ...affiliate,
    commissionTier: newTier,
    commissionRate: tierConfig.rate,
    updatedAt: new Date().toISOString(),
  };
}

// =============================================================================
// Referral Link Generation and Tracking
// =============================================================================

export function generateReferralLink(
  affiliate: Affiliate,
  campaign?: string,
  landingPage?: string
): string {
  const baseUrl = landingPage || 'https://ranios.com';
  const params = new URLSearchParams({ ref: affiliate.referralCode });

  if (campaign) {
    params.set('utm_campaign', campaign);
    params.set('utm_source', 'affiliate');
    params.set('utm_medium', 'referral');
  }

  return `${baseUrl}?${params.toString()}`;
}

export function generateCampaignLinks(affiliate: Affiliate): Array<{
  name: string;
  url: string;
  description: string;
}> {
  return [
    {
      name: 'Homepage',
      url: generateReferralLink(affiliate, 'homepage'),
      description: 'Main RaniOS homepage with your referral code',
    },
    {
      name: 'Pricing Page',
      url: generateReferralLink(affiliate, 'pricing', 'https://ranios.com/marketing/pricing'),
      description: 'Direct link to the pricing page',
    },
    {
      name: 'Free Trial',
      url: generateReferralLink(affiliate, 'trial', 'https://ranios.com/onboarding'),
      description: 'Link directly to the free trial signup',
    },
    {
      name: 'Demo Request',
      url: generateReferralLink(affiliate, 'demo', 'https://ranios.com/marketing/demo'),
      description: 'Link to the demo request page',
    },
  ];
}

// =============================================================================
// Cookie-Based Attribution
// =============================================================================

export function createAttributionCookie(referralCode: string): {
  name: string;
  value: string;
  maxAge: number;
  path: string;
  sameSite: 'lax';
  secure: boolean;
} {
  return {
    name: 'ranios_ref',
    value: JSON.stringify({
      code: referralCode,
      clickedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + COOKIE_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    }),
    maxAge: COOKIE_WINDOW_DAYS * 24 * 60 * 60,
    path: '/',
    sameSite: 'lax',
    secure: true,
  };
}

export function parseAttributionCookie(cookieValue: string): {
  code: string;
  clickedAt: string;
  expiresAt: string;
  isValid: boolean;
} | null {
  try {
    const data = JSON.parse(cookieValue);
    const isValid = new Date(data.expiresAt) > new Date();
    return { ...data, isValid };
  } catch {
    return null;
  }
}

// =============================================================================
// Referral Tracking
// =============================================================================

export function recordReferralClick(
  affiliateId: string,
  source: string,
  ipAddress: string,
  userAgent: string,
  landingPage: string
): AffiliateReferral {
  return {
    id: `ref-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    affiliateId,
    leadId: '',
    clickedAt: new Date().toISOString(),
    convertedAt: null,
    status: 'clicked',
    attributionSource: source,
    ipAddress,
    userAgent,
    landingPage,
    commission: null,
  };
}

export function convertReferral(
  referral: AffiliateReferral,
  leadId: string,
  monthlyPrice: number,
  commissionRate: number
): AffiliateReferral {
  return {
    ...referral,
    leadId,
    convertedAt: new Date().toISOString(),
    status: 'converted',
    commission: Math.round(monthlyPrice * commissionRate * 100) / 100,
  };
}

export function updateAffiliateOnConversion(
  affiliate: Affiliate,
  referral: AffiliateReferral,
  monthlyPrice: number
): Affiliate {
  const commission = Math.round(monthlyPrice * affiliate.commissionRate * 100) / 100;

  return {
    ...affiliate,
    totalConversions: affiliate.totalConversions + 1,
    totalRevenue: affiliate.totalRevenue + monthlyPrice,
    totalCommission: affiliate.totalCommission + commission,
    pendingCommission: affiliate.pendingCommission + commission,
    updatedAt: new Date().toISOString(),
  };
}

// =============================================================================
// Payout Calculation and Scheduling
// =============================================================================

export function calculatePayout(
  affiliate: Affiliate,
  referrals: AffiliateReferral[],
  periodStart: string,
  periodEnd: string
): AffiliatePayout | null {
  const eligibleReferrals = referrals.filter(
    (r) =>
      r.affiliateId === affiliate.id &&
      r.status === 'converted' &&
      r.convertedAt &&
      new Date(r.convertedAt) >= new Date(periodStart) &&
      new Date(r.convertedAt) <= new Date(periodEnd)
  );

  const totalCommission = eligibleReferrals.reduce(
    (sum, r) => sum + (r.commission || 0),
    0
  );

  if (totalCommission < MIN_PAYOUT_AMOUNT) {
    return null; // Below minimum payout threshold
  }

  return {
    id: `payout-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    affiliateId: affiliate.id,
    amount: Math.round(totalCommission * 100) / 100,
    status: 'pending',
    referralIds: eligibleReferrals.map((r) => r.id),
    periodStart,
    periodEnd,
    scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    processedAt: null,
    transactionId: null,
    notes: `${eligibleReferrals.length} conversion(s) at ${affiliate.commissionRate * 100}% commission`,
  };
}

export function processPayout(payout: AffiliatePayout, transactionId: string): AffiliatePayout {
  return {
    ...payout,
    status: 'paid',
    processedAt: new Date().toISOString(),
    transactionId,
  };
}

export function failPayout(payout: AffiliatePayout, reason: string): AffiliatePayout {
  return {
    ...payout,
    status: 'failed',
    notes: `${payout.notes} | Failed: ${reason}`,
  };
}

export function markPayoutProcessing(payout: AffiliatePayout): AffiliatePayout {
  return {
    ...payout,
    status: 'processing',
  };
}

// =============================================================================
// Affiliate Dashboard Data
// =============================================================================

export function getAffiliateDashboardData(
  affiliate: Affiliate,
  referrals: AffiliateReferral[],
  payouts: AffiliatePayout[]
): {
  overview: {
    totalClicks: number;
    totalSignups: number;
    totalConversions: number;
    conversionRate: number;
    totalCommission: number;
    pendingCommission: number;
    paidCommission: number;
    currentTier: string;
    commissionRate: string;
  };
  recentReferrals: AffiliateReferral[];
  recentPayouts: AffiliatePayout[];
  tierProgress: ReturnType<typeof evaluateCommissionTier>;
  monthlyTrend: Array<{ month: string; clicks: number; conversions: number; commission: number }>;
} {
  const myReferrals = referrals.filter((r) => r.affiliateId === affiliate.id);
  const myPayouts = payouts.filter((p) => p.affiliateId === affiliate.id);

  const clicks = myReferrals.length;
  const signups = myReferrals.filter((r) => r.status !== 'clicked').length;
  const conversions = myReferrals.filter((r) => r.status === 'converted').length;

  // Generate monthly trend for last 6 months
  const monthlyTrend: Array<{ month: string; clicks: number; conversions: number; commission: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthStr = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const monthRefs = myReferrals.filter((r) => {
      const clicked = new Date(r.clickedAt);
      return clicked >= monthStart && clicked <= monthEnd;
    });

    const monthConversions = monthRefs.filter((r) => r.status === 'converted');
    const monthCommission = monthConversions.reduce((sum, r) => sum + (r.commission || 0), 0);

    monthlyTrend.push({
      month: monthStr,
      clicks: monthRefs.length,
      conversions: monthConversions.length,
      commission: Math.round(monthCommission * 100) / 100,
    });
  }

  return {
    overview: {
      totalClicks: clicks,
      totalSignups: signups,
      totalConversions: conversions,
      conversionRate: clicks > 0 ? Math.round((conversions / clicks) * 10000) / 100 : 0,
      totalCommission: affiliate.totalCommission,
      pendingCommission: affiliate.pendingCommission,
      paidCommission: affiliate.paidCommission,
      currentTier: COMMISSION_TIERS[affiliate.commissionTier].name,
      commissionRate: `${affiliate.commissionRate * 100}%`,
    },
    recentReferrals: myReferrals.sort(
      (a, b) => new Date(b.clickedAt).getTime() - new Date(a.clickedAt).getTime()
    ).slice(0, 10),
    recentPayouts: myPayouts.sort(
      (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
    ).slice(0, 5),
    tierProgress: evaluateCommissionTier(affiliate),
    monthlyTrend,
  };
}

// =============================================================================
// Performance Reporting
// =============================================================================

function createEmptyPerformance(): AffiliatePerformance {
  return {
    clicksLast30Days: 0,
    conversionsLast30Days: 0,
    revenueLast30Days: 0,
    conversionRate: 0,
    avgDealSize: 0,
    avgTimeToConvert: 0,
    topReferralSources: [],
    monthlyTrend: [],
  };
}

export function calculatePerformance(
  affiliate: Affiliate,
  referrals: AffiliateReferral[]
): AffiliatePerformance {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const myReferrals = referrals.filter((r) => r.affiliateId === affiliate.id);
  const recentRefs = myReferrals.filter((r) => new Date(r.clickedAt) >= thirtyDaysAgo);
  const recentConversions = recentRefs.filter((r) => r.status === 'converted');

  // Top referral sources
  const sourceMap = new Map<string, { clicks: number; conversions: number }>();
  for (const ref of recentRefs) {
    const source = ref.attributionSource || 'direct';
    const current = sourceMap.get(source) || { clicks: 0, conversions: 0 };
    current.clicks++;
    if (ref.status === 'converted') current.conversions++;
    sourceMap.set(source, current);
  }

  const topSources = Array.from(sourceMap.entries())
    .map(([source, data]) => ({ source, ...data }))
    .sort((a, b) => b.conversions - a.conversions)
    .slice(0, 5);

  // Avg time to convert (days)
  const convertTimes = recentConversions
    .filter((r) => r.convertedAt)
    .map((r) => {
      const clicked = new Date(r.clickedAt).getTime();
      const converted = new Date(r.convertedAt!).getTime();
      return (converted - clicked) / (1000 * 60 * 60 * 24);
    });
  const avgTimeToConvert = convertTimes.length > 0
    ? Math.round(convertTimes.reduce((a, b) => a + b, 0) / convertTimes.length)
    : 0;

  const revenue30d = recentConversions.reduce((sum, r) => sum + (r.commission || 0), 0) / affiliate.commissionRate;

  return {
    clicksLast30Days: recentRefs.length,
    conversionsLast30Days: recentConversions.length,
    revenueLast30Days: Math.round(revenue30d),
    conversionRate: recentRefs.length > 0
      ? Math.round((recentConversions.length / recentRefs.length) * 10000) / 100
      : 0,
    avgDealSize: recentConversions.length > 0
      ? Math.round(revenue30d / recentConversions.length)
      : 0,
    avgTimeToConvert,
    topReferralSources: topSources,
    monthlyTrend: [], // Populated by getAffiliateDashboardData
  };
}

// =============================================================================
// Promotional Material Library
// =============================================================================

function getDefaultPromotionalMaterials(): PromotionalMaterial[] {
  return [
    {
      id: 'promo-banner-728',
      type: 'banner',
      name: 'Leaderboard Banner (728x90)',
      description: 'Standard leaderboard ad for website placement',
      assetUrl: '/affiliates/banners/ranios-728x90.png',
      previewUrl: '/affiliates/banners/ranios-728x90-preview.png',
      dimensions: '728x90',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'promo-banner-300',
      type: 'banner',
      name: 'Medium Rectangle (300x250)',
      description: 'Standard medium rectangle ad for sidebar placement',
      assetUrl: '/affiliates/banners/ranios-300x250.png',
      previewUrl: '/affiliates/banners/ranios-300x250-preview.png',
      dimensions: '300x250',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'promo-banner-160',
      type: 'banner',
      name: 'Wide Skyscraper (160x600)',
      description: 'Vertical sidebar banner',
      assetUrl: '/affiliates/banners/ranios-160x600.png',
      previewUrl: '/affiliates/banners/ranios-160x600-preview.png',
      dimensions: '160x600',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'promo-email',
      type: 'email_template',
      name: 'Email Introduction Template',
      description: 'Pre-written email to introduce RaniOS to your audience',
      assetUrl: '/affiliates/templates/intro-email.html',
      previewUrl: '/affiliates/templates/intro-email-preview.png',
      dimensions: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'promo-social-ig',
      type: 'social_post',
      name: 'Instagram Post Templates (5 variants)',
      description: 'Square format posts for Instagram with captions',
      assetUrl: '/affiliates/social/instagram-pack.zip',
      previewUrl: '/affiliates/social/instagram-preview.png',
      dimensions: '1080x1080',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'promo-social-linkedin',
      type: 'social_post',
      name: 'LinkedIn Post Templates (3 variants)',
      description: 'Professional format posts for LinkedIn',
      assetUrl: '/affiliates/social/linkedin-pack.zip',
      previewUrl: '/affiliates/social/linkedin-preview.png',
      dimensions: '1200x627',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'promo-landing',
      type: 'landing_page',
      name: 'Co-branded Landing Page',
      description: 'Customizable landing page with your branding + RaniOS',
      assetUrl: '/affiliates/landing/template.html',
      previewUrl: '/affiliates/landing/preview.png',
      dimensions: null,
      createdAt: new Date().toISOString(),
    },
  ];
}

export function getPromotionalMaterials(tier: CommissionTier): PromotionalMaterial[] {
  const materials = getDefaultPromotionalMaterials();

  if (tier === 'bronze') {
    return materials.filter((m) => m.type === 'banner' || m.type === 'email_template');
  }

  if (tier === 'silver') {
    return materials.filter((m) => m.type !== 'landing_page');
  }

  return materials; // Gold gets everything
}

// =============================================================================
// Affiliate Program Stats (for admin)
// =============================================================================

export function getAffiliateProgramStats(
  affiliates: Affiliate[],
  referrals: AffiliateReferral[],
  payouts: AffiliatePayout[]
): {
  totalAffiliates: number;
  activeAffiliates: number;
  totalReferrals: number;
  totalConversions: number;
  overallConversionRate: number;
  totalCommissionsPaid: number;
  pendingCommissions: number;
  avgCommissionPerConversion: number;
  topAffiliates: Array<{ name: string; conversions: number; revenue: number }>;
  tierDistribution: Array<{ tier: string; count: number }>;
} {
  const active = affiliates.filter((a) => a.status === 'active');
  const conversions = referrals.filter((r) => r.status === 'converted');
  const paidPayouts = payouts.filter((p) => p.status === 'paid');

  const totalPaid = paidPayouts.reduce((sum, p) => sum + p.amount, 0);
  const pending = affiliates.reduce((sum, a) => sum + a.pendingCommission, 0);

  const topAffiliates = affiliates
    .filter((a) => a.totalConversions > 0)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 10)
    .map((a) => ({
      name: a.name,
      conversions: a.totalConversions,
      revenue: a.totalRevenue,
    }));

  const tierMap = new Map<string, number>();
  for (const a of active) {
    const tier = COMMISSION_TIERS[a.commissionTier].name;
    tierMap.set(tier, (tierMap.get(tier) || 0) + 1);
  }

  return {
    totalAffiliates: affiliates.length,
    activeAffiliates: active.length,
    totalReferrals: referrals.length,
    totalConversions: conversions.length,
    overallConversionRate: referrals.length > 0
      ? Math.round((conversions.length / referrals.length) * 10000) / 100
      : 0,
    totalCommissionsPaid: Math.round(totalPaid * 100) / 100,
    pendingCommissions: Math.round(pending * 100) / 100,
    avgCommissionPerConversion: conversions.length > 0
      ? Math.round((totalPaid / conversions.length) * 100) / 100
      : 0,
    topAffiliates,
    tierDistribution: Array.from(tierMap.entries()).map(([tier, count]) => ({ tier, count })),
  };
}
