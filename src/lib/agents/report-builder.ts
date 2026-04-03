/**
 * Agent Report Builder
 *
 * Builds standardized AgentReport objects for each agent by
 * calling the agent's API routes and normalizing their responses.
 *
 * This is the bridge between raw engine output and the unified
 * agent command system. Each agent gets a builder function that
 * understands its engine output format and converts it to the
 * standard AgentReport shape.
 */

import type {
  AgentId,
  AgentReport,
  AgentScorecard,
  AgentAlert,
  AgentRecommendation,
  Severity,
  ScoreStatus,
} from '@/types/agent';
import { scoreToStatus, severityToPriority } from '@/types/agent';
import { AGENT_REGISTRY } from './registry';

// ── Default report for offline/recommendation-only agents ───────

export function buildOfflineReport(agentId: AgentId): AgentReport {
  const config = AGENT_REGISTRY[agentId];
  return {
    agentId,
    agentName: config.name,
    status: config.status,
    scorecard: {
      agentId,
      score: 0,
      status: 'attention',
      components: [],
      trend: 'stable',
      lastUpdated: new Date().toISOString(),
    },
    alerts: [],
    recommendations: [{
      id: `${agentId}-not-configured`,
      agentId,
      severity: 'medium',
      priority: 'p2',
      category: 'setup',
      title: `${config.name} not yet configured`,
      description: `This agent requires additional setup: ${config.enginePath ? 'route wiring' : 'engine build + data integration'}.`,
      action: config.enginePath
        ? 'Wire the API route to the existing engine'
        : 'Build the engine and configure data sources',
      impact: 'Agent will begin producing live intelligence once configured',
      effort: config.enginePath ? 'moderate' : 'significant',
      source: 'registry',
      createdAt: new Date().toISOString(),
    }],
    lastRunAt: new Date().toISOString(),
  };
}

// ── Build report from compliance engine output ──────────────────

export function buildComplianceReport(data: {
  overall: number;
  categories: Record<string, { score: number; issues: number; label: string }>;
  status: string;
  upcomingDeadlines: Array<{
    id: string; title: string; dueDate: string;
    daysUntilDue: number; severity: string; category: string;
  }>;
  overdueItems: Array<{
    id: string; title: string; severity: string; category: string;
  }>;
}): AgentReport {
  const agentId: AgentId = 'compliance-guardian';
  const config = AGENT_REGISTRY[agentId];

  const scorecard: AgentScorecard = {
    agentId,
    score: data.overall,
    status: scoreToStatus(data.overall),
    components: Object.entries(data.categories).map(([key, cat]) => ({
      label: cat.label,
      score: cat.score,
      weight: getComplianceWeight(key),
      target: 90,
      status: cat.score >= 90 ? 'above' : cat.score >= 75 ? 'at' : 'below',
    })),
    trend: 'stable',
    lastUpdated: new Date().toISOString(),
  };

  const alerts: AgentAlert[] = [
    ...data.overdueItems.map(item => ({
      id: `compliance-overdue-${item.id}`,
      agentId,
      severity: 'critical' as Severity,
      title: item.title,
      message: `Overdue compliance item in ${item.category}`,
      actionRequired: 'Resolve immediately — may affect clinic operating status',
      category: 'compliance',
      acknowledged: false,
      createdAt: new Date().toISOString(),
    })),
    ...data.upcomingDeadlines
      .filter(d => d.daysUntilDue <= 14)
      .map(deadline => ({
        id: `compliance-deadline-${deadline.id}`,
        agentId,
        severity: (deadline.severity === 'critical' ? 'critical' : 'high') as Severity,
        title: deadline.title,
        message: `Due in ${deadline.daysUntilDue} days (${deadline.dueDate})`,
        actionRequired: `Complete before ${deadline.dueDate}`,
        category: 'compliance',
        acknowledged: false,
        createdAt: new Date().toISOString(),
      })),
  ];

  const recommendations: AgentRecommendation[] = Object.entries(data.categories)
    .filter(([, cat]) => cat.score < 85)
    .map(([key, cat]) => ({
      id: `compliance-improve-${key}`,
      agentId,
      severity: (cat.score < 50 ? 'high' : 'medium') as Severity,
      priority: severityToPriority(cat.score < 50 ? 'high' : 'medium'),
      category: 'compliance',
      title: `Improve ${cat.label} score (currently ${cat.score}%)`,
      description: `${cat.label} has ${cat.issues} issue(s) requiring attention.`,
      action: `Review ${cat.label} compliance checklist and resolve open items`,
      impact: `Will improve overall compliance score from ${data.overall}%`,
      effort: 'moderate' as const,
      source: 'compliance-engine',
      createdAt: new Date().toISOString(),
    }));

  return {
    agentId,
    agentName: config.name,
    status: 'live',
    scorecard,
    alerts,
    recommendations,
    lastRunAt: new Date().toISOString(),
    metadata: { rawScore: data.overall, complianceStatus: data.status },
  };
}

