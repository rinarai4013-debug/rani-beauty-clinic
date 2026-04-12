const LOCAL_DEV_ORIGINS = new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]);

function normalizeOrigin(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin.toLowerCase();
  } catch {
    return null;
  }
}

function buildAllowedOrigins(): Set<string> {
  const allowed = new Set<string>();

  const baseOrigin = normalizeOrigin(process.env.NEXT_PUBLIC_BASE_URL || 'https://www.ranibeautyclinic.com');
  if (baseOrigin) allowed.add(baseOrigin);

  const siteOrigin = normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL || 'https://ranibeautyclinic.com');
  if (siteOrigin) allowed.add(siteOrigin);

  for (const raw of (process.env.CORS_ALLOWED_ORIGINS || '').split(',')) {
    const origin = normalizeOrigin(raw.trim());
    if (origin) allowed.add(origin);
  }

  if ((process.env.NODE_ENV || 'development') !== 'production') {
    for (const origin of LOCAL_DEV_ORIGINS) allowed.add(origin);
  }

  return allowed;
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Browser-origin enforcement for public mutation endpoints.
 * Non-browser clients without origin/referer are allowed.
 */
export function enforceAllowedPublicOrigin(request: Request): Response | null {
  const allowedOrigins = buildAllowedOrigins();
  if (allowedOrigins.size === 0) return null;

  const rawOrigin = request.headers.get('origin');
  const rawReferer = request.headers.get('referer');
  if (!rawOrigin && !rawReferer) return null;

  const requestOrigin = normalizeOrigin(rawOrigin) ?? normalizeOrigin(rawReferer);
  if (!requestOrigin) {
    return jsonError('Invalid request origin', 400);
  }

  if (!allowedOrigins.has(requestOrigin)) {
    return jsonError('Origin not allowed', 403);
  }

  return null;
}

/**
 * Payload-size guard using content-length.
 */
export function enforceContentLength(request: Request, maxBytes: number): Response | null {
  const rawLength = request.headers.get('content-length');
  if (!rawLength) return null;

  const length = Number(rawLength);
  if (!Number.isFinite(length) || length < 0) {
    return jsonError('Invalid content length', 400);
  }

  if (length > maxBytes) {
    return jsonError('Request body too large', 413);
  }

  return null;
}

export function normalizeEmailForLimit(value: string): string {
  return value.trim().toLowerCase();
}
