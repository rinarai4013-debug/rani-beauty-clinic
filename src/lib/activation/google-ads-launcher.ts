/**
 * Google Ads Quick Launch
 * Rani Beauty Clinic - Revenue Activation System
 *
 * Pre-built campaign configurations ready to paste into Google Ads Editor.
 * Four campaigns covering the full acquisition funnel:
 *
 * 1. GLP-1 Weight Loss Renton (search, $50/day) - Primary revenue driver
 * 2. Peptide Therapy Seattle (search, $25/day) - Wellness category growth
 * 3. Medspa Renton (brand + services, $25/day) - Local brand dominance
 * 4. GLP-1 Retargeting (display, $15/day) - Conversion recovery
 *
 * All copy is written in Rina's brand voice: clinically confident,
 * luxury positioning, educational, never discount-first.
 */

// ── Types ────────────────────────────────────────────────────────────────

export interface GoogleAdsCampaign {
  name: string;
  type: 'search' | 'display' | 'performance_max';
  objective: string;
  dailyBudget: number;
  monthlyBudget: number;
  targetCPA?: number;
  targetROAS?: number;
  bidStrategy: string;
  geoTargeting: GeoTarget[];
  adSchedule: AdSchedule[];
  adGroups: GoogleAdGroup[];
  sitelinks: Sitelink[];
  calloutExtensions: string[];
  structuredSnippets: StructuredSnippet[];
  callExtension: CallExtension;
  locationExtension: LocationExtension;
}

export interface GeoTarget {
  location: string;
  radius?: number; // miles
  type: 'city' | 'zip' | 'radius' | 'state';
}

export interface AdSchedule {
  day: string;
  startHour: number;
  endHour: number;
}

export interface GoogleAdGroup {
  name: string;
  keywords: Keyword[];
  negativeKeywords: string[];
  responsiveSearchAds: ResponsiveSearchAd[];
  displayAds?: DisplayAd[];
}

export interface Keyword {
  text: string;
  matchType: 'broad' | 'phrase' | 'exact';
  estimatedCPC?: number;
}

export interface ResponsiveSearchAd {
  headlines: string[]; // up to 15, max 30 chars each
  descriptions: string[]; // up to 4, max 90 chars each
  finalUrl: string;
  path1?: string;
  path2?: string;
}

export interface DisplayAd {
  headline: string;
  longHeadline: string;
  description: string;
  businessName: string;
  finalUrl: string;
  imageSpecs: { size: string; description: string }[];
}

export interface Sitelink {
  text: string;
  description1: string;
  description2: string;
  finalUrl: string;
}

export interface StructuredSnippet {
  header: string;
  values: string[];
}

export interface CallExtension {
  phoneNumber: string;
  countryCode: string;
  callReporting: boolean;
}

export interface LocationExtension {
  businessName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
}

export interface GoogleAdsExport {
  campaigns: GoogleAdsCampaign[];
  totalDailyBudget: number;
  totalMonthlyBudget: number;
  totalKeywords: number;
  totalAds: number;
  csvContent: string;
}

// ── Shared Config ────────────────────────────────────────────────────────

const FINAL_URL_BASE = 'https://www.ranibeautyclinic.com';
const PHONE = '(425) 539-4440';

const GEO_TARGETS: GeoTarget[] = [
  { location: 'Renton, WA', type: 'city' },
  { location: 'Bellevue, WA', type: 'city' },
  { location: 'Kent, WA', type: 'city' },
  { location: 'Auburn, WA', type: 'city' },
  { location: 'Newcastle, WA', type: 'city' },
  { location: 'Tukwila, WA', type: 'city' },
  { location: 'Maple Valley, WA', type: 'city' },
  { location: 'Covington, WA', type: 'city' },
  { location: 'Issaquah, WA', type: 'city' },
  { location: 'Mercer Island, WA', type: 'city' },
  { location: 'SeaTac, WA', type: 'city' },
  { location: 'Federal Way, WA', type: 'city' },
  { location: '401 Olympia Ave NE, Renton, WA 98056', radius: 25, type: 'radius' },
];

const BUSINESS_HOURS_SCHEDULE: AdSchedule[] = [
  { day: 'Monday', startHour: 7, endHour: 21 },
  { day: 'Tuesday', startHour: 7, endHour: 21 },
  { day: 'Wednesday', startHour: 7, endHour: 21 },
  { day: 'Thursday', startHour: 7, endHour: 21 },
  { day: 'Friday', startHour: 7, endHour: 21 },
  { day: 'Saturday', startHour: 8, endHour: 18 },
  { day: 'Sunday', startHour: 10, endHour: 16 },
];

