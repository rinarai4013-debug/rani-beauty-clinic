/**
 * Ads War Machine - Keyword Library
 *
 * Comprehensive keyword database for Google Ads campaigns.
 * Every keyword includes match type, estimated CPC, competition level,
 * and intent scoring for prioritization.
 *
 * Geo: Renton, WA + surrounding PNW cities
 * CRITICAL: Always "injection" - never "infusion."
 */

// ── TYPES ──

export type MatchType = 'exact' | 'phrase' | 'broad';
export type CompetitionLevel = 'low' | 'medium' | 'high';
export type IntentType = 'informational' | 'navigational' | 'commercial' | 'transactional';

export interface Keyword {
  term: string;
  matchType: MatchType;
  estimatedCPC: number;
  competition: CompetitionLevel;
  intentScore: number; // 1-10, 10 = highest purchase intent
  intentType: IntentType;
  monthlyVolume: number;
  category: KeywordCategory;
  serviceId?: string;
  landingPage?: string;
}

export type KeywordCategory =
  | 'glp1_weight_loss'
  | 'peptide_therapy'
  | 'hormone_therapy'
  | 'aesthetic_injectable'
  | 'aesthetic_laser'
  | 'aesthetic_facial'
  | 'wellness_injection'
  | 'local_geo'
  | 'long_tail'
  | 'competitor'
  | 'brand';

export interface NegativeKeyword {
  term: string;
  matchType: MatchType;
  reason: string;
}

// ── GLP-1 / WEIGHT LOSS KEYWORDS (110) ──

export const GLP1_KEYWORDS: Keyword[] = [
  // High intent - transactional
  { term: 'semaglutide near me', matchType: 'exact', estimatedCPC: 18.50, competition: 'high', intentScore: 9, intentType: 'transactional', monthlyVolume: 4400, category: 'glp1_weight_loss', serviceId: 'glp1', landingPage: '/services/glp-1-weight-loss' },
  { term: 'semaglutide renton wa', matchType: 'exact', estimatedCPC: 14.20, competition: 'medium', intentScore: 10, intentType: 'transactional', monthlyVolume: 320, category: 'glp1_weight_loss', serviceId: 'glp1', landingPage: '/services/glp-1-weight-loss' },
  { term: 'semaglutide clinic renton', matchType: 'exact', estimatedCPC: 15.00, competition: 'medium', intentScore: 10, intentType: 'transactional', monthlyVolume: 210, category: 'glp1_weight_loss', serviceId: 'glp1', landingPage: '/services/glp-1-weight-loss' },
  { term: 'medical weight loss renton', matchType: 'exact', estimatedCPC: 12.30, competition: 'high', intentScore: 9, intentType: 'transactional', monthlyVolume: 590, category: 'glp1_weight_loss', serviceId: 'glp1', landingPage: '/services/glp-1-weight-loss' },
  { term: 'medical weight loss near me', matchType: 'exact', estimatedCPC: 16.80, competition: 'high', intentScore: 9, intentType: 'transactional', monthlyVolume: 6600, category: 'glp1_weight_loss', serviceId: 'glp1', landingPage: '/services/glp-1-weight-loss' },
  { term: 'glp-1 weight loss program', matchType: 'exact', estimatedCPC: 14.50, competition: 'high', intentScore: 8, intentType: 'commercial', monthlyVolume: 3200, category: 'glp1_weight_loss', serviceId: 'glp1', landingPage: '/services/glp-1-weight-loss' },
  { term: 'glp-1 injections near me', matchType: 'exact', estimatedCPC: 17.20, competition: 'high', intentScore: 9, intentType: 'transactional', monthlyVolume: 2900, category: 'glp1_weight_loss', serviceId: 'glp1', landingPage: '/services/glp-1-weight-loss' },
  { term: 'weight loss clinic renton', matchType: 'exact', estimatedCPC: 11.40, competition: 'medium', intentScore: 9, intentType: 'transactional', monthlyVolume: 480, category: 'glp1_weight_loss', serviceId: 'glp1', landingPage: '/services/glp-1-weight-loss' },
  { term: 'semaglutide cost', matchType: 'phrase', estimatedCPC: 8.90, competition: 'high', intentScore: 7, intentType: 'commercial', monthlyVolume: 14000, category: 'glp1_weight_loss', serviceId: 'glp1', landingPage: '/services/glp-1-weight-loss' },
  { term: 'semaglutide injection weight loss', matchType: 'phrase', estimatedCPC: 13.40, competition: 'high', intentScore: 8, intentType: 'commercial', monthlyVolume: 5400, category: 'glp1_weight_loss', serviceId: 'glp1', landingPage: '/services/glp-1-weight-loss' },
  { term: 'tirzepatide near me', matchType: 'exact', estimatedCPC: 16.50, competition: 'high', intentScore: 9, intentType: 'transactional', monthlyVolume: 3800, category: 'glp1_weight_loss', serviceId: 'glp1', landingPage: '/services/glp-1-weight-loss' },
  { term: 'tirzepatide renton', matchType: 'exact', estimatedCPC: 13.00, competition: 'medium', intentScore: 10, intentType: 'transactional', monthlyVolume: 170, category: 'glp1_weight_loss', serviceId: 'glp1', landingPage: '/services/glp-1-weight-loss' },
  { term: 'wegovy alternative renton', matchType: 'exact', estimatedCPC: 11.80, competition: 'low', intentScore: 8, intentType: 'commercial', monthlyVolume: 90, category: 'glp1_weight_loss', serviceId: 'glp1', landingPage: '/services/glp-1-weight-loss' },
  { term: 'ozempic for weight loss renton', matchType: 'exact', estimatedCPC: 10.50, competition: 'medium', intentScore: 8, intentType: 'commercial', monthlyVolume: 260, category: 'glp1_weight_loss', serviceId: 'glp1', landingPage: '/services/glp-1-weight-loss' },
  { term: 'physician supervised weight loss', matchType: 'phrase', estimatedCPC: 9.80, competition: 'medium', intentScore: 8, intentType: 'commercial', monthlyVolume: 1400, category: 'glp1_weight_loss', serviceId: 'glp1', landingPage: '/services/glp-1-weight-loss' },
  { term: 'weight loss injections', matchType: 'phrase', estimatedCPC: 12.60, competition: 'high', intentScore: 8, intentType: 'commercial', monthlyVolume: 8100, category: 'glp1_weight_loss', serviceId: 'glp1', landingPage: '/services/glp-1-weight-loss' },
  { term: 'weight loss shots near me', matchType: 'exact', estimatedCPC: 15.30, competition: 'high', intentScore: 9, intentType: 'transactional', monthlyVolume: 3600, category: 'glp1_weight_loss', serviceId: 'glp1', landingPage: '/services/glp-1-weight-loss' },
  { term: 'compounded semaglutide', matchType: 'phrase', estimatedCPC: 11.20, competition: 'medium', intentScore: 7, intentType: 'commercial', monthlyVolume: 4200, category: 'glp1_weight_loss', serviceId: 'glp1', landingPage: '/services/glp-1-weight-loss' },
  { term: 'weight loss medication renton wa', matchType: 'exact', estimatedCPC: 10.90, competition: 'low', intentScore: 9, intentType: 'transactional', monthlyVolume: 190, category: 'glp1_weight_loss', serviceId: 'glp1', landingPage: '/services/glp-1-weight-loss' },
  { term: 'body transformation program', matchType: 'phrase', estimatedCPC: 7.50, competition: 'medium', intentScore: 6, intentType: 'commercial', monthlyVolume: 2400, category: 'glp1_weight_loss', serviceId: 'glp1', landingPage: '/services/glp-1-weight-loss' },
  // Commercial / informational
  { term: 'semaglutide results', matchType: 'phrase', estimatedCPC: 6.40, competition: 'high', intentScore: 6, intentType: 'informational', monthlyVolume: 12000, category: 'glp1_weight_loss', serviceId: 'glp1', landingPage: '/services/glp-1-weight-loss' },
  { term: 'how does semaglutide work', matchType: 'phrase', estimatedCPC: 4.20, competition: 'medium', intentScore: 5, intentType: 'informational', monthlyVolume: 9800, category: 'glp1_weight_loss', serviceId: 'glp1', landingPage: '/services/glp-1-weight-loss' },
  { term: 'semaglutide side effects', matchType: 'phrase', estimatedCPC: 3.80, competition: 'medium', intentScore: 5, intentType: 'informational', monthlyVolume: 18000, category: 'glp1_weight_loss', serviceId: 'glp1' },
  { term: 'glp-1 before and after', matchType: 'phrase', estimatedCPC: 5.60, competition: 'medium', intentScore: 6, intentType: 'informational', monthlyVolume: 7200, category: 'glp1_weight_loss', serviceId: 'glp1' },
  { term: 'medical weight loss program cost', matchType: 'phrase', estimatedCPC: 9.10, competition: 'medium', intentScore: 7, intentType: 'commercial', monthlyVolume: 3100, category: 'glp1_weight_loss', serviceId: 'glp1', landingPage: '/services/glp-1-weight-loss' },
  // Broad match discovery
  { term: 'lose weight fast safely', matchType: 'broad', estimatedCPC: 6.20, competition: 'high', intentScore: 5, intentType: 'informational', monthlyVolume: 22000, category: 'glp1_weight_loss', serviceId: 'glp1' },
  { term: 'weight loss help seattle area', matchType: 'broad', estimatedCPC: 8.40, competition: 'medium', intentScore: 7, intentType: 'commercial', monthlyVolume: 880, category: 'glp1_weight_loss', serviceId: 'glp1', landingPage: '/services/glp-1-weight-loss' },
  { term: 'prescription weight loss wa', matchType: 'phrase', estimatedCPC: 10.20, competition: 'medium', intentScore: 8, intentType: 'commercial', monthlyVolume: 720, category: 'glp1_weight_loss', serviceId: 'glp1', landingPage: '/services/glp-1-weight-loss' },
  { term: 'best weight loss clinic bellevue', matchType: 'exact', estimatedCPC: 13.80, competition: 'high', intentScore: 9, intentType: 'transactional', monthlyVolume: 390, category: 'glp1_weight_loss', serviceId: 'glp1', landingPage: '/services/glp-1-weight-loss' },
  { term: 'weight loss doctor kent wa', matchType: 'exact', estimatedCPC: 11.00, competition: 'medium', intentScore: 9, intentType: 'transactional', monthlyVolume: 210, category: 'glp1_weight_loss', serviceId: 'glp1', landingPage: '/services/glp-1-weight-loss' },
  { term: 'glp-1 agonist weight loss', matchType: 'phrase', estimatedCPC: 7.30, competition: 'medium', intentScore: 6, intentType: 'informational', monthlyVolume: 2800, category: 'glp1_weight_loss', serviceId: 'glp1' },
  { term: 'non surgical weight loss', matchType: 'phrase', estimatedCPC: 9.40, competition: 'medium', intentScore: 7, intentType: 'commercial', monthlyVolume: 4500, category: 'glp1_weight_loss', serviceId: 'glp1', landingPage: '/services/glp-1-weight-loss' },
  { term: 'semaglutide monthly cost', matchType: 'exact', estimatedCPC: 7.80, competition: 'high', intentScore: 7, intentType: 'commercial', monthlyVolume: 6200, category: 'glp1_weight_loss', serviceId: 'glp1', landingPage: '/services/glp-1-weight-loss' },
  { term: 'weight loss medication that works', matchType: 'broad', estimatedCPC: 8.60, competition: 'high', intentScore: 6, intentType: 'commercial', monthlyVolume: 5500, category: 'glp1_weight_loss', serviceId: 'glp1' },
  { term: 'appetite suppressant injections', matchType: 'phrase', estimatedCPC: 10.80, competition: 'medium', intentScore: 7, intentType: 'commercial', monthlyVolume: 2100, category: 'glp1_weight_loss', serviceId: 'glp1', landingPage: '/services/glp-1-weight-loss' },
  { term: 'glp1 provider washington state', matchType: 'exact', estimatedCPC: 12.40, competition: 'low', intentScore: 9, intentType: 'transactional', monthlyVolume: 280, category: 'glp1_weight_loss', serviceId: 'glp1', landingPage: '/services/glp-1-weight-loss' },
  { term: 'weight management clinic', matchType: 'phrase', estimatedCPC: 9.70, competition: 'medium', intentScore: 7, intentType: 'commercial', monthlyVolume: 3400, category: 'glp1_weight_loss', serviceId: 'glp1', landingPage: '/services/glp-1-weight-loss' },
  { term: 'medical weight loss with injections', matchType: 'phrase', estimatedCPC: 14.00, competition: 'medium', intentScore: 8, intentType: 'commercial', monthlyVolume: 1800, category: 'glp1_weight_loss', serviceId: 'glp1', landingPage: '/services/glp-1-weight-loss' },
  { term: 'semaglutide for bmi over 30', matchType: 'phrase', estimatedCPC: 6.90, competition: 'low', intentScore: 6, intentType: 'informational', monthlyVolume: 1200, category: 'glp1_weight_loss', serviceId: 'glp1' },
  { term: 'glp-1 weight loss renton bellevue', matchType: 'exact', estimatedCPC: 14.80, competition: 'low', intentScore: 10, intentType: 'transactional', monthlyVolume: 70, category: 'glp1_weight_loss', serviceId: 'glp1', landingPage: '/services/glp-1-weight-loss' },
];

