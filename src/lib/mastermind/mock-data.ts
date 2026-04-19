/**
 * Mastermind Mock Data Factory
 *
 * Generates realistic mock data matching all mastermind types.
 * Used when AI APIs are unavailable or for development/testing.
 */

import type {
  AuraScanResult,
  AuraScore,
  ZoneAnalysis,
  AuraConcern,
  PredictiveMetrics,
  TreatmentReadiness,
  MastermindPlan,
  MastermindTreatment,
  TreatmentSequenceItem,
  SimulationComparison,
  SimulationFrame,
  MastermindSession,
} from '@/types/mastermind';
import type { SkinAnalysis, MedicalFlag } from '@/types/ai-treatment';
import type { GeneratedPackage } from '@/lib/plan-builder/types';

// ── MOCK AURA SCAN ──

export function mockAuraScanResult(overrides?: Partial<AuraScanResult>): AuraScanResult {
  const auraScore: AuraScore = {
    overall: 68,
    grade: 'C',
    label: 'Fair',
    breakdown: {
      hydration: 72,
      elasticity: 61,
      texture: 65,
      tone: 58,
      clarity: 70,
      firmness: 63,
      radiance: 66,
      protection: 55,
    },
    skinAge: 47,
    chronologicalAge: 42,
    skinAgeDelta: 5,
    percentile: 42,
  };

  const zoneAnalysis: ZoneAnalysis[] = [
    {
      zone: 'forehead',
      zoneName: 'Forehead',
      overallScore: 62,
      skinAge: 48,
      concerns: [
        { type: 'wrinkles', severity: 72, treatmentPriority: 1 },
        { type: 'texture', severity: 55, treatmentPriority: 3 },
      ],
      recommendations: ['Botox for expression lines', 'RF Microneedling for skin renewal'],
    },
    {
      zone: 'cheeks_left',
      zoneName: 'Left Cheek',
      overallScore: 65,
      skinAge: 45,
      concerns: [
        { type: 'volume loss', severity: 68, treatmentPriority: 1 },
        { type: 'pigmentation', severity: 60, treatmentPriority: 2 },
      ],
      recommendations: ['Dermal filler for volume restoration', 'PicoWay for pigmentation'],
    },
    {
      zone: 'jawline',
      zoneName: 'Jawline',
      overallScore: 58,
      skinAge: 50,
      concerns: [
        { type: 'laxity', severity: 75, treatmentPriority: 1 },
      ],
      recommendations: ['Sofwave for skin tightening', 'RF Microneedling for definition'],
    },
    {
      zone: 'periorbital_left',
      zoneName: 'Eye Area',
      overallScore: 60,
      skinAge: 49,
      concerns: [
        { type: 'wrinkles', severity: 70, treatmentPriority: 1 },
        { type: 'dark circles', severity: 55, treatmentPriority: 2 },
      ],
      recommendations: ['Botox for crow\'s feet', 'Filler for tear trough'],
    },
  ];

  const detectedConcerns: AuraConcern[] = [
    {
      id: 'concern_wrinkles_0',
      concern: 'wrinkles',
      severity: 'moderate',
      score: 72,
      zones: ['forehead', 'periorbital_left'],
      trending: 'stable',
      urgency: 'medium',
      description: 'Lines are visible at rest and deepen with expressions. Early intervention can prevent further progression.',
      clinicalNote: 'Moderate dynamic and static rhytids. Forehead and periorbital regions show depth consistent with Glogau II-III.',
    },
    {
      id: 'concern_volume_loss_1',
      concern: 'volume_loss',
      severity: 'moderate',
      score: 68,
      zones: ['cheeks_left', 'cheeks_right'],
      trending: 'worsening',
      urgency: 'medium',
      description: 'Noticeable volume loss in the midface creating a less youthful contour.',
      clinicalNote: 'Midface deflation with early malar fat pad descent. Candidate for volumization.',
    },
    {
      id: 'concern_pigmentation_2',
      concern: 'pigmentation',
      severity: 'mild',
      score: 60,
      zones: ['cheeks_left'],
      trending: 'stable',
      urgency: 'low',
      description: 'Minor uneven tone or a few sun spots are present.',
      clinicalNote: 'Scattered solar lentigines. UV damage consistent with moderate cumulative exposure.',
    },
  ];

  const predictiveMetrics: PredictiveMetrics = {
    withoutIntervention: {
      sixMonths: { auraScore: 66, skinAge: 48, topConcerns: ['wrinkles', 'volume loss'], newConcernsEmerging: [] },
      oneYear: { auraScore: 63, skinAge: 50, topConcerns: ['wrinkles', 'volume loss', 'laxity'], newConcernsEmerging: ['increased sensitivity'] },
      threeYears: { auraScore: 55, skinAge: 55, topConcerns: ['wrinkles', 'laxity', 'volume loss'], newConcernsEmerging: ['deeper lines'] },
      fiveYears: { auraScore: 48, skinAge: 60, topConcerns: ['laxity', 'wrinkles', 'volume loss'], newConcernsEmerging: ['deeper lines', 'increased sensitivity'] },
    },
    withTreatment: {
      threeMonths: { auraScore: 76, skinAge: 41, topConcerns: ['wrinkles', 'volume loss'], newConcernsEmerging: [] },
      sixMonths: { auraScore: 83, skinAge: 38, topConcerns: ['texture'], newConcernsEmerging: [] },
      oneYear: { auraScore: 88, skinAge: 36, topConcerns: [], newConcernsEmerging: [] },
    },
    riskFactors: [
      { factor: 'Sun Exposure', impact: 'medium', description: 'Moderate UV exposure accelerates photoaging' },
      { factor: 'Stress Level', impact: 'medium', description: 'Cortisol breaks down collagen' },
    ],
  };

  const treatmentReadiness: TreatmentReadiness = {
    readyForTreatment: true,
    requiredPrep: [],
    seasonalConsiderations: ['Fall/Winter is ideal for laser treatments and deeper peels'],
    skinBarrierStatus: 'adequate',
  };

  const skinAnalysis: SkinAnalysis = {
    fitzpatrickType: 3,
    fitzpatrickDescription: 'Type III — Medium skin tone',
    glogauScale: 2,
    glogauDescription: 'Wrinkles in Motion — Early to moderate photoaging',
    skinHealthScore: {
      overall: 68,
      dimensions: auraScore.breakdown,
    },
    agingPatterns: [
      { type: 'expression_lines', severity: 'moderate', areas: ['Forehead', 'Crow\'s feet'], recommendedTreatments: ['Botox', 'RF Microneedling'] },
      { type: 'volume_loss', severity: 'moderate', areas: ['Cheeks/Midface', 'Temples'], recommendedTreatments: ['Dermal Fillers'] },
    ],
    treatmentPriority: [
      { rank: 1, concern: 'wrinkles', urgency: 'high', recommendedTreatment: 'Botox + RF Microneedling', rationale: 'Lines deepen with time — addressing now prevents further progression' },
      { rank: 2, concern: 'volume_loss', urgency: 'medium', recommendedTreatment: 'Dermal Fillers', rationale: 'Restoring midface volume improves multiple concerns simultaneously' },
    ],
    skincareRoutine: { morning: [], evening: [], weekly: [] },
    benchmarkComparison: {
      ageGroup: '40s',
      percentile: 42,
      areasBetterThanPeers: ['Clarity', 'Hydration'],
      areasForImprovement: ['Firmness', 'Protection', 'Tone'],
    },
  };

  const medicalFlags: MedicalFlag[] = [];

  const auraDeviceAnalysis = {
    categories: [
      { category: 'wrinkles' as const, label: 'Wrinkles', absoluteScore: 2.3, peerScore: 2.3, severity: 'moderate' as const, description: 'Moderate lines visible at rest, primarily in expression areas.' },
      { category: 'texture' as const, label: 'Texture', absoluteScore: 1.7, peerScore: 0.2, severity: 'mild' as const, description: 'Some roughness and unevenness detectable.' },
      { category: 'brownSpots' as const, label: 'Brown Spots', absoluteScore: 2.2, peerScore: 0.7, severity: 'moderate' as const, description: 'Moderate brown spots and uneven pigmentation detected.' },
      { category: 'redAreas' as const, label: 'Red Areas', absoluteScore: 1.9, peerScore: 0.4, severity: 'mild' as const, description: 'Some redness detected, possibly related to sensitivity.' },
      { category: 'pores' as const, label: 'Pores', absoluteScore: 1.9, peerScore: 0.4, severity: 'mild' as const, description: 'Moderately visible pores, especially in the T-zone.' },
    ],
    compositeSkinScore: 1.0,
    scoringMode: 'absolute' as const,
  };

  return {
    scanId: `aura_mock_${Date.now().toString(36)}`,
    timestamp: new Date().toISOString(),
    auraScore,
    auraDeviceAnalysis,
    zoneAnalysis,
    detectedConcerns,
    predictiveMetrics,
    treatmentReadiness,
    skinAnalysis,
    medicalFlags,
    ...overrides,
  };
}

