import { NextRequest, NextResponse } from 'next/server';
import {
  generateTreatmentRoadmapHTML,
  generateAftercareHTML,
  generateConsultSummaryHTML,
} from '@/lib/templates/pdf-templates';

// POST /api/templates/pdf
// Called by n8n W2 (Document Architect) to generate branded HTML for PDF conversion
// Returns HTML that n8n converts to PDF via Google Docs or Puppeteer

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateType, ...data } = body;

    if (!templateType) {
      return NextResponse.json(
        { error: 'templateType is required. Options: treatment_roadmap, aftercare, consult_summary' },
        { status: 400 }
      );
    }

    let html: string;

    switch (templateType) {
      case 'treatment_roadmap':
        if (!data.clientName || !data.treatmentPlan) {
          return NextResponse.json(
            { error: 'treatment_roadmap requires: clientName, providerName, date, treatmentPlan, totalEstimate, goals, nextSteps' },
            { status: 400 }
          );
        }
        html = generateTreatmentRoadmapHTML(data);
        break;

      case 'aftercare':
        if (!data.clientName || !data.serviceName) {
          return NextResponse.json(
            { error: 'aftercare requires: clientName, providerName, treatmentDate, serviceName, serviceCategory, aftercareInstructions, avoidList, expectedTimeline, emergencyContact' },
            { status: 400 }
          );
        }
        html = generateAftercareHTML(data);
        break;

      case 'consult_summary':
        if (!data.clientName || !data.goodOption) {
          return NextResponse.json(
            { error: 'consult_summary requires: clientName, providerName, consultDate, concerns, goodOption, betterOption, bestOption, validUntil' },
            { status: 400 }
          );
        }
        html = generateConsultSummaryHTML(data);
        break;

      default:
        return NextResponse.json(
          { error: `Unknown templateType: ${templateType}. Options: treatment_roadmap, aftercare, consult_summary` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      templateType,
      html,
      clientName: data.clientName,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[PDF Template API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate template', details: String(error) },
      { status: 500 }
    );
  }
}
