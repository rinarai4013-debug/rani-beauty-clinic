import { describe, it, expect, vi } from 'vitest';
import { logEvent, logAuthFailure, logWebhookEvent, logSyncEvent } from './structured-logger';

describe('structured-logger', () => {
  it('logEvent outputs JSON to console', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logEvent('api', 'info', 'Test message', { key: 'value' });
    expect(spy).toHaveBeenCalledOnce();
    const output = JSON.parse(spy.mock.calls[0][0]);
    expect(output.category).toBe('api');
    expect(output.level).toBe('info');
    expect(output.message).toBe('Test message');
    expect(output.key).toBe('value');
    expect(output.timestamp).toBeDefined();
    spy.mockRestore();
  });

  it('logAuthFailure logs with correct metadata', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logAuthFailure('1.2.3.4', 'admin', 'bad password');
    const output = JSON.parse(spy.mock.calls[0][0]);
    expect(output.category).toBe('auth');
    expect(output.level).toBe('warn');
    expect(output.ip).toBe('1.2.3.4');
    expect(output.username).toBe('admin');
    spy.mockRestore();
  });

  it('logWebhookEvent logs success', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logWebhookEvent('mangomint', 'appointment.created', true);
    const output = JSON.parse(spy.mock.calls[0][0]);
    expect(output.category).toBe('webhook');
    expect(output.level).toBe('info');
    expect(output.success).toBe(true);
    spy.mockRestore();
  });

  it('logWebhookEvent logs failure', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logWebhookEvent('mangomint', 'appointment.created', false);
    const output = JSON.parse(spy.mock.calls[0][0]);
    expect(output.level).toBe('error');
    expect(output.success).toBe(false);
    spy.mockRestore();
  });

  it('logSyncEvent logs with record counts', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logSyncEvent('mangomint', 5, 2);
    const output = JSON.parse(spy.mock.calls[0][0]);
    expect(output.category).toBe('sync');
    expect(output.recordsCreated).toBe(5);
    expect(output.recordsSkipped).toBe(2);
    spy.mockRestore();
  });
});
