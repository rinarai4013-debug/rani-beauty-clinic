#!/usr/bin/env node
/**
 * Cross-Lambda race smoke.
 *
 * Submits sessions in rapid succession and confirms session fetch succeeds
 * soon after submission. Requires a dashboard auth cookie for /api/mastermind/sessions/:id.
 */

import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TARGET = Number(process.env.TARGET_ROUNDS || '10');
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS || '2000');
const SUBMIT_RETRY_LIMIT = Number(process.env.SUBMIT_RETRY_LIMIT || '8');
let DASHBOARD_COOKIE = process.env.DASHBOARD_COOKIE || null;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadLocalEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return {};
  try {
    const dotenv = await import('dotenv');
    return dotenv.parse(fs.readFileSync(envPath, 'utf8'));
  } catch {
    return {};
  }
}

async function resolveDashboardCookie() {
  if (DASHBOARD_COOKIE) return DASHBOARD_COOKIE;

  const env = await loadLocalEnv();
  const secret = process.env.DASHBOARD_JWT_SECRET || env.DASHBOARD_JWT_SECRET;
  const usersRaw = process.env.DASHBOARD_USERS || env.DASHBOARD_USERS;
  if (!secret || !usersRaw) return null;

  let username = '';
  let role = 'provider';
  let displayName = 'Smoke Test';

  try {
    const parsed = JSON.parse(usersRaw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const first = parsed[0];
      username = String(first.username || '').trim();
      role = String(first.role || role).trim();
      displayName = String(first.displayName || displayName).trim();
    } else if (parsed && typeof parsed === 'object') {
      const firstEntry = Object.entries(parsed)[0];
      if (firstEntry) {
        username = String(firstEntry[0] || '').trim();
        const meta = (firstEntry[1] || {});
        role = String(meta.role || role).trim();
        displayName = String(meta.displayName || displayName).trim();
      }
    }
  } catch {
    return null;
  }

  if (!username) return null;

  const { SignJWT } = await import('jose');
  const token = await new SignJWT({ username, role, displayName })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(new TextEncoder().encode(secret));
  DASHBOARD_COOKIE = `rani-session=${token}`;
  return DASHBOARD_COOKIE;
}

async function submitSession(index) {
  const formData = new FormData();
  formData.append(
    'data',
    JSON.stringify({
      firstName: 'Race',
      lastName: `Test ${index}`,
      email: `race-${index}@audit.local`,
      phone: '(206) 555-0700',
      dob: '1990-01-01',
      skinConcerns: ['aging-skin'],
      targetAreas: ['face'],
      treatmentInterests: ['hydrafacial'],
      goals: 'a',
      timeline: 'gradual',
      budget: 'moderate',
      skinType: 'normal',
      smsConsent: false,
    }),
  );

  for (let attempt = 1; attempt <= SUBMIT_RETRY_LIMIT; attempt += 1) {
    const res = await fetch(`${BASE_URL}/api/consultation/submit`, {
      method: 'POST',
      headers: { Origin: BASE_URL },
      body: formData,
    });
    const body = await res.json().catch(() => null);

    if (res.status !== 429) {
      return { ok: res.ok, status: res.status, body };
    }

    const retryAfterSeconds = Number(res.headers.get('retry-after') || '12');
    const waitMs = Number.isFinite(retryAfterSeconds) ? Math.max(1000, retryAfterSeconds * 1000) : 12000;
    console.warn(`[RATE] submit ${index}: 429 received, waiting ${waitMs}ms (attempt ${attempt}/${SUBMIT_RETRY_LIMIT})`);
    await sleep(waitMs);
  }

  return { ok: false, status: 429, body: { error: 'Too many requests after retries' } };
}

async function fetchSession(sessionId, cookie) {
  const headers = { Origin: BASE_URL };
  if (cookie) {
    headers.Cookie = cookie;
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${BASE_URL}/api/mastermind/sessions/${sessionId}`, {
      headers,
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    return { status: res.status, ok: res.ok };
  } catch (error) {
    clearTimeout(timer);
    return { status: 0, ok: false, error: String(error) };
  }
}

(async () => {
  const cookie = await resolveDashboardCookie();
  if (!cookie) {
    console.warn('[WARN] DASHBOARD_COOKIE not set and no local auth env available. Session reads may return 401.');
  }

  const results = [];

  for (let i = 0; i < TARGET; i += 1) {
    const submitResult = await submitSession(i + 1);
    if (!submitResult.body || !submitResult.body.sessionId) {
      console.error(`[FAIL] submit ${i + 1}: no sessionId`, JSON.stringify(submitResult.body));
      results.push({ step: i + 1, ok: false, reason: 'no sessionId', status: submitResult.status });
      continue;
    }

    const sessionId = submitResult.body.sessionId;
    const fetchResult = await fetchSession(sessionId, cookie);

    if (fetchResult.status === 401) {
      results.push({
        step: i + 1,
        ok: false,
        reason: cookie
          ? 'session read unauthorized despite generated auth cookie'
          : 'auth required (set DASHBOARD_COOKIE or provide dashboard auth env)',
        status: fetchResult.status,
      });
      continue;
    }

    if (!fetchResult.ok) {
      results.push({
        step: i + 1,
        ok: false,
        reason: `session fetch failed (${fetchResult.status})`,
        status: fetchResult.status,
      });
      continue;
    }

    results.push({ step: i + 1, ok: true, status: fetchResult.status });
    console.log(`[PASS] ${i + 1}: submit=${submitResult.status}, session=${sessionId}, get=${fetchResult.status}`);
    await sleep(150);
  }

  const pass = results.filter((r) => r.ok).length;
  const fail = results.length - pass;
  const failSamples = results.filter((r) => !r.ok).slice(0, 3);

  console.log(`result: ${pass}/${results.length} race sessions`);
  if (failSamples.length > 0) {
    console.error('failures:', JSON.stringify(failSamples));
  }

  process.exit(fail === 0 ? 0 : 1);
})();
