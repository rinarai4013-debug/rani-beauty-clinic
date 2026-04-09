type Tier = 'starter' | 'pro' | 'professional' | 'enterprise';
type FlagType = 'boolean' | 'percentage' | 'variant';

type Variant = {
  key: string;
  name: string;
  weight: number;
  payload: Record<string, unknown>;
  impressions: number;
  conversions: number;
  conversionRate: number;
};

type TenantOverride = {
  tenantId: string;
  enabled: boolean;
  reason: string;
  setBy: string;
  setAt: number;
};

type Flag = {
  key: string;
  name: string;
  type: FlagType;
  enabled: boolean;
  percentage: number;
  tierDefaults: Record<Tier, boolean>;
  tags: string[];
  dependencies: string[];
  variants: Variant[];
  createdBy: string;
  createdAt: number;
  updatedAt: number;
};

type AuditEntry = {
  flagKey: string;
  action: string;
  actor: string;
  timestamp: number;
  details?: Record<string, unknown>;
};

const flags = new Map<string, Flag>();
const overrides = new Map<string, Map<string, TenantOverride>>();
const auditLog: AuditEntry[] = [];

function makeTierDefaults(input?: Partial<Record<Tier, boolean>>) {
  return {
    starter: input?.starter ?? false,
    pro: input?.pro ?? false,
    professional: input?.professional ?? input?.pro ?? false,
    enterprise: input?.enterprise ?? false,
  };
}

function log(flagKey: string, action: string, actor: string, details?: Record<string, unknown>) {
  auditLog.push({ flagKey, action, actor, timestamp: Date.now(), details });
}

export function resetFlags() {
  flags.clear();
  overrides.clear();
  auditLog.length = 0;
}

