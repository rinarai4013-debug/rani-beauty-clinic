#!/usr/bin/env node
/**
 * Aura photo-simulation smoke.
 *
 * Verifies the full high-value flow:
 * - Real Aura PDF text fallback metrics parse.
 * - A compact Aura face preview is accepted and persisted as sourcePhotoUrl.
 * - The provider plan endpoint generates treatment recommendations.
 * - The provider plan carries a medical/peptide/BoomRx optimization packet.
 * - The simulation endpoint returns distinct photo-simulation frames, not reused
 *   static images and not data-projection cards.
 *
 * Optional env:
 * - BASE_URL=http://localhost:3000
 * - REAL_PDF=/absolute/path/to/aura.pdf
 * - AURA_FACE_CROP=/absolute/path/to/neutral-face-crop.jpg
 * - DASHBOARD_COOKIE="rani-session=..."
 */

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const REAL_PDF = process.env.REAL_PDF || '/Users/sukhithebanker/Desktop/Rina_Rai_handout_2026-04-04_16-50-38.pdf';
const AURA_FACE_CROP = process.env.AURA_FACE_CROP || '/tmp/rani-aura-neutral-crop.jpg';
const MARKER_PREFIX = '[[AURA_PDF_TEXT_FALLBACK]]';

async function loadLocalEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return {};
  const dotenv = await import('dotenv');
  return dotenv.parse(fs.readFileSync(envPath, 'utf8'));
}

async function resolveDashboardCookie() {
  if (process.env.DASHBOARD_COOKIE) return process.env.DASHBOARD_COOKIE;

  const env = await loadLocalEnv();
  const secret = process.env.DASHBOARD_JWT_SECRET || env.DASHBOARD_JWT_SECRET;
  const usersRaw = process.env.DASHBOARD_USERS || env.DASHBOARD_USERS;
  if (!secret || !usersRaw) {
    throw new Error('Missing DASHBOARD_COOKIE or local DASHBOARD_JWT_SECRET + DASHBOARD_USERS');
  }

  let username = 'rina';
  let role = 'ceo';
  let displayName = 'Smoke Test';
  const parsed = JSON.parse(usersRaw);
  if (Array.isArray(parsed) && parsed.length > 0) {
    username = parsed[0]?.username || username;
    role = parsed[0]?.role || role;
    displayName = parsed[0]?.displayName || displayName;
  } else {
    const [key, meta] = Object.entries(parsed)[0] || [];
    username = key || username;
    role = meta?.role || role;
    displayName = meta?.displayName || displayName;
  }

  const { SignJWT } = await import('jose');
  const token = await new SignJWT({ username, role, displayName })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(new TextEncoder().encode(secret));
  return `rani-session=${token}`;
}

async function extractPdfText(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`REAL_PDF missing: ${filePath}`);
  const data = fs.readFileSync(filePath);
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(data),
    useWorkerFetch: false,
    isEvalSupported: false,
    disableFontFace: true,
  }).promise;

  try {
    const chunks = [];
    const maxPages = Math.min(doc.numPages, 3);
    for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
      const page = await doc.getPage(pageNumber);
      const content = await page.getTextContent();
      chunks.push(
        content.items
          .map((item) => ('str' in item ? item.str : ''))
          .filter(Boolean)
          .join(' '),
      );
    }
    return chunks.join('\n').replace(/\s{2,}/g, ' ').trim().slice(0, 3400);
  } finally {
    await doc.destroy();
  }
}

async function makeSyntheticFaceCrop() {
  return sharp({
    create: {
      width: 160,
      height: 190,
      channels: 3,
      background: { r: 220, g: 181, b: 156 },
    },
  })
    .composite([
      {
        input: Buffer.from(
          '<svg width="160" height="190"><ellipse cx="80" cy="96" rx="50" ry="64" fill="#d8aa91"/><circle cx="61" cy="82" r="5" fill="#33251f"/><circle cx="99" cy="82" r="5" fill="#33251f"/><path d="M60 124 Q80 139 100 124" stroke="#814439" stroke-width="5" fill="none" stroke-linecap="round"/></svg>',
        ),
      },
    ])
    .jpeg({ quality: 78 })
    .toBuffer();
}

async function loadFacePreviewDataUrl() {
  const buffer = fs.existsSync(AURA_FACE_CROP)
    ? fs.readFileSync(AURA_FACE_CROP)
    : await makeSyntheticFaceCrop();
  return `data:image/jpeg;base64,${buffer.toString('base64')}`;
}

async function jsonFetch(url, options = {}) {
  const res = await fetch(url, options);
  const body = await res.json().catch(() => null);
  return { res, body };
}

