# 🎯 CODEX MISSION — Intake + Mastermind Simulation Hardening
**Mission ID:** `INTAKE-SIM-2026-04-25`
**Severity:** P0 (revenue-blocking + clinical safety)
**Estimated execution:** 7 engineer-days, single sprint
**Definition of done:** All 20 audit findings resolved, weighted grade ≥ 95/100, smoke harness 100/100 pass, no regressions on existing test suite.

> You are the Principal AI Engineer for Rani Beauty Clinic. This mission is the result of a forensic audit completed 2026-04-25. The full audit lives at `audits/intake-simulation-forensic-audit-2026-04-25.md` and the fix ledger at `audits/intake-simulation-fix-ledger-2026-04-25.md`. Read both in full before writing any code. **Do not skim. Do not deviate from the protocol.** Every step has a verification gate; you may not advance until the gate passes.

---

## 0. Context one-liner you must memorize

**Two working trees exist. The dev server runs from the WRONG one. Your first job is to consolidate.**

| Tree | Path | State | Purpose |
| --- | --- | --- | --- |
| **HOTFIX** (what's running) | `/private/tmp/rani-hotfix` | git `main`, **14 modified + 6 untracked** files | Has new PDF/medical pipeline. Missing 2026-04-19 hardening. |
| **CANONICAL** (what's correct) | `/Users/sukhithebanker/Desktop/Claude/rani-beauty-clinic` | not a git repo | Has `safeFetchJson`, `waitForSession`, `getSessionByIdAsyncRetry`, `submitCore`, `SessionStoreError`. Missing PDF/medical pipeline. |

**Truth = HOTFIX + CANONICAL hardening, merged on a single branch off HOTFIX `main`.** All execution happens in `/private/tmp/rani-hotfix`. The canonical tree is read-only reference.

---

## 1. The 20 findings you must resolve (memorize the IDs)

| ID | P | Title | Audit § |
| --- | --- | --- | --- |
| F-01 | P0 | Hotfix tree regresses every 2026-04-19 hardening | §3.F-01 |
| F-02 | P0 | Submit returns 422 on missing optional arrays | §3.F-02 |
| **F-03** | **P0 CLINICAL** | **`medicalFlags` hardcoded `false` → pancreatitis patient cleared for GLP-1** | §3.F-03 |
| F-04 | P0 | No retry on session lookup → cross-Lambda 404s | §3.F-04 |
| F-05 | P0 | Scan does not detect `[base64_stripped]` | §3.F-05 |
| F-06 | P0 | `SessionStoreError` capacity classification missing | §3.F-06 |
| F-07 | P1 | BoomRx formulary has 3 concatenated rows | §3.F-07 |
| F-08 | P1 | `/api/mastermind/aura-import` has no auth | §3.F-08 |
| F-09 | P1 | Fake `.pdf` accepted as "parsed" | §3.F-09 |
| F-10 | P1 | Background scan errors invisible | §3.F-10 |
| F-11 | P1 | Simulation frames are SVG text overlays | §3.F-11 |
| F-12 | P1 | `sessionReducer` no phase guards | §3.F-12 |
| F-13 | P2 | Misleading 422 instead of 400 on empty body | §3.F-13 |
| F-14 | P2 | `complete/route.ts` lacks retry | §3.F-14 |
| F-15 | P2 | Dashboard 401 has no recovery path | §3.F-15 |
| F-16 | P2 | Observability — no structured event logs | Ledger Fix 15 |
| F-17 | P2 | Smoke harness coverage gap | Ledger Fix 16 |
| F-18 | P3 | AuraImportPanel CDN PDF.js dep | Ledger Fix 18 |
| F-19 | P3 | Latin1 fallback should be UTF-8 | Ledger Fix 19 |
| F-20 | P3 | SVG `aria-label` typo | Ledger Fix 20 |

---

## 2. Pre-flight (DO NOT SKIP — 30 minutes)

```bash
# 2.1 Confirm tree state matches the audit
cd /private/tmp/rani-hotfix
git status --short                        # expect: 14 M + 6 ??
git log --oneline -1                      # expect: bbab3e0 fix(tests): use static ./route import (not dynamic ../route)

# 2.2 Confirm canonical tree is intact
test -f /Users/sukhithebanker/Desktop/Claude/rani-beauty-clinic/src/lib/client/safe-fetch.ts || { echo "FAIL: canonical tree missing"; exit 1; }

# 2.3 Confirm dev server is running on hotfix
ps -ef | grep "next dev" | grep -v grep | grep -q rani-hotfix || { echo "FAIL: dev server not from hotfix tree"; exit 1; }
curl -sS -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/mastermind/sessions    # expect: 401

# 2.4 Snapshot current state for rollback
cd /private/tmp/rani-hotfix
git stash push -u -m "pre-INTAKE-SIM-2026-04-25-mission" --include-untracked || true
git stash list | head -1                  # confirm snapshot exists
git stash pop                             # restore working dir; stash stays in stash@{0}

# 2.5 Create the mission branch
git checkout -b feat/intake-hardening-2026-04-25

# 2.6 Verify vitest can run (audit flagged this as broken)
rm -rf node_modules/@vitest node_modules/.cache   # clear corrupt vitest util config
npm ci                                              # rebuild
npx vitest --version                                # must succeed; if not, abort and report

# 2.7 Capture baseline grade
node scripts/smoke-mastermind-intake.mjs 1 2>&1 | tail -10 > /tmp/baseline-smoke.txt || true
cat /tmp/baseline-smoke.txt
```

**GATE 0:** All 7 commands succeed. If any fail, STOP and report. Do not proceed.

---

## 3. Operating protocol (every phase)

For each phase below:
1. Read the linked section of the audit ledger first.
2. Make the code change.
3. Run the verification command.
4. **Only commit when the gate passes.** Use one commit per phase, message format: `fix(intake-sim): <ID> — <one-line description>`
5. Push to remote after every 2 phases for backup: `git push -u origin feat/intake-hardening-2026-04-25`

**Forbidden actions:**
- Do not run `git reset --hard`. Never.
- Do not run `git push --force` — ever, on any branch.
- Do not skip hooks (`--no-verify`).
- Do not edit `.env*` files unless explicitly told to.
- Do not delete the canonical tree until the entire mission is verified green.
- Do not deploy to Vercel mid-mission.

---

## 4. PHASE 1 — Cherry-pick canonical hardening (F-01) — 4 hours

### Files to copy verbatim from canonical → hotfix

```bash
CANON=/Users/sukhithebanker/Desktop/Claude/rani-beauty-clinic
HOTFIX=/private/tmp/rani-hotfix

# 4.1 The safe-fetch helpers (NEW — does not exist in hotfix)
cp "$CANON/src/lib/client/safe-fetch.ts" "$HOTFIX/src/lib/client/safe-fetch.ts"
mkdir -p "$HOTFIX/src/lib/client/__tests__"
cp "$CANON/src/lib/client/__tests__/safe-fetch.test.ts" "$HOTFIX/src/lib/client/__tests__/safe-fetch.test.ts"

# 4.2 The schema-compat tests
mkdir -p "$HOTFIX/src/lib/consultation/__tests__"
cp "$CANON/src/lib/consultation/__tests__/submit-schema-compat.test.ts" "$HOTFIX/src/lib/consultation/__tests__/submit-schema-compat.test.ts"
```

### Files to MERGE (canonical content into hotfix versions)

For each of these, **read the canonical version, then read the hotfix version, then merge.** The hotfix has additions you must preserve (PDF parsing, medical recommendations); the canonical has hardening you must add. Resolve conflicts by *unioning* — keep all hotfix new code, layer in all canonical hardening.

#### 4.3 `src/lib/mastermind/session.ts`

Add to hotfix from canonical:
- `getSessionByIdAsyncRetry(id, opts?)` — bounded exponential backoff (5 attempts, 150ms base, ~3.5s budget). See canonical lines 301-317.
- `saveSessionBestEffort(session)` — returns `{ ok: true } | { ok: false, kind, message }`. See canonical lines 426-447.
- Update `saveSessionAsync` to re-throw `SessionStoreError` (canonical 412-419).
- Keep all hotfix additions (`ProtocolPacketMeta` type, any new reducer cases).

**Verification:**
```bash
grep -n "getSessionByIdAsyncRetry\|saveSessionBestEffort" /private/tmp/rani-hotfix/src/lib/mastermind/session.ts
# Expect: at least 4 matches (export decl + each callsite reference inside)
```

#### 4.4 `src/lib/mastermind/session-store.ts`

Add to hotfix from canonical lines 40-98:
- `SessionStoreErrorKind` type
- `SessionStoreError` class
- `LIMIT_ERROR_TYPES` set
- `classifyAirtableError(body)` function

Replace `throwAirtableHttpError` (hotfix lines 47-52) with the typed-error path that:
1. Reads response body as text.
2. Calls `classifyAirtableError(body)`.
3. Throws `new SessionStoreError({ kind, operation, sessionId, status, bodySnippet, airtableErrorType, message })`.
4. Adds the structured log line: `console.error(JSON.stringify({ event: 'session_store.save_failed', kind, operation, sessionId, status, airtableErrorType, bodySnippet }))`.

**Verification:**
```bash
grep -n "SessionStoreError\|classifyAirtableError\|session_store.save_failed" /private/tmp/rani-hotfix/src/lib/mastermind/session-store.ts | wc -l
# Expect: ≥ 6 matches
```

#### 4.5 `src/lib/consultation/schema.ts`

**REPLACE** `submitIntakeSchema` (hotfix lines 234-242) with the canonical `submitCore` schema (canonical lines 239-294). Preserve all `step1Schema..step8Schema` definitions and `stepSchemas` export. Add the new boolean fields required for F-03:

```ts
const submitCore = z
  .object({
    firstName: z.string().max(80).optional(),
    lastName: z.string().max(80).optional(),
    email: z.string().email().optional(),
    phone: z.string().max(40).optional(),
    dob: z.string().optional(),
    age: z.number().int().min(0).max(130).optional(),
    contactPreference: z.string().optional(),
    referralSource: z.string().optional(),
    skinConcerns: z.array(z.string().max(80)).max(30).optional(),
    targetAreas: z.array(z.string().max(80)).max(30).optional(),
    treatmentInterests: z.array(z.string().max(80)).max(40).optional(),
    concerns: z.array(z.string().max(80)).max(30).optional(),
    previousTreatments: z.array(z.string().max(120)).max(30).optional(),
    goals: z.union([z.string().max(4000), z.array(z.string().max(200)).max(30)]).optional(),
    hasUpcomingEvent: z.boolean().optional(),
    eventDetails: z.string().max(500).optional(),
    timeline: z.string().max(80).optional(),
    budget: z.string().max(80).optional(),
    treatmentHistory: z.string().max(4000).optional(),
    medicalHistory: z.string().max(4000).optional(),
    allergies: z.string().max(2000).optional(),
    medications: z.string().max(2000).optional(),
    hasAutoimmune: z.boolean().optional(),
    hasAllergies: z.boolean().optional(),
    hasMedications: z.boolean().optional(),
    pregnant: z.boolean().optional(),
    breastfeeding: z.boolean().optional(),
    bloodThinners: z.boolean().optional(),
    keloidHistory: z.boolean().optional(),
    activeSkinInfection: z.boolean().optional(),
    isotretinoinHistory: z.boolean().optional(),
    // Clinical safety flags (NEW for F-03 — REQUIRED)
    pancreatitisHistory: z.boolean().optional(),
    thyroidCancerHistory: z.boolean().optional(),
    medullaryThyroidCancerFamily: z.boolean().optional(),
    gallbladderDisease: z.boolean().optional(),
    severeDepression: z.boolean().optional(),
    eatingDisorderHistory: z.boolean().optional(),
    uncontrolledHypertension: z.boolean().optional(),
    skinType: z.string().max(40).optional(),
    skincareRoutine: z.string().max(80).optional(),
    skincareAM: z.string().max(2000).optional(),
    skincarePM: z.string().max(2000).optional(),
    smokingAlcohol: z.string().max(40).optional(),
    smokingStatus: z.string().max(40).optional(),
    waterIntake: z.string().max(40).optional(),
    sunProtectionHabit: z.string().max(40).optional(),
    requiresLabWork: z.boolean().optional(),
    preferredDays: z.array(z.string().max(20)).max(14).optional(),
    preferredTime: z.string().max(40).optional(),
    clinicalNotes: z.string().max(4000).optional(),
    smsConsent: z.boolean().optional(),
  })
  .passthrough();

export const submitIntakeSchema = submitCore;
```

**KEEP** the `stepSchemas` array and `validateStep` helper exactly as-is — they drive the wizard UX.

**Verification:**
```bash
node -e '
const { submitIntakeSchema } = require("/private/tmp/rani-hotfix/src/lib/consultation/schema");
// Empty payload must succeed (was 422 before fix)
const r = submitIntakeSchema.safeParse({});
console.log("empty parse:", r.success);
// Dashboard vocab must succeed
const r2 = submitIntakeSchema.safeParse({ firstName:"x", goals:["a","b"], skinConcerns:["fine-lines"] });
console.log("dashboard parse:", r2.success, r2.success ? "OK" : r2.error);
process.exit(r.success && r2.success ? 0 : 1);
'
```

#### 4.6 `src/app/api/consultation/submit/route.ts`

This file is heavily modified between trees. Apply these changes to the hotfix version:

**A. Fix `coerceStringArray`** (hotfix line 115-135) — change return to `string[] | undefined`:

```diff
-function coerceStringArray(value: unknown): string[] {
+function coerceStringArray(value: unknown): string[] | undefined {
   if (Array.isArray(value)) {
-    return value
+    const filtered = value
       .map((item) => (typeof item === 'string' ? item.trim() : ''))
       .filter(Boolean);
+    return filtered.length > 0 ? filtered : undefined;
   }

   if (typeof value === 'string') {
     const trimmed = value.trim();
-    if (!trimmed) return [];
+    if (!trimmed) return undefined;
     if (trimmed.includes(',')) {
-      return trimmed
+      const parts = trimmed
         .split(',')
         .map((item) => item.trim())
         .filter(Boolean);
+      return parts.length > 0 ? parts : undefined;
     }
     return [trimmed];
   }

-  return [];
+  return undefined;
 }
```

**B. Fix `coerceLegacySubmitPayload`** (hotfix line 233-249) — drop fields when undefined:

```diff
   payload.skinConcerns = normalizeSkinConcerns(payload);
-  payload.targetAreas = coerceStringArray(payload.targetAreas);
-  payload.treatmentInterests = coerceStringArray(payload.treatmentInterests);
+  const targetAreas = coerceStringArray(payload.targetAreas);
+  const treatmentInterests = coerceStringArray(payload.treatmentInterests);
+  if (targetAreas) payload.targetAreas = targetAreas;
+  else delete payload.targetAreas;
+  if (treatmentInterests) payload.treatmentInterests = treatmentInterests;
+  else delete payload.treatmentInterests;
   payload.goals = normalizeGoals(payload);
```

**C. Wire real medical flags** in `buildMetabolicRecommendation` (hotfix line 444-471):

```diff
     medicalFlags: {
       pregnant: intakeData.pregnant === true,
       breastfeeding: intakeData.breastfeeding === true,
-      thyroidCancerHistory: false,
-      pancreatitisHistory: false,
-      gallbladderDisease: false,
-      uncontrolledHypertension: false,
-      severeDepression: false,
-      eatingDisorderHistory: false,
+      thyroidCancerHistory:
+        intakeData.thyroidCancerHistory === true ||
+        intakeData.medullaryThyroidCancerFamily === true ||
+        /\b(medullary|thyroid cancer|MTC)\b/i.test(String(intakeData.medicalHistory || '')),
+      pancreatitisHistory:
+        intakeData.pancreatitisHistory === true ||
+        /\bpancreatitis\b/i.test(String(intakeData.medicalHistory || '')) ||
+        /\bpancreatitis\b/i.test(String(intakeData.medications || '')),
+      gallbladderDisease:
+        intakeData.gallbladderDisease === true ||
+        /\b(gallstone|gallbladder|cholecyst)/i.test(String(intakeData.medicalHistory || '')),
+      uncontrolledHypertension:
+        intakeData.uncontrolledHypertension === true ||
+        /\buncontrolled hypertension\b|\bsevere htn\b/i.test(String(intakeData.medicalHistory || '')),
+      severeDepression:
+        intakeData.severeDepression === true ||
+        /\bsevere depression\b|\bsuicidal\b/i.test(String(intakeData.medicalHistory || '')),
+      eatingDisorderHistory:
+        intakeData.eatingDisorderHistory === true ||
+        /\b(anorexia|bulimia|binge eating)\b/i.test(String(intakeData.medicalHistory || '')),
     },
```

**D. Add capacity branch to session-save catch** (hotfix line 786-797):

```diff
+import { SessionStoreError } from '@/lib/mastermind/session-store';
+
       try {
         await saveSessionAsync(session);
       } catch (err) {
-        console.error('[Consultation Submit] Session persistence failed:', err);
+        if (err instanceof SessionStoreError && err.kind === 'limit') {
+          return NextResponse.json(
+            {
+              success: false,
+              errorKind: 'capacity',
+              error:
+                "We can't save your consultation right now. Our records system is at capacity — please try again shortly or call (425) 539-4440.",
+              details: { airtableErrorType: err.airtableErrorType, operation: err.operation },
+            },
+            { status: 503 },
+          );
+        }
+        if (err instanceof SessionStoreError && err.kind === 'timeout') {
+          return NextResponse.json(
+            { success: false, errorKind: 'timeout', error: 'Your consultation is taking longer than expected to save. Please try again in a moment.' },
+            { status: 504 },
+          );
+        }
+        console.error('[Consultation Submit] Session persistence failed:', err);
         return NextResponse.json(
           {
             success: false,
+            errorKind: 'persist',
             error: 'Intake system is temporarily unavailable. Please retry in a minute.',
           },
           { status: 503 },
         );
       }
```

**E. Front-load 400 for empty body** (F-13) — at hotfix line 627-633:

```diff
       rawIntakePayload = getPayloadCandidate(rawIntakePayload);

-      let intakeData: Partial<ConsultationFormData>;
       if (!rawIntakePayload || typeof rawIntakePayload !== 'object') {
         return NextResponse.json({ success: false, error: 'Missing form data' }, { status: 400 });
       }
+      // Reject empty objects with no submitted fields (used to flow into 422 with stepSchema messages — confusing).
+      if (Object.keys(rawIntakePayload as Record<string, unknown>).length === 0) {
+        return NextResponse.json({ success: false, error: 'Missing form data' }, { status: 400 });
+      }
+      let intakeData: Partial<ConsultationFormData>;
```

**F. Persist auto-scan failures** (F-10) — at hotfix line 867-898:

```diff
       const scanPromise = (async () => {
         try {
           // ... existing scan logic ...
           const scanned = sessionReducer(session, { type: 'SET_SCAN_RESULT', result: scanResult });
           await saveSessionAsync(scanned);
-          console.error(`[Consultation Submit] Auto-scan completed for session ${session.id} (source: ${source})`);
+          console.log(JSON.stringify({ event: 'mastermind.auto_scan.completed', sessionId: session.id, source }));
         } catch (err) {
-          console.error('[Consultation Submit] Auto-scan failed:', err);
+          const message = err instanceof Error ? err.message : String(err);
+          console.error(JSON.stringify({ event: 'mastermind.auto_scan.failed', sessionId: session.id, error: message }));
+          // Persist the failure so the dashboard can render it.
+          try {
+            const errored = sessionReducer(session, {
+              type: 'SET_SCAN_ERROR',
+              error: { at: new Date().toISOString(), message, source: 'auto-scan' },
+            } as never);
+            await saveSessionAsync(errored);
+          } catch (persistErr) {
+            console.error('[Consultation Submit] Could not persist scan error:', persistErr);
+          }
         }
       })();
```

(Companion change for `SET_SCAN_ERROR` action lives in §4.8.)

**Gate Phase 1 verification:**
```bash
cd /private/tmp/rani-hotfix
# Restart dev server to pick up changes
pkill -f "next dev" || true; sleep 2
(npm run dev > /tmp/rani-hotfix-dev.log 2>&1 &)
until [ "$(curl -sS -o /dev/null -w "%{http_code}" http://localhost:3000/api/mastermind/sessions)" = "401" ]; do sleep 1; done

# F-02 must now pass
RESP=$(curl -sS -o /tmp/p1-min.txt -w "%{http_code}" -X POST http://localhost:3000/api/consultation/submit \
  -H "Origin: http://localhost:3000" \
  -F 'data={"firstName":"x","lastName":"y","email":"x@y.com","phone":"(206) 555-0100","dob":"1990-01-01","skinConcerns":["fine-lines"],"targetAreas":["face"],"treatmentInterests":["hydrafacial"],"goals":"a","timeline":"gradual","budget":"moderate","skinType":"normal","smsConsent":false}')
[ "$RESP" = "200" ] || { echo "FAIL F-02: $RESP"; cat /tmp/p1-min.txt; exit 1; }

# F-03 must now block
sleep 4  # rate-limit window
RESP=$(curl -sS -o /tmp/p1-clinical.txt -w "%{http_code}" -X POST http://localhost:3000/api/consultation/submit \
  -H "Origin: http://localhost:3000" \
  -F 'data={"firstName":"Smk","lastName":"B","email":"smk-clin@audit.local","phone":"(206) 555-0501","dob":"1990-01-01","skinConcerns":["body-contouring"],"targetAreas":["face"],"treatmentInterests":["glp1","weight-loss"],"goals":"weight-loss","timeline":"asap","budget":"investment","skinType":"normal","smsConsent":false,"medications":"history of acute pancreatitis 2024","medicalHistory":"pancreatitis flare last year"}')
node -e '
const r = JSON.parse(require("fs").readFileSync("/tmp/p1-clinical.txt","utf8"));
const status = r.metabolicRecommendation?.status;
const blocked = r.metabolicRecommendation?.safetyBlocked === true || (status && status !== "eligible");
if (!blocked) { console.error("FAIL F-03: still eligible:", status, r.metabolicRecommendation); process.exit(1); }
console.log("OK F-03: status=" + status + " blocked=" + blocked);
'

git add -A && git commit -m "fix(intake-sim): F-01/F-02/F-03/F-06/F-10/F-13 — port canonical hardening + clinical safety flags + capacity classifier"
```

**GATE 1:** Both probes pass. If F-03 still returns `status: 'eligible'` for a pancreatitis patient, you've missed something — go back and verify the regex hits `medicalHistory`. Do not proceed until clinical safety is enforced.

---

## 5. PHASE 2 — Photo persistence + scan retry (F-04, F-05) — 1 hour

### 5.1 Centralize unrenderable markers

Create `/private/tmp/rani-hotfix/src/lib/mastermind/image-markers.ts`:

```ts
/**
 * Markers used to indicate that a photo URL cannot be rendered.
 * Persistence layer replaces large base64 with `[base64_stripped]`;
 * device integration replaces missing files with `[photo_ref_unavailable]`.
 *
 * Centralized so scan, plan, simulate, and the dashboard renderer
 * all agree on what "unrenderable" means.
 */
export const NON_RENDERABLE_IMAGE_MARKERS = new Set([
  '[base64_stripped]',
  '[photo_ref_unavailable]',
  '[image_unavailable]',
]);

export function isUnrenderablePhoto(value: string | null | undefined): boolean {
  if (typeof value !== 'string') return true;
  const trimmed = value.trim();
  if (!trimmed) return true;
  return NON_RENDERABLE_IMAGE_MARKERS.has(trimmed.toLowerCase());
}

export function isRenderableImageValue(value: string | null | undefined): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (NON_RENDERABLE_IMAGE_MARKERS.has(trimmed.toLowerCase())) return false;
  return (
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('blob:')
  );
}
```

### 5.2 Update scan endpoint

`src/app/api/mastermind/scan/route.ts`:

```diff
 import { unauthorized } from '@/lib/auth/middleware';
+import { isUnrenderablePhoto } from '@/lib/mastermind/image-markers';
+import { getSessionByIdAsyncRetry } from '@/lib/mastermind/session';

       // Load from session if sessionId provided
       let session = null;
       if (sessionId) {
-        session = await getSessionByIdAsync(sessionId);
+        session = await getSessionByIdAsyncRetry(sessionId);
         if (!session) return apiError('Session not found', 404);
         if (!intakeData && session.intakeData) {
           intakeData = session.intakeData as Partial<ConsultationFormData>;
         }
         if (!sourcePhotoUrl && session.sourcePhotoUrl) {
           sourcePhotoUrl = session.sourcePhotoUrl;
         }
       }

       if (!intakeData || typeof intakeData !== 'object') {
         return apiError('Missing intake data', 400);
       }

-      // 424 — photo reference placeholder means the source file is not yet available
-      if (sourcePhotoUrl === '[photo_ref_unavailable]') {
-        return apiError('Source photo is temporarily unavailable — please retry after the photo reference resolves', 424);
+      if (sourcePhotoUrl && isUnrenderablePhoto(sourcePhotoUrl)) {
+        return NextResponse.json(
+          {
+            success: false,
+            error: 'Source photo is temporarily unavailable. Please re-upload the Aura image/PDF.',
+            meta: { photoUnavailable: true },
+          },
+          { status: 424 },
+        );
       }
```

### 5.3 Apply retry across all session loaders

Run this find-and-replace across the listed files:

```bash
for f in \
  src/app/api/mastermind/plan/route.ts \
  src/app/api/mastermind/sessions/\[id\]/route.ts \
  src/app/api/mastermind/simulate/route.ts \
  src/app/api/mastermind/complete/route.ts \
  src/app/api/mastermind/consent/route.ts \
  src/app/api/mastermind/follow-up/route.ts; do
  echo "Patching $f"
  # Add import if not present
  grep -q 'getSessionByIdAsyncRetry' "$f" || \
    sed -i.bak 's/import { getSessionByIdAsync\([^}]*\)} from .@\/lib\/mastermind\/session./import { getSessionByIdAsync, getSessionByIdAsyncRetry\1} from "@\/lib\/mastermind\/session";/' "$f"
  # Replace callsites: `getSessionByIdAsync(` → `getSessionByIdAsyncRetry(` ONLY where the result is checked for null on the next line
  # SAFER: do it manually per file with the editor below.
done
```

Manually verify each file: callsites that load a session and depend on it being non-null must use the retry variant. Callsites that mutate (e.g. `getSessionByIdAsync` inside `enrichWithProviderIdentity`) can stay non-retry.

**Specific edits required:**

| File | Line(s) to change | New |
| --- | --- | --- |
| `src/app/api/mastermind/plan/route.ts` | line 48 | `getSessionByIdAsyncRetry(sessionId)` |
| `src/app/api/mastermind/sessions/[id]/route.ts` | line 34 (GET) | `getSessionByIdAsyncRetry(id)` |
| `src/app/api/mastermind/sessions/[id]/route.ts` | line 66 (PATCH) | `getSessionByIdAsyncRetry(id)` |
| `src/app/api/mastermind/simulate/route.ts` | line 312 | `getSessionByIdAsyncRetry(sessionId)` |
| `src/app/api/mastermind/complete/route.ts` | line 40 | `getSessionByIdAsyncRetry(sessionId)` |
| `src/app/api/mastermind/consent/route.ts` | line 68 (POST) | `getSessionByIdAsyncRetry(record.sessionId)` |
| `src/app/api/mastermind/consent/route.ts` | line 144 (GET) | `getSessionByIdAsyncRetry(sessionId)` |
| `src/app/api/mastermind/follow-up/route.ts` | line 65 | `getSessionByIdAsyncRetry(sessionId)` |
| `src/app/api/mastermind/follow-up/route.ts` | line 195 (re-load) | `getSessionByIdAsyncRetry(sessionId)` |

### 5.4 Update simulate endpoint to use centralized markers

`src/app/api/mastermind/simulate/route.ts`:

```diff
-const NON_RENDERABLE_IMAGE_MARKERS = new Set([
-  '[base64_stripped]',
-  '[photo_ref_unavailable]',
-  '[image_unavailable]',
-]);
-
-function isRenderableImageValue(value: string | null | undefined): value is string {
-  // ... (delete local copy)
-}
+import { NON_RENDERABLE_IMAGE_MARKERS, isRenderableImageValue } from '@/lib/mastermind/image-markers';
```

**GATE 2:**
```bash
# Lint guard: getSessionByIdAsync must only appear as a non-retry helper inside session.ts itself
grep -rn 'getSessionByIdAsync\b' /private/tmp/rani-hotfix/src/app/api/ | grep -v 'getSessionByIdAsyncRetry' | grep -v 'enrichWithProviderIdentity' | grep -v 'session-store.ts'
# Expect: 0 lines

# Unrenderable-photo handling
grep -rn 'NON_RENDERABLE_IMAGE_MARKERS\|isUnrenderablePhoto' /private/tmp/rani-hotfix/src/app/api/mastermind/scan/route.ts
# Expect: ≥ 2 lines

git add -A && git commit -m "fix(intake-sim): F-04/F-05 — apply retry to all session loaders + central image marker handling"
```

---

## 6. PHASE 3 — Auth gates + reducer guards (F-08, F-12) — 30 min

### 6.1 Auth-gate aura-import

`src/app/api/mastermind/aura-import/route.ts`:

```diff
 import { NextRequest } from 'next/server';
+import { getSessionFromRequest } from '@/lib/auth/session';
+import { unauthorized, forbidden } from '@/lib/auth/middleware';
 import {
   listAvailableScans,
   importAuraScan,
   findLatestScan,
 } from '@/lib/mastermind/aura-device-integration';
 // ...

-export async function GET() {
+export async function GET(request: NextRequest) {
   return withSentry('mastermind/aura-import', async () => {
     try {
+      const auth = await getSessionFromRequest(request).catch(() => null);
+      if (!auth) return unauthorized();
+      if (auth.role !== 'ceo' && auth.role !== 'provider') return forbidden();
       const scans = listAvailableScans();
       return apiSuccess(scans, { source: 'aura-device', count: scans.length });

 export async function POST(request: NextRequest) {
   return withSentry('mastermind/aura-import', async () => {
     try {
+      const auth = await getSessionFromRequest(request).catch(() => null);
+      if (!auth) return unauthorized();
+      if (auth.role !== 'ceo' && auth.role !== 'provider') return forbidden();
       const parsed = await parseJsonBody(request);
```

Apply the same change to `src/app/api/mastermind/aura-import/pdf/route.ts` (read it, add the same auth block at the top of POST).

### 6.2 Phase guards in sessionReducer

`src/lib/mastermind/session.ts`:

```diff
+const TERMINAL_PHASES: MastermindPhase[] = ['provider_review', 'approved', 'completed'];
+
 export function sessionReducer(...) {
   switch (action.type) {
     case 'SET_SCAN_RESULT':
+      if (TERMINAL_PHASES.includes(state.phase)) {
+        console.warn(`[Session] Refusing scan overwrite on session ${state.id} (phase=${state.phase})`);
+        return state;
+      }
       return { ... };

     case 'SET_PLAN':
+      if (TERMINAL_PHASES.includes(state.phase)) {
+        console.warn(`[Session] Refusing plan overwrite on session ${state.id} (phase=${state.phase})`);
+        return state;
+      }
       return { ... };

     case 'SET_SIMULATION':
+      if (state.phase === 'completed') return state;
       return { ... };
   }
 }
```

### 6.3 Add `SET_SCAN_ERROR` action

`src/types/mastermind.ts` — add to `MastermindSessionAction` union:
```ts
| { type: 'SET_SCAN_ERROR'; error: { at: string; message: string; source: string } | null }
```
And to `MastermindSession`:
```ts
auraScanError?: { at: string; message: string; source: string } | null;
```

`src/lib/mastermind/session.ts`:
```ts
case 'SET_SCAN_ERROR':
  return {
    ...state,
    updatedAt: now,
    auraScanError: action.error,
    activityLog: appendLog(state.activityLog, 'scan_failed', `Auto-scan failed: ${action.error?.message ?? 'unknown'}`),
  };
```

`hydrateSession`:
```ts
auraScanError: parsed.auraScanError as MastermindSession['auraScanError'] ?? null,
```

**GATE 3:**
```bash
RESP=$(curl -sS -o /dev/null -w "%{http_code}" http://localhost:3000/api/mastermind/aura-import)
[ "$RESP" = "401" ] || { echo "FAIL F-08 GET: $RESP"; exit 1; }
RESP=$(curl -sS -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/mastermind/aura-import -H "Content-Type: application/json" -d '{}')
[ "$RESP" = "401" ] || { echo "FAIL F-08 POST: $RESP"; exit 1; }
echo "OK F-08"

git add -A && git commit -m "fix(intake-sim): F-08/F-10/F-12 — auth gate aura-import + reducer phase guards + SET_SCAN_ERROR"
```

---

## 7. PHASE 4 — Aura PDF integrity + BoomRx data quality (F-07, F-09) — 4 hours

### 7.1 Reject "fake PDF" with no Aura keywords (F-09)

`src/lib/mastermind/aura-pdf.ts`:

```diff
 export async function extractAuraPdfInsights(
   pdfFile: File,
   options: { maxPages?: number; maxChars?: number } = {}
 ): Promise<AuraPdfInsights | null> {
   // ... existing extraction ...
   if (!text) return null;

-  return extractAuraPdfInsightsFromText(text, pdfFile.name || 'aura-handout.pdf');
+  const insights = extractAuraPdfInsightsFromText(text, pdfFile.name || 'aura-handout.pdf');
+  if (!insights) return null;
+
+  const hasAnyScore =
+    Object.keys(insights.absoluteScores).length > 0 ||
+    Object.keys(insights.peerScores).length > 0 ||
+    insights.peerSkinScore !== null;
+  const AURA_KEYWORD_RE = /\b(Wrinkles|Texture|Brown Spots|Red Areas|Pores|Skin Score|Aura)\b/i;
+  const hasAuraKeyword = AURA_KEYWORD_RE.test(text);
+
+  if (!hasAnyScore && !hasAuraKeyword) {
+    return null; // Not an Aura handout — let the caller surface a warning.
+  }
+
+  return insights;
 }
```

`src/app/api/consultation/submit/route.ts` lines 692-697:

```diff
   if (auraPdfFiles.length > 0) {
     const name = auraPdfFiles[0]?.name || 'document.pdf';
-    auraUploadStatus = auraPdfInsights
-      ? `Aura PDF received + parsed (${buildAuraPdfMetricsSummary(auraPdfInsights) || name})`
-      : `Aura PDF received (${name})`;
+    if (auraPdfInsights) {
+      auraUploadStatus = `Aura PDF received + parsed (${buildAuraPdfMetricsSummary(auraPdfInsights) || name})`;
+    } else {
+      auraUploadStatus = `Aura PDF received but not parsed (${name})`;
+      auraUploadWarnings.push(
+        `Aura PDF "${name}" did not contain recognizable Aura device output. Continuing with intake-only fallback. Verify the file is the actual Aura handout.`,
+      );
+    }
   }
```

### 7.2 BoomRx data integrity (F-07)

**Step A — Detect corrupt rows in raw.json:**

Create `scripts/audit-boomrx-formulary.mjs`:

```js
import fs from 'node:fs';
const raw = JSON.parse(fs.readFileSync('src/lib/medical/boomrx-formulary.raw.json', 'utf8'));
const PRICE_RE = /\$(\d+(?:\.\d{1,2})?)/g;
const corrupt = [];
for (const [i, line] of raw.price_lines.entries()) {
  const matches = line.match(PRICE_RE) || [];
  if (matches.length !== 1) {
    corrupt.push({ index: i, count: matches.length, line });
  }
}
if (corrupt.length === 0) {
  console.log('OK: 0 corrupt rows');
  process.exit(0);
}
console.error(`FAIL: ${corrupt.length} corrupt rows`);
for (const r of corrupt) console.error(`  [${r.index}] ${r.count} prices: ${r.line.slice(0, 160)}`);
process.exit(1);
```

**Step B — Auto-split corrupt rows.** Add to `src/lib/medical/boomrx-formulary.ts` BEFORE the `.map((line, index) => parseLine(line, index))` call:

```ts
function splitMergedPriceLine(line: string): string[] {
  // Lines that contain multiple `$nnn.nn)` segments are upstream PDF
  // extraction artefacts where two distinct products got concatenated.
  // Split at the boundary `$nnn.nn)` (closing paren after the price).
  const SPLIT_RE = /(\$\d+(?:\.\d{1,2})?\))/g;
  const matches = Array.from(line.matchAll(SPLIT_RE));
  if (matches.length <= 1) return [line];
  const out: string[] = [];
  let cursor = 0;
  for (const m of matches) {
    const end = (m.index ?? 0) + m[0].length;
    out.push(line.slice(cursor, end));
    cursor = end;
  }
  if (cursor < line.length) out[out.length - 1] += line.slice(cursor);
  return out
    .map((s) => s.trim())
    .filter(Boolean);
}

export const BOOMRX_FORMULARY_ITEMS: BoomRxFormularyItem[] = formularyPayload.price_lines
  .flatMap(splitMergedPriceLine)
  .map((line, index) => parseLine(line, index))
  .filter((item): item is BoomRxFormularyItem => item !== null);
```

**Step C — Defensive parser guard.** In `parseLine`:

```diff
 function parseLine(line: string, index: number): BoomRxFormularyItem | null {
   const normalized = normalizeLabel(line);
   const priceMatch = normalized.match(PRICE_REGEX);
   if (!priceMatch) return null;

+  // Reject any row whose label still contains an embedded $ (defense in depth).
+  const allPrices = normalized.match(/\$\d+(?:\.\d{1,2})?/g) || [];
+  if (allPrices.length > 1) return null;
+
   const unitCost = Number(priceMatch[1]);
```

**Step D — Add a unit test** at `src/lib/medical/__tests__/boomrx-formulary.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { BOOMRX_FORMULARY_ITEMS } from '../boomrx-formulary';

describe('BoomRx formulary integrity', () => {
  it('has no labels containing an embedded $', () => {
    const violations = BOOMRX_FORMULARY_ITEMS.filter((item) => item.label.includes('$'));
    expect(violations.map((v) => v.label.slice(0, 120))).toEqual([]);
  });

  it('every entry has a positive numeric unitCost and suggestedRetail', () => {
    for (const item of BOOMRX_FORMULARY_ITEMS) {
      expect(item.unitCost).toBeGreaterThan(0);
      expect(item.suggestedRetail).toBeGreaterThan(0);
    }
  });

  it('every entry has a non-empty trimmed label', () => {
    for (const item of BOOMRX_FORMULARY_ITEMS) {
      expect(item.label.trim().length).toBeGreaterThan(0);
    }
  });
});
```

**GATE 4:**
```bash
node scripts/audit-boomrx-formulary.mjs && echo "OK F-07 raw"
npx vitest run src/lib/medical/__tests__/boomrx-formulary.test.ts
# Expect: all 3 tests pass

# F-09 runtime probe
echo "not a pdf" > /tmp/fake.pdf
sleep 4
RESP=$(curl -sS -o /tmp/p4-fake.json -w "%{http_code}" -X POST http://localhost:3000/api/consultation/submit \
  -H "Origin: http://localhost:3000" \
  -F 'data={"firstName":"FakePdf","lastName":"x","email":"fakepdf-x@audit.local","phone":"(206) 555-0099","dob":"1990-01-01","skinConcerns":["aging-skin"],"targetAreas":["face"],"treatmentInterests":["hydrafacial"],"goals":"a","timeline":"gradual","budget":"moderate","skinType":"normal","smsConsent":false}' \
  -F 'aura=@/tmp/fake.pdf;type=application/pdf')
node -e '
const r = JSON.parse(require("fs").readFileSync("/tmp/p4-fake.json","utf8"));
const status = r.auraUploadStatus || "";
const warnings = r.auraUploadWarnings || [];
const ok = /not parsed/.test(status) && warnings.length > 0;
console.log("status:", status, "warnings:", warnings.length);
process.exit(ok ? 0 : 1);
'

git add -A && git commit -m "fix(intake-sim): F-07/F-09 — split concatenated formulary rows + reject non-Aura PDFs"
```

---

## 8. PHASE 5 — Frontend hardening (F-15, F-18) — 2 hours

### 8.1 Auth recovery in dashboard intake

`src/components/dashboard/mastermind/NewConsultationModal.tsx` line 395-396:

```diff
     if (response.status === 401) {
-      throw new Error('Your dashboard session expired. Please sign in again and retry.');
+      // Save the in-progress draft + sessionId so we can resume after re-auth.
+      try {
+        localStorage.setItem('rani_consult_pending_session', sessionId);
+      } catch { /* ignore storage errors */ }
+      const next = encodeURIComponent(window.location.pathname + window.location.search);
+      window.location.href = `/login?next=${next}&restoreSession=${encodeURIComponent(sessionId)}`;
+      throw new Error('Redirecting to sign-in…');
     }
```

Add restore logic to the dashboard's mastermind page (search for the page component that mounts `NewConsultationModal`) — on mount, check `URLSearchParams.get('restoreSession')` and re-fire `waitForSessionReady` if present.

Apply parallel change to `src/components/consultation/ConsultationWizard.tsx` if it has a similar 401 throw.

### 8.2 Replace AuraImportPanel CDN PDF.js with bundled (F-18)

`src/components/dashboard/mastermind/AuraImportPanel.tsx` lines 86-127 — replace `loadPdfJs` with a thin wrapper around the bundled module:

```diff
-  // Load pdf.js library from CDN with retry
-  const loadPdfJs = useCallback(async (): Promise<any> => {
-    const win = window as any;
-    if (win.pdfjsLib) return win.pdfjsLib;
-
-    const PDFJS_VERSION = '3.11.174';
-    const CDN_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`;
-    const WORKER_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;
-    // ... CDN load logic ...
-  }, []);
+  // Load pdf.js from the bundled package (no CDN dep).
+  // Resolves the 2026-04-19 incident "Failed to load PDF renderer from CDN" class.
+  const loadPdfJs = useCallback(async (): Promise<any> => {
+    const imported = await import('pdfjs-dist/legacy/build/pdf.mjs');
+    return imported as any;
+  }, []);
```

### 8.3 Latin1 → UTF-8 (F-19)

`src/lib/mastermind/aura-pdf.ts:86-90`:

```diff
 function extractTextFallback(bytes: Uint8Array, maxChars: number): string {
-  const raw = Buffer.from(bytes).toString('latin1');
-  const normalized = raw.replace(/[^\x20-\x7E\r\n]+/g, ' ');
+  const raw = Buffer.from(bytes).toString('utf8');
+  const normalized = raw
+    .replace(/ +/g, ' ')
+    .replace(/[^\x20-\x7E -￿\r\n]+/g, ' ');
   return normalized.replace(/\s{2,}/g, ' ').trim().slice(0, maxChars);
 }
