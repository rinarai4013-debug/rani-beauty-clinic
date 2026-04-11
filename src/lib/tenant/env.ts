/**
 * Tenant-resolution configuration helpers.
 *
 * Centralizes the list of "platform domains" (the bare domains the
 * multi-tenant router treats as its own — e.g. `ranios.com`) and other
 * hostname-adjacent defaults, so both the middleware and the server-
 * side resolver read from the same source of truth.
 *
 * All values are environment-driven with sensible fallbacks:
 *
 *   PLATFORM_DOMAINS       — comma-separated list of platform domains.
 *                            Default: "ranios.com,ranios.dev,localhost"
 *
 *   DEFAULT_TENANT_ID      — tenant ID to fall back to when nothing else
 *                            resolves. Default: "rani-beauty-clinic"
 *
 *   DEFAULT_HOSTNAME       — hostname to assume when the incoming request
 *                            has no `host` header (local dev mostly).
 *                            Default: "localhost:3000"
 *
 *   CORS_ALLOWED_ORIGINS   — comma-separated list of allowed CORS origins
 *                            for /api/* routes. Default mirrors the prior
 *                            hardcoded list.
 *
 * Behavior when an env var is absent is IDENTICAL to the pre-refactor
 * hardcoded values — this is intentional so tests, local dev, and
 * production all stay green on existing deployments.
 *
 * Tier 1 Horizon 1 (2026-04-11): replaces hardcoded arrays that were
 * duplicated across middleware.ts and resolver.ts.
 */

/** Default platform domains when no env override is set. */
const DEFAULT_PLATFORM_DOMAINS: readonly string[] = [
  'ranios.com',
  'ranios.dev',
  'localhost',
];

/** Default CORS origins when no env override is set. */
const DEFAULT_CORS_ALLOWED_ORIGINS: readonly string[] = [
  'https://ranibeautyclinic.com',
  'https://www.ranibeautyclinic.com',
  'https://ranios.com',
  'https://ranios.dev',
];

/** Default dev-only origins appended when NODE_ENV === 'development'. */
const DEV_CORS_ORIGINS: readonly string[] = [
  'http://localhost:3000',
  'http://localhost:3001',
];

/**
 * Parse a comma-separated env value into a trimmed, non-empty string array.
 * Returns `null` when the env var is missing or empty so callers can
 * distinguish "not set" (use default) from "set to []" (no values).
 */
function parseList(raw: string | undefined): string[] | null {
  if (raw === undefined || raw === null) return null;
  const parts = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return parts.length > 0 ? parts : null;
}

/**
 * Returns the ordered list of platform domains used by subdomain
 * extraction + custom-domain detection in both the middleware and
 * the tenant resolver.
 */
export function getPlatformDomains(): readonly string[] {
  const override = parseList(process.env.PLATFORM_DOMAINS);
  return override ?? DEFAULT_PLATFORM_DOMAINS;
}

/**
 * Returns the default tenant ID to fall back to when no other
 * resolution strategy produces a match. Defaults to 'rani-beauty-clinic'
 * for backward compatibility with the single-tenant deployment.
 */
export function getDefaultTenantId(): string {
  const override = process.env.DEFAULT_TENANT_ID?.trim();
  return override && override.length > 0 ? override : 'rani-beauty-clinic';
}

/**
 * Returns the hostname to assume when the incoming request has no
 * `host` header. This should essentially never happen in production
 * (Vercel/Next always sets it) — the value is here for local dev
 * and for test suites that construct synthetic requests.
 */
export function getDefaultHostname(): string {
  const override = process.env.DEFAULT_HOSTNAME?.trim();
  return override && override.length > 0 ? override : 'localhost:3000';
}

/**
 * Returns the CORS allow-list for `/api/*` routes.
 *
 * When `NODE_ENV === 'development'` the dev-only localhost origins
 * are appended automatically (matching the prior hardcoded behavior)
 * so local tooling keeps working without extra config.
 */
export function getCorsAllowedOrigins(): readonly string[] {
  const override = parseList(process.env.CORS_ALLOWED_ORIGINS);
  const base = override ?? DEFAULT_CORS_ALLOWED_ORIGINS;

  if (process.env.NODE_ENV === 'development') {
    // Append dev origins only if they're not already in the base list.
    const merged = [...base];
    for (const dev of DEV_CORS_ORIGINS) {
      if (!merged.includes(dev)) merged.push(dev);
    }
    return merged;
  }

  return base;
}