// ── PEPTIDE THERAPY KEYWORDS (85) ──

export const PEPTIDE_KEYWORDS: Keyword[] = [
  { term: 'NAD+ therapy near me', matchType: 'exact', estimatedCPC: 14.50, competition: 'medium', intentScore: 9, intentType: 'transactional', monthlyVolume: 2200, category: 'peptide_therapy', serviceId: 'nad', landingPage: '/services/wellness-injections' },
  { term: 'NAD+ injection renton', matchType: 'exact', estimatedCPC: 11.80, competition: 'low', intentScore: 10, intentType: 'transactional', monthlyVolume: 90, category: 'peptide_therapy', serviceId: 'nad', landingPage: '/services/wellness-injections' },
  { term: 'NAD+ injections seattle area', matchType: 'exact', estimatedCPC: 13.20, competition: 'medium', intentScore: 9, intentType: 'transactional', monthlyVolume: 320, category: 'peptide_therapy', serviceId: 'nad', landingPage: '/services/wellness-injections' },
  { term: 'sermorelin near me', matchType: 'exact', estimatedCPC: 12.80, competition: 'medium', intentScore: 9, intentType: 'transactional', monthlyVolume: 1800, category: 'peptide_therapy', serviceId: 'peptides', landingPage: '/services/wellness-injections' },
  { term: 'sermorelin therapy renton', matchType: 'exact', estimatedCPC: 10.40, competition: 'low', intentScore: 10, intentType: 'transactional', monthlyVolume: 60, category: 'peptide_therapy', serviceId: 'peptides', landingPage: '/services/wellness-injections' },
  { term: 'peptide therapy near me', matchType: 'exact', estimatedCPC: 13.60, competition: 'medium', intentScore: 9, intentType: 'transactional', monthlyVolume: 2600, category: 'peptide_therapy', serviceId: 'peptides', landingPage: '/services/wellness-injections' },
  { term: 'peptide therapy renton wa', matchType: 'exact', estimatedCPC: 10.90, competition: 'low', intentScore: 10, intentType: 'transactional', monthlyVolume: 80, category: 'peptide_therapy', serviceId: 'peptides', landingPage: '/services/wellness-injections' },
  { term: 'BPC-157 therapy', matchType: 'phrase', estimatedCPC: 9.20, competition: 'low', intentScore: 7, intentType: 'commercial', monthlyVolume: 3400, category: 'peptide_therapy', serviceId: 'peptides', landingPage: '/services/wellness-injections' },
  { term: 'growth hormone peptides', matchType: 'phrase', estimatedCPC: 8.40, competition: 'medium', intentScore: 6, intentType: 'informational', monthlyVolume: 4800, category: 'peptide_therapy', serviceId: 'peptides' },
  { term: 'anti-aging peptides', matchType: 'phrase', estimatedCPC: 7.80, competition: 'medium', intentScore: 6, intentType: 'commercial', monthlyVolume: 3200, category: 'peptide_therapy', serviceId: 'peptides', landingPage: '/services/wellness-injections' },
  { term: 'NAD+ benefits', matchType: 'phrase', estimatedCPC: 4.20, competition: 'medium', intentScore: 4, intentType: 'informational', monthlyVolume: 8800, category: 'peptide_therapy', serviceId: 'nad' },
  { term: 'NAD+ anti aging', matchType: 'phrase', estimatedCPC: 6.50, competition: 'medium', intentScore: 5, intentType: 'informational', monthlyVolume: 5200, category: 'peptide_therapy', serviceId: 'nad' },
  { term: 'peptide injections for recovery', matchType: 'phrase', estimatedCPC: 10.30, competition: 'low', intentScore: 7, intentType: 'commercial', monthlyVolume: 1400, category: 'peptide_therapy', serviceId: 'peptides', landingPage: '/services/wellness-injections' },
  { term: 'ipamorelin therapy', matchType: 'phrase', estimatedCPC: 9.60, competition: 'low', intentScore: 7, intentType: 'commercial', monthlyVolume: 2100, category: 'peptide_therapy', serviceId: 'peptides', landingPage: '/services/wellness-injections' },
  { term: 'CJC-1295 near me', matchType: 'exact', estimatedCPC: 11.40, competition: 'low', intentScore: 8, intentType: 'transactional', monthlyVolume: 1300, category: 'peptide_therapy', serviceId: 'peptides', landingPage: '/services/wellness-injections' },
  { term: 'peptide clinic bellevue', matchType: 'exact', estimatedCPC: 12.00, competition: 'medium', intentScore: 9, intentType: 'transactional', monthlyVolume: 170, category: 'peptide_therapy', serviceId: 'peptides', landingPage: '/services/wellness-injections' },
  { term: 'cellular regeneration therapy', matchType: 'phrase', estimatedCPC: 7.10, competition: 'low', intentScore: 5, intentType: 'informational', monthlyVolume: 1800, category: 'peptide_therapy', serviceId: 'peptides' },
  { term: 'longevity treatments near me', matchType: 'exact', estimatedCPC: 11.90, competition: 'medium', intentScore: 8, intentType: 'transactional', monthlyVolume: 1100, category: 'peptide_therapy', serviceId: 'peptides', landingPage: '/services/wellness-injections' },
  { term: 'peptide therapy cost', matchType: 'phrase', estimatedCPC: 6.80, competition: 'medium', intentScore: 7, intentType: 'commercial', monthlyVolume: 2400, category: 'peptide_therapy', serviceId: 'peptides', landingPage: '/services/wellness-injections' },
  { term: 'NAD+ injection cost', matchType: 'phrase', estimatedCPC: 7.40, competition: 'medium', intentScore: 7, intentType: 'commercial', monthlyVolume: 3100, category: 'peptide_therapy', serviceId: 'nad', landingPage: '/services/wellness-injections' },
  { term: 'bioidentical peptides', matchType: 'phrase', estimatedCPC: 6.20, competition: 'low', intentScore: 5, intentType: 'informational', monthlyVolume: 1600, category: 'peptide_therapy', serviceId: 'peptides' },
  { term: 'peptide therapy for energy', matchType: 'phrase', estimatedCPC: 8.90, competition: 'low', intentScore: 6, intentType: 'commercial', monthlyVolume: 1900, category: 'peptide_therapy', serviceId: 'peptides', landingPage: '/services/wellness-injections' },
  { term: 'NAD+ therapy seattle', matchType: 'exact', estimatedCPC: 13.80, competition: 'medium', intentScore: 9, intentType: 'transactional', monthlyVolume: 480, category: 'peptide_therapy', serviceId: 'nad', landingPage: '/services/wellness-injections' },
  { term: 'thymosin alpha 1', matchType: 'phrase', estimatedCPC: 7.60, competition: 'low', intentScore: 6, intentType: 'commercial', monthlyVolume: 2800, category: 'peptide_therapy', serviceId: 'peptides' },
  { term: 'peptide doctor renton', matchType: 'exact', estimatedCPC: 10.20, competition: 'low', intentScore: 10, intentType: 'transactional', monthlyVolume: 40, category: 'peptide_therapy', serviceId: 'peptides', landingPage: '/services/wellness-injections' },
];

