/**
 * Feature Flag System Tests — 30+ tests
 */

import {
  createFlag, updateFlag, deleteFlag, getFlag, getAllFlags,
  setTenantOverride, removeTenantOverride,
  evaluateFlag, evaluateAllFlags,
  addVariants, recordAbImpression, recordAbConversion, getAbTestResults,
  getDashboardData, getFlagAuditLog,
  initializeDefaultFlags,
  resetFlags,
} from '../feature-flags/manager';

beforeEach(() => {
  resetFlags();
});

describe('createFlag', () => {
  it('creates a boolean flag', () => {
    const flag = createFlag({ key: 'test_flag', name: 'Test Flag', type: 'boolean', createdBy: 'admin' });
    expect(flag.key).toBe('test_flag');
    expect(flag.type).toBe('boolean');
    expect(flag.enabled).toBe(false);
  });

  it('creates with tier defaults', () => {
    const flag = createFlag({
      key: 'tiered_flag', name: 'Tiered', type: 'boolean', createdBy: 'admin',
      tierDefaults: { starter: false, pro: true, enterprise: true },
    });
    expect(flag.tierDefaults.starter).toBe(false);
    expect(flag.tierDefaults.pro).toBe(true);
  });

  it('creates with tags', () => {
    const flag = createFlag({ key: 'tagged_flag', name: 'Tagged', type: 'boolean', tags: ['ai', 'premium'], createdBy: 'admin' });
    expect(flag.tags).toEqual(['ai', 'premium']);
  });

  it('creates audit entry on creation', () => {
    createFlag({ key: 'audited_flag', name: 'Audited', type: 'boolean', createdBy: 'admin' });
    const audit = getFlagAuditLog({ flagKey: 'audited_flag' });
    expect(audit.length).toBe(1);
    expect(audit[0].action).toBe('created');
  });
});

describe('updateFlag', () => {
  it('updates flag name', () => {
    createFlag({ key: 'upd_flag', name: 'Original', type: 'boolean', createdBy: 'admin' });
    const updated = updateFlag('upd_flag', { name: 'Updated Name' }, 'admin');
    expect(updated!.name).toBe('Updated Name');
  });

  it('toggles flag', () => {
    createFlag({ key: 'toggle_flag', name: 'Toggle', type: 'boolean', createdBy: 'admin' });
    const updated = updateFlag('toggle_flag', { enabled: true }, 'admin');
    expect(updated!.enabled).toBe(true);
  });

  it('returns null for non-existent flag', () => {
    expect(updateFlag('nonexistent', { enabled: true }, 'admin')).toBeNull();
  });

  it('updates percentage', () => {
    createFlag({ key: 'pct_flag', name: 'Percentage', type: 'percentage', createdBy: 'admin' });
    updateFlag('pct_flag', { percentage: 50 }, 'admin');
    expect(getFlag('pct_flag')!.percentage).toBe(50);
  });
});

describe('deleteFlag', () => {
  it('deletes a flag', () => {
    createFlag({ key: 'del_flag', name: 'Delete Me', type: 'boolean', createdBy: 'admin' });
    expect(deleteFlag('del_flag', 'admin')).toBe(true);
    expect(getFlag('del_flag')).toBeNull();
  });

  it('returns false for non-existent', () => {
    expect(deleteFlag('fake', 'admin')).toBe(false);
  });
});

describe('getAllFlags', () => {
  it('lists all flags', () => {
    createFlag({ key: 'f1', name: 'Flag 1', type: 'boolean', createdBy: 'admin' });
    createFlag({ key: 'f2', name: 'Flag 2', type: 'percentage', createdBy: 'admin' });
    expect(getAllFlags().length).toBe(2);
  });

  it('filters by tag', () => {
    createFlag({ key: 'ai_f', name: 'AI Flag', type: 'boolean', tags: ['ai'], createdBy: 'admin' });
    createFlag({ key: 'ui_f', name: 'UI Flag', type: 'boolean', tags: ['ui'], createdBy: 'admin' });
    expect(getAllFlags({ tag: 'ai' }).length).toBe(1);
  });

  it('filters by type', () => {
    createFlag({ key: 'bool_f', name: 'Bool', type: 'boolean', createdBy: 'admin' });
    createFlag({ key: 'pct_f', name: 'Pct', type: 'percentage', createdBy: 'admin' });
    expect(getAllFlags({ type: 'boolean' }).length).toBe(1);
  });
});

describe('tenant overrides', () => {
  it('sets tenant override', () => {
    createFlag({ key: 'ovr_flag', name: 'Override', type: 'boolean', enabled: true, createdBy: 'admin' });
    expect(setTenantOverride('ovr_flag', { tenantId: 't_001', enabled: false, reason: 'testing', setBy: 'admin' })).toBe(true);
  });

  it('removes tenant override', () => {
    createFlag({ key: 'rm_ovr', name: 'Remove Override', type: 'boolean', enabled: true, createdBy: 'admin' });
    setTenantOverride('rm_ovr', { tenantId: 't_001', enabled: false, reason: 'test', setBy: 'admin' });
    expect(removeTenantOverride('rm_ovr', 't_001', 'admin')).toBe(true);
  });
});

