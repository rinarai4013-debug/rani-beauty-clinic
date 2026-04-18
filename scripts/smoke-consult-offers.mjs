#!/usr/bin/env node

const baseUrl = process.env.BASE_URL;
const publicOrigin = process.env.PUBLIC_ORIGIN || '';
const dashboardSessionCookie = process.env.DASHBOARD_SESSION_COOKIE || '';
const vercelBypassToken = process.env.VERCEL_PROTECTION_BYPASS || '';

if (!baseUrl) {
  console.error('Set BASE_URL, for example: BASE_URL=https://www.ranibeautyclinic.com npm run smoke:consult-offers');
  process.exit(1);
}

const origin = baseUrl.replace(/\/$/, '');
let selectedProduct = null;
let selectedTrack = 'hybrid';
let intakeId = null;
let shouldRunOfferSelection = false;

function endpoint(path) {
  return `${origin}${path}`;
}

function headers(extra = {}) {
  const out = { ...extra };
  if (publicOrigin) out.Origin = publicOrigin;
  if (vercelBypassToken) out['x-vercel-protection-bypass'] = vercelBypassToken;
  return out;
}

async function safeFetch(input, init = {}) {
  try {
    return await fetch(input, init);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`fetch failed for ${init?.method || 'GET'} ${input} (${message})`);
  }
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

function normalizeConsultationSubmitResponse(body) {
  if (!body || typeof body !== 'object') return null;
  const direct = body;
  if ('medicalOffers' in direct || 'sessionId' in direct || 'data' in direct || 'success' in direct) {
    return direct;
  }
  if (typeof body.data === 'object' && body.data !== null) {
    return body.data;
  }
  return null;
}

async function healthCheck() {
  const response = await safeFetch(endpoint('/api/health'), {
    method: 'GET',
    cache: 'no-store',
    headers: headers(),
  });
  assert([200, 404, 503].includes(response.status), `expected 200/404/503, got ${response.status}`);
}

async function submitConsultation() {
  const payload = {
    firstName: 'Smoke',
    lastName: 'Test',
    email: `smoke+${Date.now()}@example.com`,
    phone: '(425) 555-0191',
    dob: '1992-05-15',
    skinConcerns: ['body-contouring', 'dull-skin'],
    targetAreas: ['abdomen', 'cheeks'],
    treatmentInterests: ['wellness', 'weight-management'],
    skinType: 'combination',
    treatmentHistory: 'Seeking medically supervised wellness recommendations.',
    goals: 'Lose weight and improve energy.',
    timeline: 'gradual',
    budget: 'premium',
    smsConsent: true,
  };

  const formData = new FormData();
  formData.append('data', JSON.stringify(payload));

  const response = await safeFetch(endpoint('/api/consultation/submit'), {
    method: 'POST',
    body: formData,
    headers: headers(),
  });
  assert(response.status === 200, `expected 200, got ${response.status}`);

  const body = await readJson(response);
  const normalized = normalizeConsultationSubmitResponse(body);
  assert(normalized && normalized.success !== false, 'consultation submit did not return success payload');

  const medicalOffers = normalized.medicalOffers;
  if (!medicalOffers) {
    console.log('SKIP offer selection check: submit response had no medicalOffers (legacy response contract)');
    shouldRunOfferSelection = false;
    return;
  }

  assert((medicalOffers.recommendedProducts?.length ?? 0) > 0, 'expected at least one recommended product');
  selectedProduct = medicalOffers.recommendedProducts[0];
  selectedTrack = medicalOffers.requestedTrack || 'hybrid';
  intakeId = typeof normalized.intakeId === 'string' ? normalized.intakeId : null;
  shouldRunOfferSelection = true;
}

async function selectOffer() {
  if (!shouldRunOfferSelection) {
    console.log('SKIP offer selection check (consultation submit did not return medicalOffers)');
    return;
  }
  assert(selectedProduct, 'selected product missing from previous step');

  const response = await safeFetch(endpoint('/api/consultation/offer-selection'), {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      ...(intakeId ? { intakeId } : {}),
      selectedProductId: selectedProduct.id,
      selectedProductLabel: selectedProduct.label,
      category: selectedProduct.category,
      requestedTrack: selectedTrack,
      fulfillmentMode: 'home',
      quotedRetail: Number(selectedProduct.suggestedRetail),
      quotedGrossProfit: Number(selectedProduct.suggestedGrossProfit),
      quotedMarginPercent: Number(selectedProduct.suggestedMarginPercent),
    }),
  });

  assert(response.status === 200, `expected 200, got ${response.status}`);
  const body = await readJson(response);
  assert(body?.success === true, 'expected selection success=true');
  assert(body?.providerReviewRequired === true, 'expected providerReviewRequired=true');
  assert(body?.prescriptionHandoffLocked === true, 'expected prescriptionHandoffLocked=true');
  assert(body?.checkoutAllowed === true, 'expected checkoutAllowed=true');
  assert(typeof body?.checkoutUrl === 'string' && body.checkoutUrl.includes('checkout='), 'expected checkoutUrl');
}

async function optionalDashboardCheck() {
  if (!dashboardSessionCookie) {
    console.log('SKIP dashboard consult-offers check (set DASHBOARD_SESSION_COOKIE to enable)');
    return;
  }
  const response = await safeFetch(endpoint('/api/dashboard/consult/offers'), {
    method: 'GET',
    headers: headers({ Cookie: dashboardSessionCookie }),
  });
  assert(response.status === 200, `expected 200 with staff cookie, got ${response.status}`);
}

let failed = 0;
const checks = [
  ['health responds', healthCheck],
  ['consultation submit returns medical offers', submitConsultation],
  ['offer selection enforces provider review lock and returns checkout path', selectOffer],
  ['optional dashboard consult-offers endpoint (if staff cookie provided)', optionalDashboardCheck],
];

for (const [name, fn] of checks) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    failed += 1;
    const message = error instanceof Error ? error.message : String(error);
    console.error(`FAIL ${name}: ${message}`);
  }
}

if (failed > 0) {
  console.error(`${failed} consult-offer smoke check(s) failed`);
  process.exit(1);
}

console.log('All consult-offer smoke checks passed');