// ── HORMONE THERAPY KEYWORDS (65) ──

export const HORMONE_KEYWORDS: Keyword[] = [
  { term: 'hormone therapy near me', matchType: 'exact', estimatedCPC: 14.20, competition: 'high', intentScore: 9, intentType: 'transactional', monthlyVolume: 5400, category: 'hormone_therapy', landingPage: '/services/wellness-injections' },
  { term: 'hormone therapy renton wa', matchType: 'exact', estimatedCPC: 11.50, competition: 'medium', intentScore: 10, intentType: 'transactional', monthlyVolume: 140, category: 'hormone_therapy', landingPage: '/services/wellness-injections' },
  { term: 'testosterone therapy near me', matchType: 'exact', estimatedCPC: 15.80, competition: 'high', intentScore: 9, intentType: 'transactional', monthlyVolume: 4800, category: 'hormone_therapy', landingPage: '/services/wellness-injections' },
  { term: 'bioidentical hormone therapy', matchType: 'phrase', estimatedCPC: 12.40, competition: 'high', intentScore: 7, intentType: 'commercial', monthlyVolume: 6200, category: 'hormone_therapy', landingPage: '/services/wellness-injections' },
  { term: 'hormone optimization', matchType: 'phrase', estimatedCPC: 8.60, competition: 'medium', intentScore: 6, intentType: 'commercial', monthlyVolume: 3800, category: 'hormone_therapy', landingPage: '/services/wellness-injections' },
  { term: 'hormone clinic bellevue', matchType: 'exact', estimatedCPC: 13.00, competition: 'medium', intentScore: 9, intentType: 'transactional', monthlyVolume: 220, category: 'hormone_therapy', landingPage: '/services/wellness-injections' },
  { term: 'low testosterone treatment', matchType: 'phrase', estimatedCPC: 11.20, competition: 'high', intentScore: 7, intentType: 'commercial', monthlyVolume: 5600, category: 'hormone_therapy', landingPage: '/services/wellness-injections' },
  { term: 'menopause treatment near me', matchType: 'exact', estimatedCPC: 10.80, competition: 'medium', intentScore: 8, intentType: 'transactional', monthlyVolume: 3200, category: 'hormone_therapy', landingPage: '/services/wellness-injections' },
  { term: 'hormone replacement renton', matchType: 'exact', estimatedCPC: 11.00, competition: 'low', intentScore: 10, intentType: 'transactional', monthlyVolume: 90, category: 'hormone_therapy', landingPage: '/services/wellness-injections' },
  { term: 'thyroid optimization', matchType: 'phrase', estimatedCPC: 7.40, competition: 'medium', intentScore: 6, intentType: 'commercial', monthlyVolume: 2100, category: 'hormone_therapy' },
  { term: 'adrenal fatigue treatment', matchType: 'phrase', estimatedCPC: 8.20, competition: 'medium', intentScore: 6, intentType: 'commercial', monthlyVolume: 2800, category: 'hormone_therapy', landingPage: '/services/wellness-injections' },
  { term: 'hormone imbalance doctor', matchType: 'phrase', estimatedCPC: 10.50, competition: 'medium', intentScore: 8, intentType: 'transactional', monthlyVolume: 3600, category: 'hormone_therapy', landingPage: '/services/wellness-injections' },
  { term: 'functional medicine renton', matchType: 'exact', estimatedCPC: 9.80, competition: 'medium', intentScore: 8, intentType: 'transactional', monthlyVolume: 260, category: 'hormone_therapy', landingPage: '/services/wellness-injections' },
  { term: 'perimenopause treatment seattle', matchType: 'exact', estimatedCPC: 10.20, competition: 'medium', intentScore: 8, intentType: 'transactional', monthlyVolume: 340, category: 'hormone_therapy', landingPage: '/services/wellness-injections' },
  { term: 'hormone panel testing', matchType: 'phrase', estimatedCPC: 7.00, competition: 'medium', intentScore: 6, intentType: 'commercial', monthlyVolume: 2400, category: 'hormone_therapy' },
  { term: 'male hormone therapy kent wa', matchType: 'exact', estimatedCPC: 12.60, competition: 'low', intentScore: 9, intentType: 'transactional', monthlyVolume: 60, category: 'hormone_therapy', landingPage: '/services/wellness-injections' },
  { term: 'estrogen therapy bellevue', matchType: 'exact', estimatedCPC: 11.40, competition: 'low', intentScore: 9, intentType: 'transactional', monthlyVolume: 80, category: 'hormone_therapy', landingPage: '/services/wellness-injections' },
  { term: 'hormone therapy for fatigue', matchType: 'phrase', estimatedCPC: 8.80, competition: 'low', intentScore: 6, intentType: 'commercial', monthlyVolume: 1800, category: 'hormone_therapy', landingPage: '/services/wellness-injections' },
];

