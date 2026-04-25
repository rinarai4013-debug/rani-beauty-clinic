#!/usr/bin/env node
'use strict';

const processStart = Date.now();
const DEFAULT_TIMEOUT_MS = 12000;
const DEFAULT_BASE_URL =
  process.env.SMOKE_BASE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  'http://localhost:3000';

const CHECK_SPECS = {
  1: '/',
  2: '/book',
  3: 'https://clients.mangomint.com/ranibeautyclinic1/memberships/6',
  4: '/book/hydrafacial-signature',
  5: 'POST /api/contact',
  6: 'Clients table fetch',
  7: 'SlickText brand lookup',
  8: 'Square locations',
  9: 'n8n W17 webhook',
  10: 'Homepage brand voice scan',
};

function parseArgs() {
  const rawArgs = process.argv.slice(2);
  const parsed = {
    failOn: null,
    outputJson: false,
    quiet: false,
    writeToAirtable: true,
  };

  for (const arg of rawArgs) {
    if (arg.startsWith('--fail-on=')) {
      const n = Number.parseInt(arg.replace('--fail-on=', ''), 10);
      parsed.failOn = Number.isNaN(n) ? null : n;
      continue;
    }

    if (arg === '--json') {
      parsed.outputJson = true;
      continue;
    }

    if (arg === '--quiet') {
      parsed.quiet = true;
      continue;
    }

    if (arg === '--no-write') {
      parsed.writeToAirtable = false;
      continue;
    }
  }

  return parsed;
}

function ensureUrl(input) {
  if (!input) throw new Error('Missing base URL');
  return input.startsWith('http') ? input : `https://${input}`;
}

function normalizeUrl(input) {
  if (!input) return '';
  return input.endsWith('/') ? input.slice(0, -1) : input;
}

function withTimeout(timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);
  return { controller, timeout };
}

async function requestJson(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const { timeout, controller } = withTimeout(timeoutMs);
  const headers = {
    Accept: 'application/json, text/plain, */*',
    'User-Agent': 'RaniLiveSmokeHarness/1.0',
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    const body = await response.text();
    return {
      response,
      status: response.status,
      body,
      json: safeJsonParse(body),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function safeJsonParse(input) {
  try {
    return input ? JSON.parse(input) : null;
  } catch {
    return null;
  }
}

function escapeAirtableFormulaValue(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'");
}

function airtableBaseId() {
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!baseId) throw new Error('AIRTABLE_BASE_ID is required');
  return baseId;
}

function airtableToken() {
  const token = process.env.AIRTABLE_PAT;
  if (!token) throw new Error('AIRTABLE_PAT is required');
  return token;
}

function airtableBaseUrl() {
  return `https://api.airtable.com/v0/${airtableBaseId()}`;
}

function airtableTableUrl(tableName, query = {}) {
  const url = new URL(`${airtableBaseUrl()}/${encodeURIComponent(tableName)}`);
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      for (const item of value) {
        url.searchParams.append(key, String(item));
      }
      continue;
    }

    url.searchParams.set(key, String(value));
  }

  return url.toString();
}