```

### 8.4 SVG aria-label typo (F-20)

`src/app/api/mastermind/simulate/route.ts:88`:

```diff
-<svg ... aria-label="${escapeSvgText(`${palette.title} ${frame.timepoint} projection`)}}">
+<svg ... aria-label="${escapeSvgText(`${palette.title} ${frame.timepoint} projection`)}">
```

**GATE 5:**
```bash
grep -n "cdnjs.cloudflare.com" /private/tmp/rani-hotfix/src/components/dashboard/mastermind/AuraImportPanel.tsx
# Expect: 0 lines
grep -n 'aria-label=.*}}"' /private/tmp/rani-hotfix/src/app/api/mastermind/simulate/route.ts
# Expect: 0 lines

git add -A && git commit -m "fix(intake-sim): F-15/F-18/F-19/F-20 — auth recovery + bundled PDF.js + UTF-8 fallback + SVG a11y"
```

---

## 9. PHASE 6 — Real simulation OR honest labeling (F-11) — 1.5 days

**You must pick one path.** Path A is preferred for revenue impact. Path B is the safe minimum.

### Path A (preferred): Wire `simulation-engine.ts`

The canvas-filter simulation engine exists at `src/lib/mastermind/simulation-engine.ts:67` but is unused by the simulate route. Wire it up:

1. Read the engine in full. Confirm it can run server-side (canvas in Node via `node-canvas`, OR mark as client-side and have the dashboard render the comparison).
2. If server-side: install `@napi-rs/canvas`, replace simulate's `buildDataDrivenSimulation` with a call that produces real PNG data URLs.
3. If client-side: change the simulate route's response to include `simulationInputs: { sourcePhotoUrl, scanResult, plan }` and have the dashboard's `PresentationMode` invoke `generateSimulationComparison` in the browser.

### Path B (minimum acceptable): Honest labeling

If Path A is out of budget this sprint, at minimum:

1. Add `kind: 'photo-simulation' | 'data-projection'` to `SimulationFrame`:

```ts
// src/types/mastermind.ts
export interface SimulationFrame {
  imageDataUrl: string;
  kind: 'photo-simulation' | 'data-projection';   // NEW — required
  timepoint: string;
  monthNumber: number;
  description: string;
  auraScoreProjection: number;
  skinAgeProjection: number;
}
```

2. In `simulate/route.ts:resolveFrameImage`, set `kind: 'photo-simulation'` when reusing a real photo, `kind: 'data-projection'` when generating SVG.

3. Update the dashboard's PresentationMode component to render a "Projected Score" data card when `kind === 'data-projection'` and **never** show a card that misleadingly looks like a face simulation.

4. Update the SVG to remove headings like "With Treatment" and replace with `"Projected outcome — Month {N}"` so it reads as a data card not a photo.

**GATE 6:** Frontend QA — run a session through the dashboard, take a screenshot of the simulation slide. Confirm a non-technical viewer cannot mistake the rendering for a real face transformation.

```bash
git add -A && git commit -m "fix(intake-sim): F-11 — $(echo 'real simulation engine wired' OR 'honest data-projection labeling')"
```

---

## 10. PHASE 7 — Smoke harness expansion (F-17) — 4 hours

Add three new smoke scripts to `scripts/`:

### 10.1 `scripts/smoke-clinical-safety.mjs`

```js
#!/usr/bin/env node
/**
 * Clinical safety smoke — asserts that intake hints in medicalHistory/medications
 * trigger the metabolic-engine guard rail. Failures here are clinical-safety P0.
 */
