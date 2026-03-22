/**
 * 100 Test Response Generator
 *
 * Simulates 100 diverse client consultation submissions to stress-test:
 * 1. Consultation form validation (schema)
 * 2. Service matching (unified catalog)
 * 3. Treatment plan parsing
 * 4. Package generation
 * 5. Filter preset mapping
 * 6. Skin analysis concern detection
 *
 * Run: npx tsx scripts/test-100-responses.ts
 */

// ─── Imports ────────────────────────────────────────────────────────

import { stepSchemas, validateStep, SKIN_CONCERN_OPTIONS, SKIN_TYPES, TIMELINE_OPTIONS, BUDGET_OPTIONS } from '../src/lib/consultation/schema';
import { getFollowUpQuestions, shouldShowBodyMap, getRecommendedServices } from '../src/lib/consultation/conditional-logic';
import { UNIFIED_CATALOG, searchServices, getServicesByCategory, getServicesByConcern, type ServiceCategory } from '../src/data/services/unified-catalog';
import { SERVICE_CATALOG, matchService, parseCostBreakdown, buildPackagesFromAI, parseProgramPlan } from '../src/lib/treatment-plan/parser';
import { generatePackages } from '../src/lib/plan-builder/package-generator';
import { TREATMENT_PRESETS, CATEGORY_TO_PRESETS, getPresetsForService } from '../src/lib/photo-simulation/filter-presets';

// ─── Test Data Generators ───────────────────────────────────────────

