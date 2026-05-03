import type { UnifiedService } from '@/data/services/unified-catalog';
import type { ConsultationFormData } from '@/lib/consultation/schema';
import type { AuraScanResult, FacialZone, MastermindTreatment } from '@/types/mastermind';

type RiskLevel = MastermindTreatment['riskLevel'];

export interface ServiceClinicalLogic {
  sessionsRequired: number;
  intervalWeeks: number;
  intervalBetweenSessions: string;
  expectedImprovement: string;
  timeToResults: string;
  longevity: string;
  riskLevel: RiskLevel;
  targetConcerns: string[];
  targetZones: FacialZone[];
  contraindications: string[];
  patientReasoning: string;
  clinicalRationale: string;
  planningSignals: string[];
}

const FACIAL_ZONE_KEYWORDS: Array<[FacialZone, RegExp]> = [
  ['forehead', /\bforehead|horizontal lines?\b/i],
  ['glabella', /\bglabella|frown|11s?|eleven lines?\b/i],
  ['periorbital_left', /\bcrow'?s feet|under ?eye|eye lines?|tear trough\b/i],
  ['periorbital_right', /\bcrow'?s feet|under ?eye|eye lines?|tear trough\b/i],
  ['cheeks_left', /\bcheek|midface|volume loss\b/i],
  ['cheeks_right', /\bcheek|midface|volume loss\b/i],
  ['nasolabial_left', /\bnasolabial|smile lines?\b/i],
  ['nasolabial_right', /\bnasolabial|smile lines?\b/i],
  ['lips', /\blip|perioral|smoker lines?\b/i],
  ['jawline', /\bjawline|jowl|lower face\b/i],
  ['chin', /\bchin|mentalis\b/i],
  ['neck', /\bneck|platysmal|submental\b/i],
  ['decolletage', /\bdecolletage|chest\b/i],
];

function asArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
}

function normalizeLabel(value: string): string {
  return value.replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = value.toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function serviceKey(service: UnifiedService): string {
  return `${service.category} ${service.id} ${service.parentSlug ?? ''} ${service.name}`.toLowerCase();
}

function buildIntakeText(intakeData: Partial<ConsultationFormData>): string {
  const extraIntake = intakeData as Partial<ConsultationFormData> & { previousTreatments?: unknown };
  const parts = [
    ...asArray(intakeData.skinConcerns),
    ...asArray(intakeData.targetAreas),
    ...asArray(intakeData.treatmentInterests),
    ...asArray(extraIntake.previousTreatments),
    intakeData.treatmentHistory,
    intakeData.goals,
    intakeData.clinicalNotes,
    intakeData.skinType,
    intakeData.timeline,
    intakeData.budget,
  ];
  return parts.filter(Boolean).map(String).join(' | ').toLowerCase();
}

function buildBaseConcerns(service: UnifiedService, scanResult: AuraScanResult): string[] {
  const scanConcerns = scanResult.detectedConcerns
    .slice()
    .sort((a, b) => b.score - a.score)
    .map((concern) => normalizeLabel(concern.concern));
  const serviceConcerns = service.concerns.map(normalizeLabel);
  return unique([...serviceConcerns, ...scanConcerns]).slice(0, 5);
}

function buildBaseZones(scanResult: AuraScanResult, intakeText: string): FacialZone[] {
  const zones = scanResult.zoneAnalysis
    .slice()
    .sort((a, b) => b.overallScore - a.overallScore)
    .map((zone) => zone.zone);

  for (const [zone, matcher] of FACIAL_ZONE_KEYWORDS) {
    if (matcher.test(intakeText)) zones.unshift(zone);
  }

  const deduped = Array.from(new Set(zones));
  return deduped.length > 0 ? deduped.slice(0, 4) : ['forehead'];
}

function hasAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function topConcernScore(scanResult: AuraScanResult, patterns: RegExp[]): number {
  return scanResult.detectedConcerns.reduce((max, concern) => {
    const haystack = `${concern.concern} ${concern.description} ${concern.clinicalNote}`.toLowerCase();
    return hasAny(haystack, patterns) ? Math.max(max, concern.score) : max;
  }, 0);
}

function extractPriorLaserSessions(text: string): number | null {
  const direct = text.match(/\b(\d{1,2})\s*(?:laser|lhr)?\s*(?:sessions?|treatments?)\b/i);
  if (direct) return Number(direct[1]);

  const reversed = text.match(/\b(?:laser|lhr)\D{0,16}(\d{1,2})\s*(?:sessions?|treatments?)?\b/i);
  if (reversed) return Number(reversed[1]);

  return null;
}

function buildLaserHairLogic(
  service: UnifiedService,
  scanResult: AuraScanResult,
  intakeText: string,
  baseConcerns: string[],
  baseZones: FacialZone[],
  intakeData: Partial<ConsultationFormData>
): ServiceClinicalLogic {
  const signals: string[] = [];
  let sessions = service.sessions || 6;
  let intervalWeeks = service.bodyAreas.some((area) => ['face', 'neck'].includes(area)) ? 4 : 6;
  let riskLevel: RiskLevel = 'low';
  const contraindications: string[] = [];

  const thickHair = hasAny(intakeText, [/\bcoarse\b/, /\bthick\b/, /\bdense\b/, /\bdark hair\b/, /\bstubble\b/]);
  const fineOrLightHair = hasAny(intakeText, [/\bfine\b/, /\blight hair\b/, /\bblonde\b/, /\bgray\b/, /\bred hair\b/, /\bpeach fuzz\b/]);
  const dailyShaving = hasAny(intakeText, [/\bdaily\b/, /\bevery day\b/, /\beach day\b/, /\bevery morning\b/]);
  const frequentShaving = hasAny(intakeText, [/\bevery\s*(2|3)\s*days?\b/, /\b[3-7]\s*(?:x|times)\s*(?:a\s*)?week\b/]);
  const hormonalPattern = hasAny(intakeText, [/\bpcos\b/, /\bhormonal\b/, /\bingrown\b/, /\bchin\b/, /\bupper lip\b/, /\bface\b/]);
  const priorLaser = hasAny(intakeText, [/\blaser\b/, /\blhr\b/, /\bipl\b/]);
  const noPriorLaser = hasAny(intakeText, [/\bno previous laser\b/, /\bnever had laser\b/, /\bfirst time\b/]);
  const priorLaserSessions = extractPriorLaserSessions(intakeText);
  const largeArea = service.bodyAreas.some((area) => ['back', 'chest', 'legs', 'body', 'abdomen'].includes(area)) || service.id === 'lhr-full-body';

  if (thickHair) {
    sessions += 1;
    signals.push('coarse or dense hair usually needs a full reduction series');
  }

  if (fineOrLightHair) {
    riskLevel = 'moderate';
    signals.push('fine, blonde, gray, red, or peach-fuzz hair responds less predictably to laser');
  }

  if (dailyShaving) {
    sessions += 2;
    signals.push('daily shaving suggests a high active-growth burden');
  } else if (frequentShaving) {
    sessions += 1;
    signals.push('frequent shaving suggests a moderate active-growth burden');
  }

  if (hormonalPattern) {
    sessions += 1;
    intervalWeeks = Math.max(intervalWeeks, 6);
    signals.push('facial or hormonal-pattern hair often needs extra sessions plus maintenance');
  }

  if (largeArea) {
    sessions += service.id === 'lhr-full-body' ? 2 : 1;
    intervalWeeks = Math.max(intervalWeeks, 6);
    signals.push('large body areas need more time between sessions and may need additional passes');
  }

  if (priorLaser && !noPriorLaser && priorLaserSessions !== null) {
    if (priorLaserSessions >= 4) {
      sessions -= 2;
      signals.push(`${priorLaserSessions} prior laser sessions may shorten the remaining course`);
    } else if (priorLaserSessions > 0) {
      sessions -= 1;
      signals.push(`${priorLaserSessions} prior laser sessions noted; remaining course still needed`);
    }
  } else if (noPriorLaser) {
    signals.push('first laser course should be planned as a complete growth-cycle series');
  }

  if (scanResult.skinAnalysis.fitzpatrickType >= 4) {
    intervalWeeks = Math.max(intervalWeeks, 6);
    riskLevel = 'moderate';
    signals.push(`Fitzpatrick ${scanResult.skinAnalysis.fitzpatrickType} needs conservative settings and pigment-risk monitoring`);
  }

  if (intakeData.recentSunExposure) {
    riskLevel = 'moderate';
    contraindications.push('Recent sun exposure: delay or reduce intensity until skin is no longer tanned or inflamed.');
    signals.push('recent sun exposure increases pigment risk');
  }

  sessions = clamp(Math.round(sessions), 4, 10);

  return {
    sessionsRequired: sessions,
    intervalWeeks,
    intervalBetweenSessions: intervalWeeks <= 4 ? 'Every 4-6 weeks' : 'Every 6-8 weeks',
    expectedImprovement: 'Progressive permanent hair reduction; best response is expected on darker, coarser hair, with touch-ups possible for hormonal areas.',
    timeToResults: 'Shedding is usually seen within 1-3 weeks; meaningful reduction typically appears after sessions 3-4.',
    longevity: 'Long-term hair reduction after the series, with maintenance touch-ups as needed.',
    riskLevel,
    targetConcerns: unique(['unwanted hair', 'razor irritation', 'ingrown hairs', ...baseConcerns]).slice(0, 5),
    targetZones: baseZones,
    contraindications,
    patientReasoning: `This is planned as a ${sessions}-session laser hair reduction course because the goal is to catch hairs across multiple growth cycles rather than treating only what is visible today.`,
    clinicalRationale: `LHR logic used ${sessions} sessions at ${intervalWeeks}-week cadence based on area, Fitzpatrick type, shaving/hair-density signals, hormonal pattern, and prior-laser history.`,
    planningSignals: signals.length ? signals : ['standard 6-session hair growth-cycle series'],
  };
}

function buildInjectableLogic(
  service: UnifiedService,
  scanResult: AuraScanResult,
  intakeText: string,
  baseConcerns: string[],
  baseZones: FacialZone[],
  intakeData: Partial<ConsultationFormData>
): ServiceClinicalLogic {
  const key = serviceKey(service);
  const isFiller = key.includes('filler');
  const contraindications: string[] = [];
  const signals: string[] = [];

  if (intakeData.pregnant || intakeData.breastfeeding) {
    contraindications.push('Pregnancy or breastfeeding: defer injectable treatment until cleared by provider.');
  }

  if (intakeData.bloodThinners) {
    contraindications.push('Blood thinner use: elevated bruising risk and provider review required.');
  }

  if (isFiller) {
    const multiZone = FACIAL_ZONE_KEYWORDS.filter(([, matcher]) => matcher.test(intakeText)).length >= 2;
    const laxityScore = topConcernScore(scanResult, [/laxity/, /volume/, /nasolabial/, /aging/]);
    const sessions = multiZone || laxityScore >= 70 ? 2 : 1;
    if (multiZone) signals.push('multiple filler zones requested');
    if (laxityScore >= 70) signals.push('moderate-to-high volume/laxity signal from scan');

    return {
      sessionsRequired: sessions,
      intervalWeeks: 3,
      intervalBetweenSessions: sessions > 1 ? 'Stage appointments 2-4 weeks apart' : 'Reassess at 2-4 weeks',
      expectedImprovement: 'Soft volume restoration and contour refinement in selected areas, with swelling allowed to settle before final judgment.',
      timeToResults: 'Immediate shape change with best assessment after swelling settles in 2-4 weeks.',
      longevity: 'Commonly 6-18 months depending on product, area, metabolism, and movement.',
      riskLevel: contraindications.length ? 'moderate' : 'low',
      targetConcerns: unique(['volume loss', 'facial balancing', ...baseConcerns]).slice(0, 5),
      targetZones: baseZones,
      contraindications,
      patientReasoning: sessions > 1
        ? 'Because more than one contour area is involved, filler is staged so the result stays balanced and conservative.'
        : 'Filler is kept to a focused appointment so the result stays natural and easy to refine.',
      clinicalRationale: `Filler logic used ${sessions} appointment(s), based on requested zones and scan-derived laxity/aging signals.`,
      planningSignals: signals.length ? signals : ['focused filler assessment'],
    };
  }

  const botoxZones = baseZones.filter((zone) => ['forehead', 'glabella', 'periorbital_left', 'periorbital_right', 'chin', 'neck'].includes(zone));
  if (botoxZones.length) signals.push(`expression zones: ${botoxZones.join(', ')}`);

  return {
    sessionsRequired: 1,
    intervalWeeks: 14,
    intervalBetweenSessions: 'Maintain every 12-16 weeks',
    expectedImprovement: 'Visible softening of expression lines while preserving natural movement.',
    timeToResults: 'Starts around 3-5 days, with peak effect around 14 days.',
    longevity: 'Typically 3-4 months.',
    riskLevel: contraindications.length ? 'moderate' : 'minimal',
    targetConcerns: unique(['expression lines', 'wrinkle prevention', ...baseConcerns]).slice(0, 5),
    targetZones: botoxZones.length ? botoxZones.slice(0, 4) : baseZones,
    contraindications,
    patientReasoning: 'Neuromodulator is used for expression-driven lines, so it pairs well with scan findings that show dynamic aging patterns.',
    clinicalRationale: 'Botox logic uses one treatment with 12-16 week maintenance because onset and duration are pharmacologic rather than series-based.',
    planningSignals: signals.length ? signals : ['standard neuromodulator maintenance cycle'],
  };
}

function buildCollagenOrTextureLogic(
  service: UnifiedService,
  scanResult: AuraScanResult,
  intakeText: string,
  baseConcerns: string[],
  baseZones: FacialZone[]
): ServiceClinicalLogic {
  const key = serviceKey(service);
  const scarOrTextureScore = topConcernScore(scanResult, [/scar/, /texture/, /pore/, /acne/]);
  const laxityScore = topConcernScore(scanResult, [/laxity/, /firmness/, /aging/]);
  const pigmentScore = topConcernScore(scanResult, [/pigment/, /melasma/, /sun/]);
  const signals: string[] = [];
  let sessions = service.sessions || 3;
  let intervalWeeks = 4;
  let riskLevel: RiskLevel = 'low';
  let expectedImprovement = 'Progressive improvement in texture, tone, and collagen quality.';
  let timeToResults = 'Early glow in 2-4 weeks; collagen remodeling builds over 3-6 months.';
  let longevity = 'Results build over months and are maintained with periodic refresh treatments.';

  if (key.includes('rf-microneedling') || key.includes('scar')) {
    sessions = scarOrTextureScore >= 75 ? 4 : 3;
    intervalWeeks = 5;
    expectedImprovement = 'Collagen remodeling for acne scars, pores, texture, and early laxity with progressive smoothing.';
    timeToResults = 'Initial texture improvement may appear by 4-6 weeks; collagen remodeling continues for 3-6 months.';
    longevity = 'Long-lasting collagen improvement with maintenance based on acne/scar activity and aging pace.';
    if (scanResult.skinAnalysis.fitzpatrickType >= 4) {
      riskLevel = 'moderate';
      signals.push(`Fitzpatrick ${scanResult.skinAnalysis.fitzpatrickType} needs pigment-safe energy and post-inflammatory hyperpigmentation prevention`);
    }
    if (scarOrTextureScore >= 75) signals.push('high scar/texture signal supports extending to 4 sessions');
  } else if (key.includes('sofwave') || service.category === 'skin-tightening') {
    sessions = laxityScore >= 75 || /neck|jowl|lower face|severe|advanced/.test(intakeText) ? 2 : 1;
    intervalWeeks = 12;
    expectedImprovement = 'Non-invasive lifting and tightening with collagen remodeling rather than instant volume change.';
    timeToResults = 'Subtle tightening can begin earlier, with best results developing over 3-6 months.';
    longevity = 'Often maintained around 12 months, depending on laxity, age, and collagen response.';
    if (sessions > 1) signals.push('strong laxity or neck/lower-face signal supports second tightening session');
  } else if (service.category === 'laser') {
    sessions = Math.max(service.sessions || 3, pigmentScore >= 70 || scarOrTextureScore >= 70 ? 4 : 3);
    intervalWeeks = 4;
    expectedImprovement = 'More even tone, calmer breakouts/redness, and smoother texture with conservative progressive settings.';
    timeToResults = 'Visible tone and clarity changes usually build after sessions 2-3.';
    longevity = 'Results are maintained with sunscreen, pigment control, and periodic maintenance.';
    if (scanResult.skinAnalysis.fitzpatrickType >= 4 || pigmentScore >= 70) {
      riskLevel = 'moderate';
      signals.push('pigment-prone skin requires conservative laser parameters and strict SPF');
    }
  }

  return {
    sessionsRequired: sessions,
    intervalWeeks,
    intervalBetweenSessions: sessions > 1 ? `Every ${intervalWeeks}-6 weeks` : 'Single treatment, reassess at 12 weeks',
    expectedImprovement,
    timeToResults,
    longevity,
    riskLevel,
    targetConcerns: unique([...baseConcerns, 'texture quality', 'collagen support']).slice(0, 5),
    targetZones: baseZones,
    contraindications: [],
    patientReasoning: `This is planned as ${sessions > 1 ? `a ${sessions}-session series` : 'a focused treatment'} because collagen and texture changes build gradually instead of happening in one visit.`,
    clinicalRationale: `Collagen/texture logic used ${sessions} session(s), ${intervalWeeks}-week cadence, score signals: scar/texture ${scarOrTextureScore}, pigment ${pigmentScore}, laxity ${laxityScore}.`,
    planningSignals: signals.length ? signals : ['standard collagen-remodeling cadence'],
  };
}

function buildPeelOrFacialLogic(
  service: UnifiedService,
  scanResult: AuraScanResult,
  intakeText: string,
  baseConcerns: string[],
  baseZones: FacialZone[],
  intakeData: Partial<ConsultationFormData>
): ServiceClinicalLogic {
  const key = serviceKey(service);
  const acneOrPoresScore = topConcernScore(scanResult, [/acne/, /pore/, /congestion/]);
  const pigmentScore = topConcernScore(scanResult, [/pigment/, /melasma/, /sun damage/, /tone/]);
  const signals: string[] = [];
  const contraindications: string[] = [];
  let sessions = service.sessions || 1;
  let intervalWeeks = 4;
  let riskLevel: RiskLevel = 'minimal';

  if (service.category === 'facial') {
    if (key.includes('red-light')) {
      sessions = 8;
      intervalWeeks = 1;
    } else if (acneOrPoresScore >= 60 || /acne|breakout|pores|congestion|blackhead|oily/.test(intakeText)) {
      sessions = Math.max(3, sessions);
      signals.push('acne, pore, or congestion signal supports a monthly facial series');
    } else {
      sessions = Math.max(1, sessions);
    }

    return {
      sessionsRequired: sessions,
      intervalWeeks,
      intervalBetweenSessions: sessions > 1 ? (intervalWeeks === 1 ? 'Weekly' : 'Monthly') : 'As needed for glow or prep',
      expectedImprovement: sessions > 1
        ? 'Cleaner pores, better hydration, and more consistent glow as the skin barrier stabilizes.'
        : 'Immediate hydration, smoother texture, and brighter skin for short-term glow.',
      timeToResults: 'Immediate glow, with stronger clarity after a series when congestion is present.',
      longevity: sessions > 1 ? 'Best maintained monthly or seasonally.' : 'Best maintained every 4-6 weeks.',
      riskLevel,
      targetConcerns: unique([...baseConcerns, 'hydration', 'barrier support']).slice(0, 5),
      targetZones: baseZones,
      contraindications,
      patientReasoning: sessions > 1
        ? `A ${sessions}-session facial series is recommended because hydration, pores, and congestion respond best to consistent skin conditioning.`
        : 'A facial is used as a low-downtime reset so the skin looks better quickly and is better prepared for deeper treatments.',
      clinicalRationale: `Facial logic used ${sessions} session(s), based on acne/pore score ${acneOrPoresScore} and barrier-prep needs.`,
      planningSignals: signals.length ? signals : ['low-downtime barrier optimization'],
    };
  }

  if (intakeData.pregnant || intakeData.breastfeeding) {
    contraindications.push('Pregnancy or breastfeeding: defer chemical peel unless provider explicitly clears a pregnancy-safe protocol.');
  }
  if (intakeData.isotretinoinHistory) {
    contraindications.push('Isotretinoin history: provider must confirm safe waiting period before peel.');
  }

  if (key.includes('cosmelan')) {
    sessions = 2;
    intervalWeeks = 6;
    riskLevel = 'moderate';
    signals.push('depigmentation protocol requires in-clinic peel plus home maintenance');
  } else {
    sessions = pigmentScore >= 70 || acneOrPoresScore >= 70 ? Math.max(4, sessions) : Math.max(3, sessions);
    intervalWeeks = 4;
  }

  if (scanResult.skinAnalysis.fitzpatrickType >= 4 || pigmentScore >= 70) {
    riskLevel = 'moderate';
    signals.push('pigment-prone skin needs prep, strict SPF, and conservative peel selection');
  }

  return {
    sessionsRequired: sessions,
    intervalWeeks,
    intervalBetweenSessions: key.includes('cosmelan') ? 'Initial peel plus 6-week provider check' : 'Every 3-4 weeks',
    expectedImprovement: 'Brighter tone, smoother texture, and more even pigment with strict sunscreen and homecare compliance.',
    timeToResults: key.includes('cosmelan') ? 'Pigment may darken before lifting; visible change builds over 4-12 weeks.' : 'Glow within 1-2 weeks; pigment and acne marks improve over a series.',
    longevity: 'Results depend heavily on SPF, pigment control, and maintenance peels.',
    riskLevel,
    targetConcerns: unique([...baseConcerns, 'tone correction', 'cell turnover']).slice(0, 5),
    targetZones: baseZones,
    contraindications,
    patientReasoning: `This is planned as ${sessions} peel-related appointment(s) because pigment, acne marks, and texture respond best to controlled repetition plus daily SPF.`,
    clinicalRationale: `Peel logic used ${sessions} session(s), pigment score ${pigmentScore}, acne/pore score ${acneOrPoresScore}, Fitzpatrick ${scanResult.skinAnalysis.fitzpatrickType}.`,
    planningSignals: signals.length ? signals : ['standard medical-grade peel cadence'],
  };
}

function buildWellnessLogic(
  service: UnifiedService,
  baseConcerns: string[],
  baseZones: FacialZone[]
): ServiceClinicalLogic {
  const key = serviceKey(service);
  let sessions = service.sessions || 1;
  let intervalWeeks = 4;
  let expectedImprovement = 'Supportive wellness optimization to complement the aesthetic plan.';
  let timeToResults = service.results || 'Varies by treatment and baseline health.';
  let longevity = 'Requires reassessment and maintenance based on response.';

  if (key.includes('glp1') || key.includes('semaglutide') || key.includes('tirzepatide')) {
    sessions = 1;
    intervalWeeks = 4;
    expectedImprovement = 'Monthly medically supervised metabolic support with dose escalation only when appropriate.';
    timeToResults = 'Early appetite and weight trends are usually reviewed monthly.';
    longevity = 'Ongoing while clinically appropriate with lab and provider monitoring.';
  } else if (key.includes('glutathione')) {
    sessions = 4;
    intervalWeeks = 1;
    expectedImprovement = 'Adjunct brightening and antioxidant support; not a substitute for pigment correction or SPF.';
    timeToResults = 'Subtle changes may build over several weekly injections.';
  } else if (key.includes('b12') || key.includes('lipo-b') || key.includes('biotin') || key.includes('nad')) {
    sessions = 4;
    intervalWeeks = 1;
    expectedImprovement = 'Supportive energy, recovery, or hair/skin wellness benefits based on deficiency and response.';
    timeToResults = 'Many clients reassess subjective response after 2-4 weekly injections.';
  }

  return {
    sessionsRequired: sessions,
    intervalWeeks,
    intervalBetweenSessions: sessions > 1 ? (intervalWeeks === 1 ? 'Weekly' : `Every ${intervalWeeks} weeks`) : 'Monthly/provider-directed',
    expectedImprovement,
    timeToResults,
    longevity,
    riskLevel: 'low',
    targetConcerns: unique(baseConcerns.length ? baseConcerns : ['whole-body optimization']).slice(0, 5),
    targetZones: baseZones,
    contraindications: [],
    patientReasoning: 'This supports the treatment plan from the inside out and should be adjusted by the provider based on response and medical history.',
    clinicalRationale: `Wellness logic used ${sessions} session(s) and ${intervalWeeks}-week cadence with provider monitoring.`,
    planningSignals: ['provider-directed wellness cadence'],
  };
}

function buildDefaultLogic(
  service: UnifiedService,
  baseConcerns: string[],
  baseZones: FacialZone[]
): ServiceClinicalLogic {
  const sessions = Math.max(1, service.sessions || 1);
  const intervalWeeks = sessions > 1 ? 4 : 0;
  return {
    sessionsRequired: sessions,
    intervalWeeks,
    intervalBetweenSessions: sessions > 1 ? 'Every 4-6 weeks' : 'As needed',
    expectedImprovement: service.results || 'Visible improvement expected with provider-guided treatment.',
    timeToResults: service.results || '2-4 weeks',
    longevity: service.results || 'Maintenance varies by treatment and response.',
    riskLevel: 'low',
    targetConcerns: baseConcerns.slice(0, 5),
    targetZones: baseZones,
    contraindications: [],
    patientReasoning: 'This service is included because it maps to the scan findings and stated consultation goals.',
    clinicalRationale: `Default catalog logic used ${sessions} session(s) from the service metadata.`,
    planningSignals: ['catalog default session logic'],
  };
}

export function deriveServiceClinicalLogic(
  service: UnifiedService,
  scanResult: AuraScanResult,
  intakeData: Partial<ConsultationFormData>
): ServiceClinicalLogic {
  const intakeText = buildIntakeText(intakeData);
  const baseConcerns = buildBaseConcerns(service, scanResult);
  const baseZones = buildBaseZones(scanResult, intakeText);
  const key = serviceKey(service);

  if (service.category === 'laser-hair-removal') {
    return buildLaserHairLogic(service, scanResult, intakeText, baseConcerns, baseZones, intakeData);
  }

  if (service.category === 'injectables') {
    return buildInjectableLogic(service, scanResult, intakeText, baseConcerns, baseZones, intakeData);
  }

  if (service.category === 'rf-microneedling' || service.category === 'scar-reduction' || service.category === 'laser' || service.category === 'skin-tightening') {
    return buildCollagenOrTextureLogic(service, scanResult, intakeText, baseConcerns, baseZones);
  }

  if (service.category === 'chemical-peel' || service.category === 'facial') {
    return buildPeelOrFacialLogic(service, scanResult, intakeText, baseConcerns, baseZones, intakeData);
  }

  if (service.category === 'wellness' || service.category === 'weight-management' || service.category === 'hormones' || service.category === 'labs' || key.includes('injection')) {
    return buildWellnessLogic(service, baseConcerns, baseZones);
  }

  return buildDefaultLogic(service, baseConcerns, baseZones);
}
