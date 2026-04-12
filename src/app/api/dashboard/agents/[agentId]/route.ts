import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { cache, TTL } from '@/lib/cache';
import type { AgentId, AgentReport } from '@/types/agent';
import { AGENT_REGISTRY } from '@/lib/agents/registry';
import { buildOfflineReport, buildComplianceReport, buildFinanceReport, buildScoredReport } from '@/lib/agents/report-builder';
import { withSentry } from '@/lib/sentry-utils';

/**
 * GET /api/dashboard/agents/[agentId]
 *
 * Returns a standardized AgentReport for any of the 12 agents.
 * Internally calls the agent's wired API route(s) and normalizes
 * the response through the report builder.
 *
 * This is the single access point for the command center UI.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  return withSentry('dashboard/agents/[agentId]', async () => {
    try {
      const session = await getSession();
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (!hasPermission(session.role, 'view_executive')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const { agentId } = await params;

      if (!AGENT_REGISTRY[agentId as AgentId]) {
        return NextResponse.json({ error: `Unknown agent: ${agentId}` }, { status: 404 });
      }

      const cacheKey = `agent-report-${agentId}`;
      const cached = cache.get<AgentReport>(cacheKey);
      if (cached) {
        return NextResponse.json({ success: true, data: cached });
      }

      const config = AGENT_REGISTRY[agentId as AgentId];

      // Offline or recommendation-only agents return a default report
      if (config.status === 'offline' || config.status === 'recommendation-only') {
        const report = buildOfflineReport(agentId as AgentId);
        return NextResponse.json({ success: true, data: report });
      }

      // Build report by fetching from the agent's internal API routes
      const report = await buildAgentReport(agentId as AgentId, request);

      cache.set(cacheKey, report, TTL.STANDARD);
      return NextResponse.json({ success: true, data: report });
    } catch (error) {
      console.error(`Agent report error:`, error);
      return NextResponse.json(
        { success: false, error: 'Failed to build agent report' },
        { status: 500 }
      );
    }

  });
}

/**
 * Builds an AgentReport by calling the agent's internal API routes.
 * Each agent has custom logic to transform its engine output into
 * the standardized report shape.
 */
async function buildAgentReport(agentId: AgentId, request: NextRequest): Promise<AgentReport> {
  const baseUrl = request.nextUrl.origin;
  const headers = { cookie: request.headers.get('cookie') || '' };

  switch (agentId) {
    case 'compliance-guardian': {
      const res = await fetch(`${baseUrl}/api/dashboard/compliance`, { headers });
      const json = await res.json();
      if (json.success && json.data) {
        return buildComplianceReport(json.data);
      }
      return buildOfflineReport(agentId);
    }

    case 'finance-strategist': {
      const [anomalyRes, pnlRes] = await Promise.all([
        fetch(`${baseUrl}/api/dashboard/revenue/anomalies`, { headers }).catch(() => null),
        fetch(`${baseUrl}/api/dashboard/finance/pnl`, { headers }).catch(() => null),
      ]);
      const anomalyJson = anomalyRes?.ok ? await anomalyRes.json() : null;
      const pnlJson = pnlRes?.ok ? await pnlRes.json() : null;
      return buildFinanceReport(
        anomalyJson?.data || null,
        pnlJson?.data || null
      );
    }

    case 'inventory-oracle': {
      const res = await fetch(`${baseUrl}/api/dashboard/inventory`, { headers });
      const json = await res.json();
      if (json.success && json.data) {
        return buildScoredReport(
          agentId,
          json.data.score || 70,
          (json.data.alerts || []).map((a: { id: string; type: string; severity: string; message: string; action: string }, i: number) => ({
            id: `inventory-${a.id || i}`,
            agentId,
            severity: a.severity === 'critical' ? 'critical' : a.severity === 'warning' ? 'high' : 'medium',
            title: `Inventory: ${a.type}`,
            message: a.message,
            actionRequired: a.action || 'Review inventory levels',
            category: 'operations',
            acknowledged: false,
            createdAt: new Date().toISOString(),
          })),
          [],
          { alertCount: json.data.alerts?.length || 0 }
        );
      }
      return buildOfflineReport(agentId);
    }

    case 'operations-director': {
      const res = await fetch(`${baseUrl}/api/dashboard/schedule/optimize`, { headers });
      const json = await res.json();
      if (json.success && json.data) {
        return buildScoredReport(
          agentId,
          json.data.efficiencyScore || json.data.score || 65,
          [],
          [],
          { gapCount: json.data.gaps?.length || 0, conflictCount: json.data.conflicts?.length || 0 }
        );
      }
      return buildOfflineReport(agentId);
    }

    case 'meta-commander': {
      const res = await fetch(`${baseUrl}/api/dashboard/meta-ads/optimize`, { headers });
      const json = await res.json();
      if (json.success && json.data) {
        return buildScoredReport(
          agentId,
          json.data.adScore || json.data.score || 50,
          [],
          [],
          { configured: json.configured }
        );
      }
      return buildOfflineReport(agentId);
    }

    case 'retention-empress': {
      // Uses the already-wired loyalty and churn routes
      const loyaltyRes = await fetch(`${baseUrl}/api/dashboard/loyalty`, { headers }).catch(() => null);
      const loyaltyJson = loyaltyRes?.ok ? await loyaltyRes.json() : null;
      return buildScoredReport(
        agentId,
        loyaltyJson?.data?.engagementScore || 60,
        [],
        [],
        { loyaltyMembers: loyaltyJson?.data?.totalMembers || 0 }
      );
    }

    default:
      // For partially-wired agents, return a degraded report
      return buildOfflineReport(agentId);
  }
}
