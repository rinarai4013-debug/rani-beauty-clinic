import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/dashboard/crm/overview
 * Returns combined CRM overview data (pipeline + lifecycle + segments + automations + tasks).
 */
export async function GET(request: NextRequest) {
  try {
    // In production, fetch all data from Airtable and compute.
    // For now, return a structured skeleton that the frontend can consume.
    const baseUrl = request.nextUrl.origin;

    // Fetch all CRM endpoints in parallel
    const [pipelineRes, lifecycleRes, segmentsRes, automationsRes, tasksRes] = await Promise.allSettled([
      fetch(`${baseUrl}/api/dashboard/crm/pipeline`).then(r => r.json()),
      fetch(`${baseUrl}/api/dashboard/crm/lifecycle`).then(r => r.json()),
      fetch(`${baseUrl}/api/dashboard/crm/segments`).then(r => r.json()),
      fetch(`${baseUrl}/api/dashboard/crm/automations`).then(r => r.json()),
      fetch(`${baseUrl}/api/dashboard/crm/tasks`).then(r => r.json()),
    ]);

    const pipeline = pipelineRes.status === 'fulfilled' ? pipelineRes.value.metrics || pipelineRes.value : {};
    const lifecycle = lifecycleRes.status === 'fulfilled' ? lifecycleRes.value : {};
    const segments = segmentsRes.status === 'fulfilled' ? segmentsRes.value : {};
    const automations = automationsRes.status === 'fulfilled' ? automationsRes.value.metrics || {} : {};
    const tasks = tasksRes.status === 'fulfilled' ? tasksRes.value.metrics || {} : {};

    return NextResponse.json({
      pipeline,
      lifecycle,
      segments,
      automations,
      tasks,
      recentActivity: [],
    });
  } catch (error) {
    console.error('CRM Overview error:', error);
    return NextResponse.json({ error: 'Failed to load CRM overview' }, { status: 500 });
  }
}
