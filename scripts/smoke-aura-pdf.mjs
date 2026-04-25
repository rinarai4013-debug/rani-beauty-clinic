#!/usr/bin/env node
/**
 * Aura PDF smoke — validates real/fake/oversized/malformed/no-file flows.
 * Exits non-zero if any case fails.
 */

import { existsSync, writeFileSync } from 'node:fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const REAL_PDF = process.env.REAL_PDF || '/Users/sukhithebanker/Desktop/Rina_Rai_handout_2026-04-04_16-50-38.pdf';
const PACE_MS = Number(process.env.PACE_MS || '12000');

const baselineData = {
  firstName: 'Aura',
  lastName: 'Audit',
  email: 'aura-smoke@audit.local',
  phone: '(206) 555-0800',
  dob: '1990-01-01',
  skinConcerns: ['aging-skin'],
  targetAreas: ['face'],
  treatmentInterests: ['hydrafacial'],
  goals: 'anti-aging',
  timeline: 'gradual',
  budget: 'moderate',
  skinType: 'normal',
  smsConsent: false,
};

const FAKE_PDF = '/tmp/aura-fake.pdf';
const MALFORMED_PDF = '/tmp/aura-malformed.pdf';
const OVERSIZED_PDF = '/tmp/aura-oversize.pdf';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function appendFile(formData, filePath, fieldName, fileName) {
  if (!existsSync(filePath)) {
    throw new Error(`fixture missing: ${filePath}`);
  }

  const data = await import('node:fs/promises').then((fs) => fs.readFile(filePath));
  formData.append(fieldName, new Blob([data], { type: 'application/pdf' }), fileName);
}

async function submitPayload(name, buildForm) {
  const form = new FormData();
  const payload = {
    ...baselineData,
    lastName: `${baselineData.lastName}-${name}`,
    email: `aura-${name}@audit.local`,
  };

  form.append('data', JSON.stringify(payload));
  await buildForm(form);

  const res = await fetch(`${BASE_URL}/api/consultation/submit`, {
    method: 'POST',
    headers: { Origin: BASE_URL },
    body: form,
  });

  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  return { name, status: res.status, body };
}

(async () => {
  writeFileSync(FAKE_PDF, 'this is not a pdf');
  writeFileSync(MALFORMED_PDF, '%PDF-1.4\n%bogus\nno real stream data');
  writeFileSync(OVERSIZED_PDF, Buffer.alloc(12 * 1024 * 1024, 0x61)); // 12MB

  const cases = [
    {
      name: 'real',
      build: (form) =>
        appendFile(form, REAL_PDF, 'aura', 'real.pdf'),
      check: (res) =>
        res.status === 200 &&
        typeof res.body?.auraUploadStatus === 'string' &&
        res.body.auraUploadStatus.includes('Aura PDF received') &&
        !/not parsed/i.test(res.body.auraUploadStatus) &&
        (res.body.auraUploadWarnings?.length || 0) === 0,
    },
    {
      name: 'fake',
      build: (form) =>
        appendFile(form, FAKE_PDF, 'aura', 'fake.pdf'),
      check: (res) => {
        if (res.status !== 200) return false;
        const statusText = String(res.body?.auraUploadStatus || '');
        const warnings = Array.isArray(res.body?.auraUploadWarnings) ? res.body.auraUploadWarnings.length : 0;
        return /not parsed/i.test(statusText) || warnings > 0;
      },
    },
    {
      name: 'oversized',
      build: (form) =>
        appendFile(form, OVERSIZED_PDF, 'aura', 'oversized.pdf'),
      check: (res) =>
        res.status === 413 || (res.body && /body too large/i.test(res.body?.error || '')),
    },
    {
      name: 'malformed',
      build: (form) =>
        appendFile(form, MALFORMED_PDF, 'aura', 'malformed.pdf'),
      check: (res) => {
        if (res.status !== 200) return false;
        const statusText = String(res.body?.auraUploadStatus || '');
        const warnings = Array.isArray(res.body?.auraUploadWarnings) ? res.body.auraUploadWarnings.length : 0;
        return /not parsed/i.test(statusText) || warnings > 0;
      },
    },
    {
      name: 'nofile',
      build: () => Promise.resolve(),
      check: (res) => {
        if (res.status !== 200) return false;
        const statusText = String(res.body?.auraUploadStatus || '');
        return !statusText.includes('Aura PDF received') && !/not parsed/i.test(statusText);
      },
    },
  ];

  let pass = 0;

  for (let idx = 0; idx < cases.length; idx += 1) {
    const c = cases[idx];
    let result;
    try {
      result = await submitPayload(c.name, c.build);
    } catch (err) {
      result = { name: c.name, status: 0, body: { error: String(err) } };
    }

    const ok = c.check(result);
    if (ok) {
      pass += 1;
      console.log(`[PASS] ${c.name} -> status=${result.status}`);
    } else {
      console.error(`[FAIL] ${c.name} -> status=${result.status} body=${JSON.stringify(result.body)}`);
    }

    if (idx < cases.length - 1) {
      await sleep(PACE_MS);
    }
  }

  console.log(`result: ${pass}/${cases.length}`);
  process.exit(pass === cases.length ? 0 : 1);
})();
