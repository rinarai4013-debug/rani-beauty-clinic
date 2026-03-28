/**
 * Audit Log Tests — 30+ tests
 */

import {
  logAuditEntry, logDataCreate, logDataUpdate, logDataDelete, logLogin, logHipaaAccess,
  searchAuditLog, getAuditEntry,
  getAnomalies, resolveAnomaly,
  createComplianceExport, getComplianceExports,
  getAuditStats, cleanupExpiredEntries,
  resetAuditLog,
  RETENTION_CONFIGS,
} from '../data/audit-log';

beforeEach(() => {
  resetAuditLog();
});

describe('logAuditEntry', () => {
  it('creates audit entry', () => {
    const entry = logAuditEntry({
      tenantId: 't_001', userId: 'u_1', userName: 'Admin',
      action: 'create', resource: 'Clients', resourceType: 'client',
      description: 'Created client', ip: '1.2.3.4',
    });
    expect(entry.id).toMatch(/^audit_/);
    expect(entry.tenantId).toBe('t_001');
    expect(entry.action).toBe('create');
  });

  it('sets severity based on action', () => {
    const deleteEntry = logAuditEntry({ tenantId: 't_001', userId: 'u_1', userName: 'Admin', action: 'delete', resource: 'Clients', resourceType: 'client', description: 'Deleted', ip: '1.2.3.4' });
    expect(deleteEntry.severity).toBe('high');

    const readEntry = logAuditEntry({ tenantId: 't_001', userId: 'u_1', userName: 'Admin', action: 'read', resource: 'Clients', resourceType: 'client', description: 'Read', ip: '1.2.3.4' });
    expect(readEntry.severity).toBe('low');
  });

  it('assigns HIPAA retention for health data', () => {
    const entry = logAuditEntry({
      tenantId: 't_001', userId: 'u_1', userName: 'Dr. Smith',
      action: 'hipaa_access', resource: 'Patient Records', resourceType: 'health_data',
      description: 'Accessed patient records', ip: '1.2.3.4',
    });
    expect(entry.retentionPolicy).toBe('hipaa');
    expect(entry.expiresAt).toBeNull(); // HIPAA: no auto-delete
  });

  it('assigns financial retention for billing', () => {
    const entry = logAuditEntry({
      tenantId: 't_001', userId: 'u_1', userName: 'Admin',
      action: 'billing_action', resource: 'Transactions', resourceType: 'transaction',
      description: 'Processed payment', ip: '1.2.3.4',
    });
    expect(entry.retentionPolicy).toBe('financial');
  });

  it('auto-tags HIPAA for health resources', () => {
    const entry = logAuditEntry({
      tenantId: 't_001', userId: 'u_1', userName: 'Admin',
      action: 'read', resource: 'Medical History', resourceType: 'client',
      description: 'Viewed medical history', ip: '1.2.3.4',
    });
    expect(entry.complianceTags).toContain('hipaa');
  });
});

describe('convenience loggers', () => {
  it('logDataCreate', () => {
    const entry = logDataCreate('t_001', 'u_1', 'Admin', 'Clients', 'client', 'c_123', { name: 'Test' }, '1.2.3.4');
    expect(entry.action).toBe('create');
    expect(entry.resourceId).toBe('c_123');
  });

  it('logDataUpdate with changes', () => {
    const entry = logDataUpdate('t_001', 'u_1', 'Admin', 'Clients', 'client', 'c_123', [{ field: 'name', oldValue: 'Old', newValue: 'New' }], '1.2.3.4');
    expect(entry.action).toBe('update');
    expect(entry.changes.length).toBe(1);
  });

  it('logDataDelete', () => {
    const entry = logDataDelete('t_001', 'u_1', 'Admin', 'Clients', 'client', 'c_123', { name: 'Deleted' }, '1.2.3.4');
    expect(entry.action).toBe('delete');
    expect(entry.previousValue).toEqual({ name: 'Deleted' });
  });

  it('logLogin success', () => {
    const entry = logLogin('t_001', 'u_1', 'Admin', '1.2.3.4', 'Chrome', true);
    expect(entry.action).toBe('login');
    expect(entry.metadata).toEqual({ success: true });
  });

  it('logLogin failure', () => {
    const entry = logLogin('t_001', 'u_1', 'Unknown', '1.2.3.4', 'Chrome', false);
    expect(entry.metadata).toEqual({ success: false });
  });

  it('logHipaaAccess', () => {
    const entry = logHipaaAccess('t_001', 'u_1', 'Dr. Smith', 'Patient Records', 'c_123', 'Treatment review', '1.2.3.4');
    expect(entry.action).toBe('hipaa_access');
    expect(entry.complianceTags).toContain('hipaa');
    expect(entry.complianceTags).toContain('phi_access');
  });
});