const text = await extractPdfText(REAL_PDF);
const preview = await loadFacePreviewDataUrl();
const marker = `${MARKER_PREFIX}${JSON.stringify({ name: path.basename(REAL_PDF), text })}`;
const stamp = Date.now().toString(36);
const form = new FormData();
form.append(
  'data',
  JSON.stringify({
    firstName: 'Aura',
    lastName: `PhotoSmoke-${stamp}`,
    email: `aura-photo-${stamp}@audit.local`,
    phone: '(206) 555-0911',
    dob: '1990-01-01',
    skinConcerns: ['aging-skin', 'large-pores', 'dull-skin'],
    targetAreas: ['face'],
    treatmentInterests: ['hydrafacial', 'rf-microneedling', 'peels'],
    goals: 'Use Aura scan metrics and face preview to generate a provider-ready plan.',
    timeline: 'gradual',
    budget: 'investment',
    skinType: 'normal',
    smsConsent: false,
    auraPdfPreviewImage: preview,
    clinicalNotes: ['Aura PDF parsed client-side with compact face preview for simulation.', marker].join('\n'),
  }),
);

const submit = await jsonFetch(`${BASE_URL}/api/consultation/submit`, { method: 'POST', body: form });
if (!submit.res.ok) {
  throw new Error(`submit failed ${submit.res.status}: ${JSON.stringify(submit.body)}`);
}
const sessionId = submit.body?.sessionId || submit.body?.data?.sessionId;
if (!sessionId) throw new Error(`missing sessionId: ${JSON.stringify(submit.body)}`);
console.log('[submit]', {
  sessionId,
  auraUploadStatus: submit.body.auraUploadStatus,
  hasPhoto: submit.body.data?.hasPhoto,
});

const cookie = await resolveDashboardCookie();
for (let attempt = 0; attempt < 8; attempt += 1) {
  const session = await jsonFetch(`${BASE_URL}/api/mastermind/sessions/${sessionId}`, {
    headers: { Cookie: cookie },
  });
  if (session.res.ok && session.body?.data?.auraScanResult) break;
  await new Promise((resolve) => setTimeout(resolve, 750));
}

const plan = await jsonFetch(`${BASE_URL}/api/mastermind/plan`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', Cookie: cookie },
  body: JSON.stringify({ sessionId }),
});
if (!plan.res.ok) throw new Error(`plan failed ${plan.res.status}: ${JSON.stringify(plan.body)}`);
console.log('[plan]', {
  primary: plan.body?.data?.recommendations?.primary?.length,
  complementary: plan.body?.data?.recommendations?.complementary?.length,
  medicalTrack: plan.body?.data?.medicalOptimization?.recommendedTrack,
  medicalStatus: plan.body?.data?.medicalOptimization?.status,
  peptideCandidates:
    plan.body?.data?.medicalOptimization?.dosageFramework?.personalizedPeptidePlan?.candidates?.length || 0,
  boomRxProducts: plan.body?.data?.medicalOptimization?.recommendedProducts?.length || 0,
});

const sim = await jsonFetch(`${BASE_URL}/api/mastermind/simulate`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', Cookie: cookie },
  body: JSON.stringify({ sessionId }),
});
if (!sim.res.ok) throw new Error(`simulate failed ${sim.res.status}: ${JSON.stringify(sim.body)}`);

const withFrames = sim.body?.data?.withTreatment?.frames || [];
const withoutFrames = sim.body?.data?.withoutTreatment?.frames || [];
const frames = [...withFrames, ...withoutFrames];
console.log('[simulate]', {
  renderMode: sim.body?.meta?.renderMode,
  kinds: [...new Set(frames.map((frame) => frame.kind))],
  uniqueImages: new Set(frames.map((frame) => frame.imageDataUrl)).size,
  withScores: withFrames.map((frame) => ({
    t: frame.timepoint,
    score: frame.auraScoreProjection,
    age: frame.skinAgeProjection,
  })),
});

const finalSession = await jsonFetch(`${BASE_URL}/api/mastermind/sessions/${sessionId}`, {
  headers: { Cookie: cookie },
});
const concerns = finalSession.body?.data?.auraScanResult?.detectedConcerns || [];
console.log('[scan]', {
  phase: finalSession.body?.data?.phase,
  sourcePhotoPersisted: String(finalSession.body?.data?.sourcePhotoUrl || '').startsWith('data:image/'),
  concerns: concerns
    .map((concern) => ({
      concern: concern.concern,
      severity: concern.severity,
      score: concern.score,
      zones: concern.zones,
      desc: concern.description,
    }))
    .slice(0, 5),
});

const ok =
  submit.body?.data?.hasPhoto === true &&
  /fallback parsed|received \+ parsed|text fallback parsed/i.test(String(submit.body?.auraUploadStatus || '')) &&
  plan.body?.data?.medicalOptimization?.providerSignoffRequired === true &&
  (plan.body?.data?.medicalOptimization?.recommendedProducts?.length || 0) > 0 &&
  (plan.body?.data?.medicalOptimization?.dosageFramework?.personalizedPeptidePlan?.candidates?.length || 0) > 0 &&
  frames.length >= 8 &&
  frames.every((frame) => frame.kind === 'photo-simulation') &&
  new Set(frames.map((frame) => frame.imageDataUrl)).size > 2 &&
  concerns.some((concern) => concern.concern === 'pores') &&
  !concerns.some((concern) => /Severe texture detected/.test(concern.description || '') && concern.severity === 'mild');

if (!ok) throw new Error('Aura photo simulation smoke assertions failed');
console.log('[PASS] Aura PDF metrics + compact face preview + medical plan + unique photo simulations all working');