// ── MOCK MASTERMIND PLAN ──

export function mockMastermindPlan(): MastermindPlan {
  const primary: MastermindTreatment[] = [
    {
      id: 'tx_botox_forehead',
      treatmentName: 'Botox — Forehead & Crow\'s Feet',
      category: 'injectable_neurotoxin',
      targetConcerns: ['wrinkles'],
      targetZones: ['forehead', 'periorbital_left', 'periorbital_right'],
      sessionsRequired: 1,
      intervalBetweenSessions: '3-4 months',
      expectedImprovement: '60-80% wrinkle reduction',
      timeToResults: '5-14 days',
      longevity: '3-4 months',
      perSession: 450,
      totalEstimate: 1800,
      priority: 'essential',
      urgency: 'immediate',
      downtime: 'None',
      riskLevel: 'minimal',
      contraindications: [],
      synergiesWith: ['tx_rfmn'],
      aiConfidence: 92,
      aiReasoning: 'Botox is the gold standard for dynamic wrinkles and will deliver visible results within 2 weeks.',
      clinicalRationale: 'Moderate dynamic rhytids in frontalis and orbicularis oculi. 20-25 units forehead, 10-12 units per side crow\'s feet.',
    },
    {
      id: 'tx_filler_cheeks',
      treatmentName: 'Dermal Filler — Cheek Volumization',
      category: 'injectable_filler',
      targetConcerns: ['volume_loss'],
      targetZones: ['cheeks_left', 'cheeks_right'],
      sessionsRequired: 1,
      intervalBetweenSessions: '12-18 months',
      expectedImprovement: 'Restored midface volume, lifted appearance',
      timeToResults: 'Immediate with refinement over 2 weeks',
      longevity: '12-18 months',
      perSession: 1200,
      totalEstimate: 1200,
      priority: 'essential',
      urgency: 'immediate',
      downtime: '1-3 days mild swelling',
      riskLevel: 'low',
      contraindications: [],
      synergiesWith: ['tx_botox_forehead'],
      aiConfidence: 88,
      aiReasoning: 'Restoring cheek volume creates a natural lifting effect that improves your overall facial contour and can reduce the appearance of nasolabial folds.',
      clinicalRationale: 'Midface volume deficit with malar fat pad descent. 1-1.5mL Voluma per side in deep medial cheek and lateral cheek compartments.',
    },
  ];

  const complementary: MastermindTreatment[] = [
    {
      id: 'tx_rfmn',
      treatmentName: 'RF Microneedling — Full Face',
      category: 'rf_microneedling',
      targetConcerns: ['texture', 'wrinkles', 'laxity'],
      targetZones: ['forehead', 'cheeks_left', 'cheeks_right', 'jawline'],
      sessionsRequired: 3,
      intervalBetweenSessions: '4-6 weeks',
      expectedImprovement: '40-60% texture improvement, skin tightening',
      timeToResults: '4-6 weeks per session, cumulative',
      longevity: '12-24 months',
      perSession: 650,
      totalEstimate: 1950,
      priority: 'recommended',
      urgency: 'within-3-months',
      downtime: '2-3 days redness',
      riskLevel: 'low',
      contraindications: [],
      synergiesWith: ['tx_botox_forehead', 'tx_filler_cheeks'],
      aiConfidence: 85,
      aiReasoning: 'RF Microneedling stimulates collagen production deep within your skin, improving texture and firmness over time.',
      clinicalRationale: 'Series of 3 at 4-6 week intervals. Morpheus8 or similar. Full face coverage including jawline.',
    },
  ];

  const maintenance: MastermindTreatment[] = [
    {
      id: 'tx_hydrafacial',
      treatmentName: 'HydraFacial Signature',
      category: 'facial',
      targetConcerns: ['texture', 'pigmentation'],
      targetZones: ['forehead', 'cheeks_left', 'cheeks_right', 'chin'],
      sessionsRequired: 6,
      intervalBetweenSessions: 'Monthly',
      expectedImprovement: 'Consistent glow, pore refinement, hydration',
      timeToResults: 'Immediate radiance',
      longevity: '4-6 weeks per session',
      perSession: 275,
      totalEstimate: 1650,
      priority: 'recommended',
      urgency: 'when-ready',
      downtime: 'None',
      riskLevel: 'minimal',
      contraindications: [],
      synergiesWith: [],
      aiConfidence: 90,
      aiReasoning: 'Monthly HydraFacials maintain your results and keep your skin glowing between treatments.',
      clinicalRationale: 'Monthly maintenance facial for ongoing skin health optimization.',
    },
  ];

  const packages: GeneratedPackage[] = [
    {
      tier: 'Start',
      name: 'Foundation Refresh',
      subtitle: 'Start your transformation journey',
      price: 1650,
      originalPrice: 1800,
      discount: 8,
      sessions: 5,
      lineItems: [
        { service: 'Botox', qty: 1, unitPrice: 450, total: 450 },
        { service: 'HydraFacial', qty: 4, unitPrice: 275, total: 1100 },
      ],
      monthlyPayment12: 142,
      monthlyPayment24: 74,
      highlighted: false,
      extras: ['Free skincare consultation'],
      bestFor: 'Quick refresh with ongoing maintenance',
      resultIntensity: 'Subtle, Natural Enhancement',
      concernsAddressed: ['wrinkles', 'texture'],
      savingsVsStandalone: 150,
    },
    {
      tier: 'Transform',
      name: 'Complete Transformation',
      subtitle: 'Our most popular comprehensive plan',
      price: 4200,
      originalPrice: 4950,
      discount: 15,
      sessions: 8,
      lineItems: [
        { service: 'Botox', qty: 1, unitPrice: 450, total: 450 },
        { service: 'Cheek Filler', qty: 1, unitPrice: 1200, total: 1200 },
        { service: 'RF Microneedling', qty: 3, unitPrice: 650, total: 1950 },
        { service: 'HydraFacial', qty: 3, unitPrice: 275, total: 825 },
      ],
      monthlyPayment12: 362,
      monthlyPayment24: 188,
      highlighted: true,
      extras: ['Priority scheduling', 'Complimentary skincare kit', 'Free touch-up within 30 days'],
      bestFor: 'Maximum results across all concerns',
      resultIntensity: 'Dramatic, Visible Transformation',
      concernsAddressed: ['wrinkles', 'volume loss', 'texture', 'laxity'],
      whyBest: 'Addresses all your top concerns with synergistic treatments that amplify each other\'s results',
      savingsVsStandalone: 750,
    },
    {
      tier: 'Elite',
      name: 'Elite Rejuvenation',
      subtitle: 'The ultimate anti-aging protocol',
      price: 6800,
      originalPrice: 8100,
      discount: 16,
      sessions: 14,
      lineItems: [
        { service: 'Botox', qty: 2, unitPrice: 450, total: 900 },
        { service: 'Cheek Filler', qty: 1, unitPrice: 1200, total: 1200 },
        { service: 'RF Microneedling', qty: 3, unitPrice: 650, total: 1950 },
        { service: 'HydraFacial', qty: 6, unitPrice: 275, total: 1650 },
        { service: 'VI Peel', qty: 2, unitPrice: 395, total: 790 },
      ],
      monthlyPayment12: 586,
      monthlyPayment24: 304,
      highlighted: false,
      extras: ['VIP scheduling', 'Premium skincare kit', 'Free touch-ups', 'Annual maintenance plan'],
      bestFor: 'Those who want the absolute best results',
      resultIntensity: 'Comprehensive, Long-Lasting Results',
      concernsAddressed: ['wrinkles', 'volume loss', 'texture', 'laxity', 'pigmentation'],
      savingsVsStandalone: 1300,
    },
  ];

  return {
    planId: `plan_mock_${Date.now().toString(36)}`,
    generatedAt: new Date().toISOString(),
    recommendations: { primary, complementary, maintenance },
    packages,
    sequencing: [
      {
        phase: 1,
        phaseName: 'Foundation',
        duration: '0-2 weeks',
        treatments: [
          { treatmentId: 'tx_botox_forehead', week: 1, sessionNumber: 1 },
          { treatmentId: 'tx_filler_cheeks', week: 2, sessionNumber: 1 },
        ],
        expectedMilestone: 'Wrinkle softening visible, cheek volume restored',
      },
      {
        phase: 2,
        phaseName: 'Transformation',
        duration: '3-14 weeks',
        treatments: [
          { treatmentId: 'tx_rfmn', week: 4, sessionNumber: 1 },
          { treatmentId: 'tx_rfmn', week: 8, sessionNumber: 2 },
          { treatmentId: 'tx_rfmn', week: 12, sessionNumber: 3 },
        ],
        expectedMilestone: 'Visible texture improvement and skin tightening',
      },
      {
        phase: 3,
        phaseName: 'Maintenance',
        duration: 'Ongoing monthly',
        treatments: [
          { treatmentId: 'tx_hydrafacial', week: 16, sessionNumber: 1 },
        ],
        expectedMilestone: 'Sustained glow and skin health',
      },
    ],
    aftercarePreview: [
      {
        treatmentId: 'tx_botox_forehead',
        immediateAftercare: ['No lying down for 4 hours', 'Avoid rubbing injection sites', 'No strenuous exercise for 24 hours'],
        weekOneGuidance: ['Results begin appearing in 3-5 days', 'Full results visible at 14 days', 'Avoid facials for 2 weeks'],
        productsRecommended: [{ product: 'Arnica cream', reason: 'Reduces bruising' }],
      },
    ],
    aiSummary: {
      patientFacing: 'Based on your Aura Score of 68 and the concerns you shared, we\'ve designed a comprehensive plan that targets your wrinkles, volume loss, and skin texture. Starting with Botox and fillers for immediate impact, then building long-term results with RF Microneedling.',
      providerFacing: 'Patient presents with moderate dynamic rhytids, midface volume deficit, and early textural changes. Recommended phased approach: neurotoxin + volumization first, followed by collagen induction therapy. Good candidate for all proposed treatments.',
      keyHighlights: [
        'Projected Aura Score improvement: 68 → 88 within 6 months',
        'Skin age reduction: 47 → 36 (11 years younger)',
        'All top concerns addressed with synergistic treatments',
      ],
      addressedConcerns: [
        { concern: 'Wrinkles', solution: 'Botox + RF Microneedling', timeline: '2-14 days initial, 3-6 months optimal' },
        { concern: 'Volume Loss', solution: 'Dermal Fillers — Cheeks', timeline: 'Immediate with 2-week refinement' },
        { concern: 'Skin Texture', solution: 'RF Microneedling series', timeline: '3-6 months progressive improvement' },
      ],
    },
    contraindications: [],
  };
}

