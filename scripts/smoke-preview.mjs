#!/usr/bin/env node

const baseUrl = process.env.BASE_URL;

if (!baseUrl) {
  console.error('Set BASE_URL to the preview or production origin, for example:');
  console.error('BASE_URL=https://your-preview.vercel.app node scripts/smoke-preview.mjs');
  process.exit(1);
}

const origin = baseUrl.replace(/\/$/, '');
const checks = [];

function addCheck(name, fn) {
  checks.push({ name, fn });
}

function endpoint(path) {
  return `${origin}${path}`;
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

addCheck('health endpoint responds without exposing secrets', async () => {
  const response = await fetch(endpoint('/api/health'), { cache: 'no-store' });
  const body = await readJson(response);
  assert([200, 503].includes(response.status), `expected 200 or 503, got ${response.status}`);
  assert(body && typeof body.status === 'string', 'expected JSON body with status');
  assert(!JSON.stringify(body).includes('pat'), 'health body appears to expose secret-like data');
});

addCheck('allowed CORS preflight returns allow-origin', async () => {
  const response = await fetch(endpoint('/api/health'), {
    method: 'OPTIONS',
    headers: {
      Origin: 'https://ranibeautyclinic.com',
      'Access-Control-Request-Method': 'GET',
    },
  });
  assert(response.status === 204, `expected 204, got ${response.status}`);
  assert(
    response.headers.get('access-control-allow-origin') === 'https://ranibeautyclinic.com',
    'expected allowed origin to be reflected'
  );
});

addCheck('unknown CORS origin is not reflected', async () => {
  const response = await fetch(endpoint('/api/health'), {
    method: 'OPTIONS',
    headers: {
      Origin: 'https://evil.example',
      'Access-Control-Request-Method': 'GET',
    },
  });
  assert(response.status === 204, `expected 204, got ${response.status}`);
  assert(
    response.headers.get('access-control-allow-origin') !== 'https://evil.example',
    'unexpectedly reflected unknown origin'
  );
});

addCheck('Cherry webhook rejects unsigned requests', async () => {
  const response = await fetch(endpoint('/api/webhooks/cherry'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'checkout.completed' }),
  });
  assert(response.status !== 200, `unsigned webhook should not succeed, got ${response.status}`);
  assert([401, 503].includes(response.status), `expected 401 or 503, got ${response.status}`);
});

addCheck('contact form rejects invalid payload', async () => {
  const response = await fetch(endpoint('/api/contact'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'not-an-email' }),
  });
  assert([400, 429].includes(response.status), `expected 400 or 429, got ${response.status}`);
});

addCheck('patient magic link rejects invalid email', async () => {
  const response = await fetch(endpoint('/api/patient/auth/magic-link'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'not-an-email' }),
  });
  assert([400, 429].includes(response.status), `expected 400 or 429, got ${response.status}`);
});

let failed = 0;

for (const check of checks) {
  try {
    await check.fn();
    console.log(`PASS ${check.name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${check.name}: ${error.message}`);
  }
}

if (failed > 0) {
  console.error(`${failed} smoke check(s) failed`);
  process.exit(1);
}

console.log('All preview smoke checks passed');