const FIRST_NAMES = ['Jasmine', 'Aisha', 'Priya', 'Sofia', 'Maya', 'Luna', 'Aria', 'Zara', 'Nina', 'Leila', 'Sarah', 'Emma', 'Olivia', 'Mia', 'Charlotte', 'Amelia', 'Harper', 'Evelyn', 'Abigail', 'Ella', 'Grace', 'Chloe', 'Victoria', 'Riley', 'Nora', 'Lily', 'Eleanor', 'Hannah', 'Addison', 'Aubrey', 'Kim', 'Jen', 'Lisa', 'Rachel', 'Monica', 'Deepika', 'Meera', 'Ananya', 'Fatima', 'Yuki'];
const LAST_NAMES = ['Patel', 'Kim', 'Chen', 'Rodriguez', 'Williams', 'Johnson', 'Brown', 'Davis', 'Wilson', 'Garcia', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Lee', 'Thompson', 'White', 'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Young', 'Hall', 'Allen', 'King', 'Wright', 'Scott', 'Nguyen', 'Singh', 'Shah', 'Ali', 'Park'];
const GOALS = [
  'I want glowing skin for my wedding in October',
  'Looking to reduce fine lines around my eyes and forehead',
  'I want to clear up my acne scarring from my teenage years',
  'Interested in body contouring and weight management',
  'I want to look refreshed and youthful without looking "done"',
  'My skin has lost its glow — I want radiance back',
  'I have uneven skin tone and dark spots from sun damage',
  'I want to tighten my jawline and neck area',
  'Looking for a complete skin transformation program',
  'I want to maintain my results from previous treatments elsewhere',
  'Preparing for a big event in 3 months — want to look amazing',
  'I have large pores and dull skin — want a fresh start',
  'Want to reduce redness and rosacea',
  'Looking for permanent hair removal solution',
  'I want to start a preventative skincare routine in my late 20s',
  'Post-pregnancy skin restoration — loose skin and stretch marks',
  'Hormonal acne that keeps coming back',
  'Want smoother skin texture overall',
  'Dark circles under my eyes that makeup cant hide',
  'I want the best skin of my life — budget is not an issue',
];
const TREATMENT_HISTORIES = [
  'Never had professional treatments before',
  'Had a few facials at a day spa',
  'Regular Botox every 4 months for 2 years',
  'Tried chemical peels but wasn\'t happy with results',
  'Had laser hair removal on legs — loved it',
  'Previous HydraFacials — want to try something more advanced',
  'Microneedling once, liked the results',
  'Tried at-home LED device, didn\'t see much change',
  'Had fillers in lips 6 months ago',
  'Regular facials and peels for years',
  '',
];
const ROUTINES = [
  'Cetaphil cleanser, vitamin C serum, SPF 50 daily',
  'Just soap and water honestly',
  'Full Korean skincare routine — 10 steps',
  'CeraVe cleanser and moisturizer',
  'Prescription tretinoin + moisturizer',
  'Nothing consistent — whatever samples I have',
  'La Mer everything',
  'Drunk Elephant routine',
  '',
];

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomSubset<T>(arr: readonly T[], min: number, max: number): T[] {
  const count = min + Math.floor(Math.random() * (max - min + 1));
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function randomPhone(): string {
  const area = ['425', '206', '253', '360'][Math.floor(Math.random() * 4)];
  const mid = String(Math.floor(Math.random() * 900) + 100);
  const end = String(Math.floor(Math.random() * 9000) + 1000);
  return `(${area}) ${mid}-${end}`;
}

function randomDOB(): string {
  const year = 1970 + Math.floor(Math.random() * 38); // 18-56 years old
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function randomEmail(first: string, last: string): string {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'icloud.com', 'hotmail.com'];
  return `${first.toLowerCase()}.${last.toLowerCase()}${Math.floor(Math.random() * 99)}@${randomPick(domains)}`;
}

// ─── Generate Test Response ─────────────────────────────────────────

interface TestResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  skinConcerns: string[];
  targetAreas: string[];
  treatmentInterests: string[];
  skinType: string;
  treatmentHistory: string;
  goals: string;
  timeline: string;
  budget: string;
  smsConsent: boolean;
}

function generateTestResponse(id: number): TestResponse {
  const firstName = randomPick(FIRST_NAMES);
  const lastName = randomPick(LAST_NAMES);

  return {
    id,
    firstName,
    lastName,
    email: randomEmail(firstName, lastName),
    phone: randomPhone(),
    dob: randomDOB(),
    skinConcerns: randomSubset(SKIN_CONCERN_OPTIONS, 1, 4),
    targetAreas: randomSubset(['forehead', 'cheeks', 'nose', 'chin', 'jawline', 'under-eyes', 'lips', 'neck', 'chest', 'arms', 'abdomen', 'legs'], 1, 5),
    treatmentInterests: randomSubset(['facial', 'laser-hair-removal', 'rf-microneedling', 'skin-tightening', 'chemical-peel', 'laser', 'injectables', 'wellness', 'weight-management', 'skincare'] as const, 1, 4),
    skinType: randomPick([...SKIN_TYPES]),
    treatmentHistory: randomPick(TREATMENT_HISTORIES),
    goals: randomPick(GOALS),
    timeline: randomPick([...TIMELINE_OPTIONS]),
    budget: randomPick([...BUDGET_OPTIONS]),
    smsConsent: Math.random() > 0.2,
  };
}

// ─── Test Runner ────────────────────────────────────────────────────

interface TestResult {
  id: number;
  name: string;
  validationPassed: boolean;
  validationErrors: string[];
  concernCount: number;
  interestCount: number;
  recommendedServicesCount: number;
  followUpQuestionsCount: number;
  showBodyMap: boolean;
  matchedServicesCount: number;
  unmatchedConcerns: string[];
  presetsMapped: boolean;
  presetsCount: number;
  catalogSearchWorks: boolean;
  packageGenerationWorks: boolean;
  packageTiers: number;
}

function runTest(response: TestResponse): TestResult {
  const errors: string[] = [];

  // 1. Validate each step
  let validationPassed = true;

  // Step 2: Personal info
  const step2Result = validateStep(1, {
    firstName: response.firstName,
    lastName: response.lastName,
    email: response.email,
    phone: response.phone,
    dob: response.dob,
  });
  if (!step2Result.success) {
    validationPassed = false;
    errors.push(`Step2: ${JSON.stringify(step2Result.errors)}`);
  }

  // Step 3: Concerns
  const step3Result = validateStep(2, {
    skinConcerns: response.skinConcerns,
    targetAreas: response.targetAreas,
  });
  if (!step3Result.success) {
    validationPassed = false;
    errors.push(`Step3: ${JSON.stringify(step3Result.errors)}`);
  }

  // Step 4: Interests
  const step4Result = validateStep(3, {
    treatmentInterests: response.treatmentInterests,
  });
  if (!step4Result.success) {
    validationPassed = false;
    errors.push(`Step4: ${JSON.stringify(step4Result.errors)}`);
  }

  // Step 5: History
  const step5Result = validateStep(4, {
    skinType: response.skinType,
    treatmentHistory: response.treatmentHistory,
  });
  if (!step5Result.success) {
    validationPassed = false;
    errors.push(`Step5: ${JSON.stringify(step5Result.errors)}`);
  }

  // Step 6: Goals
  const step6Result = validateStep(5, {
    goals: response.goals,
    timeline: response.timeline,
    budget: response.budget,
  });
  if (!step6Result.success) {
    validationPassed = false;
    errors.push(`Step6: ${JSON.stringify(step6Result.errors)}`);
  }

  // 2. Conditional logic
  const followUpQuestions = getFollowUpQuestions(response.skinConcerns, response.treatmentInterests);
  const showBodyMap = shouldShowBodyMap(response.skinConcerns);

  // 3. Service recommendations
  const recommendedServices = getRecommendedServices(response.skinConcerns);

  // 4. Catalog search per concern
  const unmatchedConcerns: string[] = [];
  let matchedServicesCount = 0;
  for (const concern of response.skinConcerns) {
    const services = getServicesByConcern(concern);
    if (services.length === 0) {
      unmatchedConcerns.push(concern);
    } else {
      matchedServicesCount += services.length;
    }
  }

  // 5. Filter preset mapping
  let presetsMapped = true;
  let presetsCount = 0;
  for (const interest of response.treatmentInterests) {
    const presets = CATEGORY_TO_PRESETS[interest as ServiceCategory];
    if (!presets || presets.length === 0) {
      presetsMapped = false;
    } else {
      presetsCount += presets.length;
    }
  }

  // 6. Catalog search works
  let catalogSearchWorks = true;
  try {
    const results = searchServices('hydrafacial');
    if (results.length === 0) catalogSearchWorks = false;
    const results2 = searchServices('laser');
    if (results2.length === 0) catalogSearchWorks = false;
  } catch {
    catalogSearchWorks = false;
  }

  // 7. Package generation
  let packageGenerationWorks = true;
  let packageTiers = 0;
  try {
    // Simulate building a plan from recommended services
    const topServices = UNIFIED_CATALOG.filter(s =>
      response.treatmentInterests.includes(s.category)
    ).slice(0, 6);

    if (topServices.length >= 2) {
      const phases = [
        { id: 1 as const, label: 'Foundation', description: '', services: topServices.slice(0, 2).map((s, i) => ({ id: `test-${i}`, serviceId: s.id, service: s, quantity: 1, notes: '', phase: 1 as const })) },
        { id: 2 as const, label: 'Optimization', description: '', services: topServices.slice(2, 4).map((s, i) => ({ id: `test-${i+2}`, serviceId: s.id, service: s, quantity: 1, notes: '', phase: 2 as const })) },
        { id: 3 as const, label: 'Maintenance', description: '', services: topServices.slice(4, 6).map((s, i) => ({ id: `test-${i+4}`, serviceId: s.id, service: s, quantity: 1, notes: '', phase: 3 as const })) },
      ] as [typeof phases[0], typeof phases[1], typeof phases[2]];

      const packages = generatePackages(phases);
      packageTiers = packages.length;
      if (packages.length === 0) packageGenerationWorks = false;

      // Verify package pricing
      for (const pkg of packages) {
        if (pkg.price <= 0) {
          packageGenerationWorks = false;
          errors.push(`Package ${pkg.tier} has zero price`);
        }
        if (pkg.sessions <= 0) {
          errors.push(`Package ${pkg.tier} has zero sessions`);
        }
      }
    }
  } catch (e) {
    packageGenerationWorks = false;
    errors.push(`Package generation error: ${e}`);
  }

  return {
    id: response.id,
    name: `${response.firstName} ${response.lastName}`,
    validationPassed,
    validationErrors: errors,
    concernCount: response.skinConcerns.length,
    interestCount: response.treatmentInterests.length,
    recommendedServicesCount: recommendedServices.length,
    followUpQuestionsCount: followUpQuestions.length,
    showBodyMap,
    matchedServicesCount,
    unmatchedConcerns,
    presetsMapped,
    presetsCount,
    catalogSearchWorks,
    packageGenerationWorks,
    packageTiers,
  };
}

// ─── Run 100 Tests ──────────────────────────────────────────────────

console.log('═══════════════════════════════════════════════════════════');
console.log('  RANI BEAUTY CLINIC — 100 Test Response Analysis');
console.log('═══════════════════════════════════════════════════════════\n');

const results: TestResult[] = [];
const failures: TestResult[] = [];

for (let i = 1; i <= 100; i++) {
  const response = generateTestResponse(i);
  const result = runTest(response);
  results.push(result);
  if (!result.validationPassed || result.validationErrors.length > 0) {
    failures.push(result);
  }
}

// ─── Summary ────────────────────────────────────────────────────────

const passed = results.filter(r => r.validationPassed).length;
const failed = results.filter(r => !r.validationPassed).length;
const withErrors = results.filter(r => r.validationErrors.length > 0).length;

console.log('── VALIDATION ──────────────────────────────────────────');
console.log(`  Passed: ${passed}/100`);
console.log(`  Failed: ${failed}/100`);
console.log(`  With warnings: ${withErrors}/100`);

if (failures.length > 0) {
  console.log('\n── FAILURES ────────────────────────────────────────────');
  for (const f of failures.slice(0, 10)) {
    console.log(`  #${f.id} ${f.name}: ${f.validationErrors.join('; ')}`);
  }
  if (failures.length > 10) {
    console.log(`  ... and ${failures.length - 10} more`);
  }
}

// Concern matching
const allUnmatched = new Set<string>();
for (const r of results) {
  for (const c of r.unmatchedConcerns) {
    allUnmatched.add(c);
  }
}

console.log('\n── CONCERN → SERVICE MATCHING ───────────────────────────');
console.log(`  Total concerns tested: ${results.reduce((s, r) => s + r.concernCount, 0)}`);
console.log(`  Avg services matched per concern: ${(results.reduce((s, r) => s + r.matchedServicesCount, 0) / results.reduce((s, r) => s + r.concernCount, 0)).toFixed(1)}`);
if (allUnmatched.size > 0) {
  console.log(`  ⚠ UNMATCHED CONCERNS: ${[...allUnmatched].join(', ')}`);
} else {
  console.log(`  ✓ All concerns matched to services`);
}

// Recommendations
console.log('\n── RECOMMENDATIONS ENGINE ───────────────────────────────');
const avgRecs = results.reduce((s, r) => s + r.recommendedServicesCount, 0) / 100;
console.log(`  Avg recommended services: ${avgRecs.toFixed(1)}`);
console.log(`  Avg follow-up questions: ${(results.reduce((s, r) => s + r.followUpQuestionsCount, 0) / 100).toFixed(1)}`);
console.log(`  Body map shown: ${results.filter(r => r.showBodyMap).length}/100 responses`);

// Preset mapping
console.log('\n── PHOTO SIMULATION PRESETS ─────────────────────────────');
const allPresetsMapped = results.filter(r => r.presetsMapped).length;
console.log(`  All presets mapped: ${allPresetsMapped}/100`);
console.log(`  Avg presets per response: ${(results.reduce((s, r) => s + r.presetsCount, 0) / 100).toFixed(1)}`);
const unmappedInterests = results.filter(r => !r.presetsMapped);
if (unmappedInterests.length > 0) {
  const unmappedCategories = new Set<string>();
  for (const r of unmappedInterests) {
    // Find which interests weren't mapped
    const response = generateTestResponse(r.id); // regenerate to check
    for (const interest of response.treatmentInterests) {
      if (!CATEGORY_TO_PRESETS[interest as ServiceCategory]?.length) {
        unmappedCategories.add(interest);
      }
    }
  }
  console.log(`  ⚠ UNMAPPED CATEGORIES: ${[...unmappedCategories].join(', ')}`);
}

// Catalog
console.log('\n── UNIFIED CATALOG ─────────────────────────────────────');
console.log(`  Total services: ${UNIFIED_CATALOG.length}`);
console.log(`  Legacy catalog entries: ${Object.keys(SERVICE_CATALOG).length}`);
console.log(`  Search works: ${results.every(r => r.catalogSearchWorks) ? '✓' : '✗'}`);

// Categories with service counts
const categoryCounts: Record<string, number> = {};
for (const s of UNIFIED_CATALOG) {
  categoryCounts[s.category] = (categoryCounts[s.category] || 0) + 1;
}
console.log('  Services by category:');
for (const [cat, count] of Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`    ${cat}: ${count}`);
}

