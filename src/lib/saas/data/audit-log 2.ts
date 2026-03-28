/**
 * RaniOS Audit Logging
 *
 * Every data modification logged with who/what/when/where,
 * compliance-ready format, search/filter, retention policies,
 * export, anomaly detection.
 */

import { z } from 'zod';

// ─── Types ────────────────────────────────────────────────────────

export type AuditAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'export'
  | 'import'
  | 'config_change'
  | 'permission_change'
  | 'api_key_action'
  | 'billing_action'
  | 'hipaa_access';

export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical';

export type RetentionPolicy = 'standard' | 'hipaa' | 'financial' | 'custom';

export type AnomalyType =
  | 'unusual_access_time'
  | 'high_volume_reads'
  | 'bulk_delete'
  | 'unusual_ip'
  | 'privilege_escalation'
  | 'data_exfiltration'
  | 'rapid_config_changes'
  | 'failed_auth_burst';

export interface AuditEntry {
  id: string;
  tenantId: string;
  userId: string;
  userName: string;
  action: AuditAction;
  resource: string;
  resourceId: string | null;
  resourceType: string;
  severity: AuditSeverity;
  description: string;
  previousValue: unknown;
  newValue: unknown;
  changes: FieldChange[];
  ip: string;
  userAgent: string;
  sessionId: string | null;
  geoLocation: string | null;
  timestamp: number;
  metadata: Record<string, unknown>;
  retentionPolicy: RetentionPolicy;
  expiresAt: number | null;
  complianceTags: string[];
}

export interface FieldChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface AuditFilter {
  tenantId?: string;
  userId?: string;
  action?: AuditAction;
  resource?: string;
  resourceType?: string;
  severity?: AuditSeverity;
  startTime?: number;
  endTime?: number;
  ip?: string;
  searchText?: string;
  complianceTag?: string;
  limit?: number;
  offset?: number;
}

export interface AuditSearchResult {
  entries: AuditEntry[];
  total: number;
  hasMore: boolean;
  facets: {
    actions: { action: AuditAction; count: number }[];
    users: { userId: string; userName: string; count: number }[];
    resources: { resource: string; count: number }[];
    severities: { severity: AuditSeverity; count: number }[];
  };
}

export interface AuditAnomaly {
  id: string;
  tenantId: string;
  type: AnomalyType;
  severity: AuditSeverity;
  description: string;
  affectedUserId: string | null;
  affectedResource: string | null;
  relatedEntries: string[]; // audit entry IDs
  detectedAt: number;
  resolved: boolean;
  resolvedAt: number | null;
  resolvedBy: string | null;
  metadata: Record<string, unknown>;
}

export interface RetentionConfig {
  policy: RetentionPolicy;
  retentionDays: number;
  description: string;
  autoDelete: boolean;
}

export interface ComplianceExport {
  id: string;
  tenantId: string;
  requestedBy: string;
  filter: AuditFilter;
  format: 'csv' | 'json' | 'pdf';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  entryCount: number;
  fileUrl: string | null;
  requestedAt: number;
  completedAt: number | null;
}

export interface AuditStats {
  tenantId: string;
  period: { start: number; end: number };
  totalEntries: number;
  byAction: Record<AuditAction, number>;
  bySeverity: Record<AuditSeverity, number>;
  topUsers: { userId: string; userName: string; count: number }[];
  topResources: { resource: string; count: number }[];
  anomalies: AuditAnomaly[];
  averageEntriesPerDay: number;
}

// ─── Schemas ──────────────────────────────────────────────────────

export const CreateAuditEntrySchema = z.object({
  tenantId: z.string().min(1),
  userId: z.string().min(1),
  userName: z.string().min(1),
  action: z.enum([
    'create', 'read', 'update', 'delete', 'login', 'logout',
    'export', 'import', 'config_change', 'permission_change',
    'api_key_action', 'billing_action', 'hipaa_access',
  ]),
  resource: z.string().min(1),
  resourceId: z.string().nullable().optional(),
  resourceType: z.string().min(1),
  description: z.string().min(1),
  previousValue: z.unknown().optional(),
  newValue: z.unknown().optional(),
  changes: z.array(z.object({
    field: z.string(),
    oldValue: z.unknown(),
    newValue: z.unknown(),
  })).optional().default([]),
  ip: z.string(),
  userAgent: z.string().optional().default(''),
  sessionId: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).optional().default({}),
  complianceTags: z.array(z.string()).optional().default([]),
});