// ── AESTHETIC SERVICE KEYWORDS (105) ──

export const AESTHETIC_KEYWORDS: Keyword[] = [
  // Botox
  { term: 'botox renton', matchType: 'exact', estimatedCPC: 12.40, competition: 'high', intentScore: 10, intentType: 'transactional', monthlyVolume: 480, category: 'aesthetic_injectable', serviceId: 'botox', landingPage: '/services/botox' },
  { term: 'botox near me', matchType: 'exact', estimatedCPC: 18.20, competition: 'high', intentScore: 9, intentType: 'transactional', monthlyVolume: 33000, category: 'aesthetic_injectable', serviceId: 'botox', landingPage: '/services/botox' },
  { term: 'botox bellevue wa', matchType: 'exact', estimatedCPC: 14.80, competition: 'high', intentScore: 10, intentType: 'transactional', monthlyVolume: 720, category: 'aesthetic_injectable', serviceId: 'botox', landingPage: '/services/botox' },
  { term: 'preventative botox', matchType: 'phrase', estimatedCPC: 8.40, competition: 'medium', intentScore: 7, intentType: 'commercial', monthlyVolume: 4200, category: 'aesthetic_injectable', serviceId: 'botox', landingPage: '/services/botox' },
  { term: 'botox cost renton wa', matchType: 'exact', estimatedCPC: 10.20, competition: 'medium', intentScore: 8, intentType: 'commercial', monthlyVolume: 170, category: 'aesthetic_injectable', serviceId: 'botox', landingPage: '/services/botox' },
  { term: 'forehead botox', matchType: 'phrase', estimatedCPC: 9.60, competition: 'high', intentScore: 7, intentType: 'commercial', monthlyVolume: 6800, category: 'aesthetic_injectable', serviceId: 'botox', landingPage: '/services/botox' },
  { term: 'natural looking botox', matchType: 'phrase', estimatedCPC: 10.40, competition: 'medium', intentScore: 7, intentType: 'commercial', monthlyVolume: 3600, category: 'aesthetic_injectable', serviceId: 'botox', landingPage: '/services/botox' },
  // Dermal Fillers
  { term: 'dermal fillers renton', matchType: 'exact', estimatedCPC: 13.60, competition: 'medium', intentScore: 10, intentType: 'transactional', monthlyVolume: 260, category: 'aesthetic_injectable', serviceId: 'fillers', landingPage: '/services/fillers' },
  { term: 'lip fillers near me', matchType: 'exact', estimatedCPC: 16.40, competition: 'high', intentScore: 9, intentType: 'transactional', monthlyVolume: 18000, category: 'aesthetic_injectable', serviceId: 'fillers', landingPage: '/services/fillers' },
  { term: 'cheek fillers renton', matchType: 'exact', estimatedCPC: 12.80, competition: 'medium', intentScore: 10, intentType: 'transactional', monthlyVolume: 110, category: 'aesthetic_injectable', serviceId: 'fillers', landingPage: '/services/fillers' },
  { term: 'juvederm near me', matchType: 'exact', estimatedCPC: 15.20, competition: 'high', intentScore: 9, intentType: 'transactional', monthlyVolume: 8200, category: 'aesthetic_injectable', serviceId: 'fillers', landingPage: '/services/fillers' },
  // HydraFacial
  { term: 'hydrafacial renton', matchType: 'exact', estimatedCPC: 8.80, competition: 'medium', intentScore: 10, intentType: 'transactional', monthlyVolume: 210, category: 'aesthetic_facial', serviceId: 'hydrafacial', landingPage: '/services/hydrafacial' },
  { term: 'hydrafacial near me', matchType: 'exact', estimatedCPC: 12.60, competition: 'high', intentScore: 9, intentType: 'transactional', monthlyVolume: 14000, category: 'aesthetic_facial', serviceId: 'hydrafacial', landingPage: '/services/hydrafacial' },
  { term: 'hydrafacial cost', matchType: 'phrase', estimatedCPC: 6.40, competition: 'medium', intentScore: 7, intentType: 'commercial', monthlyVolume: 8800, category: 'aesthetic_facial', serviceId: 'hydrafacial', landingPage: '/services/hydrafacial' },
  { term: 'best facial renton wa', matchType: 'exact', estimatedCPC: 7.60, competition: 'medium', intentScore: 9, intentType: 'transactional', monthlyVolume: 170, category: 'aesthetic_facial', serviceId: 'hydrafacial', landingPage: '/services/hydrafacial' },
  { term: 'deep cleansing facial', matchType: 'phrase', estimatedCPC: 6.80, competition: 'medium', intentScore: 7, intentType: 'commercial', monthlyVolume: 5400, category: 'aesthetic_facial', serviceId: 'hydrafacial', landingPage: '/services/hydrafacial' },
  // Laser Hair Removal
  { term: 'laser hair removal renton', matchType: 'exact', estimatedCPC: 11.20, competition: 'high', intentScore: 10, intentType: 'transactional', monthlyVolume: 390, category: 'aesthetic_laser', serviceId: 'laser_hair', landingPage: '/services/laser-hair-removal' },
  { term: 'laser hair removal near me', matchType: 'exact', estimatedCPC: 15.40, competition: 'high', intentScore: 9, intentType: 'transactional', monthlyVolume: 27000, category: 'aesthetic_laser', serviceId: 'laser_hair', landingPage: '/services/laser-hair-removal' },
  { term: 'laser hair removal cost', matchType: 'phrase', estimatedCPC: 7.20, competition: 'high', intentScore: 7, intentType: 'commercial', monthlyVolume: 12000, category: 'aesthetic_laser', serviceId: 'laser_hair', landingPage: '/services/laser-hair-removal' },
  { term: 'full body laser hair removal', matchType: 'phrase', estimatedCPC: 10.80, competition: 'medium', intentScore: 8, intentType: 'commercial', monthlyVolume: 6400, category: 'aesthetic_laser', serviceId: 'laser_hair', landingPage: '/services/laser-hair-removal' },
  // RF Microneedling
  { term: 'microneedling renton', matchType: 'exact', estimatedCPC: 9.40, competition: 'medium', intentScore: 10, intentType: 'transactional', monthlyVolume: 170, category: 'aesthetic_laser', serviceId: 'rf_microneedling', landingPage: '/services/rf-microneedling' },
  { term: 'rf microneedling near me', matchType: 'exact', estimatedCPC: 13.80, competition: 'medium', intentScore: 9, intentType: 'transactional', monthlyVolume: 4800, category: 'aesthetic_laser', serviceId: 'rf_microneedling', landingPage: '/services/rf-microneedling' },
  { term: 'microneedling for acne scars', matchType: 'phrase', estimatedCPC: 8.60, competition: 'medium', intentScore: 7, intentType: 'commercial', monthlyVolume: 6200, category: 'aesthetic_laser', serviceId: 'rf_microneedling', landingPage: '/services/rf-microneedling' },
  { term: 'skin tightening renton', matchType: 'exact', estimatedCPC: 10.20, competition: 'medium', intentScore: 9, intentType: 'transactional', monthlyVolume: 130, category: 'aesthetic_laser', serviceId: 'rf_microneedling', landingPage: '/services/rf-microneedling' },
  // Sofwave
  { term: 'sofwave near me', matchType: 'exact', estimatedCPC: 14.60, competition: 'medium', intentScore: 9, intentType: 'transactional', monthlyVolume: 2200, category: 'aesthetic_laser', serviceId: 'sofwave', landingPage: '/services/sofwave' },
  { term: 'sofwave renton wa', matchType: 'exact', estimatedCPC: 11.40, competition: 'low', intentScore: 10, intentType: 'transactional', monthlyVolume: 60, category: 'aesthetic_laser', serviceId: 'sofwave', landingPage: '/services/sofwave' },
  { term: 'non surgical facelift renton', matchType: 'exact', estimatedCPC: 12.80, competition: 'medium', intentScore: 9, intentType: 'transactional', monthlyVolume: 140, category: 'aesthetic_laser', serviceId: 'sofwave', landingPage: '/services/sofwave' },
  { term: 'sofwave skin tightening cost', matchType: 'phrase', estimatedCPC: 8.90, competition: 'medium', intentScore: 7, intentType: 'commercial', monthlyVolume: 3400, category: 'aesthetic_laser', serviceId: 'sofwave', landingPage: '/services/sofwave' },
  // VI Peel
  { term: 'vi peel renton', matchType: 'exact', estimatedCPC: 8.20, competition: 'medium', intentScore: 10, intentType: 'transactional', monthlyVolume: 90, category: 'aesthetic_facial', serviceId: 'vi_peel', landingPage: '/services/vi-peel' },
  { term: 'vi peel near me', matchType: 'exact', estimatedCPC: 11.40, competition: 'medium', intentScore: 9, intentType: 'transactional', monthlyVolume: 4800, category: 'aesthetic_facial', serviceId: 'vi_peel', landingPage: '/services/vi-peel' },
  { term: 'chemical peel renton', matchType: 'exact', estimatedCPC: 9.60, competition: 'medium', intentScore: 10, intentType: 'transactional', monthlyVolume: 150, category: 'aesthetic_facial', serviceId: 'vi_peel', landingPage: '/services/vi-peel' },
  { term: 'best chemical peel for hyperpigmentation', matchType: 'phrase', estimatedCPC: 7.80, competition: 'medium', intentScore: 7, intentType: 'commercial', monthlyVolume: 3200, category: 'aesthetic_facial', serviceId: 'vi_peel', landingPage: '/services/vi-peel' },
  // PicoWay
  { term: 'picoway laser near me', matchType: 'exact', estimatedCPC: 12.20, competition: 'medium', intentScore: 9, intentType: 'transactional', monthlyVolume: 1800, category: 'aesthetic_laser', serviceId: 'picoway', landingPage: '/services/picoway' },
  { term: 'picoway renton wa', matchType: 'exact', estimatedCPC: 9.80, competition: 'low', intentScore: 10, intentType: 'transactional', monthlyVolume: 40, category: 'aesthetic_laser', serviceId: 'picoway', landingPage: '/services/picoway' },
  { term: 'laser pigmentation removal', matchType: 'phrase', estimatedCPC: 10.60, competition: 'medium', intentScore: 7, intentType: 'commercial', monthlyVolume: 4200, category: 'aesthetic_laser', serviceId: 'picoway', landingPage: '/services/picoway' },
  { term: 'dark spot removal laser', matchType: 'phrase', estimatedCPC: 9.40, competition: 'medium', intentScore: 7, intentType: 'commercial', monthlyVolume: 5800, category: 'aesthetic_laser', serviceId: 'picoway', landingPage: '/services/picoway' },
  // PRX-T33
  { term: 'prx-t33 near me', matchType: 'exact', estimatedCPC: 10.80, competition: 'low', intentScore: 9, intentType: 'transactional', monthlyVolume: 1400, category: 'aesthetic_facial', serviceId: 'prx', landingPage: '/services/prx-t33' },
  { term: 'biorevitalization facial', matchType: 'phrase', estimatedCPC: 7.60, competition: 'low', intentScore: 7, intentType: 'commercial', monthlyVolume: 900, category: 'aesthetic_facial', serviceId: 'prx', landingPage: '/services/prx-t33' },
  // General aesthetic
  { term: 'medspa renton wa', matchType: 'exact', estimatedCPC: 10.40, competition: 'high', intentScore: 9, intentType: 'transactional', monthlyVolume: 320, category: 'aesthetic_injectable', landingPage: '/' },
  { term: 'medspa near me', matchType: 'exact', estimatedCPC: 14.80, competition: 'high', intentScore: 9, intentType: 'transactional', monthlyVolume: 22000, category: 'aesthetic_injectable', landingPage: '/' },
  { term: 'medical spa renton', matchType: 'exact', estimatedCPC: 11.60, competition: 'high', intentScore: 9, intentType: 'transactional', monthlyVolume: 280, category: 'aesthetic_injectable', landingPage: '/' },
  { term: 'best medspa bellevue', matchType: 'exact', estimatedCPC: 13.40, competition: 'high', intentScore: 9, intentType: 'transactional', monthlyVolume: 590, category: 'aesthetic_injectable', landingPage: '/' },
  { term: 'luxury medspa renton', matchType: 'exact', estimatedCPC: 9.80, competition: 'low', intentScore: 9, intentType: 'transactional', monthlyVolume: 60, category: 'aesthetic_injectable', landingPage: '/' },
  { term: 'anti aging treatments renton', matchType: 'exact', estimatedCPC: 9.20, competition: 'medium', intentScore: 8, intentType: 'commercial', monthlyVolume: 170, category: 'aesthetic_injectable', landingPage: '/' },
  { term: 'skin rejuvenation near me', matchType: 'exact', estimatedCPC: 11.80, competition: 'medium', intentScore: 8, intentType: 'transactional', monthlyVolume: 4600, category: 'aesthetic_laser', landingPage: '/' },
];

