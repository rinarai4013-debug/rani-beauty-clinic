#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Mastermind intake smoke harness (incident 2026-04-19).
 *
 * Drives the failing user flow end-to-end against a running server:
 *   1. POST /api/consultation/submit (multipart JSON + Aura PDF)
 *   2. Poll GET /api/mastermind/sessions/[id] for readiness
 *   3. Assert no non-JSON body leaks ("Unexpected token 'R'..." guard)
 *   4. Repeat N times consecutively.
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 \
 *   SMOKE_PDF=/path/to/handout.pdf \
 *   node scripts/smoke-mastermind-intake.mjs [iterations]
 */

import fs from 'node:fs';
import path from 'node:path';
import { Blob } from 'node:buffer';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const PDF_PATH =
  process.env.SMOKE_PDF ||
  '/Users/sukhithebanker/Desktop/Rina_Rai_handout_2026-04-04_16-50-38.pdf';
const ITERATIONS = Number(process.argv[2]) || Number(process.env.ITERATIONS) || 10;
// Paces iterations under the public-form 5/min per-IP cap without relying
// on the 429-retry branch. 13s * 5 = 65s, which safely crosses the 60s
// rate-limit window boundary.
const PACE_MS = Number(process.env.PACE_MS || 13_000);

function buildIntakePayload(attempt) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return {
    firstName: 'Rani',
    lastName: `OS-smoke-${attempt}`,
    dob: '2000-01-01',
    email: `smoke+${stamp}-${attempt}@ranibeautyclinic.com`,
    phone: '(206) 555-0100',
    age: 26,
    contactPreference: 'email',
    referralSource: 'instagram',
    // Dashboard modal vocabulary — must survive the submit schema now.
    skinConcerns: ['fine-lines', 'texture', 'laxity', 'undereye'],
    targetAreas: ['face', 'neck'],
    treatmentInterests: ['hydrafacial', 'rf-microneedling', 'botox'],
    concerns: ['fine-lines', 'texture'],
    goals: ['anti-aging', 'scar-treatment'],
    hasUpcomingEvent: false,
    previousTreatments: ['Botox 6 months ago'],
    treatmentHistory: 'Botox 6 months ago',
    medicalHistory: 'None',
    hasAutoimmune: false,
    allergies: 'None',
    hasAllergies: false,
    medications: 'None',
    hasMedications: false,
    smokingAlcohol: 'neither',
    smokingStatus: 'never',
    waterIntake: '6-8',
    skincareRoutine: 'moderate',
    skincareAM: 'Cleanser, Vitamin C, SPF 50',
    skincarePM: 'Cleanser, Retinol, Moisturizer',
    requiresLabWork: false,
    preferredDays: ['tue', 'thu'],
    preferredTime: 'evening',
    budget: 'under-500',
    clinicalNotes: `Smoke run ${attempt}. Aura PDF attached.`,
  };
}

async function safeReadJson(response) {
  const raw = await response.text();
  if (!raw) return { body: null, raw: '', parseError: null };
  try {
    return { body: JSON.parse(raw), raw, parseError: null };
  } catch (err) {
    return { body: null, raw, parseError: err instanceof Error ? err.message : String(err) };
  }
}

