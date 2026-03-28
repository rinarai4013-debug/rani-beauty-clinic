/**
 * Treatment Outcome Prediction Engine
 *
 * Predicts treatment outcomes based on demographic, treatment, and protocol data:
 * - Satisfaction likelihood (1-10)
 * - Duration of results
 * - Side effect probability and severity
 * - Number of sessions needed
 * - Total cost projection
 * - Patient expectation calibration
 * - Before/after photo timeline expectations
 * - Factors that improve/reduce outcomes
 *
 * CRITICAL: Rani does IM INJECTIONS only. Never say "infusion."
 */

import type {
  ClientProfile,
  OutcomePrediction,
  ResultsDuration,
  SideEffectPrediction,
  SessionPrediction,
  ExpectationCalibration,
  OutcomeFactor,
  PhotoTimelinePoint,
  HistoricalOutcome,
  FitzpatrickType,
  SkinConcern,
  TreatmentCategory,
} from '@/types/ai-treatment';
import { getProtocolById } from './treatment-protocols';

// ── TREATMENT OUTCOME DATA ──

interface TreatmentOutcomeProfile {
  baseSatisfaction: number; // 1-10
  durationRange: { min: string; typical: string; max: string };
  sideEffects: Array<{ effect: string; baseProbability: number; severity: 'mild' | 'moderate' | 'severe'; duration: string; management: string }>;
  sessionRange: { min: number; recommended: number; max: number; interval: string; totalTimespan: string };
  baseExpectedCost: number;
  photoTimeline: PhotoTimelinePoint[];
}

