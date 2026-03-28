import { NextRequest, NextResponse } from 'next/server';
import { generateTreatmentPlan } from '@/lib/ai/treatment-advisor';
import { performSkinAnalysis, calculateSkinHealthScore } from '@/lib/ai/skin-analysis';
import { generateConsultationCopilot } from '@/lib/ai/consultation-copilot';
import { predictOutcome } from '@/lib/ai/outcome-predictor';
import type { ClientProfile } from '@/types/ai-treatment';

export async function POST(req: NextRequest) {
  try {
    const profile: ClientProfile = await req.json();

    // Validate required fields
    if (!profile.name || !profile.age || !profile.concerns || profile.concerns.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, age, and at least one concern' },
        { status: 400 }
      );
    }

    // Generate treatment plan
    const treatmentPlan = generateTreatmentPlan(profile);

    // Perform skin analysis
    const skinScore = calculateSkinHealthScore({
      age: profile.age,
      skinType: profile.skinType,
      concerns: profile.concerns,
      lifestyle: profile.lifestyleFactors || {
        sunExposure: 'moderate',
        smoking: false,
        skincare: 'basic',
        waterIntake: 'adequate',
        sleepQuality: 'fair',
        stressLevel: 'moderate',
        exerciseFrequency: 'occasional',
      },
      currentSkincare: profile.lifestyleFactors?.skincare || 'basic',
      recentTreatments: profile.treatmentHistory?.map(t => t.treatment) || [],
      selfRatedHydration: 3,
      selfRatedTexture: 3,
      selfRatedTone: 3,
      selfRatedFirmness: 3,
    });

    const skinAnalysis = {
      fitzpatrickType: profile.skinType,
      fitzpatrickDescription: `Fitzpatrick Type ${profile.skinType}`,
      glogauScale: (profile.age < 30 ? 1 : profile.age < 50 ? 2 : profile.age < 65 ? 3 : 4) as 1 | 2 | 3 | 4,
      glogauDescription: 'Assessed based on age and concerns',
      skinHealthScore: skinScore,
      agingPatterns: [],
      treatmentPriority: [],
      skincareRoutine: { morning: [], evening: [], weekly: [] },
      benchmarkComparison: {
        ageGroup: `Ages ${Math.floor(profile.age / 10) * 10}-${Math.floor(profile.age / 10) * 10 + 9}`,
        percentile: Math.max(10, Math.min(90, skinScore.overall + Math.round((Math.random() - 0.5) * 20))),
        areasBetterThanPeers: [],
        areasForImprovement: [],
      },
    };

    // Generate outcome prediction for primary treatment
    const outcomePrediction = predictOutcome(profile, treatmentPlan.primary.id);

    // Generate consultation copilot
    const copilot = generateConsultationCopilot({
      client: profile,
      consultType: 'new_client',
      interestedServices: [treatmentPlan.primary.treatment],
    });

    return NextResponse.json({
      success: true,
      data: {
        treatmentPlan,
        skinAnalysis,
        outcomePrediction,
        copilot,
      },
    });
  } catch (error) {
    console.error('AI Advisor error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate treatment plan' },
      { status: 500 }
    );
  }
}