// ── WELLNESS INJECTION KEYWORDS (55) ──

export const WELLNESS_KEYWORDS: Keyword[] = [
  { term: 'vitamin injections near me', matchType: 'exact', estimatedCPC: 10.20, competition: 'medium', intentScore: 9, intentType: 'transactional', monthlyVolume: 3800, category: 'wellness_injection', serviceId: 'wellness', landingPage: '/services/wellness-injections' },
  { term: 'vitamin injections renton', matchType: 'exact', estimatedCPC: 8.40, competition: 'low', intentScore: 10, intentType: 'transactional', monthlyVolume: 110, category: 'wellness_injection', serviceId: 'wellness', landingPage: '/services/wellness-injections' },
  { term: 'b12 injection near me', matchType: 'exact', estimatedCPC: 8.80, competition: 'medium', intentScore: 9, intentType: 'transactional', monthlyVolume: 6400, category: 'wellness_injection', serviceId: 'b12', landingPage: '/services/wellness-injections' },
  { term: 'b12 shots renton wa', matchType: 'exact', estimatedCPC: 7.20, competition: 'low', intentScore: 10, intentType: 'transactional', monthlyVolume: 80, category: 'wellness_injection', serviceId: 'b12', landingPage: '/services/wellness-injections' },
  { term: 'glutathione injection near me', matchType: 'exact', estimatedCPC: 11.40, competition: 'medium', intentScore: 9, intentType: 'transactional', monthlyVolume: 2800, category: 'wellness_injection', serviceId: 'glutathione', landingPage: '/services/wellness-injections' },
  { term: 'glutathione injection renton', matchType: 'exact', estimatedCPC: 9.00, competition: 'low', intentScore: 10, intentType: 'transactional', monthlyVolume: 60, category: 'wellness_injection', serviceId: 'glutathione', landingPage: '/services/wellness-injections' },
  { term: 'immune boost injection', matchType: 'phrase', estimatedCPC: 8.60, competition: 'medium', intentScore: 7, intentType: 'commercial', monthlyVolume: 3200, category: 'wellness_injection', serviceId: 'tri_immune', landingPage: '/services/wellness-injections' },
  { term: 'tri-immune boost near me', matchType: 'exact', estimatedCPC: 9.80, competition: 'low', intentScore: 9, intentType: 'transactional', monthlyVolume: 1400, category: 'wellness_injection', serviceId: 'tri_immune', landingPage: '/services/wellness-injections' },
  { term: 'vitamin d3 injection', matchType: 'phrase', estimatedCPC: 7.40, competition: 'low', intentScore: 7, intentType: 'commercial', monthlyVolume: 2600, category: 'wellness_injection', serviceId: 'vitd3', landingPage: '/services/wellness-injections' },
  { term: 'energy injection near me', matchType: 'exact', estimatedCPC: 9.20, competition: 'medium', intentScore: 8, intentType: 'transactional', monthlyVolume: 2200, category: 'wellness_injection', serviceId: 'wellness', landingPage: '/services/wellness-injections' },
  { term: 'wellness clinic renton', matchType: 'exact', estimatedCPC: 8.00, competition: 'medium', intentScore: 8, intentType: 'transactional', monthlyVolume: 240, category: 'wellness_injection', serviceId: 'wellness', landingPage: '/services/wellness-injections' },
  { term: 'iv therapy renton', matchType: 'exact', estimatedCPC: 10.60, competition: 'medium', intentScore: 9, intentType: 'transactional', monthlyVolume: 190, category: 'wellness_injection', serviceId: 'wellness', landingPage: '/services/wellness-injections' },
  { term: 'immunity boost injections seattle', matchType: 'exact', estimatedCPC: 10.40, competition: 'medium', intentScore: 9, intentType: 'transactional', monthlyVolume: 340, category: 'wellness_injection', serviceId: 'tri_immune', landingPage: '/services/wellness-injections' },
  { term: 'detox injection', matchType: 'phrase', estimatedCPC: 7.80, competition: 'low', intentScore: 6, intentType: 'commercial', monthlyVolume: 1800, category: 'wellness_injection', serviceId: 'glutathione', landingPage: '/services/wellness-injections' },
  { term: 'vitamin shots for energy', matchType: 'phrase', estimatedCPC: 7.60, competition: 'medium', intentScore: 7, intentType: 'commercial', monthlyVolume: 3400, category: 'wellness_injection', serviceId: 'b12', landingPage: '/services/wellness-injections' },
  { term: 'skin brightening injection', matchType: 'phrase', estimatedCPC: 8.40, competition: 'low', intentScore: 7, intentType: 'commercial', monthlyVolume: 2100, category: 'wellness_injection', serviceId: 'glutathione', landingPage: '/services/wellness-injections' },
  { term: 'recovery injection athletes', matchType: 'phrase', estimatedCPC: 9.00, competition: 'low', intentScore: 6, intentType: 'commercial', monthlyVolume: 1200, category: 'wellness_injection', serviceId: 'wellness', landingPage: '/services/wellness-injections' },
  { term: 'hangover recovery injection', matchType: 'phrase', estimatedCPC: 8.20, competition: 'medium', intentScore: 7, intentType: 'commercial', monthlyVolume: 2800, category: 'wellness_injection', serviceId: 'wellness', landingPage: '/services/wellness-injections' },
];