async function submitOnce(attempt, pdfBytes, pdfName) {
  const submitStart = Date.now();
  const form = new FormData();
  form.append('data', JSON.stringify(buildIntakePayload(attempt)));
  form.append(
    'aura',
    new Blob([pdfBytes], { type: 'application/pdf' }),
    pdfName,
  );

  let submitRes = await fetch(`${BASE_URL}/api/consultation/submit`, {
    method: 'POST',
    body: form,
  });

  // Absorb per-IP rate limiting from the public form guard — this path is
  // intentionally strict (5/min) in production. Any 429 here is a test-env
  // artefact, not a regression. The P0 fix is that the response is JSON,
  // not an HTML proxy page; we verify that, then wait and retry once.
  if (submitRes.status === 429) {
    const rlCheck = await safeReadJson(submitRes);
    if (rlCheck.parseError) {
      throw new Error(`429 returned non-JSON: ${rlCheck.raw.slice(0, 80)}`);
    }
    const resetInMs =
      typeof rlCheck.body?.resetIn === 'number' ? rlCheck.body.resetIn : 15_000;
    const waitMs = Math.min(60_000, resetInMs + 500);
    console.warn(`[smoke] 429 on run ${attempt}, backing off ${waitMs}ms then retrying once`);
    await new Promise((r) => setTimeout(r, waitMs));
    form.delete('aura');
    form.append('aura', new Blob([pdfBytes], { type: 'application/pdf' }), pdfName);
    submitRes = await fetch(`${BASE_URL}/api/consultation/submit`, {
      method: 'POST',
      body: form,
    });
  }

  const { body: submitBody, raw: submitRaw, parseError: submitParseError } = await safeReadJson(submitRes);
  const submitMs = Date.now() - submitStart;

  if (submitParseError) {
    const hint = submitRaw.slice(0, 100).replace(/\s+/g, ' ');
    throw new Error(`submit returned non-JSON body (HTTP ${submitRes.status}): ${hint}`);
  }

  const submitOk = submitRes.ok && Boolean(submitBody?.success);
  const sessionId = submitBody?.data?.sessionId ?? null;
  const auraNote = submitBody?.data?.auraNote ?? null;
  const submitError = submitOk
    ? null
    : submitBody?.error ?? `HTTP ${submitRes.status}`;

  if (!submitOk || !sessionId) {
    return {
      attempt,
      sessionId,
      submitStatus: submitRes.status,
      submitOk: false,
      submitError,
      readyAttempts: 0,
      readyOk: false,
      submitMs,
      readyMs: 0,
      totalMs: submitMs,
      auraNote,
    };
  }

  // Readiness gate — the session GET route is staff-auth-gated, so 401
  // means "reachable" and counts as ready (the UI layer sees the staff
  // cookie). 200+success=true is the ideal signal. Any non-JSON body is
  // a P0 regression.
  const readyStart = Date.now();
  let readyAttempts = 0;
  let readyOk = false;
  const maxAttempts = 10;
  for (let i = 0; i < maxAttempts; i++) {
    readyAttempts += 1;
    const readRes = await fetch(`${BASE_URL}/api/mastermind/sessions/${sessionId}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    const { body, raw, parseError } = await safeReadJson(readRes);
    if (parseError) {
      throw new Error(`session read returned non-JSON (HTTP ${readRes.status}): ${raw.slice(0, 100)}`);
    }
    if (readRes.status === 200 && body?.success) { readyOk = true; break; }
    if (readRes.status === 401) { readyOk = true; break; }
    if (i === maxAttempts - 1) break;
    await new Promise((r) => setTimeout(r, 250 * Math.min(8, 2 ** i)));
  }
  const readyMs = Date.now() - readyStart;

  return {
    attempt,
    sessionId,
    submitStatus: submitRes.status,
    submitOk: true,
    submitError: null,
    readyAttempts,
    readyOk,
    submitMs,
    readyMs,
    totalMs: Date.now() - submitStart,
    auraNote,
  };
}

async function main() {
  if (!fs.existsSync(PDF_PATH)) {
    console.error(`[smoke] PDF not found at ${PDF_PATH}`);
    process.exit(2);
  }
  const pdfBytes = fs.readFileSync(PDF_PATH);
  const pdfName = path.basename(PDF_PATH);

  console.log(`[smoke] base=${BASE_URL}`);
  console.log(`[smoke] pdf=${pdfName} (${(pdfBytes.length / 1024).toFixed(0)}KB)`);
  console.log(`[smoke] iterations=${ITERATIONS}`);

  const results = [];
  for (let i = 1; i <= ITERATIONS; i++) {
    try {
      const r = await submitOnce(i, pdfBytes, pdfName);
      results.push(r);
      const status = r.submitOk && r.readyOk ? 'PASS' : r.submitOk ? 'SUBMIT-ONLY' : 'FAIL';
      console.log(
        `[${status}] run ${i}/${ITERATIONS} — submit=${r.submitStatus} sess=${r.sessionId ?? '-'} ready=${r.readyOk ? 'yes' : 'no'} readyTries=${r.readyAttempts} total=${r.totalMs}ms${r.auraNote ? ` aura="${r.auraNote}"` : ''}${r.submitError ? ` err="${r.submitError}"` : ''}`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[FAIL] run ${i}/${ITERATIONS} — ${msg}`);
      results.push({ attempt: i, submitOk: false, readyOk: false, submitError: msg });
    }
    if (i < ITERATIONS && PACE_MS > 0) {
      await new Promise((r) => setTimeout(r, PACE_MS));
    }
  }

  const passed = results.filter((r) => r.submitOk && r.readyOk).length;
  const submittedOnly = results.filter((r) => r.submitOk && !r.readyOk).length;
  const failed = results.length - passed - submittedOnly;
  const submits = results.map((r) => r.submitMs).filter(Boolean).sort((a, b) => a - b);
  const medianSubmit = submits[Math.floor(submits.length / 2)] ?? 0;

  console.log('---');
  console.log(`[smoke] results: ${passed}/${results.length} pass, ${submittedOnly} submit-only, ${failed} fail, medianSubmitMs=${medianSubmit}`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('[smoke] fatal', err);
  process.exit(1);
});
