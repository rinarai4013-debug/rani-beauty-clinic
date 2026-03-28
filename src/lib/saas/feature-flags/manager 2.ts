/**
 * RaniOS Feature Flag System
 *
 * Per-tenant flags, per-tier defaults, boolean/percentage/user-based,
 * A/B test support, overrides, dependency chains, audit trail.
 */

import { z } from 'zod';

// ─── Types ────────────────────────────────────────────────────────

export type FlagType = 'boolean' | 'percentage' | 'user_based' | 'variant';

export type TenantTier = 'starter' | 'pro' | 'enterprise';

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  type: FlagType;
  enabled: boolean;
  defaultValue: boolean;
  percentage: number; // 0-100, for percentage rollout
  allowedUserIds: string[]; // for user_based type
  variants: FlagVariant[]; // for variant/A-B testing
  tierDefaults: Record<TenantTier, boolean>;
  tenantOverrides: Map<string, FlagOverride>;
  dependencies: string[]; // flag keys that must be enabled
  tags: string[];
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  metadata: Record<string, unknown>;
}

export interface FlagOverride {
  tenantId: string;
  enabled: boolean;
  percentage?: number;
  allowedUserIds?: string[];
  reason: string;
  setBy: string;
  setAt: number;
  expiresAt: number | null;
}

export interface FlagVariant {
  key: string;
  name: string;
  weight: number; // percentage 0-100
  payload: Record<string, unknown>;
}

export interface FlagEvaluation {
  flagKey: string;
  enabled: boolean;
  variant: string | null;
  reason: 'default' | 'tier' | 'override' | 'percentage' | 'user' | 'dependency_missing' | 'disabled';
  flagType: FlagType;
  evaluatedAt: number;
}

export interface ABTestResult {
  flagKey: string;
  variants: {
    key: string;
    name: string;
    impressions: number;
    conversions: number;
    conversionRate: number;
    weight: number;
  }[];
  totalImpressions: number;
  startedAt: number;
  isSignificant: boolean;
  winningVariant: string | null;
}

export interface FlagAuditEntry {
  id: string;
  flagKey: string;
  action: 'created' | 'updated' | 'toggled' | 'override_set' | 'override_removed' | 'deleted';
  performedBy: string;
  previousValue: unknown;
  newValue: unknown;
  tenantId: string | null;
  timestamp: number;
}

export interface FlagDashboardData {
  totalFlags: number;
  enabledFlags: number;
  disabledFlags: number;
  flagsByType: Record<FlagType, number>;
  recentChanges: FlagAuditEntry[];
  activeTests: ABTestResult[];
  flagsByTag: { tag: string; count: number }[];
}

// ─── Schemas ──────────────────────────────────────────────────────

export const CreateFlagSchema = z.object({
  key: z.string().min(1).max(100).regex(/^[a-z0-9_]+$/, 'Key must be lowercase with underscores'),
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional().default(''),
  type: z.enum(['boolean', 'percentage', 'user_based', 'variant']),
  enabled: z.boolean().optional().default(false),
  defaultValue: z.boolean().optional().default(false),
  percentage: z.number().min(0).max(100).optional().default(0),
  tierDefaults: z.object({
    starter: z.boolean(),
    pro: z.boolean(),
    enterprise: z.boolean(),
  }).optional(),
  tags: z.array(z.string()).optional().default([]),
  dependencies: z.array(z.string()).optional().default([]),
  createdBy: z.string().min(1),
});

export const UpdateFlagSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  enabled: z.boolean().optional(),
  defaultValue: z.boolean().optional(),
  percentage: z.number().min(0).max(100).optional(),
  tags: z.array(z.string()).optional(),
  dependencies: z.array(z.string()).optional(),
});

export const SetOverrideSchema = z.object({
  tenantId: z.string().min(1),
  enabled: z.boolean(),
  percentage: z.number().min(0).max(100).optional(),
  reason: z.string().min(1).max(500),
  setBy: z.string().min(1),
  expiresAt: z.number().int().nullable().optional(),
});

// ─── In-Memory Stores ─────────────────────────────────────────────

const flags = new Map<string, FeatureFlag>();
const auditLog: FlagAuditEntry[] = [];
const abTestImpressions = new Map<string, Map<string, { impressions: number; conversions: number }>>();

// ─── Flag Management ──────────────────────────────────────────────

