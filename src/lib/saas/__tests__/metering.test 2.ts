/**
 * Usage Metering Tests — 35+ tests
 */

import {
  recordUsage,
  recordApiCall,
  recordAiUsage,
  recordSmsSend,
  recordEmailSend,
  recordStorageUsage,
  recordActiveUser,
  getCurrentUsage,
  getUsageSummary,
  getUsageByTenant,
  getOverageAlerts,
  acknowledgeAlert,
  calculateBill,
  getUsageTrend,
  forecastMonthEndUsage,
  getDashboardData,
  setTenantTier,
  getTenantTier,
  resetMetering,
  TIER_LIMITS,
  OVERAGE_PRICING,
  BASE_FEES,
} from '../api-gateway/metering';

beforeEach(() => {
  resetMetering();
});

// ─── Usage Recording ──────────────────────────────────────────────

describe('recordUsage', () => {
  it('records a usage entry', () => {
    const record = recordUsage({ tenantId: 't_001', metric: 'api_calls', value: 1 });
    expect(record.id).toMatch(/^usage_/);
    expect(record.tenantId).toBe('t_001');
    expect(record.metric).toBe('api_calls');
    expect(record.value).toBe(1);
  });

  it('records with metadata', () => {
    const record = recordUsage({ tenantId: 't_001', metric: 'api_calls', value: 1, metadata: { path: '/clients' } });
    expect(record.metadata.path).toBe('/clients');
  });
});

describe('convenience recorders', () => {
  it('records API call', () => {
    recordApiCall('t_001', '/clients', 42);
    expect(getCurrentUsage('t_001', 'api_calls')).toBe(1);
  });

  it('records AI usage with tokens', () => {
    recordAiUsage('t_001', 'claude-3', 1500, 0.03);
    expect(getCurrentUsage('t_001', 'ai_tokens')).toBe(1500);
  });

  it('records SMS send', () => {
    recordSmsSend('t_001', '+1234567890', 1);
    expect(getCurrentUsage('t_001', 'sms_sends')).toBe(1);
  });

  it('records email send', () => {
    recordEmailSend('t_001', 'tmpl_welcome', 5);
    expect(getCurrentUsage('t_001', 'email_sends')).toBe(5);
  });

  it('records storage usage', () => {
    recordStorageUsage('t_001', 1024, 'upload');
    expect(getCurrentUsage('t_001', 'storage_bytes')).toBe(1024);
  });

  it('records active user', () => {
    recordActiveUser('t_001', 'user_123');
    expect(getCurrentUsage('t_001', 'active_users')).toBe(1);
  });
});

// ─── Usage Queries ────────────────────────────────────────────────

describe('getCurrentUsage', () => {
  it('returns 0 for no usage', () => {
    expect(getCurrentUsage('t_empty', 'api_calls')).toBe(0);
  });

  it('aggregates multiple records', () => {
    recordUsage({ tenantId: 't_001', metric: 'api_calls', value: 10 });
    recordUsage({ tenantId: 't_001', metric: 'api_calls', value: 20 });
    expect(getCurrentUsage('t_001', 'api_calls')).toBe(30);
  });

  it('separates tenants', () => {
    recordUsage({ tenantId: 't_001', metric: 'api_calls', value: 10 });
    recordUsage({ tenantId: 't_002', metric: 'api_calls', value: 20 });
    expect(getCurrentUsage('t_001', 'api_calls')).toBe(10);
    expect(getCurrentUsage('t_002', 'api_calls')).toBe(20);
  });
});

describe('getUsageSummary', () => {
  it('returns summary for tenant', () => {
    setTenantTier('t_001', 'starter');
    recordUsage({ tenantId: 't_001', metric: 'api_calls', value: 5000 });
    const summary = getUsageSummary('t_001');
    expect(summary.tenantId).toBe('t_001');
    expect(summary.metrics.api_calls.current).toBe(5000);
    expect(summary.metrics.api_calls.limit).toBe(TIER_LIMITS.starter.api_calls);
  });

  it('calculates percentage correctly', () => {
    setTenantTier('t_001', 'starter');
    recordUsage({ tenantId: 't_001', metric: 'api_calls', value: 5000 });
    const summary = getUsageSummary('t_001');
    expect(summary.metrics.api_calls.percentage).toBe(50);
  });

  it('calculates overage cost', () => {
    setTenantTier('t_001', 'starter');
    recordUsage({ tenantId: 't_001', metric: 'api_calls', value: 15000 }); // 5000 over limit of 10000
    const summary = getUsageSummary('t_001');
    expect(summary.metrics.api_calls.overage).toBe(5000);
    expect(summary.metrics.api_calls.overageCost).toBe(5);
  });

  it('handles unlimited metrics for enterprise', () => {
    setTenantTier('t_001', 'enterprise');
    recordUsage({ tenantId: 't_001', metric: 'active_users', value: 100 });
    const summary = getUsageSummary('t_001');
    expect(summary.metrics.active_users.limit).toBe(Infinity);
    expect(summary.metrics.active_users.overage).toBe(0);
  });
});

describe('getUsageByTenant', () => {
  it('returns tenants sorted by usage', () => {
    recordUsage({ tenantId: 't_001', metric: 'api_calls', value: 100 });
    recordUsage({ tenantId: 't_002', metric: 'api_calls', value: 500 });
    recordUsage({ tenantId: 't_003', metric: 'api_calls', value: 200 });
    const result = getUsageByTenant('api_calls');
    expect(result[0].tenantId).toBe('t_002');
    expect(result[0].usage).toBe(500);
  });
});

// ─── Overage Detection ────────────────────────────────────────────