const SHARED_SITELINKS: Sitelink[] = [
  {
    text: 'Book a Consultation',
    description1: 'Free consultations available',
    description2: 'Meet with our expert team',
    finalUrl: `${FINAL_URL_BASE}/contact`,
  },
  {
    text: 'Our Services',
    description1: 'Full menu of treatments',
    description2: 'Injectables, laser, wellness',
    finalUrl: `${FINAL_URL_BASE}/wellness`,
  },
  {
    text: 'Weight Loss Programs',
    description1: 'Medical weight management',
    description2: 'GLP-1, peptides, and more',
    finalUrl: `${FINAL_URL_BASE}/weight-loss`,
  },
  {
    text: 'About Rani Beauty',
    description1: 'Physician-supervised medspa',
    description2: 'Renton, WA since 2023',
    finalUrl: `${FINAL_URL_BASE}/about`,
  },
  {
    text: 'View Real Results',
    description1: 'See actual patient outcomes',
    description2: 'Before and after gallery',
    finalUrl: `${FINAL_URL_BASE}/results`,
  },
  {
    text: 'Financing Available',
    description1: 'Afterpay, Cherry, PatientFi',
    description2: 'Affordable monthly payments',
    finalUrl: `${FINAL_URL_BASE}/financing/overview`,
  },
];

const SHARED_CALLOUTS: string[] = [
  'Physician Supervised',
  'Free Consultations',
  'Financing Available',
  'Renton Location',
  'Real Patient Results',
  'Luxury Medspa',
  'Personalized Plans',
  'Expert Providers',
  'Same Week Availability',
  'No Pressure Consultations',
];

const CALL_EXTENSION: CallExtension = {
  phoneNumber: PHONE,
  countryCode: 'US',
  callReporting: true,
};

const LOCATION_EXTENSION: LocationExtension = {
  businessName: 'Rani Beauty Clinic',
  address: '401 Olympia Ave NE, Suite 101',
  city: 'Renton',
  state: 'WA',
  zip: '98056',
  phone: PHONE,
};

// ── Campaign 1: GLP-1 Weight Loss Renton ────────────────────────────────

