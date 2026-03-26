export async function register() {
  try {
    if (process.env.NEXT_RUNTIME === "nodejs") {
      await import("../sentry.server.config");
    }

    if (process.env.NEXT_RUNTIME === "edge") {
      await import("../sentry.edge.config");
    }
  } catch {
    // Sentry not configured yet - skip silently
  }
}

export async function onRequestError(...args: unknown[]) {
  try {
    const Sentry = await import("@sentry/nextjs");
    if (Sentry.captureRequestError) {
      (Sentry.captureRequestError as Function)(...args);
    }
  } catch {
    // Sentry not available
  }
}
