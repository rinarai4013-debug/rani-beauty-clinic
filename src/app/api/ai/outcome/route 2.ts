import { NextRequest, NextResponse } from 'next/server';
import { predictOutcome, predictOutcomes } from '@/lib/ai/outcome-predictor';
import type { ClientProfile } from '@/types/ai-treatment';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { profile, treatmentId, treatmentIds } = body as {
      profile: ClientProfile;
      treatmentId?: string;
      treatmentIds?: string[];
    };

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Missing client profile' },
        { status: 400 }
      );
    }

    // Batch prediction
    if (treatmentIds && treatmentIds.length > 0) {
      const predictions = predictOutcomes(profile, treatmentIds);
      return NextResponse.json({ success: true, data: predictions });
    }

    // Single prediction
    if (treatmentId) {
      const prediction = predictOutcome(profile, treatmentId);
      return NextResponse.json({ success: true, data: prediction });
    }

    return NextResponse.json(
      { success: false, error: 'Missing treatmentId or treatmentIds' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Outcome prediction error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to predict outcomes' },
      { status: 500 }
    );
  }
}