const OUTCOME_PROFILES: Record<string, TreatmentOutcomeProfile> = {
  'botox-forehead': {
    baseSatisfaction: 8.5,
    durationRange: { min: '2 months', typical: '3-4 months', max: '6 months' },
    sideEffects: [
      { effect: 'Mild bruising at injection sites', baseProbability: 25, severity: 'mild', duration: '3-5 days', management: 'Arnica cream, ice, avoid blood thinners' },
      { effect: 'Temporary headache', baseProbability: 15, severity: 'mild', duration: '24-48 hours', management: 'Over-the-counter analgesic' },
      { effect: 'Brow ptosis (drooping)', baseProbability: 2, severity: 'moderate', duration: '2-4 weeks (resolves as Botox wears off)', management: 'Apraclonidine eye drops, preventable with proper technique' },
      { effect: 'Injection site swelling', baseProbability: 10, severity: 'mild', duration: '30 minutes to 2 hours', management: 'Ice, resolves quickly' },
    ],
    sessionRange: { min: 1, recommended: 1, max: 1, interval: 'Every 3-4 months', totalTimespan: 'Single session, repeat every 3-4 months' },
    baseExpectedCost: 350,
    photoTimeline: [
      { timing: 'Day 0 (treatment day)', expectedAppearance: 'No visible change — small injection marks that resolve within 30 minutes', normalVariations: ['Tiny bumps at injection sites', 'Minor redness'] },
      { timing: 'Day 3-5', expectedAppearance: 'Onset of muscle relaxation — forehead begins to feel smoother', normalVariations: ['Gradual onset — some areas may kick in before others', 'Still able to move forehead somewhat'] },
      { timing: 'Day 14 (peak)', expectedAppearance: 'Full result — smooth forehead with natural-looking expression', normalVariations: ['Slight asymmetry is normal and can be corrected at touch-up', 'Some residual movement is desirable for a natural look'] },
      { timing: 'Month 2-3', expectedAppearance: 'Results maintained beautifully at peak', normalVariations: ['Very gradual return of movement begins'] },
      { timing: 'Month 3-4', expectedAppearance: 'Gradual return of muscle movement — time for maintenance', normalVariations: ['Results fade gradually, not abruptly', 'Some clients notice lines returning at rest first'] },
    ],
  },
  'filler-cheeks': {
    baseSatisfaction: 8.8,
    durationRange: { min: '9 months', typical: '12-18 months', max: '24 months' },
    sideEffects: [
      { effect: 'Swelling', baseProbability: 90, severity: 'mild', duration: '3-7 days (most resolves in 48 hours)', management: 'Ice, elevation, arnica' },
      { effect: 'Bruising', baseProbability: 40, severity: 'mild', duration: '5-10 days', management: 'Arnica, avoid blood thinners, concealer' },
      { effect: 'Tenderness at injection site', baseProbability: 60, severity: 'mild', duration: '3-5 days', management: 'Avoid pressure on area' },
      { effect: 'Asymmetry (may need adjustment)', baseProbability: 10, severity: 'mild', duration: 'Correctable at 2-week follow-up', management: 'Touch-up at follow-up appointment' },
      { effect: 'Nodule or lump', baseProbability: 5, severity: 'moderate', duration: 'Weeks (dissolvable if HA filler)', management: 'Massage or hyaluronidase if needed' },
      { effect: 'Vascular occlusion', baseProbability: 0.5, severity: 'severe', duration: 'Immediate emergency', management: 'Hyaluronidase injection — all Rani providers trained in emergency protocol' },
    ],
    sessionRange: { min: 1, recommended: 1, max: 2, interval: 'Every 12-18 months for maintenance', totalTimespan: '1 session (possible touch-up at 2 weeks)' },
    baseExpectedCost: 1200,
    photoTimeline: [
      { timing: 'Day 0', expectedAppearance: 'Visible volume enhancement — expect 30-50% MORE volume than final result due to swelling', normalVariations: ['Significant swelling is normal', 'Bruising possible'] },
      { timing: 'Day 3-5', expectedAppearance: 'Swelling beginning to subside — starting to see true shape', normalVariations: ['Some asymmetric swelling is normal', 'Bruising peaking and beginning to yellow'] },
      { timing: 'Week 2', expectedAppearance: 'Most swelling resolved — results taking final shape', normalVariations: ['Minor residual swelling possible', 'Touch-up may be recommended'] },
      { timing: 'Month 1', expectedAppearance: 'Final result — beautiful, natural midface volume', normalVariations: ['Filler fully integrated with tissue', 'Natural movement and expression'] },
      { timing: 'Month 12-18', expectedAppearance: 'Results still present but may notice subtle volume decrease', normalVariations: ['Gradual metabolism of filler', 'Time to consider maintenance session'] },
    ],
  },
  'rfmn-face': {
    baseSatisfaction: 8.2,
    durationRange: { min: '6 months', typical: '1-2 years', max: '3+ years (with maintenance)' },
    sideEffects: [
      { effect: 'Redness (sunburn-like)', baseProbability: 95, severity: 'mild', duration: '2-5 days', management: 'Barrier cream, gentle skincare, avoid sun' },
      { effect: 'Swelling', baseProbability: 70, severity: 'mild', duration: '1-3 days', management: 'Ice, elevation' },
      { effect: 'Pin-point bleeding during treatment', baseProbability: 50, severity: 'mild', duration: 'During treatment only', management: 'Normal part of the treatment process' },
      { effect: 'Mild peeling/flaking', baseProbability: 30, severity: 'mild', duration: '3-5 days post-treatment', management: 'Gentle moisturizer, do not pick' },
      { effect: 'Post-inflammatory hyperpigmentation', baseProbability: 5, severity: 'moderate', duration: '4-8 weeks', management: 'SPF diligently, brightening serum, more common in Fitzpatrick IV-VI' },
    ],
    sessionRange: { min: 1, recommended: 3, max: 6, interval: 'Every 4-6 weeks', totalTimespan: '3-6 months for series' },
    baseExpectedCost: 1785,
    photoTimeline: [
      { timing: 'Day 0', expectedAppearance: 'Red grid-like pattern on skin, similar to a sunburn', normalVariations: ['Intensity varies by energy level', 'Some pin-point bleeding during treatment is normal'] },
      { timing: 'Day 2-3', expectedAppearance: 'Redness fading, skin feels tight and smooth', normalVariations: ['Mild peeling possible', 'Skin feels "sandpaper-like" before peeling'] },
      { timing: 'Week 1-2', expectedAppearance: 'Skin renewed, smoother texture, tighter feel', normalVariations: ['Subtle but noticeable improvement', 'Glow and texture improvement most noticeable'] },
      { timing: 'Month 1-3', expectedAppearance: 'Progressive collagen building — skin continues improving', normalVariations: ['Results are cumulative across sessions', 'Best results after completing full series'] },
      { timing: 'Month 3-6 (after series)', expectedAppearance: 'Significantly improved skin texture, tone, and tightness', normalVariations: ['Collagen remodeling continues for months after final session', '30-70% improvement depending on concern'] },
    ],
  },
  'sofwave-full-face': {
    baseSatisfaction: 8.0,
    durationRange: { min: '6 months', typical: '1-2 years', max: '2+ years with maintenance' },
    sideEffects: [
      { effect: 'Mild redness', baseProbability: 60, severity: 'mild', duration: '1-2 hours', management: 'Resolves quickly without intervention' },
      { effect: 'Warmth/tingling', baseProbability: 40, severity: 'mild', duration: '30 minutes post-treatment', management: 'Normal sensation, resolves quickly' },
      { effect: 'Temporary tenderness', baseProbability: 20, severity: 'mild', duration: '24 hours', management: 'Over-the-counter analgesic if needed' },
    ],
    sessionRange: { min: 1, recommended: 1, max: 2, interval: 'Annual', totalTimespan: 'Single session' },
    baseExpectedCost: 3500,
    photoTimeline: [
      { timing: 'Day 0', expectedAppearance: 'Mild redness that resolves within hours — otherwise, look the same', normalVariations: ['Some clients see subtle immediate tightening', 'No visible marks or bruising'] },
      { timing: 'Week 2-4', expectedAppearance: 'Subtle tightening becoming noticeable', normalVariations: ['Very gradual onset', 'May not notice day-to-day but visible in comparison photos'] },
      { timing: 'Month 2-3', expectedAppearance: 'Visible lifting of jawline, brow, and midface', normalVariations: ['Results continue building', 'Others may comment on looking refreshed'] },
      { timing: 'Month 3-6 (peak)', expectedAppearance: 'Maximum results — lifted, tighter, more defined facial contours', normalVariations: ['Collagen remodeling at peak', 'Natural, not "done" appearance'] },
      { timing: 'Month 12+', expectedAppearance: 'Results maintained, gradual natural aging continues', normalVariations: ['Annual maintenance session recommended', 'Aging slowed but not stopped'] },
    ],
  },
  'lhr-face': {
    baseSatisfaction: 8.5,
    durationRange: { min: '1 year', typical: 'Permanent (80-90% reduction)', max: 'Permanent with annual touch-ups' },
    sideEffects: [
      { effect: 'Redness and perifollicular edema', baseProbability: 80, severity: 'mild', duration: '1-3 hours', management: 'Aloe vera, cooling' },
      { effect: 'Mild discomfort during treatment', baseProbability: 70, severity: 'mild', duration: 'During treatment', management: 'Cooling device, topical numbing for sensitive areas' },
      { effect: 'Temporary darkening of hair before shedding', baseProbability: 40, severity: 'mild', duration: '1-3 weeks', management: 'Normal — hair is shedding' },
      { effect: 'Post-inflammatory hyperpigmentation', baseProbability: 3, severity: 'moderate', duration: '4-8 weeks', management: 'SPF, brightening products, more common in darker skin types' },
    ],
    sessionRange: { min: 4, recommended: 6, max: 8, interval: 'Every 4-6 weeks', totalTimespan: '6-12 months' },
    baseExpectedCost: 1200,
    photoTimeline: [
      { timing: 'Day 0', expectedAppearance: 'Mild redness around hair follicles — looks like mild irritation', normalVariations: ['Perifollicular edema is actually a good sign', 'Resolves within hours'] },
      { timing: 'Week 1-3', expectedAppearance: 'Treated hairs beginning to shed — may look like growth initially', normalVariations: ['Hairs push out as they shed', 'Can gently exfoliate to help shedding'] },
      { timing: 'After session 2-3', expectedAppearance: 'Noticeably fewer hairs, patchier regrowth', normalVariations: ['50-60% reduction visible', 'Remaining hairs may be finer'] },
      { timing: 'After session 5-6', expectedAppearance: 'Significant hair reduction — smooth skin with minimal regrowth', normalVariations: ['80-90% reduction', 'Some stubborn follicles may need additional sessions'] },
      { timing: '6 months post-series', expectedAppearance: 'Permanent reduction achieved — smooth, hair-free skin', normalVariations: ['Annual touch-up may be needed for hormonal hair', 'Some light vellus hair may remain'] },
    ],
  },
  'peel-vi': {
    baseSatisfaction: 8.3,
    durationRange: { min: '3 months', typical: '3-6 months', max: '6-12 months with maintenance' },
    sideEffects: [
      { effect: 'Peeling/flaking (day 3-7)', baseProbability: 95, severity: 'mild', duration: '4-7 days', management: 'Follow aftercare kit exactly, do not pick or pull' },
      { effect: 'Tightness and dryness', baseProbability: 80, severity: 'mild', duration: '1-7 days', management: 'Aftercare moisturizer included in kit' },
      { effect: 'Redness during peeling phase', baseProbability: 70, severity: 'mild', duration: '5-7 days', management: 'Normal — new skin is temporarily pink' },
      { effect: 'Mild stinging during application', baseProbability: 60, severity: 'mild', duration: '2-5 minutes during treatment', management: 'Fan to cool, resolves quickly' },
      { effect: 'Temporary darkening before peeling', baseProbability: 30, severity: 'mild', duration: '2-3 days before peeling begins', management: 'Normal part of the process — skin will lighten dramatically after peel' },
    ],
    sessionRange: { min: 1, recommended: 3, max: 4, interval: 'Every 4-6 weeks', totalTimespan: '3-4 months for series' },
    baseExpectedCost: 1185,
    photoTimeline: [
      { timing: 'Day 0-1', expectedAppearance: 'Slight redness and tightness — peel is still on skin', normalVariations: ['Mild tingling or warmth is normal', 'Leave peel on as instructed'] },
      { timing: 'Day 2-3', expectedAppearance: 'Skin feels tight, may notice darkening before peeling begins', normalVariations: ['Pigmented areas may temporarily darken — this is good', 'Do not panic — this is the peel working'] },
      { timing: 'Day 3-7', expectedAppearance: 'Peeling phase — sheets of skin shedding to reveal fresh skin beneath', normalVariations: ['Peeling intensity varies', 'Some areas peel more than others', 'DO NOT pull or pick peeling skin'] },
      { timing: 'Day 7-10', expectedAppearance: 'Fresh, glowing, baby-soft skin revealed', normalVariations: ['Temporary pinkness', 'Use SPF religiously'] },
      { timing: 'Week 4-6', expectedAppearance: 'Full results visible — dramatically improved tone, texture, and clarity', normalVariations: ['Pigmentation significantly reduced', 'Skin texture noticeably smoother'] },
    ],
  },
  'hydrafacial-signature': {
    baseSatisfaction: 8.7,
    durationRange: { min: '1 week', typical: '4-6 weeks', max: '6 weeks (maintenance needed)' },
    sideEffects: [
      { effect: 'Temporary redness', baseProbability: 15, severity: 'mild', duration: '30 minutes', management: 'Resolves very quickly' },
      { effect: 'Mild sensitivity', baseProbability: 10, severity: 'mild', duration: '24 hours', management: 'Gentle skincare, avoid actives' },
    ],
    sessionRange: { min: 1, recommended: 1, max: 1, interval: 'Monthly', totalTimespan: 'Ongoing monthly' },
    baseExpectedCost: 275,
    photoTimeline: [
      { timing: 'Immediately after', expectedAppearance: 'The famous "HydraFacial glow" — visibly brighter, dewier skin', normalVariations: ['Very mild redness possible', 'Pores appear minimized'] },
      { timing: '24-48 hours', expectedAppearance: 'Peak glow — skin looks its absolute best', normalVariations: ['Many clients schedule 2 days before events', 'Makeup applies beautifully'] },
      { timing: 'Week 2-4', expectedAppearance: 'Continued improved skin quality', normalVariations: ['Glow gradually fades', 'Monthly maintenance recommended'] },
    ],
  },
  'glp1-semaglutide': {
    baseSatisfaction: 8.4,
    durationRange: { min: '6 months', typical: 'Ongoing with maintained use', max: 'Permanent with lifestyle changes' },
    sideEffects: [
      { effect: 'Nausea', baseProbability: 50, severity: 'mild', duration: 'First 2-4 weeks (improves with each titration)', management: 'Eat smaller meals, avoid greasy foods, ginger tea' },
      { effect: 'Constipation', baseProbability: 25, severity: 'mild', duration: 'Ongoing (manageable)', management: 'Increase fiber and water, consider stool softener' },
      { effect: 'Injection site reaction', baseProbability: 10, severity: 'mild', duration: '24 hours', management: 'Rotate injection sites' },
      { effect: 'Fatigue', baseProbability: 15, severity: 'mild', duration: 'First 1-2 weeks', management: 'Usually resolves as body adjusts' },
      { effect: 'Gallbladder issues', baseProbability: 3, severity: 'moderate', duration: 'Varies', management: 'Report right upper quadrant pain immediately' },
    ],
    sessionRange: { min: 3, recommended: 12, max: 24, interval: 'Monthly check-ins, weekly self-injection', totalTimespan: '6-12 months initial program' },
    baseExpectedCost: 4788,
    photoTimeline: [
      { timing: 'Week 1-2', expectedAppearance: 'No visible change yet — appetite changes beginning internally', normalVariations: ['Some clients notice reduced food noise/cravings', 'Scale may not show change yet'] },
      { timing: 'Month 1', expectedAppearance: 'First visible changes — clothes may feel looser, 5-8 lbs typical', normalVariations: ['Rate varies by individual', 'Face may show changes first'] },
      { timing: 'Month 3', expectedAppearance: 'Significant visible transformation — 10-15% body weight loss trajectory', normalVariations: ['Steady loss of 1-2 lbs per week', 'Others beginning to notice'] },
      { timing: 'Month 6', expectedAppearance: 'Dramatic transformation — 15-20% body weight loss for many', normalVariations: ['Skin may begin to loosen', 'Consider RF microneedling body for tightening'] },
      { timing: 'Month 12', expectedAppearance: 'Goal weight achieved or significant progress toward it', normalVariations: ['Maintenance dose may be lower', 'Lifestyle habits critical for long-term success'] },
    ],
  },
};