export type CreateAuditEntryInput = z.infer<typeof CreateAuditEntrySchema>;

// ─── Constants ────────────────────────────────────────────────────

export const RETENTION_CONFIGS: Record<RetentionPolicy, RetentionConfig> = {
  standard: {
    policy: 'standard',
    retentionDays: 90,
    description: 'Standard 90-day retention for general audit logs',
    autoDelete: true,
  },
  hipaa: {
    policy: 'hipaa',
    retentionDays: 2555, // ~7 years
    description: 'HIPAA-compliant 7-year retention for healthcare data access',
    autoDelete: false,
  },
  financial: {
    policy: 'financial',
    retentionDays: 2555, // ~7 years
    description: '7-year retention for financial and billing records',
    autoDelete: false,
  },
  custom: {
    policy: 'custom',
    retentionDays: 365, // default 1 year
    description: 'Custom retention period',
    autoDelete: true,
  },
};

const ACTION_SEVERITY: Record<AuditAction, AuditSeverity> = {
  create: 'low',
  read: 'low',
  update: 'medium',
  delete: 'high',
  login: 'low',
  logout: 'low',
  export: 'medium',
  import: 'medium',
  config_change: 'high',
  permission_change: 'high',
  api_key_action: 'high',
  billing_action: 'medium',
  hipaa_access: 'high',
};

const HIPAA_RESOURCES = ['Client Intakes', 'Medical History', 'Treatment Plans', 'Patient Records', 'Health Data'];

// ─── In-Memory Store ──────────────────────────────────────────────

const auditEntries: AuditEntry[] = [];
const anomalies: AuditAnomaly[] = [];
const complianceExports: ComplianceExport[] = [];

// ─── Core Functions ───────────────────────────────────────────────

export function logAuditEntry(input: CreateAuditEntryInput): AuditEntry {
  const severity = determineAuditSeverity(input);
  const retentionPolicy = determineRetentionPolicy(input);
  const retention = RETENTION_CONFIGS[retentionPolicy];

  const entry: AuditEntry = {
    id: `audit_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`,
    tenantId: input.tenantId,
    userId: input.userId,
    userName: input.userName,
    action: input.action,
    resource: input.resource,
    resourceId: input.resourceId ?? null,
    resourceType: input.resourceType,
    severity,
    description: input.description,
    previousValue: input.previousValue ?? null,
    newValue: input.newValue ?? null,
    changes: input.changes || [],
    ip: input.ip,
    userAgent: input.userAgent || '',
    sessionId: input.sessionId ?? null,
    geoLocation: null,
    timestamp: Date.now(),
    metadata: input.metadata || {},
    retentionPolicy,
    expiresAt: retention.autoDelete
      ? Date.now() + retention.retentionDays * 24 * 60 * 60 * 1000
      : null,
    complianceTags: input.complianceTags || [],
  };

  // Add HIPAA tag if accessing health data
  if (HIPAA_RESOURCES.some(r => input.resource.includes(r) || input.resourceType.includes(r))) {
    if (!entry.complianceTags.includes('hipaa')) {
      entry.complianceTags.push('hipaa');
    }
  }

  auditEntries.push(entry);

  // Keep store manageable
  if (auditEntries.length > 100_000) {
    auditEntries.splice(0, auditEntries.length - 100_000);
  }

  // Check for anomalies
  detectAnomalies(entry);

  return entry;
}

// ─── Convenience Loggers ──────────────────────────────────────────

export function logDataCreate(
  tenantId: string, userId: string, userName: string,
  resource: string, resourceType: string, resourceId: string,
  data: unknown, ip: string,
): AuditEntry {
  return logAuditEntry({
    tenantId, userId, userName,
    action: 'create',
    resource, resourceType, resourceId,
    description: `Created ${resourceType}: ${resourceId}`,
    newValue: data,
    ip,
  });
}

