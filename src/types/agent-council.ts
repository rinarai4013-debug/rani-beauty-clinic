import type { Permission } from '@/types/auth';

export type CouncilTier = 'crown' | 'revenue' | 'protection' | 'intelligence';
export type CouncilCategory =
  | 'executive'
  | 'finance'
  | 'growth'
  | 'conversion'
  | 'retention'
  | 'operations'
  | 'compliance'
  | 'inventory'
  | 'website'
  | 'seo'
  | 'ads';

export type CouncilSeverity = 'critical' | 'high' | 'medium' | 'low';
export type CouncilBuildStatus = 'real' | 'extended' | 'placeholder';

export type CouncilAgentId =
  | 'ceo-chief-of-staff'
  | 'finance-strategist'
  | 'general-google'
  | 'meta-commander'
  | 'website-colonel'
  | 'seo-queen'
  | 'conversion-duchess'
  | 'client-journey-concierge'
  | 'retention-empress'
  | 'operations-director'
  | 'compliance-guardian'
  | 'inventory-oracle';

export interface CouncilScorecard {
  label: string;
  value: string;
  context: string;
}

export interface CouncilSignal {
  label: string;
  value: string;
  status: CouncilSeverity;
  note: string;
}

export interface CouncilRecommendation {
  id: string;
  title: string;
  description: string;
  severity: CouncilSeverity;
  impact: string;
  owner: string;
}

export interface CouncilRouteLink {
  label: string;
  href: string;
  type: 'page' | 'api';
}

export interface CouncilAgent {
  id: CouncilAgentId;
  name: string;
  emoji: string;
  tier: CouncilTier;
  category: CouncilCategory;
  status: CouncilBuildStatus;
  mission: string;
  ownerValue: string;
  permission: Permission;
  uiPath: string;
  apiPath: string;
  summary: string;
  scorecards: CouncilScorecard[];
  signals: CouncilSignal[];
  recommendations: CouncilRecommendation[];
  linkedRoutes: CouncilRouteLink[];
}

export interface CouncilSnapshot {
  headline: string;
  summary: string;
  totalAgents: number;
  realOrExtendedAgents: number;
  criticalMoves: CouncilRecommendation[];
  easyWins: CouncilRecommendation[];
  tierCounts: Record<CouncilTier, number>;
  agentCountByStatus: Record<CouncilBuildStatus, number>;
}
