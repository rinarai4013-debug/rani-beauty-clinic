# Live Smoke Test Harness

## Overview

This harness validates the end-to-end purchase and operations path every morning at 06:00 PT via Vercel cron:
- `GET /api/cron/smoke-test` calls `scripts/live-smoke-test.js`
- Result is written to Airtable table `Smoke Test Runs`
- Dashboard card at `/dashboard` displays the latest run status

Cron schedule is configured in `vercel.json`:
- `0 13 * * *` (13:00 UTC = 06:00 PT)

## Required env vars

- `SMOKE_BASE_URL`
- `AIRTABLE_PAT`
- `AIRTABLE_BASE_ID`
- `SLICKTEXT_PUBLIC_KEY`
- `SLICKTEXT_BRAND_ID`
- `SQUARE_ACCESS_TOKEN` (optional; missing key marks Square check as partial)
- `W17_POST_TREATMENT_WEBHOOK_URL` (or compatible alias)
- `SLACK_WEBHOOK_URL` (optional; receives failure pages when enabled)

## Run the harness manually

```bash
node scripts/live-smoke-test.js
node scripts/live-smoke-test.js --json
node scripts/live-smoke-test.js --no-write
node scripts/live-smoke-test.js --fail-on=3
```

- `--json` prints a machine-readable result object.
- `--no-write` skips Airtable inserts (useful for local smoke).
- `--fail-on=<n>` forces check `n` to fail for failure-path validation.

## Trigger cron route

```bash
curl -X GET https://<your-domain>/api/cron/smoke-test \
  -H "x-vercel-cron: 1"
```

## Interpret results

### 200 response
- `ok: true` indicates all checks passed.
- `status: Pass | Partial` indicates healthy with optional partial checks.

### 500 response
- One or more checks failed (`status: Fail`).
- Dashboard card will highlight failed checks and provide spec links when available.

## Disable / pause the harness

Until a route is intentionally decommissioned, remove or rename the cron entry in `vercel.json`:
```json
"crons": []
```

Do not delete the harness files until `scripts/live-smoke-test.js` and
`src/app/api/cron/smoke-test/route.ts` are intentionally retired.

## Airtable table deployment

Deploy the `Smoke Test Runs` table using:

```bash
export AIRTABLE_PAT=...
export AIRTABLE_BASE_ID=...
python3 RaniOS/scripts/deploy_smoke_test_table.py
```
