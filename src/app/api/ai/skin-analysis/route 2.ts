import { NextRequest, NextResponse } from 'next/server';
import { performSkinAnalysis } from '@/lib/ai/skin-analysis';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { assessmentInput, fitzpatrickInput, glogauInput } = body;

    if (!assessmentInput || !fitzpatrickInput || !glogauInput) {
      return NextResponse.json(
        { success: false, error: 'Missing required assessment inputs' },
        { status: 400 }
      );
    }

    const analysis = performSkinAnalysis(assessmentInput, fitzpatrickInput, glogauInput);

    return NextResponse.json({ success: true, data: analysis });
  } catch (error) {
    console.error('Skin analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform skin analysis' },
      { status: 500 }
    );
  }
}