// Package generation
console.log('\n── PACKAGE GENERATION ──────────────────────────────────');
const pkgWorks = results.filter(r => r.packageGenerationWorks).length;
console.log(`  Successful: ${pkgWorks}/100`);
console.log(`  Avg tiers generated: ${(results.reduce((s, r) => s + r.packageTiers, 0) / 100).toFixed(1)}`);

// Parser tests
console.log('\n── TREATMENT PLAN PARSER ───────────────────────────────');
const testCostTexts = [
  'HydraFacial Signature — $225\nVI Peel — $325\nRF Microneedling x3 — $2,250',
  'Sofwave Full Face + Neck — $3,999\nBotox — $350',
  'Laser Hair Removal — $225\nBioRePeel Face — $350',
  'GLP-1 Semaglutide (Month 1) — $349\nB12 Injection — $25',
  'PRX-T33 — $475\nDermaplaning — $49',
];

let parserIssues = 0;
for (const text of testCostTexts) {
  const parsed = parseCostBreakdown(text);
  if (parsed.length === 0) {
    console.log(`  ⚠ Failed to parse: "${text.slice(0, 50)}..."`);
    parserIssues++;
  }
}

const testPlanTexts = [
  'Phase 1: Foundation\n- HydraFacial Signature\n- Skin Assessment\n\nPhase 2: Treatment\n- RF Microneedling x3\n- VI Peel x2\n\nPhase 3: Maintenance\n- Monthly HydraFacial',
  'Phase 1: Assessment & First Treatment\nWeeks 1-2\n- Comprehensive Consultation\n- Signature HydraFacial\n\nPhase 2: Active Treatment\nWeeks 3-8\n- Sofwave Full Face\n- PRX-T33 x2',
];

