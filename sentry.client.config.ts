import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance — 10% sampling for free tier
  tracesSampleRate: 0.1,

  // Session Replay — 10% of sessions, 100% on error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],

  // Filter out noisy errors
  ignoreErrors: [
    // Browser extensions
    "top.GLOBALS",
    "canvas.contentDocument",
    // Network errors users can't control
    "Failed to fetch",
    "NetworkError",
    "Load failed",
    // Cancelled navigations
    "AbortError",
    // Benign resize observer
    "ResizeObserver loop",
  ],

  // Tag environment
  environment: process.env.NODE_ENV,
});
