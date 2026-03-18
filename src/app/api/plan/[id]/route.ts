import { NextRequest, NextResponse } from 'next/server';
import { Tables, fetchFirst } from '@/lib/airtable/client';

// Intake fields from the Client Intakes table
interface IntakeFields {
  'First Name'?: string;
  'Last Name'?: string;
  'Full Name'?: string;
  'Email'?: string;
  'Phone Number'?: string;
  'Phone'?: string;
  'Top Skin Concerns'?: string | string[];
  'Target Areas'?: string | string[];
  'Treatment Interests'?: string | string[];
  'Skin Type'?: string;
  'Cosmetic Treatment History'?: string;
  'Intake Summary (AI)'?: string;
  'Program Plan (AI)'?: string;
  'Cost Breakdown (AI)'?: string;
  'Timeline (AI)'?: string;
  'Suggested Next Step (AI)'?: string;
  'Treatment Value (AI)'?: string;
  'Processing Status'?: string;
  'Intake Intelligence'?: string[];
}

// Intelligence fields from the Intake Intelligence table
interface IntelligenceFields {
  'Intake Summary (AI)'?: string;
  'Program Plan (AI)'?: string;
  'Cost Breakdown (AI)'?: string;
  'Timeline (AI)'?: string;
  'Suggested Next Step (AI)'?: string;
  'Treatment Value (AI)'?: string;
  'Skin Health Score'?: number;
  'Projected Score'?: number;
  'Client Intakes'?: string[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    // Fetch the intake record by Airtable record ID
    let intakeRecord: { id: string; fields: IntakeFields } | null = null;

    try {
      const record = await Tables.intakes().find(id);
      intakeRecord = { id: record.id, fields: record.fields as unknown as IntakeFields };
    } catch {
      // If direct ID lookup fails, try searching by a formula
      const records = await fetchFirst<IntakeFields>(
        Tables.intakes(),
        1,
        { filterByFormula: `RECORD_ID() = '${id}'` },
        true
      );
      if (records.length > 0) {
        intakeRecord = records[0];
      }
    }

    if (!intakeRecord) {
      return NextResponse.json({ error: 'Treatment plan not found' }, { status: 404 });
    }

    const intake = intakeRecord.fields;

    // Try to fetch linked Intake Intelligence record
    let intelligence: IntelligenceFields | null = null;
    const intelligenceIds = intake['Intake Intelligence'];

    if (intelligenceIds && intelligenceIds.length > 0) {
      try {
        const intelRecord = await Tables.intakeIntelligence().find(intelligenceIds[0]);
        intelligence = intelRecord.fields as unknown as IntelligenceFields;
      } catch {
        // Intelligence not yet generated
      }
    }

    // If no linked intelligence, try finding by searching
    if (!intelligence) {
      try {
        const intelRecords = await fetchFirst<IntelligenceFields>(
          Tables.intakeIntelligence(),
          1,
          {
            filterByFormula: `FIND("${id}", ARRAYJOIN({Client Intakes}))`,
          },
          true
        );
        if (intelRecords.length > 0) {
          intelligence = intelRecords[0].fields;
        }
      } catch {
        // Intelligence table may not have matching records
      }
    }

    // Build the full name from available fields
    const firstName = intake['First Name'] || '';
    const lastName = intake['Last Name'] || '';
    const fullName = intake['Full Name'] || `${firstName} ${lastName}`.trim() || 'Valued Client';

    // Normalize array/string fields
    const normalizeField = (val: string | string[] | undefined): string[] => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      return val.split(',').map((s) => s.trim()).filter(Boolean);
    };

    // Build response
    const plan = {
      id: intakeRecord.id,
      clientName: fullName,
      firstName: firstName || fullName.split(' ')[0],
      email: intake['Email'] || '',
      phone: intake['Phone Number'] || intake['Phone'] || '',
      skinConcerns: normalizeField(intake['Top Skin Concerns']),
      targetAreas: normalizeField(intake['Target Areas']),
      treatmentInterests: normalizeField(intake['Treatment Interests']),
      skinType: intake['Skin Type'] || '',
      treatmentHistory: intake['Cosmetic Treatment History'] || '',
      processingStatus: intake['Processing Status'] || 'New',

      // AI Intelligence fields — may come from intake or intelligence table
      intakeSummary:
        intelligence?.['Intake Summary (AI)'] ||
        intake['Intake Summary (AI)'] ||
        null,
      programPlan:
        intelligence?.['Program Plan (AI)'] ||
        intake['Program Plan (AI)'] ||
        null,
      costBreakdown:
        intelligence?.['Cost Breakdown (AI)'] ||
        intake['Cost Breakdown (AI)'] ||
        null,
      timeline:
        intelligence?.['Timeline (AI)'] ||
        intake['Timeline (AI)'] ||
        null,
      suggestedNextStep:
        intelligence?.['Suggested Next Step (AI)'] ||
        intake['Suggested Next Step (AI)'] ||
        null,
      treatmentValue:
        intelligence?.['Treatment Value (AI)'] ||
        intake['Treatment Value (AI)'] ||
        null,

      // Scores
      skinHealthScore: intelligence?.['Skin Health Score'] || null,
      projectedScore: intelligence?.['Projected Score'] || null,

      // Intelligence status
      intelligenceReady: !!intelligence || !!(
        intake['Intake Summary (AI)'] ||
        intake['Program Plan (AI)']
      ),
    };

    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Error fetching treatment plan:', error);
    return NextResponse.json(
      { error: 'Failed to load treatment plan' },
      { status: 500 }
    );
  }
}
