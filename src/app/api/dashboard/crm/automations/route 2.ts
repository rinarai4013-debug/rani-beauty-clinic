import { NextRequest, NextResponse } from 'next/server';
import { BUILT_IN_AUTOMATIONS, calculateAutomationMetrics } from '@/lib/crm/automations';
import type { AutomationRecipe, AutomationExecution } from '@/types/crm';

/**
 * GET /api/dashboard/crm/automations
 * Returns all automations with metrics.
 */
export async function GET(request: NextRequest) {
  try {
    const automations = BUILT_IN_AUTOMATIONS;
    const executions: AutomationExecution[] = []; // In production, fetch from Airtable
    const metrics = calculateAutomationMetrics(automations, executions);

    return NextResponse.json({ automations, metrics });
  } catch (error) {
    console.error('CRM Automations error:', error);
    return NextResponse.json({ error: 'Failed to load automations' }, { status: 500 });
  }
}

/**
 * POST /api/dashboard/crm/automations
 * Toggle or update an automation.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, automationId, enabled } = body;

    if (action === 'toggle') {
      return NextResponse.json({ success: true, automationId, enabled });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('CRM Automations POST error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