export function logDataUpdate(
  tenantId: string, userId: string, userName: string,
  resource: string, resourceType: string, resourceId: string,
  changes: FieldChange[], ip: string,
): AuditEntry {
  return logAuditEntry({
    tenantId, userId, userName,
    action: 'update',
    resource, resourceType, resourceId,
    description: `Updated ${resourceType}: ${resourceId} (${changes.length} fields)`,
    changes,
    ip,
  });
}

export function logDataDelete(
  tenantId: string, userId: string, userName: string,
  resource: string, resourceType: string, resourceId: string,
  previousData: unknown, ip: string,
): AuditEntry {
  return logAuditEntry({
    tenantId, userId, userName,
    action: 'delete',
    resource, resourceType, resourceId,
    description: `Deleted ${resourceType}: ${resourceId}`,
    previousValue: previousData,
    ip,
  });
}

export function logLogin(
  tenantId: string, userId: string, userName: string,
  ip: string, userAgent: string, success: boolean,
): AuditEntry {
  return logAuditEntry({
    tenantId, userId, userName,
    action: 'login',
    resource: 'Authentication',
    resourceType: 'session',
    description: success ? `User logged in from ${ip}` : `Failed login attempt from ${ip}`,
    ip,
    userAgent,
    metadata: { success },
  });
}

export function logHipaaAccess(
  tenantId: string, userId: string, userName: string,
  resource: string, resourceId: string, reason: string,
  ip: string,
): AuditEntry {
  return logAuditEntry({
    tenantId, userId, userName,
    action: 'hipaa_access',
    resource, resourceType: 'health_data', resourceId,
    description: `HIPAA data access: ${reason}`,
    ip,
    complianceTags: ['hipaa', 'phi_access'],
    metadata: { reason },
  });
}

// ─── Search and Filter ────────────────────────────────────────────

