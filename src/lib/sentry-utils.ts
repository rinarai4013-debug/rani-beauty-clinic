import * as Sentry from "@sentry/nextjs";

/**
 * Sentry breadcrumb + event helpers for Rani Beauty Clinic.
 * Import these in API routes and server actions to enrich error context.
 */

// ── Stripe / Checkout ──────────────────────────────────────────────
export function captureCheckoutEvent(
  tier: string,
  amount: number,
  metadata?: Record<string, string>
) {
  Sentry.addBreadcrumb({
    category: "checkout",
    message: `Checkout: ${tier} - $${(amount / 100).toFixed(2)}`,
    level: "info",
    data: { tier, amount, ...metadata },
  });
}

// ── Airtable Operations ────────────────────────────────────────────
export function captureAirtableOperation(
  table: string,
  operation: "read" | "create" | "update" | "delete" | "list",
  durationMs: number,
  metadata?: Record<string, unknown>
) {
  Sentry.addBreadcrumb({
    category: "airtable",
    message: `Airtable ${operation} on ${table} (${durationMs}ms)`,
    level: durationMs > 3000 ? "warning" : "info",
    data: { table, operation, durationMs, ...metadata },
  });

  // Flag slow queries
  if (durationMs > 5000) {
    Sentry.captureMessage(`Slow Airtable query: ${table}.${operation} took ${durationMs}ms`, {
      level: "warning",
      tags: { table, operation },
      extra: { durationMs, ...metadata },
    });
  }
}

// ── AI Agent Execution ─────────────────────────────────────────────
export function captureAgentExecution(
  agentName: string,
  success: boolean,
  durationMs: number,
  metadata?: Record<string, unknown>
) {
  Sentry.addBreadcrumb({
    category: "agent",
    message: `Agent ${agentName}: ${success ? "success" : "failed"} (${durationMs}ms)`,
    level: success ? "info" : "error",
    data: { agentName, success, durationMs, ...metadata },
  });

  if (!success) {
    Sentry.captureMessage(`Agent failed: ${agentName}`, {
      level: "error",
      tags: { agent: agentName },
      extra: { durationMs, ...metadata },
    });
  }
}

// ── Auth Events ────────────────────────────────────────────────────
export function captureAuthEvent(
  event: "login" | "logout" | "session_expired" | "unauthorized",
  email: string,
  success: boolean,
  metadata?: Record<string, unknown>
) {
  Sentry.addBreadcrumb({
    category: "auth",
    message: `Auth ${event}: ${success ? "success" : "failed"} (${email})`,
    level: success ? "info" : "warning",
    data: { event, email, success, ...metadata },
  });

  if (!success && event === "login") {
    Sentry.captureMessage(`Failed login attempt: ${email}`, {
      level: "warning",
      tags: { authEvent: event },
      extra: metadata,
    });
  }
}

// ── Webhook Processing ─────────────────────────────────────────────
export function captureWebhookEvent(
  source: "stripe" | "mangomint" | "cherry" | "n8n" | string,
  event: string,
  success: boolean,
  metadata?: Record<string, unknown>
) {
  Sentry.addBreadcrumb({
    category: "webhook",
    message: `Webhook ${source}/${event}: ${success ? "ok" : "failed"}`,
    level: success ? "info" : "error",
    data: { source, event, success, ...metadata },
  });

  if (!success) {
    Sentry.captureMessage(`Webhook processing failed: ${source}/${event}`, {
      level: "error",
      tags: { webhookSource: source, webhookEvent: event },
      extra: metadata,
    });
  }
}

// ── Generic API route wrapper ──────────────────────────────────────
export function withSentry<T>(
  routeName: string,
  handler: () => Promise<T>
): Promise<T> {
  return Sentry.withScope(async (scope) => {
    scope.setTag("route", routeName);
    try {
      return await handler();
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  });
}