export function createFlag(input: {
  key: string;
  name: string;
  type: FlagType;
  createdBy: string;
  enabled?: boolean;
  percentage?: number;
  tierDefaults?: Partial<Record<Tier, boolean>>;
  tags?: string[];
  dependencies?: string[];
}) {
  const flag: Flag = {
    key: input.key,
    name: input.name,
    type: input.type,
    enabled: input.enabled ?? false,
    percentage: input.percentage ?? 0,
    tierDefaults: makeTierDefaults(input.tierDefaults),
    tags: input.tags ?? [],
    dependencies: input.dependencies ?? [],
    variants: [],
    createdBy: input.createdBy,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  flags.set(flag.key, flag);
  log(flag.key, 'created', input.createdBy);
  return flag;
}

export function updateFlag(key: string, updates: Partial<Omit<Flag, 'key' | 'createdBy' | 'createdAt'>>, actor: string) {
  const existing = flags.get(key);
  if (!existing) return null;
  const updated: Flag = {
    ...existing,
    ...updates,
    tierDefaults: updates.tierDefaults ? makeTierDefaults(updates.tierDefaults) : existing.tierDefaults,
    updatedAt: Date.now(),
  };
  flags.set(key, updated);
  log(key, 'updated', actor, updates as Record<string, unknown>);
  return updated;
}

export function deleteFlag(key: string, actor: string) {
  const deleted = flags.delete(key);
  overrides.delete(key);
  if (deleted) log(key, 'deleted', actor);
  return deleted;
}

export function getFlag(key: string) {
  return flags.get(key) ?? null;
}

export function getAllFlags(filters?: { tag?: string; type?: FlagType }) {
  return [...flags.values()].filter((flag) => {
    if (filters?.tag && !flag.tags.includes(filters.tag)) return false;
    if (filters?.type && flag.type !== filters.type) return false;
    return true;
  });
}

export function setTenantOverride(
  key: string,
  input: { tenantId: string; enabled: boolean; reason: string; setBy: string }
) {
  if (!flags.has(key)) return false;
  const byTenant = overrides.get(key) ?? new Map<string, TenantOverride>();
  byTenant.set(input.tenantId, {
    tenantId: input.tenantId,
    enabled: input.enabled,
    reason: input.reason,
    setBy: input.setBy,
    setAt: Date.now(),
  });
  overrides.set(key, byTenant);
  log(key, 'override_set', input.setBy, { tenantId: input.tenantId, enabled: input.enabled });
  return true;
}

export function removeTenantOverride(key: string, tenantId: string, actor: string) {
  const byTenant = overrides.get(key);
  if (!byTenant?.has(tenantId)) return false;
  byTenant.delete(tenantId);
  log(key, 'override_removed', actor, { tenantId });
  return true;
}

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function evaluateFlag(key: string, context: { tenantId: string; tier: Tier }) {
  const flag = flags.get(key);
  if (!flag) return { enabled: false, reason: 'disabled' as const };

  for (const dependency of flag.dependencies) {
    const depResult = evaluateFlag(dependency, context);
    if (!depResult.enabled) {
      return { enabled: false, reason: 'dependency_missing' as const };
    }
  }

  const override = overrides.get(key)?.get(context.tenantId);
  if (override) {
    return { enabled: override.enabled, reason: 'override' as const };
  }

  if (!flag.enabled) {
    return { enabled: false, reason: 'disabled' as const };
  }

  const tierEnabled = flag.tierDefaults[context.tier === 'professional' ? 'professional' : context.tier] ?? false;
  if (!tierEnabled) {
    return { enabled: false, reason: 'tier' as const };
  }

  if (flag.type === 'percentage') {
    const bucket = hashString(`${context.tenantId}:${key}`) % 100;
    return { enabled: bucket < flag.percentage, reason: 'percentage' as const };
  }

  return { enabled: true, reason: 'enabled' as const };
}

export function evaluateAllFlags(context: { tenantId: string; tier: Tier }) {
  return Object.fromEntries(
    [...flags.keys()].map((key) => [key, evaluateFlag(key, context)])
  );
}

export function addVariants(key: string, variantsInput: Array<{ key: string; name: string; weight: number; payload: Record<string, unknown> }>) {
  const flag = flags.get(key);
  if (!flag) return false;
  const totalWeight = variantsInput.reduce((sum, variant) => sum + variant.weight, 0);
  if (totalWeight !== 100) return false;
  flag.variants = variantsInput.map((variant) => ({
    ...variant,
    impressions: 0,
    conversions: 0,
    conversionRate: 0,
  }));
  flag.type = 'variant';
  flag.updatedAt = Date.now();
  return true;
}

export function recordAbImpression(key: string, variantKey: string) {
  const variant = flags.get(key)?.variants.find((entry) => entry.key === variantKey);
  if (!variant) return false;
  variant.impressions += 1;
  variant.conversionRate = variant.impressions === 0 ? 0 : (variant.conversions / variant.impressions) * 100;
  return true;
}

export function recordAbConversion(key: string, variantKey: string) {
  const variant = flags.get(key)?.variants.find((entry) => entry.key === variantKey);
  if (!variant) return false;
  variant.conversions += 1;
  variant.conversionRate = variant.impressions === 0 ? 0 : (variant.conversions / variant.impressions) * 100;
  return true;
}

export function getAbTestResults(key: string) {
  const flag = flags.get(key);
  if (!flag) return null;
  return { variants: flag.variants };
}

export function getDashboardData() {
  const all = [...flags.values()];
  return {
    totalFlags: all.length,
    enabledFlags: all.filter((flag) => flag.enabled).length,
    flagsByType: all.reduce<Record<string, number>>((acc, flag) => {
      acc[flag.type] = (acc[flag.type] ?? 0) + 1;
      return acc;
    }, {}),
  };
}

export function getFlagAuditLog(filters?: { flagKey?: string }) {
  if (!filters?.flagKey) return [...auditLog];
  return auditLog.filter((entry) => entry.flagKey === filters.flagKey);
}

export function initializeDefaultFlags() {
  if (flags.size > 0) return getAllFlags();

  const defaults = [
    'ai_intake_intelligence',
    'ai_consult_copilot',
    'ai_phone_agent',
    'ai_reactivation_ranker',
    'pricing_optimization',
    'pnl_briefing',
    'schedule_optimizer',
    'inventory_guardrails',
    'social_copilot',
    'meta_ads_optimizer',
    'consult_command_center',
    'rag_knowledge_base',
    'gamification_engine',
    'template_library',
    'plaid_finance_sync',
    'white_label_branding',
    'booking_source_attribution',
    'provider_fill_pressure',
    'retention_signals',
    'executive_daily_email',
    'daily_ceo_briefing',
    'membership_save_engine',
  ];

  defaults.forEach((key, index) => {
    createFlag({
      key,
      name: key.replace(/_/g, ' '),
      type: index % 5 === 0 ? 'percentage' : 'boolean',
      createdBy: 'system',
      enabled: true,
      percentage: index % 5 === 0 ? 50 : 0,
      tags: key.startsWith('ai_') ? ['ai'] : ['core'],
      tierDefaults: {
        starter: ['template_library', 'booking_source_attribution', 'executive_daily_email'].includes(key),
        pro: true,
        professional: true,
        enterprise: true,
      },
    });
  });

  return getAllFlags();
}
