#!/usr/bin/env node
/**
 * Cross-Lambda race smoke.
 *
 * Submits sessions in rapid succession and confirms session fetch succeeds
 * soon after submission. Requires a dashboard auth cookie for /api/mastermind/sessions/:id.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TARGET = Number(process.env.TARGET_ROUNDS || '10');
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS || '2000');
const DASHBOARD_COOKIE = process.env.DASHBOARD_COOKIE;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

  const res = await fetch(`${BASE_URL}/api/consultation/submit`, {
    method: 'POST',
    headers: { Origin: BASE_URL },
    body: formData,
  });

  const body = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, body };
}

async function fetchSession(sessionId) {
  const headers = { Origin: BASE_URL };
  if (DASHBOARD_COOKIE) {
    headers.Cookie = DASHBOARD_COOKIE;
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
  const results = [];

  for (let i = 0; i < TARGET; i += 1) {
    const submitResult = await submitSession(i + 1);
    if (!submitResult.body || !submitResult.body.sessionId) {
      console.error(`[FAIL] submit ${i + 1}: no sessionId`, JSON.stringify(submitResult.body));
      results.push({ step: i + 1, ok: false, reason: 'no sessionId', status: submitResult.status });
      continue;
    }

    const sessionId = submitResult.body.sessionId;
    const fetchResult = await fetchSession(sessionId);

    if (fetchResult.status === 401) {
      results.push({
        step: i + 1,
        ok: false,
        reason: 'auth required (set DASHBOARD_COOKIE or use an authenticated test user)',
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

    if (i % 2 === 0) {
      await sleep(100);
    }
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