// ── MAIN PREDICTION FUNCTION ──

export function predictOutcome(
  profile: ClientProfile,
  treatmentId: string,
): OutcomePrediction {
  const outcomeProfile = OUTCOME_PROFILES[treatmentId];
  const protocol = getProtocolById(treatmentId);

  if (!outcomeProfile) {
    return generateGenericPrediction(profile, treatmentId);
  }

  // Adjust satisfaction based on client factors
  const satisfaction = adjustSatisfaction(outcomeProfile.baseSatisfaction, profile, treatmentId);

  // Adjust duration based on lifestyle
  const duration = adjustDuration(outcomeProfile.durationRange, profile);

  // Adjust side effects based on profile
  const sideEffects = adjustSideEffects(outcomeProfile.sideEffects, profile);

  // Session prediction
  const sessions = adjustSessions(outcomeProfile.sessionRange, profile);

  // Cost projection
  const totalCost = calculateTotalCost(outcomeProfile, sessions, profile);

  // Expectation calibration
  const calibration = calibrateExpectations(treatmentId, profile, outcomeProfile);

  // Outcome factors
  const factors = identifyOutcomeFactors(profile);

  return {
    treatmentId,
    treatmentName: protocol?.name || treatmentId,
    satisfactionLikelihood: satisfaction,
    resultsDuration: duration,
    sideEffects,
    sessionsNeeded: sessions,
    totalCostProjection: totalCost,
    expectationCalibration: calibration,
    outcomeFactors: factors,
    photoTimeline: outcomeProfile.photoTimeline,
  };
}

