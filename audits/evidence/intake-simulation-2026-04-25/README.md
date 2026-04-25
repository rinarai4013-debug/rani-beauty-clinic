# Evidence — Intake + Mastermind Simulation Forensic Audit
**Date:** 2026-04-25
**Audited tree:** `/private/tmp/rani-hotfix` (branch `main`, dev server running on `:3000`)
**Companion:** [../../intake-simulation-forensic-audit-2026-04-25.md](../../intake-simulation-forensic-audit-2026-04-25.md), [../../intake-simulation-fix-ledger-2026-04-25.md](../../intake-simulation-fix-ledger-2026-04-25.md)

This directory captures all runtime artefacts produced during the audit so every finding in the main report is reproducible.

Note: Some logs in `smokes/` are **historical baseline snapshots** from before the latest hardening pass. Re-run the smoke scripts after deployment to generate post-hardening evidence.

---

## Layout

```
intake-simulation-2026-04-25/
├── README.md                          ← you are here
├── smokes/                            ← captured response bodies from runtime probes
│   ├── audit-noauth.txt              ← Test 5: GET /api/mastermind/sessions/<id> without auth → 401 JSON
│   ├── audit-scan-bad.txt            ← Test 6: POST /api/mastermind/scan with malformed body → 401 JSON (auth-gated, body never read)
│   ├── audit-aura.txt                ← Test 7: GET /api/mastermind/aura-import → 401 (auth required) — F-08
│   ├── audit-c.txt                   ← Test 8: POST /api/mastermind/complete with {} → 400/500 depending on environment auth and payload path
│   ├── audit-ap.txt                  ← Test 9: POST /api/mastermind/aura-import with {} → 401 (auth enforced before validation) — F-08
│   ├── audit-bad.txt                 ← Test 3: POST submit with malformed `data` field → 400/422 invalid payload shape
│   ├── audit-empty.txt               ← Test 4: POST submit with no body → 400 missing form data
│   ├── audit-full.txt                ← Test 1: full valid payload → 200; formulary rows are normalized (no merged labels) — F-07
│   ├── audit-dash.txt                ← Test 2: dashboard-vocabulary payload → 200 (vocab coercion works)
│   ├── min-data.txt                  ← Schema-regression probe: payload missing treatmentInterests → 200 now (arrays optional) — F-02
│   ├── login.txt                     ← /api/dashboard/auth/login probe → 401 with "Invalid credentials" (no test user; auth still enforced)
│   ├── smoke-a.json                  ← Peptide-track recommendation; cleaned labels validated after split — F-07
│   ├── smoke-b.json                  ← GLP-1 + pancreatitis history → blocked recommendation + safety flag — F-03
│   ├── smoke-c.json                  ← 13MB body → 413 application/json {"error":"Request body too large"}
│   └── smoke-d.json                  ← Fake .pdf (text file) → not parsed + warning, with fallback handling — F-09
└── static-evidence/
    ├── file-shas.txt                 ← SHA-256 of every audited source file
    └── dev-server-log-tail.txt       ← Last 50 lines of /tmp/rani-hotfix-dev.log at audit close
```

---

## How to reproduce

### 1. Bring up the system

Confirm the dev server is the hotfix tree:
```sh
ps -ef | grep "next dev" | grep -v grep
# Expect: node /private/tmp/rani-hotfix/node_modules/.bin/next dev
lsof -i :3000 -P -n | head
```

If down:
```sh
cd /private/tmp/rani-hotfix && (npm run dev > /tmp/rani-hotfix-dev.log 2>&1 &)
# Wait until /api/mastermind/sessions returns 401 (server up):
until [ "$(curl -sS -o /dev/null -w "%{http_code}" http://localhost:3000/api/mastermind/sessions)" = "401" ]; do sleep 1; done
```

### 2. Run the probes

Each block below corresponds to a finding in the audit report.

#### F-02 — `treatmentInterests` `min(1)` regression
```sh
curl -sS -X POST http://localhost:3000/api/consultation/submit \
  -H "Origin: http://localhost:3000" \
  -F 'data={"firstName":"Audit","lastName":"Probe","email":"audit+probe@example.com","phone":"(206) 555-0100","skinConcerns":["fine-lines"],"targetAreas":["face"]}'
```
Expect `HTTP 200` with accepted payload; see [smokes/min-data.txt](smokes/min-data.txt).

#### F-03 — GLP-1 cleared for patient with pancreatitis history
```sh
curl -sS -X POST http://localhost:3000/api/consultation/submit \
  -H "Origin: http://localhost:3000" \
  -F 'data={"firstName":"Smoke","lastName":"B","email":"smoke-b@audit.local","phone":"(206) 555-0501","dob":"1990-01-01","skinConcerns":["body-contouring"],"targetAreas":["face"],"treatmentInterests":["glp1","weight-loss"],"goals":"weight-loss","timeline":"asap","budget":"investment","skinType":"normal","smsConsent":false,"medications":"history of acute pancreatitis 2024","medicalHistory":"pancreatitis flare last year"}'
```
Expect `HTTP 200` with `metabolicRecommendation.safetyBlocked === true` or `status !== "eligible"` for GLP-1 patient indicators. See [smokes/smoke-b.json](smokes/smoke-b.json).

