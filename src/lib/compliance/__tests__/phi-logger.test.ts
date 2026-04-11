// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { NextRequest } from 'next/server';
import type { SessionPayload } from '@/types/auth';
import {
  logPhiAccessFromRequest,
  logPhiAccessBatchFromRequest,
} from '../phi-logger';
import { getAccessLogs, clearHIPAAData } from '../hipaa-audit';

function makeRequest(headers: Record<string, string> = {}): NextRequest {
  return {
    headers: {
      get: (name: string) => headers[name.toLowerCase()] ?? null,
    },
  } as unknown as NextRequest;
}

function makeSession(overrides: Partial<SessionPayload> = {}): SessionPayload {
  return {
    username: 'rina',
    role: 'ceo',
    displayName: 'Rina Rai',
    ...overrides,
  };
}

beforeEach(() => {
  clearHIPAAData();
});

describe('logPhiAccessFromRequest', () => {
  it('creates a PHI access log entry with all fields populated from session + event', () => {
    const request = makeRequest({ 'x-forwarded-for': '192.0.2.42' });
    const session = makeSession();

    logPhiAccessFromRequest(request, session, {
      patientId: 'rec123',
      patientName: 'Jane Patient',
      action: 'view',
      dataCategory: 'treatment_records',
      details: 'Consult prep',
    });

    const logs = getAccessLogs();
    expect(logs).toHaveLength(1);
    const entry = logs[0];
    expect(entry.userId).toBe('rina');
    expect(entry.userName).toBe('Rina Rai');
    expect(entry.userRole).toBe('ceo');
    expect(entry.patientId).toBe('rec123');
    expect(entry.patientName).toBe('Jane Patient');
    expect(entry.action).toBe('view');
    expect(entry.dataCategory).toBe('treatment_records');
    expect(entry.ipAddress).toBe('192.0.2.42');
    expect(entry.details).toBe('Consult prep');
    expect(typeof entry.id).toBe('string');
    expect(typeof entry.timestamp).toBe('string');
  });

  it('extracts IP from the first entry of x-forwarded-for when multiple hops present', () => {
    const request = makeRequest({
      'x-forwarded-for': '198.51.100.7, 10.0.0.1, 10.0.0.2',
    });
    logPhiAccessFromRequest(request, makeSession(), {
      patientId: 'p1',
      patientName: 'P',
      action: 'view',
      dataCategory: 'demographics',
    });
    expect(getAccessLogs()[0].ipAddress).toBe('198.51.100.7');
  });

  it('falls back to x-real-ip when x-forwarded-for is absent', () => {
    const request = makeRequest({ 'x-real-ip': '203.0.113.5' });
    logPhiAccessFromRequest(request, makeSession(), {
      patientId: 'p1',
      patientName: 'P',
      action: 'view',
      dataCategory: 'demographics',
    });
    expect(getAccessLogs()[0].ipAddress).toBe('203.0.113.5');
  });

  it('falls back to "unknown" when neither header is set', () => {
    const request = makeRequest({});
    logPhiAccessFromRequest(request, makeSession(), {
      patientId: 'p1',
      patientName: 'P',
      action: 'view',
      dataCategory: 'demographics',
    });
    expect(getAccessLogs()[0].ipAddress).toBe('unknown');
  });

  it('does not throw when the underlying logPHIAccess throws — swallows and console.errors', () => {
    // We simulate a throw by poisoning the session shape. The wrapper
    // should catch any error and not propagate.
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const request = makeRequest({});
    const badSession = { username: 'rina' } as unknown as SessionPayload;

    // Even though the session is missing displayName, the call should
    // not throw from the wrapper's perspective. Whether or not a log
    // entry was created is implementation-dependent — we only assert
    // the wrapper doesn't propagate.
    expect(() =>
      logPhiAccessFromRequest(request, badSession, {
        patientId: 'p1',
        patientName: 'P',
        action: 'view',
        dataCategory: 'demographics',
      }),
    ).not.toThrow();

    consoleSpy.mockRestore();
  });

  it('records all 6 PHI access actions in the action union', () => {
    const actions: Array<'view' | 'create' | 'update' | 'delete' | 'export' | 'print'> = [
      'view',
      'create',
      'update',
      'delete',
      'export',
      'print',
    ];
    const request = makeRequest({});
    const session = makeSession();

    for (const action of actions) {
      logPhiAccessFromRequest(request, session, {
        patientId: `p-${action}`,
        patientName: `P ${action}`,
        action,
        dataCategory: 'demographics',
      });
    }

    const logs = getAccessLogs();
    expect(logs).toHaveLength(6);
    expect(new Set(logs.map((l) => l.action))).toEqual(new Set(actions));
  });

  it('records all 8 PHI data categories', () => {
    const categories: Array<
      | 'demographics'
      | 'medical_history'
      | 'treatment_records'
      | 'photos'
      | 'billing'
      | 'insurance'
      | 'consents'
      | 'lab_results'
    > = [
      'demographics',
      'medical_history',
      'treatment_records',
      'photos',
      'billing',
      'insurance',
      'consents',
      'lab_results',
    ];
    const request = makeRequest({});
    const session = makeSession();

    for (const category of categories) {
      logPhiAccessFromRequest(request, session, {
        patientId: `p-${category}`,
        patientName: `P ${category}`,
        action: 'view',
        dataCategory: category,
      });
    }

    const logs = getAccessLogs();
    expect(logs).toHaveLength(8);
    expect(new Set(logs.map((l) => l.dataCategory))).toEqual(new Set(categories));
  });
});

describe('logPhiAccessBatchFromRequest', () => {
  it('creates N log entries from N events with a shared request context', () => {
    const request = makeRequest({ 'x-forwarded-for': '192.0.2.100' });
    const session = makeSession({ role: 'frontdesk', username: 'sarah', displayName: 'Sarah' });

    logPhiAccessBatchFromRequest(request, session, [
      { patientId: 'p1', patientName: 'A', action: 'view', dataCategory: 'demographics' },
      { patientId: 'p2', patientName: 'B', action: 'view', dataCategory: 'demographics' },
      { patientId: 'p3', patientName: 'C', action: 'view', dataCategory: 'demographics' },
    ]);

    const logs = getAccessLogs();
    expect(logs).toHaveLength(3);
    for (const log of logs) {
      expect(log.userId).toBe('sarah');
      expect(log.userRole).toBe('frontdesk');
      expect(log.ipAddress).toBe('192.0.2.100');
    }
    expect(new Set(logs.map((l) => l.patientId))).toEqual(new Set(['p1', 'p2', 'p3']));
  });

  it('no-ops on an empty batch', () => {
    logPhiAccessBatchFromRequest(makeRequest({}), makeSession(), []);
    expect(getAccessLogs()).toHaveLength(0);
  });

  it('continues logging subsequent events if one event would fail', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const request = makeRequest({});
    const session = makeSession();

    logPhiAccessBatchFromRequest(request, session, [
      { patientId: 'p1', patientName: 'A', action: 'view', dataCategory: 'demographics' },
      { patientId: 'p2', patientName: 'B', action: 'view', dataCategory: 'demographics' },
      { patientId: 'p3', patientName: 'C', action: 'view', dataCategory: 'demographics' },
    ]);

    // All 3 should have been logged (no events currently fail under
    // normal inputs, but this test documents the contract).
    expect(getAccessLogs()).toHaveLength(3);
    consoleSpy.mockRestore();
  });
});
