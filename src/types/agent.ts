/**
 * Rani Beauty Clinic — Agent Command System Type Definitions
 *
 * Shared types for the 12-agent AI council.
 * Reuses severity pattern from compliance types ('low' | 'medium' | 'high' | 'critical').
 * Extends AlertItem/ActionItem patterns from briefing/types.ts.
 */

// ── Agent Identifiers ───────────────────────────────────────────

export type AgentId =
  | 'general-google'
  | 'meta-commander'
  | 'website-colonel'
  | 'seo-queen'
  | 'conversion-duchess'
  | 'client-journey-concierge'
  | 'retention-empress'
  | 'operations-director'
  | 'compliance-guardian'
  | 'inventory-oracle'
  | 'finance-strategist'
  | 'ceo-chief-of-staff';

export type AgentCategory =
  | 'growth'
  | 'conversion'
  | 'retention'
  | 'operations'
  | 'compliance'
  | 'finance'
  | 'executive';

// ── Agent Status ────────────────────────────────────────────────

/** Whether the agent is producing live data, partial data, or offline */
export type AgentStatus =
  | 'live'                  // Engine wired, returning real data
  | 'partial'               // Some routes wired, some stubs
  | 'recommendation-only'   // No engine — manual input scorecard
  | 'offline';              // Not yet implemented

// ── Severity & Priority ─────────────────────────────────────────
// Reuses the exact pattern from src/types/compliance.ts BreachNotification

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export type Priority = 'p0' | 'p1' | 'p2' | 'p3';

// ── Agent Configuration ─────────────────────────────────────────

export interface AgentConfig {
  id: AgentId;
  name: string;
  icon: string;
  category: AgentCategory;
  mission: string;
  status: AgentStatus;
  enginePath: string | null;       // e.g. 'lib/churn/engine.ts', null if no engine
  apiRoutes: string[];             // e.g. ['/api/dashboard/compliance']
  dashboardPath: string | null;    // e.g. '/dashboard/compliance'
  refreshInterval: number;         // SWR refresh in seconds
  dependencies: AgentId[];
}

// ── Scorecard ───────────────────────────────────────────────────

export interface ScorecardComponent {
  label: string;
  score: number;                   // 0-100
  weight: number;                  // 0-1, all weights in a scorecard sum to 1
  target: number;                  // Target value for context
  status: 'above' | 'at' | 'below';
}

export type ScoreStatus = 'excellent' | 'good' | 'attention' | 'critical';

export interface AgentScorecard {
  agentId: AgentId;
  score: number;                   // 0-100 composite
  status: ScoreStatus;
  components: ScorecardComponent[];
  trend: 'improving' | 'stable' | 'declining';
  lastUpdated: string;             // ISO date
}

// ── Alerts ──────────────────────────────────────────────────────
// Extends the AlertItem pattern from src/lib/briefing/types.ts

export interface AgentAlert {
  id: string;
  agentId: AgentId;
  severity: Severity;
  title: string;
  message: string;
  actionRequired: string;
  category: string;                // e.g. 'revenue', 'compliance', 'retention'
  acknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  createdAt: string;
  expiresAt?: string;
}

// ── Recommendations ─────────────────────────────────────────────
// Extends the ActionItem pattern from src/lib/briefing/types.ts

export interface AgentRecommendation {
  id: string;
  agentId: AgentId;
  severity: Severity;
  priority: Priority;
  category: string;
  title: string;
  description: string;
  action: string;
  impact: string;
  effort: 'quick' | 'moderate' | 'significant';
  revenueImpact?: number;
  deadline?: string;
  source: string;                  // Engine/data source
  createdAt: string;
}

// ── Agent Report (Unified Output) ───────────────────────────────

export interface AgentReport {
  agentId: AgentId;
  agentName: string;
  status: AgentStatus;
  scorecard: AgentScorecard;
  alerts: AgentAlert[];
  recommendations: AgentRecommendation[];
  lastRunAt: string;
  metadata?: Record<string, unknown>;
}

// ── CEO Synthesis ───────────────────────────────────────────────

export interface AgentStatusSummary {
  agentId: AgentId;
  name: string;
  icon: string;
  category: AgentCategory;
  score: number;
  status: AgentStatus;
  alertCount: number;
  criticalCount: number;
  topAlert?: string;
}

export interface CEOSynthesis {
  clinicHealthScore: number;
  agentStatuses: AgentStatusSummary[];
  criticalAlerts: AgentAlert[];
  topRecommendations: AgentRecommendation[];
  todaysFocus: string[];
  revenueAtRisk: number;
  complianceStatus: 'clear' | 'attention' | 'critical';
  generatedAt: string;
}

// ── Agent Feed (cross-agent aggregation) ────────────────────────

export interface AgentFeed {
  alerts: AgentAlert[];
  recommendations: AgentRecommendation[];
  agentStatuses: AgentStatusSummary[];
  generatedAt: string;
}

// ── Helpers ─────────────────────────────────────────────────────

export function scoreToStatus(score: number): ScoreStatus {
  if (score >= 85) return 'excellent';
  if (score >= 65) return 'good';
  if (score >= 40) return 'attention';
  return 'critical';
}

export function severityToPriority(severity: Severity): Priority {
  switch (severity) {
    case 'critical': return 'p0';
    case 'high': return 'p1';
    case 'medium': return 'p2';
    case 'low': return 'p3';
  }
}