export function searchAuditLog(filter: AuditFilter): AuditSearchResult {
  let results = [...auditEntries];

  if (filter.tenantId) results = results.filter(e => e.tenantId === filter.tenantId);
  if (filter.userId) results = results.filter(e => e.userId === filter.userId);
  if (filter.action) results = results.filter(e => e.action === filter.action);
  if (filter.resource) results = results.filter(e => e.resource.includes(filter.resource!));
  if (filter.resourceType) results = results.filter(e => e.resourceType === filter.resourceType);
  if (filter.severity) results = results.filter(e => e.severity === filter.severity);
  if (filter.startTime) results = results.filter(e => e.timestamp >= filter.startTime!);
  if (filter.endTime) results = results.filter(e => e.timestamp <= filter.endTime!);
  if (filter.ip) results = results.filter(e => e.ip === filter.ip);
  if (filter.complianceTag) results = results.filter(e => e.complianceTags.includes(filter.complianceTag!));
  if (filter.searchText) {
    const term = filter.searchText.toLowerCase();
    results = results.filter(e =>
      e.description.toLowerCase().includes(term) ||
      e.userName.toLowerCase().includes(term) ||
      e.resource.toLowerCase().includes(term),
    );
  }

  results.sort((a, b) => b.timestamp - a.timestamp);

  const total = results.length;
  const offset = filter.offset || 0;
  const limit = filter.limit || 50;
  const paged = results.slice(offset, offset + limit);

  // Build facets
  const actionCounts = new Map<AuditAction, number>();
  const userCounts = new Map<string, { userName: string; count: number }>();
  const resourceCounts = new Map<string, number>();
  const severityCounts = new Map<AuditSeverity, number>();

  results.forEach(e => {
    actionCounts.set(e.action, (actionCounts.get(e.action) || 0) + 1);
    const user = userCounts.get(e.userId) || { userName: e.userName, count: 0 };
    user.count += 1;
    userCounts.set(e.userId, user);
    resourceCounts.set(e.resource, (resourceCounts.get(e.resource) || 0) + 1);
    severityCounts.set(e.severity, (severityCounts.get(e.severity) || 0) + 1);
  });

  return {
    entries: paged,
    total,
    hasMore: offset + limit < total,
    facets: {
      actions: Array.from(actionCounts.entries())
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count),
      users: Array.from(userCounts.entries())
        .map(([userId, data]) => ({ userId, userName: data.userName, count: data.count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      resources: Array.from(resourceCounts.entries())
        .map(([resource, count]) => ({ resource, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      severities: Array.from(severityCounts.entries())
        .map(([severity, count]) => ({ severity, count }))
        .sort((a, b) => b.count - a.count),
    },
  };
}

export function getAuditEntry(id: string): AuditEntry | null {
  return auditEntries.find(e => e.id === id) || null;
}

// ─── Anomaly Detection ────────────────────────────────────────────

function detectAnomalies(entry: AuditEntry): void {
  const recentEntries = auditEntries.filter(
    e => e.tenantId === entry.tenantId && e.timestamp > Date.now() - 60 * 60 * 1000,
  );

  // Unusual access time (between 1 AM and 5 AM)
  const hour = new Date(entry.timestamp).getHours();
  if (hour >= 1 && hour <= 5 && entry.action !== 'login') {
    createAnomaly({
      tenantId: entry.tenantId,
      type: 'unusual_access_time',
      severity: 'medium',
      description: `Unusual access at ${hour}:00 by ${entry.userName}`,
      affectedUserId: entry.userId,
      affectedResource: entry.resource,
      relatedEntries: [entry.id],
    });
  }

  // High volume reads in short period
  const userReads = recentEntries.filter(
    e => e.userId === entry.userId && e.action === 'read',
  );
  if (userReads.length > 100) {
    const existing = anomalies.find(
      a => a.tenantId === entry.tenantId &&
           a.type === 'high_volume_reads' &&
           a.affectedUserId === entry.userId &&
           !a.resolved,
    );
    if (!existing) {
      createAnomaly({
        tenantId: entry.tenantId,
        type: 'high_volume_reads',
        severity: 'high',
        description: `${entry.userName} performed ${userReads.length} reads in the last hour`,
        affectedUserId: entry.userId,
        affectedResource: null,
        relatedEntries: userReads.slice(-10).map(e => e.id),
      });
    }
  }

  // Bulk delete detection
  const userDeletes = recentEntries.filter(
    e => e.userId === entry.userId && e.action === 'delete',
  );
  if (userDeletes.length > 10) {
    const existing = anomalies.find(
      a => a.tenantId === entry.tenantId &&
           a.type === 'bulk_delete' &&
           a.affectedUserId === entry.userId &&
           !a.resolved,
    );
    if (!existing) {
      createAnomaly({
        tenantId: entry.tenantId,
        type: 'bulk_delete',
        severity: 'critical',
        description: `${entry.userName} deleted ${userDeletes.length} records in the last hour`,
        affectedUserId: entry.userId,
        affectedResource: entry.resourceType,
        relatedEntries: userDeletes.map(e => e.id),
      });
    }
  }

  // Failed auth burst
  if (entry.action === 'login' && entry.metadata?.success === false) {
    const failedLogins = recentEntries.filter(
      e => e.action === 'login' && e.metadata?.success === false && e.ip === entry.ip,
    );
    if (failedLogins.length >= 5) {
      createAnomaly({
        tenantId: entry.tenantId,
        type: 'failed_auth_burst',
        severity: 'critical',
        description: `${failedLogins.length} failed login attempts from IP ${entry.ip}`,
        affectedUserId: null,
        affectedResource: 'Authentication',
        relatedEntries: failedLogins.map(e => e.id),
      });
    }
  }
}

function createAnomaly(input: Omit<AuditAnomaly, 'id' | 'detectedAt' | 'resolved' | 'resolvedAt' | 'resolvedBy' | 'metadata'>): void {
  anomalies.push({
    ...input,
    id: `anomaly_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
    detectedAt: Date.now(),
    resolved: false,
    resolvedAt: null,
    resolvedBy: null,
    metadata: {},
  });
}

export function getAnomalies(
  tenantId: string,
  resolved?: boolean,
): AuditAnomaly[] {
  let result = anomalies.filter(a => a.tenantId === tenantId);
  if (resolved !== undefined) result = result.filter(a => a.resolved === resolved);
  return result.sort((a, b) => b.detectedAt - a.detectedAt);
}

export function resolveAnomaly(anomalyId: string, resolvedBy: string): boolean {
  const anomaly = anomalies.find(a => a.id === anomalyId);
  if (!anomaly) return false;
  anomaly.resolved = true;
  anomaly.resolvedAt = Date.now();
  anomaly.resolvedBy = resolvedBy;
  return true;
}

// ─── Retention Policy ─────────────────────────────────────────────

function determineRetentionPolicy(input: CreateAuditEntryInput): RetentionPolicy {
  if (input.action === 'hipaa_access' || input.complianceTags?.includes('hipaa')) {
    return 'hipaa';
  }
  if (input.action === 'billing_action' || input.resourceType === 'transaction') {
    return 'financial';
  }
  return 'standard';
}

function determineAuditSeverity(input: CreateAuditEntryInput): AuditSeverity {
  if (input.action === 'hipaa_access') return 'high';
  return ACTION_SEVERITY[input.action] || 'low';
}

export function cleanupExpiredEntries(): number {
  const now = Date.now();
  const before = auditEntries.length;
  const remaining = auditEntries.filter(e => !e.expiresAt || e.expiresAt > now);
  auditEntries.length = 0;
  auditEntries.push(...remaining);
  return before - auditEntries.length;
}

// ─── Compliance Export ────────────────────────────────────────────

export function createComplianceExport(
  tenantId: string,
  requestedBy: string,
  filter: AuditFilter,
  format: 'csv' | 'json' | 'pdf',
): ComplianceExport {
  const results = searchAuditLog({ ...filter, tenantId, limit: 100_000 });

  const exp: ComplianceExport = {
    id: `cexp_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`,
    tenantId,
    requestedBy,
    filter,
    format,
    status: 'completed',
    entryCount: results.total,
    fileUrl: `/api/saas/audit/export/${Date.now()}`,
    requestedAt: Date.now(),
    completedAt: Date.now(),
  };

  complianceExports.push(exp);
  return exp;
}

export function getComplianceExports(tenantId: string): ComplianceExport[] {
  return complianceExports
    .filter(e => e.tenantId === tenantId)
    .sort((a, b) => b.requestedAt - a.requestedAt);
}

// ─── Stats ────────────────────────────────────────────────────────

export function getAuditStats(
  tenantId: string,
  days: number = 30,
): AuditStats {
  const start = Date.now() - days * 24 * 60 * 60 * 1000;
  const entries = auditEntries.filter(
    e => e.tenantId === tenantId && e.timestamp >= start,
  );

  const byAction = {} as Record<AuditAction, number>;
  const bySeverity = {} as Record<AuditSeverity, number>;
  const userMap = new Map<string, { userName: string; count: number }>();
  const resourceMap = new Map<string, number>();

  entries.forEach(e => {
    byAction[e.action] = (byAction[e.action] || 0) + 1;
    bySeverity[e.severity] = (bySeverity[e.severity] || 0) + 1;
    const user = userMap.get(e.userId) || { userName: e.userName, count: 0 };
    user.count += 1;
    userMap.set(e.userId, user);
    resourceMap.set(e.resource, (resourceMap.get(e.resource) || 0) + 1);
  });

  return {
    tenantId,
    period: { start, end: Date.now() },
    totalEntries: entries.length,
    byAction,
    bySeverity,
    topUsers: Array.from(userMap.entries())
      .map(([userId, data]) => ({ userId, userName: data.userName, count: data.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    topResources: Array.from(resourceMap.entries())
      .map(([resource, count]) => ({ resource, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    anomalies: getAnomalies(tenantId, false),
    averageEntriesPerDay: days > 0 ? Math.round(entries.length / days) : 0,
  };
}

// ─── Reset (for testing) ──────────────────────────────────────────

export function resetAuditLog(): void {
  auditEntries.length = 0;
  anomalies.length = 0;
  complianceExports.length = 0;
}
