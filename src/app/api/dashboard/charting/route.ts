import { NextRequest, NextResponse } from 'next/server';
import {
  createChart,
  updateChart,
  listCharts,
  getChartById,
  validateChart,
  generateChartId,
  getComplianceSummary,
  canCheckout,
  type ChartNote,
  type ChartListFilter,
} from '@/lib/charting/engine';
import { type ChartTemplateType, getTemplateList, getTemplate } from '@/lib/charting/templates';

// GET - List charts with filters, or get a single chart by ID, or get compliance summary
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Action: get compliance summary for today
    if (action === 'compliance') {
      const summary = await getComplianceSummary();
      return NextResponse.json(summary);
    }

    // Action: list available templates
    if (action === 'templates') {
      return NextResponse.json(getTemplateList());
    }

    // Action: get template schema
    if (action === 'template') {
      const type = searchParams.get('type') as ChartTemplateType;
      if (!type) {
        return NextResponse.json({ error: 'Template type required' }, { status: 400 });
      }
      const template = getTemplate(type);
      if (!template) {
        return NextResponse.json({ error: 'Unknown template type' }, { status: 404 });
      }
      return NextResponse.json(template);
    }

    // Action: check if appointment can checkout
    if (action === 'checkout-check') {
      const appointmentId = searchParams.get('appointmentId');
      const templateType = searchParams.get('templateType') as ChartTemplateType;
      if (!templateType) {
        return NextResponse.json({ error: 'Template type required' }, { status: 400 });
      }
      // If we have data to check, it would be in a POST. For GET, just check template rules
      const template = getTemplate(templateType);
      return NextResponse.json({
        blocksCheckout: template.blocksCheckout,
        requiresMdReview: template.requiresMedicalDirectorReview,
      });
    }

    // Action: get single chart by record ID
    const recordId = searchParams.get('id');
    if (recordId) {
      const chart = await getChartById(recordId);
      if (!chart) {
        return NextResponse.json({ error: 'Chart not found' }, { status: 404 });
      }
      // Re-validate to get current compliance status
      const validation = validateChart(chart.templateType, chart.data);
      return NextResponse.json({ chart, validation });
    }

    // Default: list charts with filters
    const filters: ChartListFilter = {};
    if (searchParams.get('clientName')) filters.clientName = searchParams.get('clientName')!;
    if (searchParams.get('providerName')) filters.providerName = searchParams.get('providerName')!;
    if (searchParams.get('templateType')) filters.templateType = searchParams.get('templateType') as ChartTemplateType;
    if (searchParams.get('status')) filters.status = searchParams.get('status') as ChartNote['status'];
    if (searchParams.get('dateFrom')) filters.dateFrom = searchParams.get('dateFrom')!;
    if (searchParams.get('dateTo')) filters.dateTo = searchParams.get('dateTo')!;
    if (searchParams.get('appointmentId')) filters.appointmentId = searchParams.get('appointmentId')!;
    if (searchParams.get('limit')) filters.limit = parseInt(searchParams.get('limit')!, 10);

    const charts = await listCharts(filters);
    const compliance = await getComplianceSummary();

    return NextResponse.json({ charts, compliance });
  } catch (error) {
    console.error('[Charting API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch charts', details: String(error) },
      { status: 500 }
    );
  }
}

// POST - Create a new chart
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      templateType,
      clientName,
      clientId,
      providerName,
      providerId,
      appointmentId,
      appointmentDate,
      data: chartData,
    } = body as {
      templateType: ChartTemplateType;
      clientName: string;
      clientId?: string;
      providerName: string;
      providerId?: string;
      appointmentId?: string;
      appointmentDate: string;
      data: Record<string, unknown>;
    };

    // Validate required fields
    if (!templateType || !clientName || !providerName || !appointmentDate) {
      return NextResponse.json(
        { error: 'Missing required fields: templateType, clientName, providerName, appointmentDate' },
        { status: 400 }
      );
    }

    // Validate template type exists
    const template = getTemplate(templateType);
    if (!template) {
      return NextResponse.json({ error: 'Unknown template type' }, { status: 400 });
    }

    // Validate chart data
    const validation = validateChart(templateType, chartData || {});

    const now = new Date().toISOString();
    const chartId = generateChartId();

    const chart: Omit<ChartNote, 'id'> = {
      chartId,
      templateType,
      clientName,
      clientId,
      providerName,
      providerId,
      appointmentId,
      appointmentDate,
      createdAt: now,
      updatedAt: now,
      status: validation.isCompliant ? 'complete' : 'draft',
      data: chartData || {},
      complianceStatus: validation.isCompliant ? 'complete' : 'incomplete',
      requiresMdReview: template.requiresMedicalDirectorReview,
    };

    const recordId = await createChart(chart);

    return NextResponse.json({
      success: true,
      recordId,
      chartId,
      status: chart.status,
      validation,
    });
  } catch (error) {
    console.error('[Charting API] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create chart', details: String(error) },
      { status: 500 }
    );
  }
}

// PATCH - Update an existing chart
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { recordId, data: chartData, status, mdReviewDate, mdReviewNotes, templateType } = body as {
      recordId: string;
      data?: Record<string, unknown>;
      status?: ChartNote['status'];
      mdReviewDate?: string;
      mdReviewNotes?: string;
      templateType?: ChartTemplateType;
    };

    if (!recordId) {
      return NextResponse.json({ error: 'recordId is required' }, { status: 400 });
    }

    // Get existing chart to know the template type if not provided
    const existing = await getChartById(recordId);
    if (!existing) {
      return NextResponse.json({ error: 'Chart not found' }, { status: 404 });
    }

    const effectiveTemplateType = templateType || existing.templateType;
    const effectiveData = chartData || existing.data;

    // Re-validate
    const validation = validateChart(effectiveTemplateType, effectiveData);

    const updates: Partial<ChartNote> = {
      templateType: effectiveTemplateType,
    };

    if (chartData) updates.data = chartData;
    if (status) updates.status = status;
    if (mdReviewDate) updates.mdReviewDate = mdReviewDate;
    if (mdReviewNotes) updates.mdReviewNotes = mdReviewNotes;

    // Auto-set compliance status
    updates.complianceStatus = validation.isCompliant ? 'complete' : 'incomplete';

    // If marking as complete or signed, verify compliance
    if ((status === 'complete' || status === 'signed') && !validation.isCompliant) {
      return NextResponse.json({
        error: 'Cannot mark chart as complete - required fields are missing',
        validation,
      }, { status: 422 });
    }

    // Check checkout eligibility
    const checkout = canCheckout(effectiveTemplateType, effectiveData);

    await updateChart(recordId, updates);

    return NextResponse.json({
      success: true,
      recordId,
      status: status || existing.status,
      validation,
      checkoutAllowed: checkout.allowed,
      checkoutReason: checkout.reason,
    });
  } catch (error) {
    console.error('[Charting API] PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update chart', details: String(error) },
      { status: 500 }
    );
  }
}