import { Blob } from 'node:buffer';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const HAZARD_CASES = [
  { name: 'pancreatitis', flag: 'pancreatitisHistory', text: 'history of acute pancreatitis 2024', track: 'glp1' },
  { name: 'medullary-thyroid', flag: 'thyroidCancerHistory', text: 'family history of medullary thyroid cancer', track: 'glp1' },
  { name: 'gallstones', flag: 'gallbladderDisease', text: 'recurrent gallstones, awaiting cholecystectomy', track: 'glp1' },
  { name: 'severe-depression', flag: 'severeDepression', text: 'severe depression with prior suicidal ideation', track: 'glp1' },
  { name: 'eating-disorder', flag: 'eatingDisorderHistory', text: 'history of bulimia in remission', track: 'glp1' },
];

let pass = 0, fail = 0;
for (const c of HAZARD_CASES) {
  const form = new FormData();
  form.append('data', JSON.stringify({
    firstName: 'Hazard', lastName: c.name, email: `hazard-${c.name}@audit.local`,
    phone: '(206) 555-0900', dob: '1990-01-01',
    skinConcerns: ['body-contouring'], targetAreas: ['face'],
    treatmentInterests: ['glp1', 'weight-loss'],
    goals: 'weight-loss', timeline: 'asap', budget: 'investment', skinType: 'normal', smsConsent: false,
    medicalHistory: c.text,
  }));
  const res = await fetch(`${BASE_URL}/api/consultation/submit`, {
    method: 'POST',
    headers: { Origin: BASE_URL },
    body: form,
  });
  const body = await res.json().catch(() => null);
  const status = body?.metabolicRecommendation?.status;
  const blocked = body?.metabolicRecommendation?.safetyBlocked === true || (status && status !== 'eligible');
  if (blocked) {
    pass++;
    console.log(`[PASS] ${c.name} → blocked (status=${status})`);
  } else {
    fail++;
    console.error(`[FAIL] ${c.name} → STILL ELIGIBLE (status=${status}). Body:`, JSON.stringify(body?.metabolicRecommendation));
  }
  await new Promise((r) => setTimeout(r, 13_000));   // pace to public rate limit
}
console.log(`---\nresult: ${pass}/${HAZARD_CASES.length} hazards blocked`);
process.exit(fail === 0 ? 0 : 1);
```

### 10.2 `scripts/smoke-aura-pdf.mjs`

Drives 5 cases: real PDF, fake PDF, oversized PDF, malformed PDF, no-file. Asserts each surfaces correct status. Use real PDF at `/Users/sukhithebanker/Desktop/Rina_Rai_handout_2026-04-04_16-50-38.pdf` (~6.8 MB).

### 10.3 `scripts/smoke-cross-lambda-race.mjs`

Submits 10 sessions in rapid succession with no pacing; asserts each follow-up `GET /sessions/[id]` succeeds within 2s. (Tests the retry helper.)

**GATE 7:**
```bash
BASE_URL=http://localhost:3000 node scripts/smoke-clinical-safety.mjs
# Expect: 5/5 hazards blocked