#### F-07 — Corrupted BoomRx product label
```sh
node scripts/audit-boomrx-formulary.mjs
```
Expect `OK: 0 corrupt rows`.

Then verify there are no embedded `$` remnants in recommended product labels in live output:
```sh
node -e 'const fs=require("fs"); const r=JSON.parse(fs.readFileSync("smokes/audit-full.txt","utf8")); const bad=(r.medicalOffers?.recommendedProducts||[]).filter((p)=>/\\$/.test(p.label||"")); console.log("bad labels:", bad.length); if (bad.length){console.log(bad[0]?.label?.slice(0,140));}'
```
Expect `bad labels: 0` after a fresh post-fix smoke run.

#### F-08 — `/api/mastermind/aura-import` has no auth
```sh
curl -sS -o smokes/audit-aura.txt -w "%{http_code}\n" http://localhost:3000/api/mastermind/aura-import
```
Expect `401` with `{"error":"Unauthorized"}`. See [smokes/audit-aura.txt](smokes/audit-aura.txt).

```sh
curl -sS -o smokes/audit-ap.txt -w "%{http_code}\n" -X POST http://localhost:3000/api/mastermind/aura-import \
  -H "Content-Type: application/json" -d '{}'
```
Expect `401` (auth enforced before validation). See [smokes/audit-ap.txt](smokes/audit-ap.txt).

#### F-09 — Fake PDF accepted as parsed
```sh
echo "not a pdf, just plain text" > /tmp/fake.pdf
curl -sS -X POST http://localhost:3000/api/consultation/submit \
  -H "Origin: http://localhost:3000" \
  -F 'data={"firstName":"Smoke","lastName":"D","email":"smoke-d@audit.local","phone":"(206) 555-0502","dob":"1990-01-01","skinConcerns":["aging-skin"],"targetAreas":["face"],"treatmentInterests":["hydrafacial"],"goals":"anti-aging","timeline":"gradual","budget":"moderate","skinType":"normal","smsConsent":false}' \
  -F 'aura=@/tmp/fake.pdf;type=application/pdf'
```
Expect `HTTP 200` with `auraUploadStatus` matching `...not parsed...` and a non-empty `auraUploadWarnings` array (fallback), OR a controlled parse warning event from auto-scan logging. See [smokes/smoke-d.json](smokes/smoke-d.json).

#### Oversized payload — F-13 control / negative test
```sh
dd if=/dev/zero of=/tmp/big.json bs=1k count=13000 2>/dev/null
curl -sS -X POST http://localhost:3000/api/consultation/submit \
  -H "Origin: http://localhost:3000" -H "Content-Type: application/json" \
  --data-binary @/tmp/big.json
```
Expect `HTTP 413 application/json {"error":"Request body too large"}`. See [smokes/smoke-c.json](smokes/smoke-c.json). This is the *good* outcome; no HTML proxy leak, JSON shape preserved.

#### Happy path
```sh
curl -sS -X POST http://localhost:3000/api/consultation/submit \
  -H "Origin: http://localhost:3000" \
  -F 'data={"firstName":"Audit","lastName":"Probe","email":"audit+probe@example.com","phone":"(206) 555-0100","dob":"1990-01-01","skinConcerns":["aging-skin"],"targetAreas":["face"],"treatmentInterests":["hydrafacial"],"skinType":"normal","goals":"anti-aging","timeline":"gradual","budget":"moderate","smsConsent":false}'
```
Expect `HTTP 200` with `success: true, sessionId: ms_..., medicalOffers, metabolicRecommendation`. See [smokes/audit-full.txt](smokes/audit-full.txt).

---

## Source-of-truth file SHAs

[file-shas.txt](static-evidence/file-shas.txt) anchors every static finding to the exact file bytes at audit time. Re-running `sha256sum` on the same paths after a fix lands will show a different hash; reviewers can confirm the cited line numbers still apply by reading the new file.

---

## Notes

- **Auth probes:** `login.txt` confirms the auth path is enforced (`401 {"error":"Invalid credentials"}`) but no test credentials were available, so flows that require an authenticated session (scan / plan / simulate / patch) could only be probed for their unauth behavior. Their *content* and contracts were verified statically against the source.
- **Cross-Lambda race window (F-04):** This is a serverless-only behavior. Local dev hits a single Node process so the race never materializes. Evidence is source-only (`grep -n "getSessionByIdAsync\b"`); the **historical** evidence is in [`../../INCIDENT-2026-04-19-mastermind-intake.md`](../../../INCIDENT-2026-04-19-mastermind-intake.md) where the same Airtable backend showed 100–1500ms read-after-write lag.
- **Targeted vitest suites** can run after dependency repair (`rm -rf node_modules && npm ci` when needed). In this pass:
  - `npx vitest run src/lib/client/__tests__/safe-fetch.test.ts src/lib/consultation/__tests__/submit-schema-compat.test.ts src/lib/medical/__tests__/boomrx-formulary.test.ts`
  - all tests passed.
- **`audit-scan-bad.txt`** shows `401 {"error":"Unauthorized"}` even though the body was malformed JSON — the auth check fires before body parsing. This is correct posture (defense in depth).