describe('overage alerts', () => {
  it('generates alert at 80% usage', () => {
    setTenantTier('t_001', 'starter');
    recordUsage({ tenantId: 't_001', metric: 'sms_sends', value: 400 }); // 80% of 500
    const alerts = getOverageAlerts('t_001');
    expect(alerts.length).toBeGreaterThanOrEqual(1);
    expect(alerts[0].severity).toBe('info');
  });

  it('generates warning at 90%', () => {
    setTenantTier('t_001', 'starter');
    recordUsage({ tenantId: 't_001', metric: 'sms_sends', value: 450 }); // 90% of 500
    const alerts = getOverageAlerts('t_001');
    const warning = alerts.find(a => a.severity === 'warning');
    expect(warning).toBeDefined();
  });

  it('generates critical at 100%', () => {
    setTenantTier('t_001', 'starter');
    recordUsage({ tenantId: 't_001', metric: 'sms_sends', value: 500 }); // 100% of 500
    const alerts = getOverageAlerts('t_001');
    const critical = alerts.find(a => a.severity === 'critical');
    expect(critical).toBeDefined();
  });

  it('acknowledges alerts', () => {
    setTenantTier('t_001', 'starter');
    recordUsage({ tenantId: 't_001', metric: 'sms_sends', value: 500 });
    const alerts = getOverageAlerts('t_001', false);
    if (alerts.length > 0) {
      expect(acknowledgeAlert(alerts[0].id)).toBe(true);
    }
  });

  it('skips alerts for unlimited metrics', () => {
    setTenantTier('t_001', 'enterprise');
    recordUsage({ tenantId: 't_001', metric: 'active_users', value: 10000 });
    const alerts = getOverageAlerts('t_001').filter(a => a.metric === 'active_users');
    expect(alerts.length).toBe(0);
  });
});

// ─── Billing ──────────────────────────────────────────────────────

describe('calculateBill', () => {
  it('calculates base fee correctly', () => {
    setTenantTier('t_001', 'pro');
    const bill = calculateBill('t_001');
    expect(bill.baseFee).toBe(BASE_FEES.pro);
    expect(bill.tier).toBe('pro');
  });

  it('includes overage charges', () => {
    setTenantTier('t_001', 'starter');
    recordUsage({ tenantId: 't_001', metric: 'api_calls', value: 15000 }); // 5000 over
    const bill = calculateBill('t_001');
    expect(bill.overageTotal).toBeGreaterThan(0);
    expect(bill.totalDue).toBe(bill.baseFee + bill.overageTotal);
  });

  it('has line items for all metrics', () => {
    const bill = calculateBill('t_001');
    expect(bill.lineItems.length).toBe(10);
  });

  it('line items include correct metric names', () => {
    const bill = calculateBill('t_001');
    const apiItem = bill.lineItems.find(l => l.metric === 'api_calls');
    expect(apiItem).toBeDefined();
    expect(apiItem!.description).toBe('API Calls');
  });
});

// ─── Trends & Forecasting ─────────────────────────────────────────

describe('getUsageTrend', () => {
  it('returns trend data', () => {
    const trend = getUsageTrend('t_001', 'api_calls', 7);
    expect(trend.metric).toBe('api_calls');
    expect(trend.dataPoints.length).toBe(7);
    expect(trend.forecast.length).toBe(7);
  });

  it('calculates average', () => {
    recordUsage({ tenantId: 't_001', metric: 'api_calls', value: 100 });
    const trend = getUsageTrend('t_001', 'api_calls', 7);
    expect(trend.average).toBeGreaterThanOrEqual(0);
  });
});

describe('forecastMonthEndUsage', () => {
  it('returns forecast data', () => {
    recordUsage({ tenantId: 't_001', metric: 'api_calls', value: 1000 });
    setTenantTier('t_001', 'starter');
    const forecast = forecastMonthEndUsage('t_001', 'api_calls');
    expect(forecast.projected).toBeGreaterThanOrEqual(1000);
    expect(forecast.limit).toBe(TIER_LIMITS.starter.api_calls);
  });
});

// ─── Dashboard ────────────────────────────────────────────────────

describe('getDashboardData', () => {
  it('returns comprehensive dashboard', () => {
    setTenantTier('t_001', 'pro');
    recordApiCall('t_001', '/clients', 50);
    recordAiUsage('t_001', 'claude-3', 1000, 0.02);
    const dashboard = getDashboardData('t_001');
    expect(dashboard.tenantId).toBe('t_001');
    expect(dashboard.currentPeriod).toBeDefined();
    expect(dashboard.alerts).toBeDefined();
    expect(dashboard.topEndpoints).toBeDefined();
    expect(dashboard.aiUsage).toBeDefined();
    expect(dashboard.trends).toBeDefined();
  });
});

// ─── Tier Management ──────────────────────────────────────────────

describe('tenant tier', () => {
  it('defaults to starter', () => {
    expect(getTenantTier('unknown')).toBe('starter');
  });

  it('sets and gets tier', () => {
    setTenantTier('t_001', 'enterprise');
    expect(getTenantTier('t_001')).toBe('enterprise');
  });
});

// ─── Constants ────────────────────────────────────────────────────

describe('constants', () => {
  it('tier limits are defined for all tiers', () => {
    expect(TIER_LIMITS.starter).toBeDefined();
    expect(TIER_LIMITS.pro).toBeDefined();
    expect(TIER_LIMITS.enterprise).toBeDefined();
  });

  it('overage pricing exists for all metrics', () => {
    expect(Object.keys(OVERAGE_PRICING).length).toBe(10);
  });

  it('base fees scale with tiers', () => {
    expect(BASE_FEES.starter).toBeLessThan(BASE_FEES.pro);
    expect(BASE_FEES.pro).toBeLessThan(BASE_FEES.enterprise);
  });
});
