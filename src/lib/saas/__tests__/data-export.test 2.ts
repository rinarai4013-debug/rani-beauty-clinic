/**
 * Data Export/Import Tests — 30+ tests
 */

import {
  createExport, getExport, getExportHistory, generateExportData, getExportColumns, getAllExportScopes,
  createScheduledExport, getScheduledExports, toggleScheduledExport, deleteScheduledExport,
  createGdprRequest, verifyGdprRequest, processGdprRequest, getGdprRequests,
  createImport, updateImportMapping, validateImport, executeImport, getImport, getImportHistory,
  createDeletionRequest, confirmDeletion, getDeletionRequests,
  initializeMigrationWizard, advanceMigrationStep,
  resetDataExport, IMPORT_FIELD_MAPS,
} from '../data/export';

beforeEach(() => {
  resetDataExport();
});

describe('createExport', () => {
  it('creates an export job', () => {
    const exp = createExport({ tenantId: 't_001', requestedBy: 'admin', scope: ['clients'], format: 'csv' });
    expect(exp.id).toMatch(/^exp_/);
    expect(exp.status).toBe('completed'); // synchronous mock
    expect(exp.tenantId).toBe('t_001');
  });

  it('supports full export', () => {
    const exp = createExport({ tenantId: 't_001', requestedBy: 'admin', scope: ['full'], format: 'json' });
    expect(exp.recordCount).toBeGreaterThan(0);
    expect(exp.fileUrl).not.toBeNull();
  });

  it('sets expiration date', () => {
    const exp = createExport({ tenantId: 't_001', requestedBy: 'admin', scope: ['clients'], format: 'csv' });
    expect(exp.expiresAt).toBeGreaterThan(Date.now());
  });

  it('supports multiple scopes', () => {
    const exp = createExport({ tenantId: 't_001', requestedBy: 'admin', scope: ['clients', 'appointments', 'transactions'], format: 'csv' });
    expect(exp.recordCount).toBeGreaterThan(0);
  });
});

describe('getExport', () => {
  it('retrieves by ID', () => {
    const exp = createExport({ tenantId: 't_001', requestedBy: 'admin', scope: ['clients'], format: 'csv' });
    expect(getExport(exp.id)).not.toBeNull();
    expect(getExport(exp.id)!.id).toBe(exp.id);
  });

  it('returns null for unknown ID', () => {
    expect(getExport('fake_id')).toBeNull();
  });
});

describe('getExportHistory', () => {
  it('returns exports for tenant', () => {
    createExport({ tenantId: 't_001', requestedBy: 'admin', scope: ['clients'], format: 'csv' });
    createExport({ tenantId: 't_001', requestedBy: 'admin', scope: ['transactions'], format: 'json' });
    createExport({ tenantId: 't_002', requestedBy: 'admin', scope: ['clients'], format: 'csv' });
    expect(getExportHistory('t_001').length).toBe(2);
  });
});

describe('export columns', () => {
  it('returns columns for clients', () => {
    const cols = getExportColumns('clients');
    expect(cols).toContain('First Name');
    expect(cols).toContain('Email');
  });

  it('returns all export scopes', () => {
    const scopes = getAllExportScopes();
    expect(scopes.length).toBeGreaterThan(5);
  });

  it('generates export data structure', () => {
    const data = generateExportData('clients', 'csv');
    expect(data.columns.length).toBeGreaterThan(0);
    expect(data.format).toBe('csv');
  });
});

describe('scheduled exports', () => {
  it('creates a scheduled export', () => {
    const sched = createScheduledExport({
      tenantId: 't_001', scope: ['full'], format: 'json',
      frequency: 'weekly', hour: 6, timezone: 'America/Los_Angeles',
      destination: 'email', destinationConfig: { email: 'admin@clinic.com' },
    });
    expect(sched.id).toMatch(/^sched_/);
    expect(sched.enabled).toBe(true);
    expect(sched.nextRunAt).toBeGreaterThan(Date.now());
  });

  it('lists scheduled exports', () => {
    createScheduledExport({ tenantId: 't_001', scope: ['clients'], format: 'csv', frequency: 'daily', hour: 0, timezone: 'UTC', destination: 'download' });
    expect(getScheduledExports('t_001').length).toBe(1);
  });

  it('toggles schedule', () => {
    const sched = createScheduledExport({ tenantId: 't_001', scope: ['clients'], format: 'csv', frequency: 'daily', hour: 0, timezone: 'UTC', destination: 'download' });
    toggleScheduledExport(sched.id, false);
    expect(getScheduledExports('t_001')[0].enabled).toBe(false);
  });

  it('deletes schedule', () => {
    const sched = createScheduledExport({ tenantId: 't_001', scope: ['clients'], format: 'csv', frequency: 'daily', hour: 0, timezone: 'UTC', destination: 'download' });
    expect(deleteScheduledExport(sched.id)).toBe(true);
    expect(getScheduledExports('t_001').length).toBe(0);
  });
});