function buildGLP1Campaign(): GoogleAdsCampaign {
  return {
    name: 'GLP-1 Weight Loss Renton',
    type: 'search',
    objective: 'Conversions - Lead form submissions and phone calls',
    dailyBudget: 50,
    monthlyBudget: 1500,
    targetCPA: 75,
    bidStrategy: 'Maximize Conversions with Target CPA',
    geoTargeting: GEO_TARGETS,
    adSchedule: BUSINESS_HOURS_SCHEDULE,
    adGroups: [
      {
        name: 'GLP-1 - Semaglutide',
        keywords: [
          { text: 'semaglutide near me', matchType: 'phrase', estimatedCPC: 8.50 },
          { text: 'semaglutide renton', matchType: 'exact', estimatedCPC: 6.00 },
          { text: 'semaglutide weight loss seattle', matchType: 'phrase', estimatedCPC: 9.00 },
          { text: 'semaglutide clinic near me', matchType: 'phrase', estimatedCPC: 7.50 },
          { text: 'semaglutide injection near me', matchType: 'phrase', estimatedCPC: 8.00 },
          { text: 'semaglutide prescription washington', matchType: 'phrase', estimatedCPC: 7.00 },
          { text: 'semaglutide doctor renton', matchType: 'exact', estimatedCPC: 5.50 },
          { text: 'where to get semaglutide', matchType: 'phrase', estimatedCPC: 6.50 },
          { text: 'semaglutide cost renton', matchType: 'exact', estimatedCPC: 5.00 },
          { text: 'semaglutide provider bellevue', matchType: 'phrase', estimatedCPC: 7.00 },
        ],
        negativeKeywords: [
          'free', 'cheap', 'coupon', 'discount code', 'DIY', 'online pharmacy',
          'reddit', 'side effects lawsuit', 'class action', 'compounding pharmacy',
          'telehealth only', 'ozempic shortage', 'insurance coverage',
          'mounjaro coupon', 'at home', 'without prescription',
        ],
        responsiveSearchAds: [{
          headlines: [
            'Medical Weight Loss Renton',    // 30 chars
            'Semaglutide in Renton WA',      // 25 chars
            'GLP-1 Weight Loss Program',     // 25 chars
            'Physician Supervised Care',     // 25 chars
            'Lose Weight With GLP-1',        // 22 chars
            'Semaglutide Starting $399',     // 25 chars
            'Expert Weight Loss Clinic',     // 25 chars
            'Real Results, Real Patients',   // 28 chars
            'Book Your Free Consult',        // 22 chars
            'Medically Guided Weight Loss',  // 29 chars
            'Trusted Renton Medspa',         // 22 chars
            'Personalized Weight Programs',  // 29 chars
            'Start Your Transformation',     // 25 chars
            'GLP-1 Injections Available',    // 26 chars
            'Rani Beauty Clinic Renton',     // 26 chars
          ],
          descriptions: [
            'Physician-supervised GLP-1 weight loss programs starting at $399/mo. Personalized care in Renton.',
            'Join hundreds of patients who have transformed their lives with medical weight management at Rani.',
            'Free consultation. Personalized dosing. Ongoing support. Start your weight loss journey today.',
            'Trusted by patients across Renton, Bellevue, and Kent. Results you can see, care you can trust.',
          ],
          finalUrl: `${FINAL_URL_BASE}/weight-loss`,
          path1: 'weight-loss',
          path2: 'GLP-1',
        }],
      },
      {
        name: 'GLP-1 - Tirzepatide',
        keywords: [
          { text: 'tirzepatide near me', matchType: 'phrase', estimatedCPC: 9.00 },
          { text: 'tirzepatide washington', matchType: 'phrase', estimatedCPC: 7.50 },
          { text: 'tirzepatide renton', matchType: 'exact', estimatedCPC: 6.00 },
          { text: 'tirzepatide clinic seattle area', matchType: 'phrase', estimatedCPC: 8.50 },
          { text: 'tirzepatide for weight loss', matchType: 'phrase', estimatedCPC: 8.00 },
          { text: 'tirzepatide prescription', matchType: 'phrase', estimatedCPC: 7.00 },
          { text: 'mounjaro alternative renton', matchType: 'phrase', estimatedCPC: 6.50 },
        ],
        negativeKeywords: [
          'free', 'cheap', 'coupon', 'DIY', 'at home', 'without prescription',
          'compounding', 'online only', 'telehealth', 'insurance',
        ],
        responsiveSearchAds: [{
          headlines: [
            'Tirzepatide Weight Loss',       // 23 chars
            'Tirzepatide in Renton WA',      // 25 chars
            'Advanced GLP-1 Therapy',         // 22 chars
            'Next-Gen Weight Loss Here',     // 25 chars
            'Dual Action Weight Loss',       // 23 chars
            'Expert Tirzepatide Dosing',     // 25 chars
            'Physician Monitored Care',      // 24 chars
            'Premium Weight Management',     // 25 chars
            'Start Losing Weight Today',     // 25 chars
            'Tirzepatide Programs $499',     // 25 chars
            'Medically Supervised',          // 20 chars
            'Free Weight Loss Consult',      // 24 chars
            'Trusted Local Provider',        // 22 chars
            'See Real Patient Results',      // 24 chars
            'Rani Beauty Clinic',            // 19 chars
          ],
          descriptions: [
            'Tirzepatide weight loss programs with physician oversight. Personalized dosing and ongoing support.',
            'The newest advancement in medical weight management, available now at Rani Beauty Clinic in Renton.',
            'Free consultation to see if tirzepatide is right for you. No pressure, just expert guidance.',
            'Serving Renton, Bellevue, Kent, and the greater Seattle area. Book your consultation today.',
          ],
          finalUrl: `${FINAL_URL_BASE}/weight-loss`,
          path1: 'weight-loss',
          path2: 'tirzepatide',
        }],
      },
      {
        name: 'GLP-1 - General Weight Loss',
        keywords: [
          { text: 'medical weight loss renton', matchType: 'exact', estimatedCPC: 7.00 },
          { text: 'medical weight loss near me', matchType: 'phrase', estimatedCPC: 8.00 },
          { text: 'weight loss clinic renton wa', matchType: 'exact', estimatedCPC: 6.50 },
          { text: 'weight loss doctor near me', matchType: 'phrase', estimatedCPC: 7.50 },
          { text: 'weight loss injection near me', matchType: 'phrase', estimatedCPC: 8.50 },
          { text: 'medical weight loss bellevue', matchType: 'phrase', estimatedCPC: 7.50 },
          { text: 'weight loss clinic kent wa', matchType: 'phrase', estimatedCPC: 6.00 },
          { text: 'weight management program', matchType: 'phrase', estimatedCPC: 5.50 },
          { text: 'prescription weight loss', matchType: 'phrase', estimatedCPC: 7.00 },
          { text: 'lose weight fast safely', matchType: 'phrase', estimatedCPC: 5.00 },
          { text: 'weight loss clinic auburn wa', matchType: 'phrase', estimatedCPC: 5.50 },
          { text: 'obesity treatment renton', matchType: 'phrase', estimatedCPC: 6.00 },
          { text: 'glp-1 weight loss', matchType: 'phrase', estimatedCPC: 8.00 },
          { text: 'weight loss medication near me', matchType: 'phrase', estimatedCPC: 7.50 },
        ],
        negativeKeywords: [
          'surgery', 'bariatric', 'gastric bypass', 'lap band', 'free',
          'cheap', 'DIY', 'home remedy', 'supplement', 'pill',
          'diet plan only', 'gym', 'personal trainer',
        ],
        responsiveSearchAds: [{
          headlines: [
            'Medical Weight Loss Clinic',    // 25 chars
            'Lose Weight With Expert Care',  // 28 chars
            'Weight Loss Clinic Renton',     // 25 chars
            'Doctor Supervised Programs',    // 26 chars
            'Start Losing Weight Today',     // 25 chars
            'Proven Medical Weight Loss',    // 26 chars
            'Customized Weight Programs',    // 26 chars
            'Free Weight Loss Consult',      // 24 chars
            'Results You Can See',           // 19 chars
            'Trusted by Hundreds',           // 19 chars
            'Renton Weight Loss Experts',    // 26 chars
            'Affordable Monthly Plans',      // 24 chars
            'Programs From $399/Month',      // 24 chars
            'Your Weight Loss Journey',      // 24 chars
            'Rani Beauty Clinic',            // 19 chars
          ],
          descriptions: [
            'Physician-supervised weight loss programs in Renton WA. Personalized plans with ongoing support.',
            'Medical weight management that works. Free consultations, flexible financing, real patient results.',
            'Join patients across the greater Seattle area who chose Rani for their weight loss transformation.',
            'No crash diets. No gimmicks. Medically guided weight loss with proven GLP-1 medications.',
          ],
          finalUrl: `${FINAL_URL_BASE}/weight-loss`,
          path1: 'weight-loss',
          path2: 'programs',
        }],
      },
    ],
    sitelinks: SHARED_SITELINKS.slice(0, 4),
    calloutExtensions: SHARED_CALLOUTS.slice(0, 6),
    structuredSnippets: [
      { header: 'Types', values: ['Semaglutide', 'Tirzepatide', 'GLP-1 Injections', 'Peptide Therapy'] },
      { header: 'Amenities', values: ['Free Consultations', 'Financing Options', 'Personalized Dosing', 'Ongoing Support'] },
    ],
    callExtension: CALL_EXTENSION,
    locationExtension: LOCATION_EXTENSION,
  };
}