for (const text of testPlanTexts) {
  const { phases } = parseProgramPlan(text);
  if (phases.length === 0) {
    console.log(`  ⚠ Failed to parse plan: "${text.slice(0, 50)}..."`);
    parserIssues++;
  }
}

// Service matching
console.log('\n── SERVICE MATCHING (matchService) ─────────────────────');
const testMatchTexts = [
  'HydraFacial', 'Signature HydraFacial', 'hydrafacial signature',
  'RF Microneedling', 'rf microneedling face', 'RF Micro-needling',
  'Sofwave', 'sofwave full face', 'Sofwave Full Face + Neck',
  'VI Peel', 'vi peel purify', 'VI Peel Precision Plus',
  'PRX-T33', 'prx', 'PRX T33',
  'Botox', 'botox injections', 'BOTOX',
  'Dermal Fillers', 'filler', 'Fillers',
  'Laser Hair Removal', 'LHR', 'laser hair',
  'GLP-1', 'glp-1 program', 'semaglutide',
  'B12', 'b12 injection', 'vitamin b12',
  'NAD+', 'nad+ injection',
  'Glutathione', 'glutathione injection',
  'Tretinoin', 'tretinoin 0.05%',
  'Folix Hair Restoration',
  'Dermaplaning',
  'Laser Facial', 'ND:Yag',
  'BioRePeel', 'biorepeel face',
];