// ── ADJUSTMENT FUNCTIONS ──

function adjustSatisfaction(base: number, profile: ClientProfile, treatmentId: string): number {
  let score = base;

  // Realistic expectations improve satisfaction
  if (profile.age > 60 && treatmentId.includes('botox')) score -= 0.3; // Deeper static lines may not fully resolve
  if (profile.age < 35 && treatmentId.includes('botox')) score += 0.2; // Younger patients see great preventive results

  // Lifestyle factors
  if (profile.lifestyleFactors?.smoking) score -= 0.5;
  if (profile.lifestyleFactors?.skincare === 'advanced') score += 0.3;
  if (profile.lifestyleFactors?.sunExposure === 'heavy') score -= 0.3;

  // Previous treatment satisfaction history
  if (profile.treatmentHistory && profile.treatmentHistory.length > 0) {
    const avgSatisfaction = profile.treatmentHistory.reduce((s, t) => s + t.satisfaction, 0) / profile.treatmentHistory.length;
    if (avgSatisfaction >= 8) score += 0.3; // Happy patients tend to stay happy
    if (avgSatisfaction <= 5) score -= 0.5; // Previous dissatisfaction is a risk factor
  }

  return Math.max(1, Math.min(10, Math.round(score * 10) / 10));
}

function adjustDuration(
  baseRange: { min: string; typical: string; max: string },
  profile: ClientProfile,
): ResultsDuration {
  const extending: string[] = [];
  const reducing: string[] = [];

  // Factors extending results
  if (profile.lifestyleFactors?.sunExposure === 'minimal') extending.push('Minimal sun exposure helps preserve results');
  if (profile.lifestyleFactors?.skincare === 'advanced') extending.push('Professional skincare routine extends treatment benefits');
  if (!profile.lifestyleFactors?.smoking) extending.push('Non-smoker — collagen production not compromised');
  if (profile.lifestyleFactors?.waterIntake === 'high') extending.push('Excellent hydration supports skin health');
  if (profile.lifestyleFactors?.exerciseFrequency === 'regular') extending.push('Regular exercise promotes healthy circulation');

  // Factors reducing results
  if (profile.lifestyleFactors?.smoking) reducing.push('Smoking accelerates collagen breakdown and reduces blood flow');
  if (profile.lifestyleFactors?.sunExposure === 'heavy') reducing.push('Heavy sun exposure degrades results faster');
  if (profile.lifestyleFactors?.stressLevel === 'high') reducing.push('Chronic stress affects skin healing and aging');
  if (profile.lifestyleFactors?.sleepQuality === 'poor') reducing.push('Poor sleep impairs skin repair processes');
  if (profile.lifestyleFactors?.skincare === 'none') reducing.push('No skincare routine means results fade faster');

  return {
    minimum: baseRange.min,
    typical: baseRange.typical,
    maximum: baseRange.max,
    factorsExtending: extending.length > 0 ? extending : ['Consistent SPF use', 'Professional skincare routine'],
    factorsReducing: reducing.length > 0 ? reducing : ['Heavy sun exposure', 'Smoking', 'Lack of skincare routine'],
  };
}