async function airtableRequest(tableName, options = {}) {
  const { method = 'GET', query = {}, body } = options;
  const payload = {
    method,
    headers: {
      Authorization: `Bearer ${airtableToken()}`,
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    payload.body = JSON.stringify(body);
  }

  const res = await requestJson(airtableTableUrl(tableName, query), payload);
  return {
    status: res.status,
    json: res.json,
    raw: res.body,
  };
}

function buildRunResult(checks, options = {}) {
  const args = parseArgs();
  const forcedFailure = options.forcedFailure;
  const normalizedChecks = checks.map((check, index) => {
    if (forcedFailure && forcedFailure === index + 1) {
      return {
        ...check,
        ok: false,
        status: 'Fail',
        detail: `Forced failure from --fail-on=${forcedFailure}`,
      };
    }

    return check;
  });

  const isPartial = (status) => String(status || '').toLowerCase() === 'partial';
  const hasFailure = normalizedChecks.some((check) => !check.ok && !isPartial(check.status));
  const hasPartial = normalizedChecks.some((check) => isPartial(check.status));

  return {
    ok: !hasFailure,
    status: hasFailure ? 'Fail' : hasPartial ? 'Partial' : 'Pass',
    triggeredBy: options.triggeredBy || 'manual',
    timestamp: new Date().toISOString(),
    checks: normalizedChecks,
    durationMs: Date.now() - processStart,
  };
}

async function createSmokeRunRecord(result) {
  const fields = {
    Timestamp: result.timestamp,
    Status: result.status,
    'Checks JSON': JSON.stringify(result.checks),
    'Duration ms': result.durationMs,
    'Triggered By': result.triggeredBy || 'manual',
  };

  const response = await airtableRequest('Smoke Test Runs', {
    method: 'POST',
    body: {
      records: [{ fields }],
    },
  });

  if (response.status >= 300) {
    throw new Error(`Failed to write Smoke Test Runs row (${response.status}): ${JSON.stringify(response.json || response.raw || {})}`);
  }
}

function sanitizeCheckResult(check) {
  if (!check || typeof check !== 'object') {
    return {
      name: 'Unknown check',
      ok: false,
      status: 'Fail',
      durationMs: 0,
      detail: 'Invalid check result shape',
    };
  }

  const rawStatus = check.status || (check.ok ? 'Pass' : 'Fail');
  const normalizedStatus = String(rawStatus).toLowerCase() === 'partial' ? 'Partial' : rawStatus;
  return {
    name: check.name,
    ok: Boolean(check.ok),
    status: normalizedStatus,
    durationMs: Number(check.durationMs) || 0,
    detail: check.detail,
    spec: check.spec,
  };
}

async function runCheck(definition) {
  const start = Date.now();
  try {
    const result = await definition.fn();
    return {
      ...sanitizeCheckResult(result),
      durationMs: result?.durationMs ?? Date.now() - start,
      status: result?.status || 'Pass',
      spec: result?.spec || definition.spec,
      ok: Boolean(result?.ok),
    };
  } catch (error) {
    return {
      name: definition.name,
      ok: false,
      status: 'Fail',
      durationMs: Date.now() - start,
      spec: definition.spec,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

async function checkHomepage(baseUrl) {
  const startedAt = Date.now();
  const { response, body } = await requestJson(`${baseUrl}/`);

  if (response.status !== 200) {
    throw new Error(`Homepage returned ${response.status}`);
  }

  if (!/<title>Rani Beauty Clinic<\/title>/i.test(body)) {
    throw new Error('Homepage missing expected title: Rani Beauty Clinic');
  }

  return {
    name: 'Homepage loads',
    ok: true,
    spec: CHECK_SPECS[1],
    durationMs: Date.now() - startedAt,
    detail: 'Homepage rendered and returned expected title.',
    status: 'Pass',
  };
}

async function checkBookRoute(baseUrl) {
  const startedAt = Date.now();
  const { response, body } = await requestJson(`${baseUrl}/book`);

  if (response.status !== 200) {
    throw new Error(`Book page returned ${response.status}`);
  }

  if (!body.includes('mangomint-booking-app-container')) {
    throw new Error('Book page missing mangomint booking container marker');
  }

  return {
    name: '/book loads',
    ok: true,
    spec: CHECK_SPECS[2],
    durationMs: Date.now() - startedAt,
    detail: 'Book route returned expected embed container marker.',
    status: 'Pass',
  };
}

async function checkRoyalAuraMembership() {
  const startedAt = Date.now();
  const { response } = await requestJson('https://clients.mangomint.com/ranibeautyclinic1/memberships/6');

  if (response.status !== 200) {
    throw new Error(`Mangomint membership endpoint returned ${response.status}`);
  }

  return {
    name: 'ROYAL AURA membership page loads',
    ok: true,
    spec: CHECK_SPECS[3],
    durationMs: Date.now() - startedAt,
    detail: 'Mangomint membership page returned 200.',
    status: 'Pass',
  };
}

async function checkMangomintEmbed(baseUrl) {
  const startedAt = Date.now();
  const { response, body } = await requestJson(`${baseUrl}/book/hydrafacial-signature`);

  if (response.status !== 200) {
    throw new Error(`HydraFacial booking route returned ${response.status}`);
  }

  if (!body.includes('booking.mangomint.com')) {
    throw new Error('Hydrafacial route does not include Mangomint embed host marker');
  }

  return {
    name: 'Mangomint embed deep-link works',
    ok: true,
    spec: CHECK_SPECS[4],
    durationMs: Date.now() - startedAt,
    detail: 'Deep-link booking route returns booking.mangomint.com marker.',
    status: 'Pass',
  };
}

async function checkContactApi(baseUrl) {
  const startedAt = Date.now();
  const testEmail = `smoke-test-${Date.now()}@example.com`;
  const payload = {
    name: 'Rani Smoke Test',
    email: testEmail,
    phone: '(425) 555-0109',
    service: 'Smoke Test Harness',
    message: 'Automated smoke test',
    source: 'smoke-test',
    leadSource: 'smoke-test',
  };

  const postResponse = await requestJson(`${baseUrl}/api/contact`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (postResponse.status !== 200) {
    throw new Error(`Contact API returned ${postResponse.status}`);
  }

  const filterByFormula = `FIND('${escapeAirtableFormulaValue(testEmail)}', {Email}) > 0`;
  const lookupResponse = await airtableRequest('Client Intakes', {
    query: {
      filterByFormula,
      maxRecords: 1,
      view: 'Grid view',
    },
  });

  if (lookupResponse.status >= 300) {
    throw new Error(`Contact record lookup failed (${lookupResponse.status})`);
  }

  const records = Array.isArray(lookupResponse.json?.records) ? lookupResponse.json.records : [];
  if (!records.length) {
    throw new Error('Contact record was not created in Airtable within timeout window');
  }

  const recordId = records[0]?.id;
  if (!recordId) {
    throw new Error('Contact record returned without id');
  }

  const deleteResponse = await airtableRequest('Client Intakes', {
    method: 'DELETE',
    query: {
      records: [recordId],
    },
  });

  if (deleteResponse.status >= 300) {
    throw new Error(`Failed to delete smoke test contact row (${deleteResponse.status})`);
  }

  return {
    name: 'Contact form API',
    ok: true,
    spec: CHECK_SPECS[5],
    durationMs: Date.now() - startedAt,
    detail: 'Created and removed smoke test contact successfully.',
    status: 'Pass',
  };
}

async function checkAirtableReadSmoke() {
  const startedAt = Date.now();
  const response = await airtableRequest('Clients', {
    query: {
      maxRecords: 1,
      fields: ['Email'],
    },
  });

  if (response.status !== 200) {
    throw new Error(`Airtable Clients read returned ${response.status}`);
  }

  const records = response.json?.records;
  if (!Array.isArray(records)) {
    throw new Error('Clients read response shape is invalid');
  }

  return {
    name: 'Airtable read smoke',
    ok: true,
    spec: CHECK_SPECS[6],
    durationMs: Date.now() - startedAt,
    detail: `Airtable Clients read succeeded with ${records.length} row(s).`,
    status: 'Pass',
  };
}

async function checkSlickText() {
  const startedAt = Date.now();
  const publicKey = process.env.SLICKTEXT_PUBLIC_KEY;
  const brandId = process.env.SLICKTEXT_BRAND_ID;

  if (!publicKey) {
    throw new Error('SLICKTEXT_PUBLIC_KEY is not configured');
  }
  if (!brandId) {
    throw new Error('SLICKTEXT_BRAND_ID is not configured');
  }

  const { response } = await requestJson(`https://dev.slicktext.com/v1/brands/${brandId}`, {
    headers: {
      Authorization: `Bearer ${publicKey}`,
    },
  });

  if (response.status !== 200) {
    throw new Error(`SlickText API returned ${response.status}`);
  }

  return {
    name: 'SlickText API key valid',
    ok: true,
    spec: CHECK_SPECS[7],
    durationMs: Date.now() - startedAt,
    detail: 'Brand API endpoint returned 200.',
    status: 'Pass',
  };
}

async function checkSquareApi() {
  const startedAt = Date.now();
  const token = process.env.SQUARE_ACCESS_TOKEN;
  if (!token) {
    return {
      name: 'Square API key valid',
      ok: true,
      spec: CHECK_SPECS[8],
      durationMs: Date.now() - startedAt,
      detail: 'Square token not configured; check intentionally marked partial.',
      status: 'Partial',
    };
  }

  const isSandbox =
    process.env.SQUARE_ENV === 'sandbox' ||
    /^sandbox/i.test(token) ||
    /sandbox/i.test(token);
  const endpoint = isSandbox
    ? 'https://connect.squareupsandbox.com/v2/locations'
    : 'https://connect.squareup.com/v2/locations';

  const { response, json } = await requestJson(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Square-Version': '2025-07-23',
    },
  });

  if (response.status !== 200) {
    throw new Error(`Square API returned ${response.status}`);
  }

  if (!Array.isArray(json?.locations)) {
    throw new Error('Square API response does not include locations array');
  }

  return {
    name: 'Square API key valid',
    ok: true,
    spec: CHECK_SPECS[8],
    durationMs: Date.now() - startedAt,
    detail: `Locations endpoint returned ${json.locations.length} location(s).`,
    status: 'Pass',
  };
}

function getW17WebhookUrl() {
  return (
    process.env.W17_POST_TREATMENT_WEBHOOK_URL ||
    process.env.N8N_W17_POST_TREATMENT_WEBHOOK_URL ||
    process.env.N8N_WEBHOOK_W17_URL ||
    process.env.SMOKE_W17_WEBHOOK_URL
  );
}

async function checkN8nWebhook() {
  const startedAt = Date.now();
  const webhook = getW17WebhookUrl();

  if (!webhook) {
    throw new Error('W17 webhook URL is not configured');
  }

  const { response } = await requestJson(webhook, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      test: true,
      dryRun: true,
      source: 'smoke-harness',
      payload: {
        patientName: 'Smoke Test',
        patientPhone: '+14255550100',
      },
    }),
  });

  if (response.status !== 200) {
    throw new Error(`W17 webhook returned ${response.status}`);
  }

  return {
    name: 'n8n webhook reachable',
    ok: true,
    spec: CHECK_SPECS[9],
    durationMs: Date.now() - startedAt,
    detail: 'W17 webhook endpoint accepted test payload.',
    status: 'Pass',
  };
}

