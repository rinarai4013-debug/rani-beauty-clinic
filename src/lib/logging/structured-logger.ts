export type LogCategory = 'auth' | 'webhook' | 'sync' | 'api' | 'ai' | 'integration';
export type LogLevel = 'info' | 'warn' | 'error' | 'critical';

export function logEvent(
  category: LogCategory,
  level: LogLevel,
  message: string,
  metadata?: Record<string, unknown>,
): void {
  const entry = {
    timestamp: new Date().toISOString(),
    category,
    level,
    message,
    ...metadata,
  };
  console.log(JSON.stringify(entry));
}

export function logAuthFailure(ip: string, username: string, reason: string): void {
  logEvent('auth', 'warn', 'Authentication failure', { ip, username, reason });
}

export function logWebhookEvent(
  source: string,
  event: string,
  success: boolean,
  details?: Record<string, unknown>,
): void {
  logEvent('webhook', success ? 'info' : 'error', `Webhook ${event} from ${source}`, {
    source,
    event,
    success,
    ...details,
  });
}

export function logSyncEvent(
  integration: string,
  recordsCreated: number,
  recordsSkipped: number,
  error?: string,
): void {
  logEvent('sync', error ? 'error' : 'info', `Sync completed for ${integration}`, {
    integration,
    recordsCreated,
    recordsSkipped,
    ...(error ? { error } : {}),
  });
}