function adjustSideEffects(
  baseSideEffects: TreatmentOutcomeProfile['sideEffects'],
  profile: ClientProfile,
): SideEffectPrediction[] {
  return baseSideEffects.map(se => {
    let probability = se.baseProbability;

    // Blood thinners increase bruising risk
    if (se.effect.toLowerCase().includes('bruis') && profile.medicalHistory.bloodThinners) {
      probability = Math.min(100, probability * 1.8);
    }

    // Darker skin types have higher PIH risk
    if (se.effect.toLowerCase().includes('hyperpigmentation') && profile.skinType >= 4) {
      probability = Math.min(100, probability * 2);
    }

    // Age affects healing
    if (profile.age > 60) {
      if (se.effect.toLowerCase().includes('swelling') || se.effect.toLowerCase().includes('bruis')) {
        probability = Math.min(100, probability * 1.3);
      }
    }

    return {
      effect: se.effect,
      probability: Math.round(probability),
      severity: se.severity,
      duration: se.duration,
      management: se.management,
    };
  });
}

function adjustSessions(
  baseRange: TreatmentOutcomeProfile['sessionRange'],
  profile: ClientProfile,
): SessionPrediction {
  let recommended = baseRange.recommended;

  // Older patients or severe concerns may need more sessions for RF/peels
  if (profile.age > 55 && baseRange.max > 1) {
    recommended = Math.min(baseRange.max, recommended + 1);
  }

  // Skin type considerations for laser
  if (profile.skinType >= 4 && baseRange.recommended >= 4) {
    recommended = Math.min(baseRange.max, recommended + 1); // May need more sessions at lower settings
  }

  return {
    minimum: baseRange.min,
    recommended,
    maximum: baseRange.max,
    intervalBetween: baseRange.interval,
    totalTimespan: baseRange.totalTimespan,
  };
}

