export function captureCheckoutEvent(
  tier: string,
  amount: number,
  metadata?: Record<string, string>
): void;

export function captureAirtableOperation(
  table: string,
  operation: "read" | "create" | "update" | "delete" | "list",
  durationMs: number,
  metadata?: Record<string, unknown>
): void;

export function captureAgentExecution(
  agentName: string,
  success: boolean,
  durationMs: number,
  metadata?: Record<string, unknown>
): void;

export function captureAuthEvent(
  event: "login" | "logout" | "session_expired" | "unauthorized",
  email: string,
  success: boolean,
  metadata?: Record<string, unknown>
): void;

export function captureWebhookEvent(
  source: "stripe" | "mangomint" | "cherry" | "n8n" | string,
  event: string,
  success: boolean,
  metadata?: Record<string, unknown>
): void;

export function withSentry<T>(routeName: string, handler: () => Promise<T>): Promise<T>;