git add -A && git commit -m "fix(intake-sim): F-17 — smoke harness expansion (clinical-safety, aura-pdf, race)"
```

---

## 11. PHASE 8 — Observability (F-16) — 2 hours

Replace every `console.error('[X] ...', err)` in the audit-scope routes with a structured event:

```ts
console.error(JSON.stringify({
  event: 'mastermind.<surface>.<failure_mode>',
  sessionId,                        // when applicable
  source,                           // when applicable
  error: err instanceof Error ? err.message : String(err),
  ts: new Date().toISOString(),
}));
```

**Event tags to introduce:**
- `consultation.submit.invalid_payload` — 400/422 paths
- `consultation.submit.session_persist_failed` — 503 paths
- `mastermind.scan.failed`
- `mastermind.scan.photo_unavailable`
- `mastermind.plan.failed`
- `mastermind.simulate.failed`
- `mastermind.complete.webhook_failed`
- `mastermind.complete.success`
- `mastermind.auto_scan.failed`
- `mastermind.auto_scan.completed`
- `mastermind.aura_pdf.parse_failed`
- `mastermind.aura_pdf.parsed`
- `session_store.save_failed`
- `metabolic.flag_blocked` — when a hazard flag fires

Wire into Sentry (already configured via `@sentry/nextjs`) so each event creates a breadcrumb.

**GATE 8:**
```bash
grep -rn "console.error.*event" /private/tmp/rani-hotfix/src/app/api/mastermind /private/tmp/rani-hotfix/src/app/api/consultation /private/tmp/rani-hotfix/src/lib/mastermind | grep -E '"event"' | wc -l
# Expect: ≥ 10