async function checkBrandVoice() {
  const startedAt = Date.now();
  const { response, body } = await requestJson(`${DEFAULT_BASE_URL}/`);

  if (response.status !== 200) {
    throw new Error(`Homepage scan returned ${response.status}`);
  }

  if (/\binfusion\b/i.test(body)) {
    throw new Error('Homepage contains banned term "infusion"');
  }

  return {
    name: 'Brand voice health',
    ok: true,
    spec: CHECK_SPECS[10],
    durationMs: Date.now() - startedAt,
    detail: 'No banned brand voice term found on homepage HTML.',
    status: 'Pass',
  };
}

async function runSmokeChecks(options = {}) {
  const args = parseArgs();
  const writeToAirtable = options.writeToAirtable !== false;

  const baseUrl = normalizeUrl(ensureUrl(DEFAULT_BASE_URL));

  const checksToRun = [
    { name: 'Homepage loads', spec: CHECK_SPECS[1], fn: () => checkHomepage(baseUrl) },
    { name: '/book loads', spec: CHECK_SPECS[2], fn: () => checkBookRoute(baseUrl) },
    { name: 'ROYAL AURA membership page loads', spec: CHECK_SPECS[3], fn: () => checkRoyalAuraMembership() },
    { name: 'Mangomint embed deep-link works', spec: CHECK_SPECS[4], fn: () => checkMangomintEmbed(baseUrl) },
    { name: 'Contact form API', spec: CHECK_SPECS[5], fn: () => checkContactApi(baseUrl) },
    { name: 'Airtable read smoke', spec: CHECK_SPECS[6], fn: () => checkAirtableReadSmoke() },
    { name: 'SlickText API key valid', spec: CHECK_SPECS[7], fn: () => checkSlickText() },
    { name: 'Square API key valid', spec: CHECK_SPECS[8], fn: () => checkSquareApi() },
    { name: 'n8n webhook reachable', spec: CHECK_SPECS[9], fn: () => checkN8nWebhook() },
    { name: 'Brand voice health', spec: CHECK_SPECS[10], fn: () => checkBrandVoice() },
  ];

  const checks = await Promise.all(checksToRun.map(runCheck));

  const result = buildRunResult(checks, {
    forcedFailure: args.failOn,
    triggeredBy: options.triggeredBy || 'manual',
  });

  if (writeToAirtable) {
    await createSmokeRunRecord(result);
  }

  return result;
}

function renderHumanReport(run) {
  const header = `Smoke Test: ${run.status} (${run.durationMs}ms)`;
  const rows = run.checks.map((check) => {
    const marker = check.ok ? '✓' : '✗';
    const label =
      String(check.status).toLowerCase() === 'partial'
        ? `${marker} ${check.name} [partial]`
        : `${marker} ${check.name}`;
    return `${label} (${check.durationMs}ms)`;
  });

  return `${header}\n${rows.join('\n')}\n`;
}

if (require.main === module) {
  runSmokeChecks({ writeToAirtable: true })
    .then((run) => {
      if (parseArgs().outputJson) {
        console.log(JSON.stringify(run, null, 2));
      } else if (!parseArgs().quiet) {
        console.log(renderHumanReport(run));
        for (const check of run.checks) {
          if (!check.ok || String(check.status).toLowerCase() === 'partial') {
            console.log(`  - ${check.detail}`);
          }
        }
      }

      process.exit(run.ok ? 0 : 1);
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    });
}

module.exports = {
  runSmokeChecks,
};
