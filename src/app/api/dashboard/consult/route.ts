import { NextRequest, NextResponse } from 'next/server';
import { generateConsultCopilot, type ConsultInput } from '@/lib/consult/copilot-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const consultInput: ConsultInput = {
      client: body.client || {
        name: 'New Client',
        previousServices: [],
        totalSpend: 0,
        visitCount: 0,
        membershipStatus: 'none',
      },
      concerns: body.concerns || ['skin rejuvenation'],
      consultType: body.consultType || 'new_client',
      interestedServices: body.interestedServices,
      budget: body.budget || 'unknown',
      timeAvailable: body.timeAvailable || 30,
    };

    const result = generateConsultCopilot(consultInput);

    return NextResponse.json({
      success: true,
      data: result,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Consult co-pilot error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate consult intelligence' },
      { status: 500 }
    );
  }
}

// GET for demo/sample data
export async function GET() {
  try {
    const sampleInput: ConsultInput = {
      client: {
        name: 'Sarah Johnson',
        age: 34,
        gender: 'female',
        skinType: 'Combination',
        previousServices: ['HydraFacial'],
        totalSpend: 450,
        visitCount: 2,
        lastVisit: '2026-02-01',
        membershipStatus: 'none',
        churnRisk: 35,
        notes: 'Interested in anti-aging. Works in tech. Wedding in September.',
      },
      concerns: ['fine lines', 'skin tightening', 'dull skin', 'wedding prep'],
      consultType: 'existing_client',
      interestedServices: ['Botox', 'Sofwave'],
      budget: 'moderate',
      timeAvailable: 30,
    };

    const result = generateConsultCopilot(sampleInput);

    return NextResponse.json({
      success: true,
      data: result,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Consult co-pilot error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate consult intelligence' },
      { status: 500 }
    );
  }
}