// ── MOCK SIMULATION ──

export function mockSimulationComparison(): SimulationComparison {
  const emptyFrame = (timepoint: string, monthNumber: number, score: number, skinAge: number, desc: string): SimulationFrame => ({
    imageDataUrl: '',
    timepoint,
    monthNumber,
    description: desc,
    auraScoreProjection: score,
    skinAgeProjection: skinAge,
  });

  return {
    withTreatment: {
      frames: [
        emptyFrame('1M', 1, 74, 44, 'Botox results visible, filler settled'),
        emptyFrame('3M', 3, 80, 40, 'First RF Microneedling results emerging'),
        emptyFrame('6M', 6, 86, 37, 'Full treatment effects realized'),
        emptyFrame('1Y', 12, 88, 36, 'Peak results with maintenance'),
      ],
      narrative: 'With your treatment plan, your skin progressively improves month by month. Botox smooths expression lines immediately, fillers restore youthful volume, and RF Microneedling rebuilds collagen for long-term firmness.',
    },
    withoutTreatment: {
      frames: [
        emptyFrame('6M', 6, 66, 48, 'Continued gradual decline'),
        emptyFrame('1Y', 12, 63, 50, 'Wrinkles deepen, volume loss progresses'),
        emptyFrame('3Y', 36, 55, 55, 'Significant aging acceleration'),
        emptyFrame('5Y', 60, 48, 60, 'Advanced aging, more aggressive treatment needed'),
      ],
      narrative: 'Without intervention, natural aging combined with environmental factors will progressively deepen wrinkles, increase volume loss, and reduce skin elasticity.',
    },
    comparison: {
      auraScoreDelta: 25,
      skinAgeDelta: 14,
      keyDifferentiators: [
        '25-point Aura Score difference at 1 year',
        '14-year skin age gap between paths',
        'Treatment now costs $4,200 vs. $8,400+ if delayed 3 years',
      ],
    },
    costOfDelay: {
      currentPlanCost: 4200,
      costIfDelayed1Year: 5500,
      costIfDelayed3Years: 8400,
      reasoning: 'As skin continues to age, more aggressive (and expensive) treatments are needed to achieve the same results. Starting now means less intervention and better outcomes.',
    },
  };
}