export function createFlag(input: z.infer<typeof CreateFlagSchema>): FeatureFlag {
  const flag: FeatureFlag = {
    id: `flag_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`,
    key: input.key,
    name: input.name,
    description: input.description || '',
    type: input.type,
    enabled: input.enabled ?? false,
    defaultValue: input.defaultValue ?? false,
    percentage: input.percentage ?? 0,
    allowedUserIds: [],
    variants: [],
    tierDefaults: input.tierDefaults || { starter: false, pro: false, enterprise: true },
    tenantOverrides: new Map(),
    dependencies: input.dependencies || [],
    tags: input.tags || [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: input.createdBy,
    metadata: {},
  };

  flags.set(flag.key, flag);

  addAuditEntry({
    flagKey: flag.key,
    action: 'created',
    performedBy: input.createdBy,
    previousValue: null,
    newValue: { key: flag.key, type: flag.type, enabled: flag.enabled },
    tenantId: null,
  });

  return flag;
}

export function updateFlag(
  key: string,
  updates: z.infer<typeof UpdateFlagSchema>,
  performedBy: string,
): FeatureFlag | null {
  const flag = flags.get(key);
  if (!flag) return null;

  const previousValue = {
    name: flag.name,
    enabled: flag.enabled,
    defaultValue: flag.defaultValue,
    percentage: flag.percentage,
  };

  if (updates.name !== undefined) flag.name = updates.name;
  if (updates.description !== undefined) flag.description = updates.description;
  if (updates.enabled !== undefined) flag.enabled = updates.enabled;
  if (updates.defaultValue !== undefined) flag.defaultValue = updates.defaultValue;
  if (updates.percentage !== undefined) flag.percentage = updates.percentage;
  if (updates.tags) flag.tags = updates.tags;
  if (updates.dependencies) flag.dependencies = updates.dependencies;
  flag.updatedAt = Date.now();

  addAuditEntry({
    flagKey: key,
    action: updates.enabled !== undefined ? 'toggled' : 'updated',
    performedBy,
    previousValue,
    newValue: updates,
    tenantId: null,
  });

  return flag;
}

export function deleteFlag(key: string, performedBy: string): boolean {
  const flag = flags.get(key);
  if (!flag) return false;

  flags.delete(key);

  addAuditEntry({
    flagKey: key,
    action: 'deleted',
    performedBy,
    previousValue: { key, name: flag.name },
    newValue: null,
    tenantId: null,
  });

  return true;
}

export function getFlag(key: string): FeatureFlag | null {
  return flags.get(key) || null;
}

export function getAllFlags(filter?: { tag?: string; type?: FlagType; enabled?: boolean }): FeatureFlag[] {
  let result = Array.from(flags.values());

  if (filter?.tag) result = result.filter(f => f.tags.includes(filter.tag!));
  if (filter?.type) result = result.filter(f => f.type === filter.type);
  if (filter?.enabled !== undefined) result = result.filter(f => f.enabled === filter.enabled);

  return result.sort((a, b) => b.updatedAt - a.updatedAt);
}

// ─── Overrides ────────────────────────────────────────────────────

export function setTenantOverride(
  flagKey: string,
  override: z.infer<typeof SetOverrideSchema>,
): boolean {
  const flag = flags.get(flagKey);
  if (!flag) return false;

  const previous = flag.tenantOverrides.get(override.tenantId);

  flag.tenantOverrides.set(override.tenantId, {
    tenantId: override.tenantId,
    enabled: override.enabled,
    percentage: override.percentage,
    reason: override.reason,
    setBy: override.setBy,
    setAt: Date.now(),
    expiresAt: override.expiresAt ?? null,
  });

  flag.updatedAt = Date.now();

  addAuditEntry({
    flagKey,
    action: 'override_set',
    performedBy: override.setBy,
    previousValue: previous || null,
    newValue: { tenantId: override.tenantId, enabled: override.enabled },
    tenantId: override.tenantId,
  });

  return true;
}

export function removeTenantOverride(
  flagKey: string,
  tenantId: string,
  performedBy: string,
): boolean {
  const flag = flags.get(flagKey);
  if (!flag) return false;

  const previous = flag.tenantOverrides.get(tenantId);
  if (!previous) return false;

  flag.tenantOverrides.delete(tenantId);
  flag.updatedAt = Date.now();

  addAuditEntry({
    flagKey,
    action: 'override_removed',
    performedBy,
    previousValue: previous,
    newValue: null,
    tenantId,
  });

  return true;
}

// ─── A/B Test Support ─────────────────────────────────────────────

export function addVariants(flagKey: string, variants: FlagVariant[]): boolean {
  const flag = flags.get(flagKey);
  if (!flag || flag.type !== 'variant') return false;

  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  if (Math.abs(totalWeight - 100) > 0.01) return false; // weights must sum to 100

  flag.variants = variants;
  flag.updatedAt = Date.now();
  return true;
}

export function recordAbImpression(flagKey: string, variantKey: string): void {
  if (!abTestImpressions.has(flagKey)) {
    abTestImpressions.set(flagKey, new Map());
  }
  const variants = abTestImpressions.get(flagKey)!;
  if (!variants.has(variantKey)) {
    variants.set(variantKey, { impressions: 0, conversions: 0 });
  }
  variants.get(variantKey)!.impressions += 1;
}

export function recordAbConversion(flagKey: string, variantKey: string): void {
  const variants = abTestImpressions.get(flagKey);
  if (!variants || !variants.has(variantKey)) return;
  variants.get(variantKey)!.conversions += 1;
}

export function getAbTestResults(flagKey: string): ABTestResult | null {
  const flag = flags.get(flagKey);
  if (!flag || flag.type !== 'variant') return null;

  const impressionData = abTestImpressions.get(flagKey);
  let totalImpressions = 0;

  const variants = flag.variants.map(v => {
    const data = impressionData?.get(v.key) || { impressions: 0, conversions: 0 };
    totalImpressions += data.impressions;
    return {
      key: v.key,
      name: v.name,
      impressions: data.impressions,
      conversions: data.conversions,
      conversionRate: data.impressions > 0
        ? Math.round((data.conversions / data.impressions) * 10000) / 100
        : 0,
      weight: v.weight,
    };
  });

  const isSignificant = totalImpressions > 100;
  const sortedByRate = [...variants].sort((a, b) => b.conversionRate - a.conversionRate);
  const winningVariant = isSignificant && sortedByRate.length > 0 ? sortedByRate[0].key : null;

  return {
    flagKey,
    variants,
    totalImpressions,
    startedAt: flag.createdAt,
    isSignificant,
    winningVariant,
  };
}

// ─── Flag Evaluation (SDK-compatible) ─────────────────────────────

export function evaluateFlag(
  flagKey: string,
  context: {
    tenantId: string;
    tier: TenantTier;
    userId?: string;
  },
): FlagEvaluation {
  const flag = flags.get(flagKey);
  const base: Omit<FlagEvaluation, 'enabled' | 'variant' | 'reason'> = {
    flagKey,
    flagType: flag?.type || 'boolean',
    evaluatedAt: Date.now(),
  };

  // Flag doesn't exist
  if (!flag) {
    return { ...base, enabled: false, variant: null, reason: 'disabled', flagType: 'boolean' };
  }

  // Global kill switch
  if (!flag.enabled) {
    return { ...base, enabled: false, variant: null, reason: 'disabled' };
  }

  // Check dependencies
  for (const dep of flag.dependencies) {
    const depResult = evaluateFlag(dep, context);
    if (!depResult.enabled) {
      return { ...base, enabled: false, variant: null, reason: 'dependency_missing' };
    }
  }

  // Check tenant override
  const override = flag.tenantOverrides.get(context.tenantId);
  if (override) {
    // Check expiration
    if (override.expiresAt && Date.now() > override.expiresAt) {
      flag.tenantOverrides.delete(context.tenantId);
    } else {
      if (flag.type === 'variant' && override.enabled) {
        const variant = selectVariant(flag, context.tenantId);
        return { ...base, enabled: true, variant, reason: 'override' };
      }
      return { ...base, enabled: override.enabled, variant: null, reason: 'override' };
    }
  }

  // Type-specific evaluation
  switch (flag.type) {
    case 'boolean': {
      const tierDefault = flag.tierDefaults[context.tier];
      return { ...base, enabled: tierDefault, variant: null, reason: 'tier' };
    }

    case 'percentage': {
      const hash = simpleHash(`${flagKey}:${context.tenantId}`);
      const bucket = hash % 100;
      const enabled = bucket < flag.percentage;
      return { ...base, enabled, variant: null, reason: 'percentage' };
    }

    case 'user_based': {
      const enabled = context.userId
        ? flag.allowedUserIds.includes(context.userId)
        : false;
      return { ...base, enabled, variant: null, reason: 'user' };
    }

    case 'variant': {
      const tierDefault = flag.tierDefaults[context.tier];
      if (!tierDefault) {
        return { ...base, enabled: false, variant: null, reason: 'tier' };
      }
      const variant = selectVariant(flag, context.tenantId);
      return { ...base, enabled: true, variant, reason: 'tier' };
    }

    default:
      return { ...base, enabled: flag.defaultValue, variant: null, reason: 'default' };
  }
}

export function evaluateAllFlags(
  context: { tenantId: string; tier: TenantTier; userId?: string },
): Record<string, FlagEvaluation> {
  const results: Record<string, FlagEvaluation> = {};
  for (const [key] of flags) {
    results[key] = evaluateFlag(key, context);
  }
  return results;
}

function selectVariant(flag: FeatureFlag, seed: string): string | null {
  if (flag.variants.length === 0) return null;

  const hash = simpleHash(`${flag.key}:${seed}:variant`);
  const bucket = hash % 100;
  let cumulative = 0;

  for (const variant of flag.variants) {
    cumulative += variant.weight;
    if (bucket < cumulative) return variant.key;
  }

  return flag.variants[flag.variants.length - 1].key;
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// ─── Dashboard Data ───────────────────────────────────────────────

export function getDashboardData(): FlagDashboardData {
  const allFlags = Array.from(flags.values());

  const flagsByType: Record<FlagType, number> = { boolean: 0, percentage: 0, user_based: 0, variant: 0 };
  allFlags.forEach(f => { flagsByType[f.type] += 1; });

  const tagCounts = new Map<string, number>();
  allFlags.forEach(f => f.tags.forEach(t => {
    tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
  }));

  const activeTests = allFlags
    .filter(f => f.type === 'variant' && f.enabled)
    .map(f => getAbTestResults(f.key))
    .filter((r): r is ABTestResult => r !== null);

  return {
    totalFlags: allFlags.length,
    enabledFlags: allFlags.filter(f => f.enabled).length,
    disabledFlags: allFlags.filter(f => !f.enabled).length,
    flagsByType,
    recentChanges: auditLog.slice(-20).reverse(),
    activeTests,
    flagsByTag: Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count),
  };
}

// ─── Audit Trail ──────────────────────────────────────────────────

function addAuditEntry(entry: Omit<FlagAuditEntry, 'id' | 'timestamp'>): void {
  auditLog.push({
    ...entry,
    id: `faudit_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: Date.now(),
  });
  if (auditLog.length > 10_000) {
    auditLog.splice(0, auditLog.length - 10_000);
  }
}

export function getFlagAuditLog(
  filter?: { flagKey?: string; tenantId?: string; action?: string; limit?: number },
): FlagAuditEntry[] {
  let logs = [...auditLog];
  if (filter?.flagKey) logs = logs.filter(l => l.flagKey === filter.flagKey);
  if (filter?.tenantId) logs = logs.filter(l => l.tenantId === filter.tenantId);
  if (filter?.action) logs = logs.filter(l => l.action === filter.action);
  return logs.sort((a, b) => b.timestamp - a.timestamp).slice(0, filter?.limit || 100);
}

// ─── Default Flags ────────────────────────────────────────────────

const DEFAULT_FLAGS = [
  { key: 'ai_intake_intelligence', name: 'AI Intake Intelligence', type: 'boolean' as FlagType, tags: ['ai', 'core'], tierDefaults: { starter: true, pro: true, enterprise: true } },
  { key: 'ai_treatment_recs', name: 'AI Treatment Recommendations', type: 'boolean' as FlagType, tags: ['ai', 'core'], tierDefaults: { starter: true, pro: true, enterprise: true } },
  { key: 'ai_consult_copilot', name: 'AI Consult Co-Pilot', type: 'boolean' as FlagType, tags: ['ai', 'premium'], tierDefaults: { starter: false, pro: true, enterprise: true } },
  { key: 'ai_phone_agent', name: 'AI Phone Agent', type: 'boolean' as FlagType, tags: ['ai', 'premium'], tierDefaults: { starter: false, pro: false, enterprise: true } },
  { key: 'churn_prediction', name: 'Churn Prediction Engine', type: 'boolean' as FlagType, tags: ['analytics', 'core'], tierDefaults: { starter: true, pro: true, enterprise: true } },
  { key: 'revenue_anomaly', name: 'Revenue Anomaly Detection', type: 'boolean' as FlagType, tags: ['analytics', 'premium'], tierDefaults: { starter: false, pro: true, enterprise: true } },
  { key: 'dynamic_pricing', name: 'Dynamic Pricing Engine', type: 'boolean' as FlagType, tags: ['analytics', 'premium'], tierDefaults: { starter: false, pro: true, enterprise: true } },
  { key: 'schedule_optimizer', name: 'Schedule Optimizer', type: 'boolean' as FlagType, tags: ['operations', 'core'], tierDefaults: { starter: true, pro: true, enterprise: true } },
  { key: 'inventory_auto_manager', name: 'Inventory Auto-Manager', type: 'boolean' as FlagType, tags: ['operations', 'premium'], tierDefaults: { starter: false, pro: true, enterprise: true } },
  { key: 'meta_ads_ai', name: 'Meta Ads AI Manager', type: 'boolean' as FlagType, tags: ['marketing', 'premium'], tierDefaults: { starter: false, pro: true, enterprise: true } },
  { key: 'social_auto_post', name: 'Social Media Auto-Post', type: 'boolean' as FlagType, tags: ['marketing', 'core'], tierDefaults: { starter: true, pro: true, enterprise: true } },
  { key: 'white_label', name: 'White Label Branding', type: 'boolean' as FlagType, tags: ['branding', 'enterprise'], tierDefaults: { starter: false, pro: false, enterprise: true } },
  { key: 'custom_domain', name: 'Custom Domain Support', type: 'boolean' as FlagType, tags: ['branding', 'enterprise'], tierDefaults: { starter: false, pro: false, enterprise: true } },
  { key: 'api_access', name: 'API Access', type: 'boolean' as FlagType, tags: ['developer', 'pro'], tierDefaults: { starter: false, pro: true, enterprise: true } },
  { key: 'webhook_integrations', name: 'Webhook Integrations', type: 'boolean' as FlagType, tags: ['developer', 'pro'], tierDefaults: { starter: false, pro: true, enterprise: true } },
  { key: 'marketplace_access', name: 'Plugin Marketplace', type: 'boolean' as FlagType, tags: ['marketplace', 'pro'], tierDefaults: { starter: false, pro: true, enterprise: true } },
  { key: 'advanced_analytics', name: 'Advanced Analytics', type: 'boolean' as FlagType, tags: ['analytics', 'premium'], tierDefaults: { starter: false, pro: true, enterprise: true } },
  { key: 'hipaa_compliance', name: 'HIPAA Compliance Pack', type: 'boolean' as FlagType, tags: ['compliance', 'enterprise'], tierDefaults: { starter: false, pro: false, enterprise: true } },
  { key: 'multi_location', name: 'Multi-Location Support', type: 'boolean' as FlagType, tags: ['operations', 'enterprise'], tierDefaults: { starter: false, pro: false, enterprise: true } },
  { key: 'rag_knowledge_base', name: 'RAG Knowledge Base', type: 'boolean' as FlagType, tags: ['ai', 'premium'], tierDefaults: { starter: false, pro: true, enterprise: true } },
  { key: 'new_dashboard_design', name: 'New Dashboard Design', type: 'percentage' as FlagType, tags: ['ui', 'experiment'] , tierDefaults: { starter: true, pro: true, enterprise: true } },
  { key: 'checkout_flow_v2', name: 'Checkout Flow v2', type: 'variant' as FlagType, tags: ['ui', 'experiment'], tierDefaults: { starter: true, pro: true, enterprise: true } },
];

export function initializeDefaultFlags(): void {
  DEFAULT_FLAGS.forEach(f => {
    if (!flags.has(f.key)) {
      createFlag({
        key: f.key,
        name: f.name,
        type: f.type,
        enabled: true,
        tierDefaults: f.tierDefaults,
        tags: f.tags,
        createdBy: 'system',
      });
    }
  });

  // Set up A/B test variants for checkout_flow_v2
  const checkoutFlag = flags.get('checkout_flow_v2');
  if (checkoutFlag && checkoutFlag.variants.length === 0) {
    addVariants('checkout_flow_v2', [
      { key: 'control', name: 'Current Checkout', weight: 50, payload: { layout: 'single_page' } },
      { key: 'multi_step', name: 'Multi-Step Checkout', weight: 25, payload: { layout: 'multi_step' } },
      { key: 'express', name: 'Express Checkout', weight: 25, payload: { layout: 'express' } },
    ]);
  }

  // Set percentage for new dashboard rollout
  const dashFlag = flags.get('new_dashboard_design');
  if (dashFlag) {
    dashFlag.percentage = 25; // 25% rollout
  }
}

// ─── Reset (for testing) ──────────────────────────────────────────

export function resetFlags(): void {
  flags.clear();
  auditLog.length = 0;
  abTestImpressions.clear();
}