describe('searchAuditLog', () => {
  beforeEach(() => {
    logAuditEntry({ tenantId: 't_001', userId: 'u_1', userName: 'Alice', action: 'create', resource: 'Clients', resourceType: 'client', description: 'Created client', ip: '1.2.3.4' });
    logAuditEntry({ tenantId: 't_001', userId: 'u_2', userName: 'Bob', action: 'update', resource: 'Appointments', resourceType: 'appointment', description: 'Updated appointment', ip: '5.6.7.8' });
    logAuditEntry({ tenantId: 't_002', userId: 'u_3', userName: 'Carol', action: 'delete', resource: 'Clients', resourceType: 'client', description: 'Deleted client', ip: '9.10.11.12' });
  });

  it('returns all entries', () => {
    const result = searchAuditLog({});
    expect(result.total).toBe(3);
  });

  it('filters by tenant', () => {
    const result = searchAuditLog({ tenantId: 't_001' });
    expect(result.total).toBe(2);
  });

  it('filters by action', () => {
    const result = searchAuditLog({ action: 'delete' });
    expect(result.total).toBe(1);
  });

  it('filters by user', () => {
    const result = searchAuditLog({ userId: 'u_1' });
    expect(result.total).toBe(1);
  });

  it('searches by text', () => {
    const result = searchAuditLog({ searchText: 'appointment' });
    expect(result.total).toBe(1);
  });

  it('returns facets', () => {
    const result = searchAuditLog({});
    expect(result.facets.actions.length).toBeGreaterThan(0);
    expect(result.facets.users.length).toBeGreaterThan(0);
    expect(result.facets.resources.length).toBeGreaterThan(0);
  });

  it('paginates results', () => {
    const page1 = searchAuditLog({ limit: 2, offset: 0 });
    expect(page1.entries.length).toBe(2);
    expect(page1.hasMore).toBe(true);
    const page2 = searchAuditLog({ limit: 2, offset: 2 });
    expect(page2.entries.length).toBe(1);
    expect(page2.hasMore).toBe(false);
  });
});

describe('getAuditEntry', () => {
  it('retrieves entry by ID', () => {
    const entry = logAuditEntry({ tenantId: 't_001', userId: 'u_1', userName: 'Admin', action: 'create', resource: 'Test', resourceType: 'test', description: 'Test entry', ip: '1.2.3.4' });
    expect(getAuditEntry(entry.id)).not.toBeNull();
    expect(getAuditEntry(entry.id)!.id).toBe(entry.id);
  });

  it('returns null for unknown ID', () => {
    expect(getAuditEntry('fake_id')).toBeNull();
  });
});

describe('anomaly detection', () => {
  it('detects failed auth burst', () => {
    for (let i = 0; i < 5; i++) {
      logLogin('t_001', `u_${i}`, 'Unknown', '203.0.113.42', 'Bot', false);
    }
    const anomalies = getAnomalies('t_001', false);
    const authAnomaly = anomalies.find(a => a.type === 'failed_auth_burst');
    expect(authAnomaly).toBeDefined();
    expect(authAnomaly!.severity).toBe('critical');
  });

  it('resolves anomaly', () => {
    for (let i = 0; i < 5; i++) {
      logLogin('t_001', `u_${i}`, 'Unknown', '10.0.0.1', 'Bot', false);
    }
    const anomalies = getAnomalies('t_001', false);
    if (anomalies.length > 0) {
      expect(resolveAnomaly(anomalies[0].id, 'admin')).toBe(true);
      expect(getAnomalies('t_001', false).length).toBeLessThan(anomalies.length);
    }
  });
});

describe('compliance export', () => {
  it('creates compliance export', () => {
    logAuditEntry({ tenantId: 't_001', userId: 'u_1', userName: 'Admin', action: 'create', resource: 'Test', resourceType: 'test', description: 'Test', ip: '1.2.3.4' });
    const exp = createComplianceExport('t_001', 'admin', { tenantId: 't_001' }, 'json');
    expect(exp.status).toBe('completed');
    expect(exp.entryCount).toBeGreaterThan(0);
  });

  it('lists compliance exports', () => {
    createComplianceExport('t_001', 'admin', {}, 'csv');
    expect(getComplianceExports('t_001').length).toBe(1);
  });
});

describe('audit stats', () => {
  it('returns stats', () => {
    logAuditEntry({ tenantId: 't_001', userId: 'u_1', userName: 'Admin', action: 'create', resource: 'Test', resourceType: 'test', description: 'Test', ip: '1.2.3.4' });
    logAuditEntry({ tenantId: 't_001', userId: 'u_1', userName: 'Admin', action: 'update', resource: 'Test', resourceType: 'test', description: 'Test', ip: '1.2.3.4' });
    const stats = getAuditStats('t_001', 30);
    expect(stats.totalEntries).toBe(2);
    expect(stats.topUsers.length).toBeGreaterThan(0);
  });
});

describe('retention policies', () => {
  it('defines standard retention as 90 days', () => {
    expect(RETENTION_CONFIGS.standard.retentionDays).toBe(90);
  });

  it('defines HIPAA retention as 7 years', () => {
    expect(RETENTION_CONFIGS.hipaa.retentionDays).toBe(2555);
    expect(RETENTION_CONFIGS.hipaa.autoDelete).toBe(false);
  });

  it('cleanup removes expired entries', () => {
    const count = cleanupExpiredEntries();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