// ── MOCK SESSION ──

export function mockMastermindSession(overrides?: Partial<MastermindSession>): MastermindSession {
  const now = new Date().toISOString();
  return {
    id: `ms_mock_${Date.now().toString(36)}`,
    createdAt: now,
    updatedAt: now,
    phase: 'scan_complete',
    intakeData: {
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.j@example.com',
      phone: '(425) 555-0123',
      dob: '1984-03-15',
      skinConcerns: ['aging-skin', 'hyperpigmentation', 'skin-laxity'],
      targetAreas: ['forehead', 'cheeks', 'jawline'],
      treatmentInterests: ['injectables', 'skin-tightening', 'facial'],
      skinType: 'combination',
      treatmentHistory: 'Had a HydraFacial 6 months ago',
      goals: 'Look refreshed for my daughter\'s wedding',
      timeline: 'event',
      budget: 'premium',
    },
    patientName: 'Sarah Johnson',
    patientEmail: 'sarah.j@example.com',
    medicalOffers: null,
    sourcePhotoUrl: null,
    auraScanResult: mockAuraScanResult(),
    mastermindPlan: null,
    providerReview: null,
    simulationComparison: null,
    selectedPackageTier: null,
    pdfUrl: null,
    bookedAppointmentId: null,
    ...overrides,
  };
}