// ── Build report from revenue anomaly engine output ─────────────

export function buildFinanceReport(anomalyData: {
  anomalies: Array<{ type: string; severity: string; message: string; suggestion: string }>;
  healthScore: number;
  summary: string;
  projectedMonthEnd: number;
} | null, pnlData: {
  healthScore: number;
  kpis: Record<string, number>;
  insights: Array<{ type: string; message: string }>;
} | null): AgentReport {
  const agentId: AgentId = 'finance-strategist';
  const config = AGENT_REGISTRY[agentId];

  const combinedScore = pnlData?.healthScore ?? anomalyData?.healthScore ?? 0;

  const scorecard: AgentScorecard = {
    agentId,
    score: combinedScore,
    status: scoreToStatus(combinedScore),
    components: [],
    trend: 'stable',
    lastUpdated: new Date().toISOString(),
  };

  const alerts: AgentAlert[] = (anomalyData?.anomalies || [])
    .filter(a => a.severity === 'critical' || a.severity === 'warning')
    .map((anomaly, i) => ({
      id: `finance-anomaly-${i}`,
      agentId,
      severity: (anomaly.severity === 'critical' ? 'critical' : 'high') as Severity,
      title: `Revenue anomaly: ${anomaly.type}`,
      message: anomaly.message,
      actionRequired: anomaly.suggestion,
      category: 'finance',
      acknowledged: false,
      createdAt: new Date().toISOString(),
    }));

  const recommendations: AgentRecommendation[] = (pnlData?.insights || [])
    .slice(0, 5)
    .map((insight, i) => ({
      id: `finance-insight-${i}`,
      agentId,
      severity: 'medium' as Severity,
      priority: 'p2' as const,
      category: 'finance',
      title: insight.message,
      description: `Financial intelligence insight from P&L analysis`,
      action: 'Review in Finance dashboard',
      impact: 'Improved financial visibility',
      effort: 'quick' as const,
      source: 'pnl-engine',
      createdAt: new Date().toISOString(),
    }));

  return {
    agentId,
    agentName: config.name,
    status: anomalyData || pnlData ? 'live' : 'partial',
    scorecard,
    alerts,
    recommendations,
    lastRunAt: new Date().toISOString(),
    metadata: {
      projectedMonthEnd: anomalyData?.projectedMonthEnd,
      anomalyCount: anomalyData?.anomalies.length ?? 0,
    },
  };
}

// ── Generic report from scored engine output ────────────────────

export function buildScoredReport(
  agentId: AgentId,
  score: number,
  alerts: AgentAlert[] = [],
  recommendations: AgentRecommendation[] = [],
  metadata?: Record<string, unknown>
): AgentReport {
  const config = AGENT_REGISTRY[agentId];
  return {
    agentId,
    agentName: config.name,
    status: score > 0 ? 'live' : 'partial',
    scorecard: {
      agentId,
      score,
      status: scoreToStatus(score),
      components: [],
      trend: 'stable',
      lastUpdated: new Date().toISOString(),
    },
    alerts,
    recommendations,
    lastRunAt: new Date().toISOString(),
    metadata,
  };
}

// ── Helpers ─────────────────────────────────────────────────────

function getComplianceWeight(key: string): number {
  const weights: Record<string, number> = {
    hipaa: 0.20, osha: 0.12, licensing: 0.18, dea: 0.15,
    devices: 0.12, consents: 0.10, policies: 0.05, training: 0.08,
  };
  return weights[key] || 0.10;
}