// ── Campaign 2: Peptide Therapy Seattle ────────────────────────────────

function buildPeptideCampaign(): GoogleAdsCampaign {
  return {
    name: 'Peptide Therapy Seattle',
    type: 'search',
    objective: 'Conversions - Lead form submissions',
    dailyBudget: 25,
    monthlyBudget: 750,
    targetCPA: 60,
    bidStrategy: 'Maximize Conversions with Target CPA',
    geoTargeting: GEO_TARGETS,
    adSchedule: BUSINESS_HOURS_SCHEDULE,
    adGroups: [
      {
        name: 'Peptide Therapy - General',
        keywords: [
          { text: 'peptide therapy near me', matchType: 'phrase', estimatedCPC: 6.00 },
          { text: 'peptide therapy seattle', matchType: 'phrase', estimatedCPC: 5.50 },
          { text: 'peptide therapy renton', matchType: 'exact', estimatedCPC: 4.50 },
          { text: 'peptide injections near me', matchType: 'phrase', estimatedCPC: 5.00 },
          { text: 'bpc-157 therapy', matchType: 'phrase', estimatedCPC: 5.50 },
          { text: 'peptide clinic washington', matchType: 'phrase', estimatedCPC: 5.00 },
          { text: 'anti-aging peptides', matchType: 'phrase', estimatedCPC: 4.50 },
          { text: 'nad+ injection near me', matchType: 'phrase', estimatedCPC: 6.00 },
          { text: 'nad+ therapy seattle', matchType: 'phrase', estimatedCPC: 5.50 },
          { text: 'nad+ therapy renton', matchType: 'exact', estimatedCPC: 4.00 },
          { text: 'wellness injections near me', matchType: 'phrase', estimatedCPC: 4.00 },
          { text: 'vitamin injection clinic', matchType: 'phrase', estimatedCPC: 3.50 },
          { text: 'glutathione injection near me', matchType: 'phrase', estimatedCPC: 4.50 },
          { text: 'immune boost injection', matchType: 'phrase', estimatedCPC: 3.50 },
          { text: 'b12 injection clinic near me', matchType: 'phrase', estimatedCPC: 3.00 },
        ],
        negativeKeywords: [
          'bodybuilding', 'steroids', 'buy online', 'DIY', 'research chemical',
          'for sale', 'wholesale', 'self inject', 'without doctor',
          'side effects lawsuit', 'dangerous',
        ],
        responsiveSearchAds: [{
          headlines: [
            'Peptide Therapy Renton WA',     // 24 chars
            'Medical Peptide Programs',       // 23 chars
            'NAD+ Injections Available',      // 25 chars
            'Wellness Injections Clinic',     // 26 chars
            'Expert Peptide Providers',       // 24 chars
            'Physician Supervised Care',      // 25 chars
            'Anti-Aging Peptide Therapy',     // 26 chars
            'B12 & Glutathione Shots',        // 23 chars
            'Immune Boost Injections',        // 23 chars
            'Feel Your Best Every Day',       // 24 chars
            'Book Your Wellness Visit',       // 25 chars
            'Trusted Renton Provider',        // 23 chars
            'Wellness Starting at $35',       // 24 chars
            'Personalized Protocols',         // 22 chars
            'Rani Beauty Clinic',             // 19 chars
          ],
          descriptions: [
            'Medical-grade peptide therapy at Rani Beauty Clinic. NAD+, B12, glutathione, and more. Renton WA.',
            'Physician-supervised wellness injections for energy, immunity, and anti-aging. Free consultations.',
            'From B12 to NAD+, our injectable wellness menu helps you feel and perform at your peak. Visit us.',
            'Serving Renton, Bellevue, Kent, and beyond. Walk-ins welcome for select wellness injections.',
          ],
          finalUrl: `${FINAL_URL_BASE}/wellness`,
          path1: 'wellness',
          path2: 'peptides',
        }],
      },
    ],
    sitelinks: SHARED_SITELINKS.slice(0, 4),
    calloutExtensions: ['NAD+ Available', 'B12 Shots $35', 'Walk-Ins Welcome', 'Immune Boosters', 'Expert Providers', 'Free Consults'],
    structuredSnippets: [
      { header: 'Types', values: ['NAD+', 'B12', 'Glutathione', 'Tri-Immune', 'Vitamin D3'] },
      { header: 'Amenities', values: ['Walk-In Friendly', 'Physician Supervised', 'Quick Visits', 'Affordable Pricing'] },
    ],
    callExtension: CALL_EXTENSION,
    locationExtension: LOCATION_EXTENSION,
  };
}