describe('GDPR requests', () => {
  it('creates a GDPR access request', () => {
    const req = createGdprRequest({
      tenantId: 't_001', requestType: 'access',
      subjectEmail: 'client@example.com', subjectName: 'Jane Doe',
      verificationMethod: 'email',
    });
    expect(req.id).toMatch(/^gdpr_/);
    expect(req.status).toBe('received');
    expect(req.deadline).toBeGreaterThan(Date.now());
  });

  it('verifies GDPR request', () => {
    const req = createGdprRequest({ tenantId: 't_001', requestType: 'access', subjectEmail: 'test@test.com', subjectName: 'Test', verificationMethod: 'email' });
    expect(verifyGdprRequest(req.id)).toBe(true);
  });

  it('processes verified GDPR request', () => {
    const req = createGdprRequest({ tenantId: 't_001', requestType: 'access', subjectEmail: 'test@test.com', subjectName: 'Test', verificationMethod: 'email' });
    verifyGdprRequest(req.id);
    const processed = processGdprRequest(req.id);
    expect(processed).not.toBeNull();
    expect(processed!.status).toBe('completed');
    expect(processed!.exportId).not.toBeNull();
  });

  it('rejects unverified processing', () => {
    const req = createGdprRequest({ tenantId: 't_001', requestType: 'access', subjectEmail: 'test@test.com', subjectName: 'Test', verificationMethod: 'email' });
    expect(processGdprRequest(req.id)).toBeNull();
  });

  it('lists GDPR requests', () => {
    createGdprRequest({ tenantId: 't_001', requestType: 'access', subjectEmail: 'a@test.com', subjectName: 'A', verificationMethod: 'email' });
    createGdprRequest({ tenantId: 't_001', requestType: 'erasure', subjectEmail: 'b@test.com', subjectName: 'B', verificationMethod: 'phone' });
    expect(getGdprRequests('t_001').length).toBe(2);
  });
});

describe('data import', () => {
  it('creates import from Zenoti', () => {
    const imp = createImport({ tenantId: 't_001', source: 'zenoti' });
    expect(imp.id).toMatch(/^imp_/);
    expect(imp.fieldMapping.length).toBeGreaterThan(0);
  });

  it('has field mappings for all sources', () => {
    expect(IMPORT_FIELD_MAPS.zenoti.length).toBeGreaterThan(0);
    expect(IMPORT_FIELD_MAPS.vagaro.length).toBeGreaterThan(0);
    expect(IMPORT_FIELD_MAPS.boulevard.length).toBeGreaterThan(0);
    expect(IMPORT_FIELD_MAPS.mindbody.length).toBeGreaterThan(0);
  });

  it('validates import', () => {
    const imp = createImport({ tenantId: 't_001', source: 'csv' });
    const errors = validateImport(imp.id);
    expect(Array.isArray(errors)).toBe(true);
  });

  it('executes import', () => {
    const imp = createImport({ tenantId: 't_001', source: 'zenoti' });
    const result = executeImport(imp.id);
    expect(result).not.toBeNull();
    expect(result!.status).toBe('completed');
    expect(result!.recordsImported).toBeGreaterThan(0);
  });

  it('lists import history', () => {
    createImport({ tenantId: 't_001', source: 'zenoti' });
    createImport({ tenantId: 't_001', source: 'vagaro' });
    expect(getImportHistory('t_001').length).toBe(2);
  });
});

describe('data deletion', () => {
  it('creates deletion request with confirmation code', () => {
    const req = createDeletionRequest('t_001', 'admin', 'client', ['client@test.com']);
    expect(req.confirmationCode.length).toBe(6);
    expect(req.status).toBe('pending');
  });

  it('confirms and processes deletion', () => {
    const req = createDeletionRequest('t_001', 'admin', 'client', ['client@test.com']);
    expect(confirmDeletion(req.id, req.confirmationCode)).toBe(true);
    expect(getDeletionRequests('t_001')[0].status).toBe('completed');
  });

  it('rejects wrong confirmation code', () => {
    const req = createDeletionRequest('t_001', 'admin', 'client', ['test@test.com']);
    expect(confirmDeletion(req.id, 'WRONG')).toBe(false);
  });
});

describe('migration wizard', () => {
  it('initializes wizard', () => {
    const state = initializeMigrationWizard('t_001', 'zenoti');
    expect(state.step).toBe('select_source');
    expect(state.importId).not.toBeNull();
    expect(state.mappingSuggestions.length).toBeGreaterThan(0);
  });

  it('advances steps', () => {
    const state = initializeMigrationWizard('t_001', 'vagaro');
    const next = advanceMigrationStep(state, 'upload_file');
    expect(next.step).toBe('upload_file');
  });
});