let matched = 0;
let unmatched = 0;
const unmatchedList: string[] = [];

for (const text of testMatchTexts) {
  const result = matchService(text);
  if (result) {
    matched++;
  } else {
    unmatched++;
    unmatchedList.push(text);
  }
}

console.log(`  Matched: ${matched}/${testMatchTexts.length}`);
console.log(`  Unmatched: ${unmatched}/${testMatchTexts.length}`);
if (unmatchedList.length > 0) {
  console.log(`  ⚠ UNMATCHED: ${unmatchedList.join(', ')}`);
}

// Filter presets
console.log('\n── FILTER PRESETS ──────────────────────────────────────');
console.log(`  Total presets: ${Object.keys(TREATMENT_PRESETS).length}`);
const allCategories: ServiceCategory[] = ['facial', 'laser-hair-removal', 'chemical-peel', 'rf-microneedling', 'skin-tightening', 'scar-reduction', 'laser', 'injectables', 'wellness', 'weight-management', 'hormones', 'labs', 'skincare', 'hair', 'consultation'];
const unmappedCats: string[] = [];
for (const cat of allCategories) {
  const presets = CATEGORY_TO_PRESETS[cat];
  if (!presets || presets.length === 0) {
    unmappedCats.push(cat);
  }
}
if (unmappedCats.length > 0) {
  console.log(`  ⚠ UNMAPPED CATEGORIES: ${unmappedCats.join(', ')}`);
} else {
  console.log(`  ✓ All categories have preset mappings`);
}

// Final summary
console.log('\n═══════════════════════════════════════════════════════════');
const totalIssues = failures.length + allUnmatched.size + unmatchedList.length + parserIssues + unmappedCats.length;
if (totalIssues === 0) {
  console.log('  ✅ ALL 100 TESTS PASSED — ZERO ISSUES FOUND');
} else {
  console.log(`  ⚠ ${totalIssues} ISSUE(S) FOUND — SEE ABOVE FOR DETAILS`);
}
console.log('═══════════════════════════════════════════════════════════\n');