// ── Campaign 3: Medspa Renton ────────────────────────────────────────

function buildMedspaCampaign(): GoogleAdsCampaign {
  return {
    name: 'Medspa Renton - Brand + Services',
    type: 'search',
    objective: 'Conversions - Consultation bookings',
    dailyBudget: 25,
    monthlyBudget: 750,
    targetCPA: 50,
    bidStrategy: 'Maximize Conversions with Target CPA',
    geoTargeting: GEO_TARGETS,
    adSchedule: BUSINESS_HOURS_SCHEDULE,
    adGroups: [
      {
        name: 'Brand - Rani Beauty Clinic',
        keywords: [
          { text: 'rani beauty clinic', matchType: 'exact', estimatedCPC: 1.50 },
          { text: 'rani beauty clinic renton', matchType: 'exact', estimatedCPC: 1.00 },
          { text: 'rani beauty renton', matchType: 'exact', estimatedCPC: 1.00 },
          { text: 'rani medspa', matchType: 'exact', estimatedCPC: 1.50 },
          { text: 'rani beauty clinic reviews', matchType: 'exact', estimatedCPC: 0.75 },
        ],
        negativeKeywords: ['jobs', 'hiring', 'salary', 'careers'],
        responsiveSearchAds: [{
          headlines: [
            'Rani Beauty Clinic Renton',     // 25 chars
            'Official Rani Beauty Site',      // 25 chars
            'Luxury Medspa in Renton',        // 23 chars
            'Book With Rani Today',           // 20 chars
            'Physician Supervised Care',      // 25 chars
            'Where Beauty Meets Science',     // 26 chars
            'Trusted Renton Medspa',          // 22 chars
            'Free Consultations',             // 19 chars
            'See Our 5-Star Reviews',         // 22 chars
            'Injectables & Laser',            // 19 chars
            'GLP-1 Weight Loss',              // 18 chars
            'HydraFacial & Peels',            // 19 chars
            'Sofwave Skin Tightening',        // 24 chars
            'Full Service Medspa',            // 19 chars
            'Rani Beauty Clinic',             // 19 chars
          ],
          descriptions: [
            'The official site for Rani Beauty Clinic. Luxury medspa in Renton WA. Injectables, laser, wellness.',
            'Physician-supervised treatments by Rina Rai. Free consultations for all new patients. Book today.',
            'Sofwave, HydraFacial, GLP-1, peptides, and more. Real results for real patients at Rani Beauty.',
            'Located at 401 Olympia Ave NE in Renton. Serving Bellevue, Kent, Auburn. Call (425) 539-4440.',
          ],
          finalUrl: FINAL_URL_BASE,
          path1: 'medspa',
          path2: 'renton',
        }],
      },
      {
        name: 'Services - Medspa General',
        keywords: [
          { text: 'medspa renton', matchType: 'exact', estimatedCPC: 5.00 },
          { text: 'medspa near me', matchType: 'phrase', estimatedCPC: 6.00 },
          { text: 'medical spa renton wa', matchType: 'exact', estimatedCPC: 5.50 },
          { text: 'medspa bellevue', matchType: 'phrase', estimatedCPC: 7.00 },
          { text: 'hydrafacial renton', matchType: 'exact', estimatedCPC: 4.50 },
          { text: 'hydrafacial near me', matchType: 'phrase', estimatedCPC: 5.00 },
          { text: 'botox renton wa', matchType: 'exact', estimatedCPC: 6.00 },
          { text: 'botox near me', matchType: 'phrase', estimatedCPC: 7.00 },
          { text: 'laser hair removal renton', matchType: 'exact', estimatedCPC: 5.00 },
          { text: 'chemical peel near me', matchType: 'phrase', estimatedCPC: 4.50 },
          { text: 'skin tightening renton', matchType: 'exact', estimatedCPC: 5.00 },
          { text: 'sofwave near me', matchType: 'phrase', estimatedCPC: 6.50 },
          { text: 'rf microneedling renton', matchType: 'exact', estimatedCPC: 5.00 },
          { text: 'vi peel near me', matchType: 'phrase', estimatedCPC: 4.00 },
          { text: 'picoway laser renton', matchType: 'exact', estimatedCPC: 5.00 },
        ],
        negativeKeywords: [
          'DIY', 'at home', 'cheap', 'free', 'groupon', 'training',
          'certification', 'school', 'how to', 'salon', 'nail',
        ],
        responsiveSearchAds: [{
          headlines: [
            'Top Rated Renton Medspa',       // 22 chars
            'Luxury Medspa Near You',         // 22 chars
            'HydraFacial From $249',          // 21 chars
            'Expert Botox & Fillers',         // 22 chars
            'Sofwave Skin Tightening',        // 24 chars
            'Laser Hair Removal',             // 19 chars
            'RF Microneedling Experts',       // 24 chars
            'Free Medspa Consultation',       // 24 chars
            'Physician Supervised',           // 20 chars
            'See Our Real Results',           // 20 chars
            '5-Star Rated Medspa',            // 20 chars
            'Serving Renton & Bellevue',      // 26 chars
            'Book Your Visit Today',          // 21 chars
            'Financing Available',            // 19 chars
            'Rani Beauty Clinic',             // 19 chars
          ],
          descriptions: [
            'Full-service luxury medspa in Renton. HydraFacial, Botox, Sofwave, laser, and medical weight loss.',
            'Free consultations for all new patients. Financing available. Real results from real providers.',
            'Physician-supervised care in a luxury environment. Injectables, facials, laser, and body treatments.',
            'Rated 5 stars by our patients. Visit Rani Beauty Clinic at 401 Olympia Ave NE, Renton WA 98056.',
          ],
          finalUrl: `${FINAL_URL_BASE}/wellness`,
          path1: 'medspa',
          path2: 'services',
        }],
      },
    ],
    sitelinks: SHARED_SITELINKS,
    calloutExtensions: SHARED_CALLOUTS,
    structuredSnippets: [
      { header: 'Service catalog', values: ['HydraFacial', 'Botox', 'Fillers', 'Sofwave', 'Laser Hair Removal', 'GLP-1 Weight Loss'] },
      { header: 'Neighborhoods', values: ['Renton', 'Bellevue', 'Kent', 'Auburn', 'Newcastle', 'Tukwila'] },
    ],
    callExtension: CALL_EXTENSION,
    locationExtension: LOCATION_EXTENSION,
  };
}

