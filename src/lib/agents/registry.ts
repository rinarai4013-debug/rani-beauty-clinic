/**
 * Rani Beauty Clinic — Agent Registry
 *
 * Single source of truth for all 12 agents.
 * Maps agent IDs to their configuration: engine paths, API routes,
 * dashboard paths, categories, and current operational status.
 *
 * Status values are based on verified codebase evidence:
 * - 'live'                = engine exists AND API route is wired to Airtable
 * - 'partial'             = engine exists but API route is a stub (needs wiring)
 * - 'recommendation-only' = no engine exists, manual-input scorecard only
 * - 'offline'             = not yet implemented
 */

import type { AgentConfig, AgentId } from '@/types/agent';

export const AGENT_REGISTRY: Record<AgentId, AgentConfig> = {
  'general-google': {
    id: 'general-google',
    name: 'General Google',
    icon: '🟢',
    category: 'growth',
    mission: 'Google Ads intelligence, search intent alignment, budget watch',
    status: 'recommendation-only',
    enginePath: null,
    apiRoutes: [],
    dashboardPath: null,
    refreshInterval: 300,
    dependencies: [],
  },

  'meta-commander': {
    id: 'meta-commander',
    name: 'Meta Commander',
    icon: '🔵',
    category: 'growth',
    mission: 'Meta Ads intelligence, creative fatigue detection, ROAS optimization',
    status: 'partial',
    enginePath: 'lib/ads/meta-ads-manager.ts',
    apiRoutes: ['/api/dashboard/meta-ads', '/api/dashboard/meta-ads/optimize'],
    dashboardPath: '/dashboard/meta-ads',
    refreshInterval: 300,
    dependencies: [],
  },

  'website-colonel': {
    id: 'website-colonel',
    name: 'Website Colonel',
    icon: '🌐',
    category: 'conversion',
    mission: 'CRO audit, trust signals, page friction, conversion leaks',
    status: 'recommendation-only',
    enginePath: null,
    apiRoutes: [],
    dashboardPath: null,
    refreshInterval: 300,
    dependencies: [],
  },

  'seo-queen': {
    id: 'seo-queen',
    name: 'SEO Queen',
    icon: '🔍',
    category: 'growth',
    mission: 'Local SEO, content gaps, schema health, geo-page expansion',
    status: 'recommendation-only',
    enginePath: null,
    apiRoutes: ['/api/dashboard/marketing/seo'],
    dashboardPath: '/dashboard/marketing/seo',
    refreshInterval: 300,
    dependencies: [],
  },

  'conversion-duchess': {
    id: 'conversion-duchess',
    name: 'Conversion Duchess',
    icon: '💋',
    category: 'conversion',
    mission: 'Consultation conversion, pricing psychology, pipeline velocity',
    status: 'partial',
    enginePath: 'lib/consult/copilot-engine.ts',
    apiRoutes: ['/api/dashboard/consult', '/api/dashboard/crm/pipeline', '/api/dashboard/pricing'],
    dashboardPath: '/dashboard/consult',
    refreshInterval: 300,
    dependencies: [],
  },

  'client-journey-concierge': {
    id: 'client-journey-concierge',
    name: 'Client Journey Concierge',
    icon: '💌',
    category: 'retention',
    mission: 'Onboarding, follow-up sequences, rebooking, treatment plan delivery',
    status: 'partial',
    enginePath: 'lib/templates/post-treatment.ts',
    apiRoutes: ['/api/dashboard/communications'],
    dashboardPath: '/dashboard/communications',
    refreshInterval: 300,
    dependencies: [],
  },

  'retention-empress': {
    id: 'retention-empress',
    name: 'Retention Empress',
    icon: '♻️',
    category: 'retention',
    mission: 'Memberships, loyalty, churn risk, winback, LTV expansion',
    status: 'partial',
    enginePath: 'lib/churn/engine.ts',
    apiRoutes: [
      '/api/dashboard/clients/at-risk',
      '/api/dashboard/loyalty',
      '/api/dashboard/membership',
      '/api/dashboard/referrals',
      '/api/dashboard/reactivation',
    ],
    dashboardPath: '/dashboard/loyalty',
    refreshInterval: 120,
    dependencies: [],
  },

  'operations-director': {
    id: 'operations-director',
    name: 'Operations Director',
    icon: '🧰',
    category: 'operations',
    mission: 'Schedule efficiency, bottlenecks, room utilization, clinic score',
    status: 'partial',
    enginePath: 'lib/schedule/optimizer.ts',
    apiRoutes: [
      '/api/dashboard/schedule',
      '/api/dashboard/schedule/no-show-risk',
      '/api/dashboard/schedule/optimize',
    ],
    dashboardPath: '/dashboard/schedule-optimizer',
    refreshInterval: 120,
    dependencies: [],
  },

  'compliance-guardian': {
    id: 'compliance-guardian',
    name: 'Compliance Guardian',
    icon: '🛡️',
    category: 'compliance',
    mission: 'HIPAA, OSHA, licensing, controlled substances, consent, device maintenance',
    status: 'partial',
    enginePath: 'lib/compliance/index.ts',
    apiRoutes: ['/api/dashboard/compliance'],
    dashboardPath: '/dashboard/compliance',
    refreshInterval: 300,
    dependencies: [],
  },

  'inventory-oracle': {
    id: 'inventory-oracle',
    name: 'Inventory Oracle',
    icon: '📦',
    category: 'operations',
    mission: 'Stock intelligence, reorder alerts, waste analysis, supplier management',
    status: 'live',
    enginePath: 'lib/inventory/auto-manager.ts',
    apiRoutes: ['/api/dashboard/inventory'],
    dashboardPath: '/dashboard/inventory',
    refreshInterval: 300,
    dependencies: [],
  },

  'finance-strategist': {
    id: 'finance-strategist',
    name: 'Finance Strategist',
    icon: '💵',
    category: 'finance',
    mission: 'Revenue pacing, P&L intelligence, service profitability, forecasting',
    status: 'partial',
    enginePath: 'lib/finance/pnl-engine.ts',
    apiRoutes: [
      '/api/dashboard/finance/pnl',
      '/api/dashboard/revenue/anomalies',
      '/api/dashboard/finance/overview',
    ],
    dashboardPath: '/dashboard/finance',
    refreshInterval: 300,
    dependencies: [],
  },

  'ceo-chief-of-staff': {
    id: 'ceo-chief-of-staff',
    name: 'CEO Chief of Staff',
    icon: '👠',
    category: 'executive',
    mission: 'Executive synthesis, cross-agent prioritization, daily/weekly/monthly briefs',
    status: 'partial',
    enginePath: 'lib/briefing/index.ts',
    apiRoutes: ['/api/dashboard/briefing', '/api/dashboard/agents/feed'],
    dashboardPath: '/dashboard/command-center',
    refreshInterval: 60,
    dependencies: [
      'compliance-guardian',
      'finance-strategist',
      'operations-director',
      'retention-empress',
      'inventory-oracle',
      'meta-commander',
    ],
  },
};

// ── Accessors ───────────────────────────────────────────────────

export function getAgent(id: AgentId): AgentConfig {
  return AGENT_REGISTRY[id];
}

export function getAgentsByCategory(category: AgentConfig['category']): AgentConfig[] {
  return Object.values(AGENT_REGISTRY).filter(a => a.category === category);
}

export function getLiveAgents(): AgentConfig[] {
  return Object.values(AGENT_REGISTRY).filter(a => a.status === 'live' || a.status === 'partial');
}

export function getAllAgents(): AgentConfig[] {
  return Object.values(AGENT_REGISTRY);
}

export const AGENT_IDS = Object.keys(AGENT_REGISTRY) as AgentId[];

export const CATEGORY_LABELS: Record<AgentConfig['category'], string> = {
  growth: 'Growth',
  conversion: 'Conversion',
  retention: 'Retention',
  operations: 'Operations',
  compliance: 'Compliance',
  finance: 'Finance',
  executive: 'Executive',
};

export const CATEGORY_ORDER: AgentConfig['category'][] = [
  'executive',
  'finance',
  'operations',
  'compliance',
  'conversion',
  'retention',
  'growth',
];