function calculateTotalCost(
  outcomeProfile: TreatmentOutcomeProfile,
  sessions: SessionPrediction,
  profile: ClientProfile,
): number {
  const perSessionCost = outcomeProfile.baseExpectedCost / outcomeProfile.sessionRange.recommended;
  return Math.round(perSessionCost * sessions.recommended);
}

function calibrateExpectations(
  treatmentId: string,
  profile: ClientProfile,
  outcomeProfile: TreatmentOutcomeProfile,
): ExpectationCalibration {
  const misconceptions: string[] = [];
  const disclosures: string[] = [];

  // Common misconceptions by treatment type
  if (treatmentId.includes('botox')) {
    misconceptions.push('Botox does NOT freeze your face — when done well, you maintain natural expression');
    misconceptions.push('Botox does NOT fill wrinkles — it relaxes muscles that create wrinkles');
    misconceptions.push('Results are not immediate — it takes 3-5 days to begin working');
    disclosures.push('Deep static lines (present without movement) may improve but not disappear completely');
    disclosures.push('First-time patients may metabolize Botox faster — second treatment often lasts longer');
  }

  if (treatmentId.includes('filler')) {
    misconceptions.push('You will look swollen for 3-7 days — this is NOT the final result');
    misconceptions.push('Fillers do not make you look "overdone" when done conservatively');
    misconceptions.push('HA fillers are reversible — they can be dissolved if needed');
    disclosures.push('Some asymmetry is normal immediately after — we evaluate at 2-week follow-up');
    disclosures.push('Results from the first session may not be as dramatic as you hoped — building gradually is our approach');
  }

  if (treatmentId.includes('rfmn')) {
    misconceptions.push('You will NOT see dramatic results after one session — this is a series treatment');
    misconceptions.push('Redness is NOT a complication — it is expected and indicates the treatment is working');
    disclosures.push('Full results take 3-6 months as collagen remodels — patience is key');
    disclosures.push('Results are cumulative — each session builds on the previous one');
  }

  if (treatmentId.includes('glp1')) {
    misconceptions.push('GLP-1 is NOT a magic weight loss shot — it works best combined with nutrition and exercise');
    misconceptions.push('Weight loss is gradual and steady — expect 1-2 lbs per week, not overnight changes');
    disclosures.push('GI side effects (nausea) are common initially but typically improve within 2-4 weeks');
    disclosures.push('Maintaining results long-term requires lifestyle changes — the medication is a tool, not a cure');
  }

  // Build realistic outcome statement
  const realistic = `Based on your profile (age ${profile.age}, skin type ${profile.skinType}), you can expect ${outcomeProfile.durationRange.typical} of results with proper maintenance. ${profile.lifestyleFactors?.smoking ? 'Smoking may reduce results duration.' : 'Your healthy lifestyle supports excellent outcomes.'}`;

  const bestCase = `In the best scenario — consistent aftercare, SPF use, and healthy lifestyle — you could see results lasting ${outcomeProfile.durationRange.max}.`;

  const worstCase = `In a less optimal scenario, results may last closer to ${outcomeProfile.durationRange.min}. Factors like sun exposure, smoking, or inconsistent skincare can affect duration.`;

  return {
    realisticOutcome: realistic,
    bestCase,
    worstCase,
    commonMisconceptions: misconceptions,
    importantDisclosures: disclosures,
  };
}