git add -A && git commit -m "fix(intake-sim): F-16 — structured event logs across mastermind surface"
```

---

## 12. PHASE 9 — Final verification matrix (1 hour)

Run the entire test suite + every new smoke. **All must pass before the mission is complete.**

```bash
# 12.1 Lint + typecheck
cd /private/tmp/rani-hotfix
npx next lint
npx tsc --noEmit

# 12.2 Unit + route tests
npx vitest run \
  src/lib/client/__tests__/safe-fetch.test.ts \
  src/lib/consultation/__tests__/submit-schema-compat.test.ts \
  src/lib/medical/__tests__/boomrx-formulary.test.ts \
  src/lib/mastermind/__tests__/session.test.ts \
  src/lib/mastermind/__tests__/session-store-classify.test.ts \
  src/app/api/__tests__/

# 12.3 BoomRx integrity
node scripts/audit-boomrx-formulary.mjs

# 12.4 Existing intake smoke (baseline)
BASE_URL=http://localhost:3000 \
  SMOKE_PDF=/Users/sukhithebanker/Desktop/Rina_Rai_handout_2026-04-04_16-50-38.pdf \
  PACE_MS=13000 \
  node scripts/smoke-mastermind-intake.mjs 10
# Expect: 10/10 pass

# 12.5 New smokes
BASE_URL=http://localhost:3000 node scripts/smoke-clinical-safety.mjs   # 5/5 hazards blocked
BASE_URL=http://localhost:3000 node scripts/smoke-aura-pdf.mjs           # 5/5 cases handled
BASE_URL=http://localhost:3000 node scripts/smoke-cross-lambda-race.mjs  # 10/10 within 2s