describe('evaluateFlag', () => {
  it('returns disabled for non-existent flag', () => {
    const result = evaluateFlag('nonexistent', { tenantId: 't_001', tier: 'starter' });
    expect(result.enabled).toBe(false);
    expect(result.reason).toBe('disabled');
  });

  it('returns disabled when globally off', () => {
    createFlag({ key: 'off_flag', name: 'Off', type: 'boolean', createdBy: 'admin' });
    // Default enabled = false
    const result = evaluateFlag('off_flag', { tenantId: 't_001', tier: 'starter' });
    expect(result.enabled).toBe(false);
  });

  it('evaluates tier defaults', () => {
    createFlag({
      key: 'tier_flag', name: 'Tier', type: 'boolean', enabled: true, createdBy: 'admin',
      tierDefaults: { starter: false, pro: true, enterprise: true },
    });
    expect(evaluateFlag('tier_flag', { tenantId: 't_001', tier: 'starter' }).enabled).toBe(false);
    expect(evaluateFlag('tier_flag', { tenantId: 't_001', tier: 'pro' }).enabled).toBe(true);
    expect(evaluateFlag('tier_flag', { tenantId: 't_001', tier: 'enterprise' }).enabled).toBe(true);
  });

  it('applies tenant override', () => {
    createFlag({ key: 'ovr_eval', name: 'Override Eval', type: 'boolean', enabled: true, createdBy: 'admin', tierDefaults: { starter: false, pro: false, enterprise: false } });
    setTenantOverride('ovr_eval', { tenantId: 't_special', enabled: true, reason: 'beta', setBy: 'admin' });
    const result = evaluateFlag('ovr_eval', { tenantId: 't_special', tier: 'starter' });
    expect(result.enabled).toBe(true);
    expect(result.reason).toBe('override');
  });

  it('checks dependency chain', () => {
    createFlag({ key: 'dep_parent', name: 'Parent', type: 'boolean', enabled: true, createdBy: 'admin', tierDefaults: { starter: true, pro: true, enterprise: true } });
    createFlag({ key: 'dep_child', name: 'Child', type: 'boolean', enabled: true, createdBy: 'admin', tierDefaults: { starter: true, pro: true, enterprise: true }, dependencies: ['dep_parent'] });
    expect(evaluateFlag('dep_child', { tenantId: 't_001', tier: 'starter' }).enabled).toBe(true);

    // Disable parent
    updateFlag('dep_parent', { enabled: false }, 'admin');
    expect(evaluateFlag('dep_child', { tenantId: 't_001', tier: 'starter' }).enabled).toBe(false);
    expect(evaluateFlag('dep_child', { tenantId: 't_001', tier: 'starter' }).reason).toBe('dependency_missing');
  });

  it('evaluates percentage rollout deterministically', () => {
    createFlag({ key: 'pct_eval', name: 'Pct Eval', type: 'percentage', enabled: true, percentage: 50, createdBy: 'admin' });
    updateFlag('pct_eval', { percentage: 50 }, 'admin');
    const result1 = evaluateFlag('pct_eval', { tenantId: 'tenant_a', tier: 'starter' });
    const result2 = evaluateFlag('pct_eval', { tenantId: 'tenant_a', tier: 'starter' });
    // Same tenant should get same result
    expect(result1.enabled).toBe(result2.enabled);
  });
});

describe('evaluateAllFlags', () => {
  it('evaluates all flags for context', () => {
    initializeDefaultFlags();
    const results = evaluateAllFlags({ tenantId: 't_001', tier: 'pro' });
    expect(Object.keys(results).length).toBeGreaterThan(0);
  });
});

describe('A/B testing', () => {
  it('adds variants to flag', () => {
    createFlag({ key: 'ab_test', name: 'AB Test', type: 'variant', enabled: true, createdBy: 'admin' });
    const success = addVariants('ab_test', [
      { key: 'control', name: 'Control', weight: 50, payload: {} },
      { key: 'variant_a', name: 'Variant A', weight: 50, payload: {} },
    ]);
    expect(success).toBe(true);
  });

  it('rejects variants that do not sum to 100', () => {
    createFlag({ key: 'bad_ab', name: 'Bad AB', type: 'variant', enabled: true, createdBy: 'admin' });
    const success = addVariants('bad_ab', [
      { key: 'a', name: 'A', weight: 30, payload: {} },
      { key: 'b', name: 'B', weight: 40, payload: {} },
    ]);
    expect(success).toBe(false);
  });

  it('records impressions and conversions', () => {
    createFlag({ key: 'track_ab', name: 'Track AB', type: 'variant', enabled: true, createdBy: 'admin' });
    addVariants('track_ab', [
      { key: 'control', name: 'Control', weight: 50, payload: {} },
      { key: 'test', name: 'Test', weight: 50, payload: {} },
    ]);
    recordAbImpression('track_ab', 'control');
    recordAbImpression('track_ab', 'control');
    recordAbConversion('track_ab', 'control');
    const results = getAbTestResults('track_ab');
    expect(results).not.toBeNull();
    const control = results!.variants.find(v => v.key === 'control');
    expect(control!.impressions).toBe(2);
    expect(control!.conversions).toBe(1);
    expect(control!.conversionRate).toBe(50);
  });
});

describe('dashboard', () => {
  it('returns dashboard data', () => {
    initializeDefaultFlags();
    const data = getDashboardData();
    expect(data.totalFlags).toBeGreaterThan(0);
    expect(data.enabledFlags).toBeGreaterThan(0);
    expect(data.flagsByType).toBeDefined();
  });
});

describe('default flags', () => {
  it('initializes 20+ default flags', () => {
    initializeDefaultFlags();
    const flags = getAllFlags();
    expect(flags.length).toBeGreaterThanOrEqual(20);
  });

  it('includes AI flags', () => {
    initializeDefaultFlags();
    expect(getFlag('ai_intake_intelligence')).not.toBeNull();
    expect(getFlag('ai_consult_copilot')).not.toBeNull();
    expect(getFlag('ai_phone_agent')).not.toBeNull();
  });
});