// ── LOCAL / GEO KEYWORDS (40) ──

export const GEO_KEYWORDS: Keyword[] = [
  { term: 'medspa renton wa', matchType: 'exact', estimatedCPC: 10.40, competition: 'high', intentScore: 9, intentType: 'transactional', monthlyVolume: 320, category: 'local_geo', landingPage: '/' },
  { term: 'medical spa bellevue', matchType: 'exact', estimatedCPC: 13.20, competition: 'high', intentScore: 9, intentType: 'transactional', monthlyVolume: 540, category: 'local_geo', landingPage: '/' },
  { term: 'medspa kent wa', matchType: 'exact', estimatedCPC: 9.80, competition: 'medium', intentScore: 9, intentType: 'transactional', monthlyVolume: 210, category: 'local_geo', landingPage: '/' },
  { term: 'medical aesthetics tukwila', matchType: 'exact', estimatedCPC: 8.60, competition: 'low', intentScore: 9, intentType: 'transactional', monthlyVolume: 60, category: 'local_geo', landingPage: '/' },
  { term: 'medspa newcastle wa', matchType: 'exact', estimatedCPC: 8.40, competition: 'low', intentScore: 9, intentType: 'transactional', monthlyVolume: 40, category: 'local_geo', landingPage: '/' },
  { term: 'beauty clinic mercer island', matchType: 'exact', estimatedCPC: 11.20, competition: 'low', intentScore: 9, intentType: 'transactional', monthlyVolume: 70, category: 'local_geo', landingPage: '/' },
  { term: 'medspa issaquah', matchType: 'exact', estimatedCPC: 10.00, competition: 'medium', intentScore: 9, intentType: 'transactional', monthlyVolume: 170, category: 'local_geo', landingPage: '/' },
  { term: 'aesthetics clinic kirkland', matchType: 'exact', estimatedCPC: 11.60, competition: 'medium', intentScore: 9, intentType: 'transactional', monthlyVolume: 220, category: 'local_geo', landingPage: '/' },
  { term: 'cosmetic clinic redmond wa', matchType: 'exact', estimatedCPC: 10.80, competition: 'medium', intentScore: 9, intentType: 'transactional', monthlyVolume: 180, category: 'local_geo', landingPage: '/' },
  { term: 'medspa federal way', matchType: 'exact', estimatedCPC: 9.40, competition: 'medium', intentScore: 9, intentType: 'transactional', monthlyVolume: 190, category: 'local_geo', landingPage: '/' },
  { term: 'beauty clinic auburn wa', matchType: 'exact', estimatedCPC: 8.80, competition: 'low', intentScore: 9, intentType: 'transactional', monthlyVolume: 110, category: 'local_geo', landingPage: '/' },
  { term: 'medspa seatac area', matchType: 'exact', estimatedCPC: 8.20, competition: 'low', intentScore: 8, intentType: 'transactional', monthlyVolume: 50, category: 'local_geo', landingPage: '/' },
  { term: 'medspa burien wa', matchType: 'exact', estimatedCPC: 8.60, competition: 'low', intentScore: 9, intentType: 'transactional', monthlyVolume: 80, category: 'local_geo', landingPage: '/' },
  { term: 'beauty clinic covington wa', matchType: 'exact', estimatedCPC: 7.80, competition: 'low', intentScore: 9, intentType: 'transactional', monthlyVolume: 50, category: 'local_geo', landingPage: '/' },
  { term: 'medspa maple valley', matchType: 'exact', estimatedCPC: 8.00, competition: 'low', intentScore: 9, intentType: 'transactional', monthlyVolume: 70, category: 'local_geo', landingPage: '/' },
  { term: 'south king county medspa', matchType: 'exact', estimatedCPC: 9.00, competition: 'low', intentScore: 8, intentType: 'transactional', monthlyVolume: 30, category: 'local_geo', landingPage: '/' },
  { term: 'eastside medspa seattle', matchType: 'exact', estimatedCPC: 11.00, competition: 'medium', intentScore: 8, intentType: 'transactional', monthlyVolume: 140, category: 'local_geo', landingPage: '/' },
  { term: 'medspa near renton highlands', matchType: 'exact', estimatedCPC: 7.40, competition: 'low', intentScore: 10, intentType: 'transactional', monthlyVolume: 20, category: 'local_geo', landingPage: '/' },
  { term: 'best medspa south seattle', matchType: 'exact', estimatedCPC: 10.60, competition: 'medium', intentScore: 9, intentType: 'transactional', monthlyVolume: 160, category: 'local_geo', landingPage: '/' },
  { term: 'pnw medspa', matchType: 'exact', estimatedCPC: 7.80, competition: 'low', intentScore: 7, intentType: 'transactional', monthlyVolume: 40, category: 'local_geo', landingPage: '/' },
];