# 12.6 Build
NODE_OPTIONS='--max-old-space-size=8192' npx next build
```

**GATE 9 — definition of done:**
- ✅ Lint + typecheck clean
- ✅ All unit/route tests green (zero new failures)
- ✅ BoomRx integrity script reports 0 corrupt rows
- ✅ Intake smoke 10/10
- ✅ Clinical-safety smoke 5/5
- ✅ Aura-PDF smoke 5/5
- ✅ Cross-Lambda race smoke 10/10
- ✅ `next build` succeeds

---

## 13. PHASE 10 — Tree consolidation + PR (1 hour)

### 13.1 Verify the canonical tree is no longer needed

```bash
diff -r /Users/sukhithebanker/Desktop/Claude/rani-beauty-clinic/src/lib/client/safe-fetch.ts \
        /private/tmp/rani-hotfix/src/lib/client/safe-fetch.ts && echo "OK safe-fetch matches"
diff -r /Users/sukhithebanker/Desktop/Claude/rani-beauty-clinic/src/lib/consultation/schema.ts \
        /private/tmp/rani-hotfix/src/lib/consultation/schema.ts || echo "Schemas differ (expected — hotfix has new fields)"
```

Confirm every canonical hardening is now in hotfix; the canonical tree is redundant.

### 13.2 Push and open PR

```bash
cd /private/tmp/rani-hotfix
git push -u origin feat/intake-hardening-2026-04-25
gh pr create --title "fix(intake-sim): forensic audit 2026-04-25 — hardening sweep" --body "$(cat <<'EOF'
## Summary
- Resolves all 20 findings from `audits/intake-simulation-forensic-audit-2026-04-25.md`.
- Cherry-picks the 2026-04-19 incident-response hardening that was orphaned in a sibling working tree.
- Adds clinical-safety flags so pancreatitis / MTC / gallbladder / severe-depression / eating-disorder histories block GLP-1 routing.
- Splits 3 corrupted BoomRx formulary rows; adds parser + CI guards.
- Wires `getSessionByIdAsyncRetry` across every session loader.
- Adds auth gates to `/api/mastermind/aura-import` (was open to public).
- Centralizes `[base64_stripped]` / `[photo_ref_unavailable]` markers.
- Adds 3 new smoke harnesses + structured event logs.

