import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { cache, TTL } from '@/lib/cache';
import type { AgentFeed, AgentStatusSummary, AgentAlert, AgentRecommendation } from '@/types/agent';
import { AGENT_IDS, AGENT_REGISTRY } from '@/lib/agents/registry';

/**
 * GET /api/dashboard/agents/feed
 *
 * Aggregates all 12 agents into a single feed for the command center.
 * Returns: agent statuses, cross-agent alerts, prioritized recommendations.
 * Agent: CEO Chief of Staff
 *
 * Calls /api/dashboard/agents/[agentId] for each agent in parallel.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!hasPermission(session.role, 'view_executive')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const cacheKey = 'agent-feed';
    const cached = cache.get<AgentFeed>(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, data: cached });
    }

    const baseUrl = request.nextUrl.origin;
    const headers = { cookie: request.headers.get('cookie') || '' };

    // Fetch all agent reports in parallel
    const reportPromises = AGENT_IDS.map(async (agentId) => {
      try {
        const res = await fetch(`${baseUrl}/api/dashboard/agents/${agentId}`, { headers });
        if (!res.ok) return null;
        const json = await res.json();
        return json.data || null;
      } catch {
        return null;
      }
    });

    const reports = await Promise.all(reportPromises);

    // Build feed from reports
    const agentStatuses: AgentStatusSummary[] = [];
    const allAlerts: AgentAlert[] = [];
    const allRecommendations: AgentRecommendation[] = [];

    for (let i = 0; i < AGENT_IDS.length; i++) {
      const agentId = AGENT_IDS[i];
      const config = AGENT_REGISTRY[agentId];
      const report = reports[i];

      agentStatuses.push({
        agentId,
        name: config.name,
        icon: config.icon,
        category: config.category,
        score: report?.scorecard?.score ?? 0,
        status: report?.status ?? config.status,
        alertCount: report?.alerts?.length ?? 0,
        criticalCount: report?.alerts?.filter((a: AgentAlert) => a.severity === 'critical').length ?? 0,
        topAlert: report?.alerts?.[0]?.title,
      });

      if (report?.alerts) {
        allAlerts.push(...report.alerts);
      }
      if (report?.recommendations) {
        allRecommendations.push(...report.recommendations);
      }
    }

    // Sort alerts by severity (critical first)
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    allAlerts.sort((a, b) =>
      (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4)
    );

    // Sort recommendations by priority
    const priorityOrder = { p0: 0, p1: 1, p2: 2, p3: 3 };
    allRecommendations.sort((a, b) =>
      (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4)
    );

    const feed: AgentFeed = {
      alerts: allAlerts.slice(0, 20),
      recommendations: allRecommendations.slice(0, 15),
      agentStatuses,
      generatedAt: new Date().toISOString(),
    };

    cache.set(cacheKey, feed, TTL.REALTIME);
    return NextResponse.json({ success: true, data: feed });
  } catch (error) {
    console.error('Agent feed error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to build agent feed' },
      { status: 500 }
    );
  }
}
