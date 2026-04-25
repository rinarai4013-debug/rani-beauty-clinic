#!/usr/bin/env node
/**
 * Clinical safety smoke — asserts that intake hints in medicalHistory/medications
 * trigger the metabolic-engine guard rail. Failures here are clinical-safety P0.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const PACE_MS = Number(process.env.PACE_MS || '12000');

const HAZARD_CASES = [
  {
    name: 'pancreatitis',
    text: 'history of acute pancreatitis 2024',
    track: 'glp1',
  },
  {
    name: 'medullary-thyroid',
    text: 'family history of medullary thyroid cancer',
    track: 'glp1',
  },
  {
    name: 'gallstones',
    text: 'recurrent gallstones, awaiting cholecystectomy',
    track: 'glp1',
  },
  {
    name: 'severe-depression',
    text: 'severe depression with prior suicidal ideation',
    track: 'glp1',
  },
  {
    name: 'eating-disorder',
    text: 'history of bulimia in remission',
    track: 'glp1',
  },
];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function submitCase(item) {
  const formData = new FormData();
  formData.append(
    'data',
    JSON.stringify({
      firstName: 'Hazard',
      lastName: item.name,
      email: `hazard-${item.name}@audit.local`,
      phone: '(206) 555-0900',
      dob: '1990-01-01',
      skinConcerns: ['body-contouring'],
      targetAreas: ['face'],
      treatmentInterests: [item.track, 'weight-loss'],
      goals: 'weight-loss',
      timeline: 'asap',
      budget: 'investment',
      skinType: 'normal',
      smsConsent: false,
      medicalHistory: item.text,
    }),
  );

  const res = await fetch(`${BASE_URL}/api/consultation/submit`, {
    method: 'POST',
    headers: { Origin: BASE_URL },
    body: formData,
  });

  let body = null;
  try {
    body = await res.json();
  } catch (error) {
    body = null;
  }

  const status = body?.metabolicRecommendation?.status;
  const safetyBlocked =
    body?.metabolicRecommendation?.safetyBlocked === true ||
    (status && status !== 'eligible') ||
    body?.metabolicRecommendation?.providerReview === true;

  return {
    ok: res.ok,
    httpStatus: res.status,
    case: item,
    response: body,
    safetyBlocked,
    metabolicStatus: status,
  };
}

(async () => {
  let pass = 0;
  let fail = 0;

  for (const item of HAZARD_CASES) {
    const result = await submitCase(item);
    if (result.safetyBlocked) {
      pass += 1;
      console.log(`[PASS] ${item.name} -> blocked (status=${result.metabolicStatus})`);
    } else {
      fail += 1;
      console.error(
        `[FAIL] ${item.name} -> STILL ELIGIBLE (status=${result.metabolicStatus}). Payload:`,
        JSON.stringify(result.response?.metabolicRecommendation),
      );
    }

    if (fail + pass < HAZARD_CASES.length) {
      await delay(PACE_MS);
    }
  }

  console.log(`---\nresult: ${pass}/${HAZARD_CASES.length} hazards blocked`);
  process.exit(fail === 0 ? 0 : 1);
})();