function identifyOutcomeFactors(profile: ClientProfile): OutcomeFactor[] {
  const factors: OutcomeFactor[] = [];
  const lf = profile.lifestyleFactors;

  if (lf) {
    if (lf.sunExposure === 'minimal') {
      factors.push({ factor: 'Minimal sun exposure', impact: 'improves', magnitude: 'significant', recommendation: 'Continue protecting your skin from UV — this is the #1 factor for treatment longevity' });
    } else if (lf.sunExposure === 'heavy') {
      factors.push({ factor: 'Heavy sun exposure', impact: 'reduces', magnitude: 'significant', recommendation: 'We strongly recommend increasing sun protection to SPF 50 daily and limiting direct sun exposure' });
    }

    if (lf.smoking) {
      factors.push({ factor: 'Smoking', impact: 'reduces', magnitude: 'significant', recommendation: 'Smoking reduces blood flow and collagen production — even reducing consumption can improve outcomes' });
    }

    if (lf.skincare === 'advanced') {
      factors.push({ factor: 'Advanced skincare routine', impact: 'improves', magnitude: 'moderate', recommendation: 'Your commitment to professional skincare will significantly enhance treatment results' });
    } else if (lf.skincare === 'none') {
      factors.push({ factor: 'No current skincare routine', impact: 'reduces', magnitude: 'moderate', recommendation: 'Adding a basic routine (cleanser, SPF, retinoid) would dramatically improve your results' });
    }

    if (lf.waterIntake === 'high') {
      factors.push({ factor: 'Excellent hydration', impact: 'improves', magnitude: 'minor', recommendation: 'Great hydration supports skin health and healing' });
    }

    if (lf.sleepQuality === 'poor') {
      factors.push({ factor: 'Poor sleep quality', impact: 'reduces', magnitude: 'moderate', recommendation: 'Skin repair happens during sleep — improving sleep quality will boost treatment outcomes' });
    }

    if (lf.stressLevel === 'high') {
      factors.push({ factor: 'High stress levels', impact: 'reduces', magnitude: 'minor', recommendation: 'Chronic stress accelerates aging — stress management supports treatment results' });
    }

    if (lf.exerciseFrequency === 'regular' || lf.exerciseFrequency === 'daily') {
      factors.push({ factor: 'Regular exercise', impact: 'improves', magnitude: 'moderate', recommendation: 'Exercise promotes circulation and collagen production — excellent for treatment outcomes' });
    }
  }

  // Age factor
  if (profile.age < 35) {
    factors.push({ factor: 'Younger age', impact: 'improves', magnitude: 'moderate', recommendation: 'Your skin\'s natural collagen production is still strong — treatments are an excellent investment in prevention' });
  } else if (profile.age >= 55) {
    factors.push({ factor: 'Mature skin', impact: 'neutral', magnitude: 'minor', recommendation: 'Results may take slightly longer to manifest but will be well worth the investment — consistency is key' });
  }

  return factors;
}