// ── Campaign 4: GLP-1 Retargeting ────────────────────────────────────

function buildRetargetingCampaign(): GoogleAdsCampaign {
  return {
    name: 'GLP-1 Retargeting - Display',
    type: 'display',
    objective: 'Conversions - Return website visitors',
    dailyBudget: 15,
    monthlyBudget: 450,
    targetCPA: 40,
    bidStrategy: 'Maximize Conversions',
    geoTargeting: GEO_TARGETS,
    adSchedule: BUSINESS_HOURS_SCHEDULE,
    adGroups: [
      {
        name: 'Retargeting - Weight Loss Pages',
        keywords: [], // display targeting uses audiences, not keywords
        negativeKeywords: [],
        responsiveSearchAds: [],
        displayAds: [
          {
            headline: 'Ready to Start Your Weight Loss Journey?',
            longHeadline: 'Medical Weight Loss at Rani Beauty Clinic. Free Consultation Available.',
            description: 'You visited us for a reason. Physician-supervised GLP-1 programs starting at $399/mo. Book your free consultation.',
            businessName: 'Rani Beauty Clinic',
            finalUrl: `${FINAL_URL_BASE}/weight-loss`,
            imageSpecs: [
              { size: '1200x628', description: 'Landscape: Clean lifestyle photo, woman looking confident, Navy #0F1D2C text overlay with Gold #C9A96E accents. "Your transformation starts here" with Rani logo.' },
              { size: '1080x1080', description: 'Square: Before/after style split image (illustration only, no real patients without consent). Gold border, clinic logo, "Medical Weight Loss From $399/mo"' },
              { size: '300x250', description: 'Medium rectangle: Navy background, gold text "Still thinking about it?", Rani logo, CTA button "Book Free Consult"' },
            ],
          },
          {
            headline: 'Your Weight Loss Consultation is Free',
            longHeadline: 'No Commitment. No Pressure. Just Expert Guidance at Rani Beauty Clinic.',
            description: 'Personalized GLP-1 programs. Physician supervised. Financing available. Take the first step today.',
            businessName: 'Rani Beauty Clinic',
            finalUrl: `${FINAL_URL_BASE}/contact`,
            imageSpecs: [
              { size: '1200x628', description: 'Landscape: Warm clinic interior or consultation setting. Gold text "Free Consultation" with Rani branding. Professional, inviting aesthetic.' },
              { size: '1080x1080', description: 'Square: Patient testimonial style (with consent). Quote about experience. Navy and cream palette.' },
              { size: '300x250', description: 'Medium rectangle: Cream background, navy text "We are here when you are ready", gold CTA button "Schedule Now"' },
            ],
          },
        ],
      },
      {
        name: 'Retargeting - Service Pages',
        keywords: [],
        negativeKeywords: [],
        responsiveSearchAds: [],
        displayAds: [
          {
            headline: 'Your Skin Deserves Expert Care',
            longHeadline: 'Luxury Medspa Treatments at Rani Beauty Clinic. Renton WA.',
            description: 'HydraFacial, Botox, Sofwave, and more. Physician-supervised care with real results. Book today.',
            businessName: 'Rani Beauty Clinic',
            finalUrl: `${FINAL_URL_BASE}/wellness`,
            imageSpecs: [
              { size: '1200x628', description: 'Landscape: Beautiful skin close-up or treatment room. Gold overlay "Luxury Care, Real Results". Rani branding.' },
              { size: '300x250', description: 'Medium rectangle: Navy background, gold text with service highlights. CTA "Book Your Treatment".' },
            ],
          },
        ],
      },
    ],
    sitelinks: SHARED_SITELINKS.slice(0, 4),
    calloutExtensions: SHARED_CALLOUTS.slice(0, 4),
    structuredSnippets: [],
    callExtension: CALL_EXTENSION,
    locationExtension: LOCATION_EXTENSION,
  };
}