## Test plan
- [ ] `npx next lint && npx tsc --noEmit` — clean
- [ ] `npx vitest run src/lib/ src/app/api/__tests__/` — all green
- [ ] `node scripts/audit-boomrx-formulary.mjs` — 0 corrupt rows
- [ ] `node scripts/smoke-mastermind-intake.mjs 10` — 10/10
- [ ] `node scripts/smoke-clinical-safety.mjs` — 5/5 hazards blocked
- [ ] `node scripts/smoke-aura-pdf.mjs` — 5/5
- [ ] `node scripts/smoke-cross-lambda-race.mjs` — 10/10
- [ ] `next build` — succeeds
- [ ] Manual: dashboard NewConsultationModal session-expiry redirects with draft preserved
- [ ] Manual: simulation slide cannot be mistaken for a real face transformation

## Audit findings resolved
F-01, F-02, F-03 (clinical), F-04, F-05, F-06, F-07, F-08, F-09, F-10, F-11, F-12, F-13, F-14, F-15, F-16, F-17, F-18, F-19, F-20.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### 13.3 Mark canonical tree archived

```bash
mv /Users/sukhithebanker/Desktop/Claude/rani-beauty-clinic /Users/sukhithebanker/Desktop/Claude/rani-beauty-clinic.archive-2026-04-25
echo "Archived $(date -u +%Y-%m-%dT%H:%M:%SZ) — superseded by feat/intake-hardening-2026-04-25" \
  > /Users/sukhithebanker/Desktop/Claude/rani-beauty-clinic.archive-2026-04-25/ARCHIVED.md
```