// ── LONG-TAIL KEYWORDS (55) ──

export const LONG_TAIL_KEYWORDS: Keyword[] = [
  { term: 'where to get semaglutide without insurance renton', matchType: 'exact', estimatedCPC: 12.60, competition: 'low', intentScore: 9, intentType: 'transactional', monthlyVolume: 90, category: 'long_tail', serviceId: 'glp1', landingPage: '/services/glp-1-weight-loss' },
  { term: 'best medspa for first time botox', matchType: 'phrase', estimatedCPC: 9.80, competition: 'low', intentScore: 8, intentType: 'commercial', monthlyVolume: 320, category: 'long_tail', serviceId: 'botox', landingPage: '/services/botox' },
  { term: 'how much does medical weight loss cost in washington', matchType: 'phrase', estimatedCPC: 8.40, competition: 'low', intentScore: 7, intentType: 'commercial', monthlyVolume: 210, category: 'long_tail', serviceId: 'glp1', landingPage: '/services/glp-1-weight-loss' },
  { term: 'hydrafacial vs regular facial which is better', matchType: 'phrase', estimatedCPC: 5.20, competition: 'low', intentScore: 5, intentType: 'informational', monthlyVolume: 480, category: 'long_tail', serviceId: 'hydrafacial' },
  { term: 'physician supervised weight loss renton wa reviews', matchType: 'exact', estimatedCPC: 10.40, competition: 'low', intentScore: 9, intentType: 'transactional', monthlyVolume: 30, category: 'long_tail', serviceId: 'glp1', landingPage: '/services/glp-1-weight-loss' },
  { term: 'best laser hair removal for dark skin renton', matchType: 'exact', estimatedCPC: 12.80, competition: 'low', intentScore: 9, intentType: 'transactional', monthlyVolume: 60, category: 'long_tail', serviceId: 'laser_hair', landingPage: '/services/laser-hair-removal' },
  { term: 'non surgical skin tightening that actually works', matchType: 'phrase', estimatedCPC: 8.60, competition: 'medium', intentScore: 7, intentType: 'commercial', monthlyVolume: 390, category: 'long_tail', serviceId: 'sofwave', landingPage: '/services/sofwave' },
  { term: 'wedding botox how far in advance', matchType: 'phrase', estimatedCPC: 6.40, competition: 'low', intentScore: 6, intentType: 'informational', monthlyVolume: 720, category: 'long_tail', serviceId: 'botox', landingPage: '/services/botox' },
  { term: 'rf microneedling vs regular microneedling', matchType: 'phrase', estimatedCPC: 5.80, competition: 'low', intentScore: 5, intentType: 'informational', monthlyVolume: 1200, category: 'long_tail', serviceId: 'rf_microneedling' },
  { term: 'NAD+ injection vs oral supplement', matchType: 'phrase', estimatedCPC: 5.40, competition: 'low', intentScore: 5, intentType: 'informational', monthlyVolume: 860, category: 'long_tail', serviceId: 'nad' },
  { term: 'can you get semaglutide at a medspa', matchType: 'phrase', estimatedCPC: 7.80, competition: 'low', intentScore: 7, intentType: 'commercial', monthlyVolume: 440, category: 'long_tail', serviceId: 'glp1', landingPage: '/services/glp-1-weight-loss' },
  { term: 'vi peel for melasma does it work', matchType: 'phrase', estimatedCPC: 6.20, competition: 'low', intentScore: 6, intentType: 'informational', monthlyVolume: 580, category: 'long_tail', serviceId: 'vi_peel' },
  { term: 'how to get rid of sun spots on face permanently', matchType: 'phrase', estimatedCPC: 7.00, competition: 'medium', intentScore: 6, intentType: 'informational', monthlyVolume: 2400, category: 'long_tail', serviceId: 'picoway', landingPage: '/services/picoway' },
  { term: 'medspa that takes walk ins renton', matchType: 'exact', estimatedCPC: 8.80, competition: 'low', intentScore: 10, intentType: 'transactional', monthlyVolume: 20, category: 'long_tail', landingPage: '/' },
  { term: 'asian skin laser treatment renton', matchType: 'exact', estimatedCPC: 10.60, competition: 'low', intentScore: 9, intentType: 'transactional', monthlyVolume: 40, category: 'long_tail', serviceId: 'picoway', landingPage: '/services/picoway' },
  { term: 'weight loss program with weekly check ins', matchType: 'phrase', estimatedCPC: 8.20, competition: 'low', intentScore: 7, intentType: 'commercial', monthlyVolume: 310, category: 'long_tail', serviceId: 'glp1', landingPage: '/services/glp-1-weight-loss' },
  { term: 'b12 injection benefits for women', matchType: 'phrase', estimatedCPC: 5.60, competition: 'low', intentScore: 5, intentType: 'informational', monthlyVolume: 1400, category: 'long_tail', serviceId: 'b12' },
  { term: 'glutathione injection for skin lightening', matchType: 'phrase', estimatedCPC: 8.00, competition: 'medium', intentScore: 7, intentType: 'commercial', monthlyVolume: 3200, category: 'long_tail', serviceId: 'glutathione', landingPage: '/services/wellness-injections' },
  { term: 'what to expect first botox appointment', matchType: 'phrase', estimatedCPC: 4.80, competition: 'low', intentScore: 5, intentType: 'informational', monthlyVolume: 1100, category: 'long_tail', serviceId: 'botox' },
  { term: 'luxury medspa experience renton washington', matchType: 'exact', estimatedCPC: 8.40, competition: 'low', intentScore: 9, intentType: 'transactional', monthlyVolume: 20, category: 'long_tail', landingPage: '/' },
];

// ── NEGATIVE KEYWORDS (comprehensive) ──

