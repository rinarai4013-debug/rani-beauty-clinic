/**
 * Audit Trail Engine
 * Immutable audit log for all PHI access, modifications, deletions
 * with user, timestamp, IP, action type.
 */

import type { AuditEntry, AuditAction } from '@/types/compliance';

// ── In-memory audit store (production: Airtable or dedicated DB) ────

let auditLog: AuditEntry[] = [];

export function getAuditLog(): AuditEntry[] {
  return [...auditLog].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

// ── Category mapping ─────────────────────────────────────────────────

const ACTION_CATEGORY_MAP: Record<AuditAction, AuditEntry['category']> = {
  phi_view: 'hipaa',
  phi_create: 'hipaa',
  phi_update: 'hipaa',
  phi_delete: 'hipaa',
  phi_export: 'hipaa',
  phi_print: 'hipaa',
  consent_sign: 'consent',
  consent_revoke: 'consent',
  substance_dispense: 'dea',
  substance_waste: 'dea',
  substance_reconcile: 'dea',
  device_maintenance: 'device',
  device_calibration: 'device',
  device_adverse_event: 'device',
  incident_report: 'incident',
  incident_update: 'incident',
  license_update: 'licensing',
  license_verify: 'licensing',
  policy_acknowledge: 'policy',
  policy_update: 'policy',
  training_complete: 'hipaa',
  breach_report: 'hipaa',
  breach_update: 'hipaa',
  login: 'auth',
  logout: 'auth',
  password_change: 'auth',
  baa_sign: 'hipaa',
  baa_update: 'hipaa',
  delegation_create: 'licensing',
  delegation_update: 'licensing',
};

const ACTION_SEVERITY_MAP: Record<AuditAction, AuditEntry['severity']> = {
  phi_view: 'info',
  phi_create: 'info',
  phi_update: 'warning',
  phi_delete: 'critical',
  phi_export: 'warning',
  phi_print: 'warning',
  consent_sign: 'info',
  consent_revoke: 'warning',
  substance_dispense: 'warning',
  substance_waste: 'warning',
  substance_reconcile: 'info',
  device_maintenance: 'info',
  device_calibration: 'info',
  device_adverse_event: 'critical',
  incident_report: 'critical',
  incident_update: 'warning',
  license_update: 'info',
  license_verify: 'info',
  policy_acknowledge: 'info',
  policy_update: 'warning',
  training_complete: 'info',
  breach_report: 'critical',
  breach_update: 'critical',
  login: 'info',
  logout: 'info',
  password_change: 'warning',
  baa_sign: 'info',
  baa_update: 'warning',
  delegation_create: 'warning',
  delegation_update: 'warning',
};

// ── Create audit entry ───────────────────────────────────────────────

export interface CreateAuditParams {
  userId: string;
  userName: string;
  userRole: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  details: string;
  ipAddress: string;
  userAgent?: string;
  previousValue?: string;
  newValue?: string;
}

export function createAuditEntry(params: CreateAuditParams): AuditEntry {
  const entry: AuditEntry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString(),
    userId: params.userId,
    userName: params.userName,
    userRole: params.userRole,
    action: params.action,
    category: ACTION_CATEGORY_MAP[params.action],
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    details: params.details,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    previousValue: params.previousValue,
    newValue: params.newValue,
    severity: ACTION_SEVERITY_MAP[params.action],
  };

  // Immutable append - never modify existing entries
  auditLog = [...auditLog, Object.freeze(entry)];

  return entry;
}

// ── Query helpers ────────────────────────────────────────────────────

export interface AuditQueryParams {
  userId?: string;
  action?: AuditAction;
  category?: AuditEntry['category'];
  severity?: AuditEntry['severity'];
  resourceId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export function queryAuditLog(params: AuditQueryParams): {
  entries: AuditEntry[];
  total: number;
  hasMore: boolean;
} {
  let filtered = getAuditLog();

  if (params.userId) {
    filtered = filtered.filter((e) => e.userId === params.userId);
  }
  if (params.action) {
    filtered = filtered.filter((e) => e.action === params.action);
  }
  if (params.category) {
    filtered = filtered.filter((e) => e.category === params.category);
  }
  if (params.severity) {
    filtered = filtered.filter((e) => e.severity === params.severity);
  }
  if (params.resourceId) {
    filtered = filtered.filter((e) => e.resourceId === params.resourceId);
  }
  if (params.startDate) {
    const start = new Date(params.startDate).getTime();
    filtered = filtered.filter((e) => new Date(e.timestamp).getTime() >= start);
  }
  if (params.endDate) {
    const end = new Date(params.endDate).getTime();
    filtered = filtered.filter((e) => new Date(e.timestamp).getTime() <= end);
  }
  if (params.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.details.toLowerCase().includes(q) ||
        e.userName.toLowerCase().includes(q) ||
        e.resourceType.toLowerCase().includes(q)
    );
  }

  const total = filtered.length;
  const offset = params.offset || 0;
  const limit = params.limit || 50;
  const entries = filtered.slice(offset, offset + limit);

  return {
    entries,
    total,
    hasMore: offset + limit < total,
  };
}

// ── Export for reporting ──────────────────────────────────────────────

export function exportAuditLog(
  params: AuditQueryParams
): { headers: string[]; rows: string[][] } {
  const { entries } = queryAuditLog({ ...params, limit: 10000 });

  const headers = [
    'Timestamp',
    'User',
    'Role',
    'Action',
    'Category',
    'Severity',
    'Resource Type',
    'Resource ID',
    'Details',
    'IP Address',
  ];

  const rows = entries.map((e) => [
    e.timestamp,
    e.userName,
    e.userRole,
    e.action,
    e.category,
    e.severity,
    e.resourceType,
    e.resourceId,
    e.details,
    e.ipAddress,
  ]);

  return { headers, rows };
}

// ── Integrity verification ───────────────────────────────────────────

export function verifyAuditIntegrity(): {
  valid: boolean;
  totalEntries: number;
  issues: string[];
} {
  const log = getAuditLog();
  const issues: string[] = [];

  // Check chronological order (newest first after sort)
  for (let i = 1; i < log.length; i++) {
    const current = new Date(log[i].timestamp).getTime();
    const previous = new Date(log[i - 1].timestamp).getTime();
    if (current > previous) {
      issues.push(`Entry ${log[i].id} has timestamp newer than preceding entry`);
    }
  }

  // Check required fields
  for (const entry of log) {
    if (!entry.userId) issues.push(`Entry ${entry.id} missing userId`);
    if (!entry.action) issues.push(`Entry ${entry.id} missing action`);
    if (!entry.timestamp) issues.push(`Entry ${entry.id} missing timestamp`);
    if (!entry.ipAddress) issues.push(`Entry ${entry.id} missing ipAddress`);
  }

  return {
    valid: issues.length === 0,
    totalEntries: log.length,
    issues,
  };
}

// ── Seed for development ─────────────────────────────────────────────

export function seedAuditLog(entries: AuditEntry[]): void {
  auditLog = [...auditLog, ...entries.map((e) => Object.freeze(e))];
}

export function clearAuditLog(): void {
  auditLog = [];
}