// ── GENERIC PREDICTION FALLBACK ──

function generateGenericPrediction(profile: ClientProfile, treatmentId: string): OutcomePrediction {
  const protocol = getProtocolById(treatmentId);

  return {
    treatmentId,
    treatmentName: protocol?.name || treatmentId,
    satisfactionLikelihood: 8.0,
    resultsDuration: {
      minimum: protocol?.expectedResults.duration || '3 months',
      typical: protocol?.expectedResults.duration || '6-12 months',
      maximum: '12+ months with maintenance',
      factorsExtending: ['Consistent SPF use', 'Professional skincare', 'Healthy lifestyle'],
      factorsReducing: ['Sun exposure', 'Smoking', 'Poor skincare habits'],
    },
    sideEffects: [
      { effect: 'Mild redness', probability: 30, severity: 'mild', duration: '24-48 hours', management: 'Cold compress, gentle skincare' },
      { effect: 'Temporary sensitivity', probability: 20, severity: 'mild', duration: '24-48 hours', management: 'Avoid active ingredients, use gentle products' },
    ],
    sessionsNeeded: {
      minimum: 1,
      recommended: protocol?.followUpSchedule.length || 1,
      maximum: (protocol?.followUpSchedule.length || 1) + 2,
      intervalBetween: 'As recommended by provider',
      totalTimespan: protocol?.expectedResults.duration || '3-6 months',
    },
    totalCostProjection: protocol?.pricing.basePrice || 500,
    expectationCalibration: {
      realisticOutcome: 'Results vary by individual — your provider will set specific expectations during consultation.',
      bestCase: 'Optimal outcomes with consistent aftercare and healthy lifestyle.',
      worstCase: 'Minimal improvement possible if aftercare is not followed or contraindications arise.',
      commonMisconceptions: ['Results require patience — most treatments improve over weeks to months'],
      importantDisclosures: ['All results are individual', 'Follow-up appointments are important for optimal outcomes'],
    },
    outcomeFactors: identifyOutcomeFactors(profile),
    photoTimeline: [
      { timing: 'Day 0', expectedAppearance: 'Treatment completed — follow post-care instructions', normalVariations: ['Mild redness or sensitivity possible'] },
      { timing: 'Week 2-4', expectedAppearance: 'Initial results becoming visible', normalVariations: ['Gradual improvement expected'] },
      { timing: 'Month 1-3', expectedAppearance: 'Full results developing', normalVariations: ['Continued improvement over time'] },
    ],
  };
}

// ── HISTORICAL OUTCOME TRACKING ──

/**
 * Create a historical outcome record for ML training data
 */
export function createOutcomeRecord(
  clientId: string,
  treatmentId: string,
  treatmentDate: string,
  profile: ClientProfile,
  outcome: {
    satisfaction: number;
    resultsDuration: string;
    sideEffects: string[];
    sessionsCompleted: number;
    wouldRepeat: boolean;
  },
): HistoricalOutcome {
  return {
    clientId,
    treatmentId,
    treatmentDate,
    protocol: treatmentId,
    demographics: {
      age: profile.age,
      skinType: profile.skinType,
      concerns: profile.concerns,
    },
    outcome,
  };
}

/**
 * Batch prediction for multiple treatments
 */
export function predictOutcomes(
  profile: ClientProfile,
  treatmentIds: string[],
): OutcomePrediction[] {
  return treatmentIds.map(id => predictOutcome(profile, id));
}

export { OUTCOME_PROFILES };