// ── Export Functions ────────────────────────────────────────────────────

/**
 * Build all four Google Ads campaigns.
 */
export function buildAllCampaigns(): GoogleAdsExport {
  const campaigns = [
    buildGLP1Campaign(),
    buildPeptideCampaign(),
    buildMedspaCampaign(),
    buildRetargetingCampaign(),
  ];

  const totalDailyBudget = campaigns.reduce((s, c) => s + c.dailyBudget, 0);
  const totalMonthlyBudget = campaigns.reduce((s, c) => s + c.monthlyBudget, 0);
  const totalKeywords = campaigns.reduce((s, c) =>
    s + c.adGroups.reduce((gs, g) => gs + g.keywords.length, 0), 0);
  const totalAds = campaigns.reduce((s, c) =>
    s + c.adGroups.reduce((gs, g) =>
      gs + g.responsiveSearchAds.length + (g.displayAds?.length || 0), 0), 0);

  const csvContent = generateGoogleAdsCSV(campaigns);

  return {
    campaigns,
    totalDailyBudget,
    totalMonthlyBudget,
    totalKeywords,
    totalAds,
    csvContent,
  };
}

/**
 * Generate Google Ads Editor compatible CSV.
 */
export function generateGoogleAdsCSV(campaigns: GoogleAdsCampaign[]): string {
  const lines: string[] = [];

  // Campaign rows
  lines.push('Campaign,Campaign Type,Daily Budget,Bid Strategy,Campaign Status');
  for (const c of campaigns) {
    lines.push(`"${c.name}",${c.type},${c.dailyBudget},"${c.bidStrategy}",Active`);
  }

  lines.push('');
  lines.push('Campaign,Ad Group,Keyword,Match Type,Status');

  // Keyword rows
  for (const c of campaigns) {
    for (const g of c.adGroups) {
      for (const k of g.keywords) {
        const matchPrefix = k.matchType === 'exact' ? `[${k.text}]` :
          k.matchType === 'phrase' ? `"${k.text}"` : k.text;
        lines.push(`"${c.name}","${g.name}","${matchPrefix}",${k.matchType},Active`);
      }
    }
  }

  lines.push('');
  lines.push('Campaign,Ad Group,Negative Keyword,Match Type');

  // Negative keyword rows
  for (const c of campaigns) {
    for (const g of c.adGroups) {
      for (const nk of g.negativeKeywords) {
        lines.push(`"${c.name}","${g.name}","${nk}",phrase`);
      }
    }
  }

  lines.push('');
  lines.push('Campaign,Ad Group,Headline 1,Headline 2,Headline 3,Description 1,Description 2,Final URL,Path 1,Path 2');

  // Ad rows
  for (const c of campaigns) {
    for (const g of c.adGroups) {
      for (const ad of g.responsiveSearchAds) {
        lines.push([
          `"${c.name}"`,
          `"${g.name}"`,
          `"${ad.headlines[0]}"`,
          `"${ad.headlines[1]}"`,
          `"${ad.headlines[2]}"`,
          `"${ad.descriptions[0]}"`,
          `"${ad.descriptions[1]}"`,
          ad.finalUrl,
          ad.path1 || '',
          ad.path2 || '',
        ].join(','));
      }
    }
  }

  lines.push('');
  lines.push('Campaign,Sitelink Text,Description 1,Description 2,Final URL');

  // Sitelink rows
  for (const c of campaigns) {
    for (const sl of c.sitelinks) {
      lines.push(`"${c.name}","${sl.text}","${sl.description1}","${sl.description2}","${sl.finalUrl}"`);
    }
  }

  return lines.join('\n');
}

/**
 * Get a single campaign by name.
 */
export function getCampaign(name: string): GoogleAdsCampaign | null {
  const all = buildAllCampaigns();
  return all.campaigns.find(c => c.name.toLowerCase().includes(name.toLowerCase())) || null;
}

/**
 * Get keyword count and budget summary.
 */
export function getBudgetSummary(): {
  campaigns: { name: string; daily: number; monthly: number; keywords: number }[];
  totalDaily: number;
  totalMonthly: number;
  totalAnnual: number;
} {
  const all = buildAllCampaigns();

  return {
    campaigns: all.campaigns.map(c => ({
      name: c.name,
      daily: c.dailyBudget,
      monthly: c.monthlyBudget,
      keywords: c.adGroups.reduce((s, g) => s + g.keywords.length, 0),
    })),
    totalDaily: all.totalDailyBudget,
    totalMonthly: all.totalMonthlyBudget,
    totalAnnual: all.totalMonthlyBudget * 12,
  };
}