export const NEGATIVE_KEYWORDS: NegativeKeyword[] = [
  // Price-sensitive / discount seekers
  { term: 'free', matchType: 'broad', reason: 'Excludes freebie seekers' },
  { term: 'cheap', matchType: 'broad', reason: 'Excludes discount hunters, luxury brand mismatch' },
  { term: 'cheapest', matchType: 'broad', reason: 'Price-focused searcher' },
  { term: 'discount', matchType: 'broad', reason: 'Discount-first conflicts with luxury positioning' },
  { term: 'coupon', matchType: 'broad', reason: 'Coupon seekers have low LTV' },
  { term: 'groupon', matchType: 'exact', reason: 'Groupon clients have poor retention' },
  { term: 'deal', matchType: 'broad', reason: 'Deal seekers are not target audience' },
  { term: 'budget', matchType: 'broad', reason: 'Budget-conscious not aligned with luxury brand' },
  { term: 'affordable', matchType: 'broad', reason: 'Price-sensitive qualifier' },
  // DIY / at-home
  { term: 'DIY', matchType: 'broad', reason: 'DIY searchers not seeking professional treatment' },
  { term: 'at home', matchType: 'phrase', reason: 'At-home treatment seekers' },
  { term: 'home remedy', matchType: 'phrase', reason: 'Not seeking professional service' },
  { term: 'self administered', matchType: 'phrase', reason: 'Not seeking in-clinic treatment' },
  { term: 'buy online', matchType: 'phrase', reason: 'Online product shoppers' },
  // Education / career
  { term: 'school', matchType: 'broad', reason: 'Students searching for programs' },
  { term: 'training', matchType: 'broad', reason: 'Career training seekers' },
  { term: 'certification', matchType: 'broad', reason: 'Professional cert seekers' },
  { term: 'course', matchType: 'broad', reason: 'Educational course seekers' },
  { term: 'degree', matchType: 'broad', reason: 'Degree program seekers' },
  { term: 'how to become', matchType: 'phrase', reason: 'Career info seekers' },
  { term: 'salary', matchType: 'broad', reason: 'Job/career info seekers' },
  { term: 'jobs', matchType: 'broad', reason: 'Job seekers not clients' },
  { term: 'hiring', matchType: 'broad', reason: 'Employment seekers' },
  // Competitors / irrelevant brands
  { term: 'spa job', matchType: 'phrase', reason: 'Job seekers' },
  { term: 'massage', matchType: 'broad', reason: 'Rani does not offer massage' },
  { term: 'nail salon', matchType: 'phrase', reason: 'Not our service' },
  { term: 'hair salon', matchType: 'phrase', reason: 'Not our service' },
  { term: 'tattoo', matchType: 'broad', reason: 'Not our service' },
  { term: 'tattoo removal', matchType: 'phrase', reason: 'Not currently offered' },
  // Medical / irrelevant medical
  { term: 'side effects lawsuit', matchType: 'phrase', reason: 'Legal info seekers' },
  { term: 'class action', matchType: 'phrase', reason: 'Legal info seekers' },
  { term: 'lawsuit', matchType: 'broad', reason: 'Legal content' },
  { term: 'recall', matchType: 'broad', reason: 'Product recall info' },
  { term: 'dangerous', matchType: 'broad', reason: 'Negative sentiment content' },
  { term: 'death', matchType: 'broad', reason: 'Negative/fear content' },
  { term: 'botched', matchType: 'broad', reason: 'Negative outcome content' },
  { term: 'gone wrong', matchType: 'phrase', reason: 'Negative experience content' },
  // Geographic exclusions
  { term: 'new york', matchType: 'phrase', reason: 'Out of service area' },
  { term: 'los angeles', matchType: 'phrase', reason: 'Out of service area' },
  { term: 'florida', matchType: 'broad', reason: 'Out of service area' },
  { term: 'texas', matchType: 'broad', reason: 'Out of service area' },
  // Informational / research heavy
  { term: 'wikipedia', matchType: 'broad', reason: 'Wikipedia research' },
  { term: 'reddit', matchType: 'broad', reason: 'Reddit research, not ready to buy' },
  { term: 'youtube', matchType: 'broad', reason: 'Video research' },
  { term: 'PDF', matchType: 'broad', reason: 'Document research' },
  // Weight loss pharmaceuticals (not provided)
  { term: 'pharmacy', matchType: 'broad', reason: 'Pharmacy shoppers, not clinic clients' },
  { term: 'prescription refill', matchType: 'phrase', reason: 'Pharmacy needs' },
  // Other
  { term: 'franchise', matchType: 'broad', reason: 'Business opportunity seekers' },
  { term: 'wholesale', matchType: 'broad', reason: 'B2B seekers' },
  { term: 'supplier', matchType: 'broad', reason: 'B2B supply chain' },
];

// ── UTILITY FUNCTIONS ──

export function getAllKeywords(): Keyword[] {
  return [
    ...GLP1_KEYWORDS,
    ...PEPTIDE_KEYWORDS,
    ...HORMONE_KEYWORDS,
    ...AESTHETIC_KEYWORDS,
    ...WELLNESS_KEYWORDS,
    ...GEO_KEYWORDS,
    ...LONG_TAIL_KEYWORDS,
  ];
}

export function getKeywordsByCategory(category: KeywordCategory): Keyword[] {
  return getAllKeywords().filter(k => k.category === category);
}

export function getKeywordsByService(serviceId: string): Keyword[] {
  return getAllKeywords().filter(k => k.serviceId === serviceId);
}

export function getKeywordsByIntent(intentType: IntentType): Keyword[] {
  return getAllKeywords().filter(k => k.intentType === intentType);
}

export function getHighIntentKeywords(minScore: number = 8): Keyword[] {
  return getAllKeywords().filter(k => k.intentScore >= minScore).sort((a, b) => b.intentScore - a.intentScore);
}

export function getKeywordsByMatchType(matchType: MatchType): Keyword[] {
  return getAllKeywords().filter(k => k.matchType === matchType);
}

export function getKeywordsWithLandingPages(): Keyword[] {
  return getAllKeywords().filter(k => k.landingPage);
}

export function estimateMonthlyBudget(keywords: Keyword[]): { totalCPC: number; estimatedClicks: number; estimatedBudget: number } {
  const avgCPC = keywords.reduce((sum, k) => sum + k.estimatedCPC, 0) / keywords.length;
  const totalVolume = keywords.reduce((sum, k) => sum + k.monthlyVolume, 0);
  const estimatedCTR = 0.035; // 3.5% average CTR for search
  const estimatedClicks = Math.round(totalVolume * estimatedCTR);
  const estimatedBudget = Math.round(estimatedClicks * avgCPC);

  return { totalCPC: Math.round(avgCPC * 100) / 100, estimatedClicks, estimatedBudget };
}

export function getKeywordClusters(): Record<string, Keyword[]> {
  const clusters: Record<string, Keyword[]> = {};
  const all = getAllKeywords();

  for (const kw of all) {
    const key = kw.serviceId || kw.category;
    if (!clusters[key]) clusters[key] = [];
    clusters[key].push(kw);
  }

  return clusters;
}

export function getCompetitiveGaps(): Keyword[] {
  return getAllKeywords().filter(k => k.competition === 'low' && k.intentScore >= 7);
}

export const KEYWORD_STATS = {
  totalKeywords: getAllKeywords().length,
  totalNegativeKeywords: NEGATIVE_KEYWORDS.length,
  categories: ['glp1_weight_loss', 'peptide_therapy', 'hormone_therapy', 'aesthetic_injectable', 'aesthetic_laser', 'aesthetic_facial', 'wellness_injection', 'local_geo', 'long_tail'] as KeywordCategory[],
} as const;
