import { NextRequest, NextResponse } from 'next/server';
import { generateTreatmentPlan } from '@/lib/ai/treatment-advisor';
import { calculateSkinHealthScore, generateSkincareRoutine, compareToBenchmarks, rankTreatmentPriorities } from '@/lib/ai/skin-analysis';
import { predictOutcome } from '@/lib/ai/outcome-predictor';
import type { QuizAnswers, ClientProfile, FitzpatrickType, SkinConcern, BudgetTier, PainTolerance, DowntimeAvailability } from '@/types/ai-treatment';

const AGE_MAP: Record<string, number> = {
  '18-24': 21, '25-34': 30, '35-44': 40, '45-54': 50, '55-64': 60, '65+': 68,
};

const SKIN_TYPE_MAP: Record<string, FitzpatrickType> = {
  'very_fair': 1, 'fair': 2, 'medium': 3, 'olive': 4, 'brown': 5, 'dark': 6,
};

export async function POST(req: NextRequest) {
  try {
    const answers: QuizAnswers = await req.json();

    // Convert quiz answers to client profile
    const age = AGE_MAP[answers.ageRange] || 35;
    const skinType = SKIN_TYPE_MAP[answers.skinType] || 2;

    const profile: ClientProfile = {
      name: 'Quiz Participant',
      age,
      gender: 'female',
      skinType,
      concerns: answers.topConcerns as SkinConcern[],
      budget: answers.budgetRange as BudgetTier,
      painTolerance: answers.painTolerance as PainTolerance,
      downtimeAvailability: answers.downtimeAvailability as DowntimeAvailability,
      medicalHistory: {
        pregnant: false,
        breastfeeding: false,
        bloodThinners: false,
        autoimmune: false,
        keloidHistory: false,
        activeSkinInfection: false,
        recentSunExposure: false,
        isotretinoin: false,
        allergies: [],
        medications: [],
        conditions: [],
      },
      lifestyleFactors: {
        sunExposure: (answers.sunExposure as 'minimal' | 'moderate' | 'heavy') || 'moderate',
        smoking: false,
        skincare: (answers.skincareRoutine as 'none' | 'basic' | 'moderate' | 'advanced') || 'basic',
        waterIntake: 'adequate',
        sleepQuality: 'fair',
        stressLevel: 'moderate',
        exerciseFrequency: 'occasional',
      },
      skinGoals: answers.skinGoals,
    };

    // Generate everything
    const treatmentPlan = generateTreatmentPlan(profile);

    const skinScore = calculateSkinHealthScore({
      age: profile.age,
      skinType: profile.skinType,
      concerns: profile.concerns,
      lifestyle: profile.lifestyleFactors!,
      currentSkincare: profile.lifestyleFactors?.skincare || 'basic',
      recentTreatments: answers.previousTreatments || [],
      selfRatedHydration: 3,
      selfRatedTexture: 3,
      selfRatedTone: 3,
      selfRatedFirmness: 3,
    });

    const benchmark = compareToBenchmarks(age, skinScore);
    const priorities = rankTreatmentPriorities(profile.concerns, skinScore, age);
    const routine = generateSkincareRoutine(skinType, profile.concerns, age, profile.lifestyleFactors?.skincare || 'basic');

    const outcomePrediction = predictOutcome(profile, treatmentPlan.primary.id);

    const skinAnalysis = {
      fitzpatrickType: skinType,
      fitzpatrickDescription: `Fitzpatrick Type ${skinType}`,
      glogauScale: (age < 30 ? 1 : age < 50 ? 2 : age < 65 ? 3 : 4) as 1 | 2 | 3 | 4,
      glogauDescription: 'Based on age and skin assessment',
      skinHealthScore: skinScore,
      agingPatterns: [],
      treatmentPriority: priorities,
      skincareRoutine: routine,
      benchmarkComparison: benchmark,
    };

    const shareableCard = {
      headline: `Your Skin Score: ${skinScore.overall}/100`,
      skinScore: skinScore.overall,
      topRecommendation: treatmentPlan.primary.treatment,
      secondRecommendation: treatmentPlan.alternatives[0]?.treatment || '',
      estimatedInvestment: `$${treatmentPlan.costEstimate.initialTreatment}`,
      callToAction: 'Book your complimentary consultation at Rani Beauty Clinic',
    };

    return NextResponse.json({
      success: true,
      data: {
        skinAnalysis,
        treatmentPlan,
        outcomePrediction,
        shareableCard,
      },
    });
  } catch (error) {
    console.error('Quiz API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process quiz results' },
      { status: 500 }
    );
  }
}
