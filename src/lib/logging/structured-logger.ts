export type LogCategory = 'auth' | 'webhook' | 'sync' | 'api' | 'ai' | 'integration';
export type LogLevel = 'info' | 'warn' | 'error' | 'critical';

const REDACTED = '[REDACTED]';
const MAX_STRING_LENGTH = 2_000;
const MAX_ARRAY_LENGTH = 50;
const MAX_OBJECT_KEYS = 50;
const MAX_DEPTH = 4;

function isSensitiveKey(key: string): boolean {
  const normalized = key.replace(/[^a-z0-9]/gi, '').toLowerCase();
  const sensitiveTokens = [
    'token',
    'secret',
    'password',
    'apikey',
    'authorization',
    'cookie',
    'session',
    'jwt',
    'email',
    'phone',
    'dob',
    'ssn',
    'address',
  ];
  return sensitiveTokens.some((token) => normalized.includes(token));
}

function redactValue(value: unknown, key?: string, depth = 0): unknown {
  if (key && isSensitiveKey(key)) return REDACTED;
  if (depth > MAX_DEPTH) return '[TRUNCATED]';

  if (typeof value === 'string') {
    if (value.length > MAX_STRING_LENGTH) {
      return `${value.slice(0, MAX_STRING_LENGTH)}...[TRUNCATED]`;
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY_LENGTH).map((item) => redactValue(item, key, depth + 1));
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).slice(0, MAX_OBJECT_KEYS);
    return Object.fromEntries(
      entries.map(([nestedKey, nestedValue]) => [nestedKey, redactValue(nestedValue, nestedKey, depth + 1)]),
    );
  }

  return value;
}

function sanitizeMetadata(metadata?: Record<string, unknown>): Record<string, unknown> {
  if (!metadata) return {};
  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [key, redactValue(value, key)]),
  );
}

export function logEvent(
  category: LogCategory,
  level: LogLevel,
  message: string,
  metadata?: Record<string, unknown>,
): void {
  const sanitizedMetadata = sanitizeMetadata(metadata);
  const entry = {
    timestamp: new Date().toISOString(),
    category,
    level,
    message,
    ...sanitizedMetadata,
  };
  console.warn(JSON.stringify(entry));
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