(Don't `rm` it — keep for 30-day forensic recovery.)

---

## 14. Rollback plan

If anything goes wrong mid-mission:

```bash
cd /private/tmp/rani-hotfix
git checkout main                         # back to baseline
git branch -D feat/intake-hardening-2026-04-25     # delete failed branch
# OR if a phase was committed but later phase broke the tree:
git checkout feat/intake-hardening-2026-04-25
git revert HEAD                           # revert latest commit, keep history
# OR partial revert:
git revert <commit-sha>
```

If the dev server fails to start after a phase: `pkill -f "next dev"; rm -rf .next; npm run dev`.

If `npm ci` corrupts node_modules: `rm -rf node_modules && npm ci --no-audit --no-fund`.

---

## 15. Hard rules (re-stated for memory)

- **Phase 1 must complete before Phase 2.** No skipping ahead.
- **Every gate must pass before commit.** A failing gate = stop, fix, retry.
- **No production deploy in this mission.** Push branch → open PR → human review → merge → CI deploys.
- **Clinical safety (F-03) is non-negotiable.** If your medical-flag wiring still lets a pancreatitis hint pass to a GLP-1 track, the mission has failed regardless of other progress.
- **No force pushes. No history rewriting.** All work is on a feature branch with normal history.
- **Document anything weird.** If the canonical tree is missing a file you expected, write a note in the PR description. Don't silently invent.

---

## 16. Success metric

When this mission is complete, running the audit again should produce a weighted grade of **≥95/100 (A)**, with all 20 findings closed and all 10 prior incident classes (`audits/INCIDENT-2026-04-19-mastermind-intake.md`) regression-tested in CI.

The next time someone runs:
```bash
curl -X POST http://localhost:3000/api/consultation/submit -H "Origin: http://localhost:3000" -F 'data={...pancreatitis intake...}'
```
the response must include `metabolicRecommendation.safetyBlocked: true` AND a clear `Provider Review Required` banner. **That single test is the soul of this mission.** Hold it sacred.

---

**Mission brief end. Begin Phase 0 (pre-flight) immediately. Report progress at every gate.**
