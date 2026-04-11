# Tier 1 Zod Scope Audit — 2026-04-11

**Author:** Claude (Wave 11 + Horizon 1 swim lane)
**Branch:** `claude/tier1-zod-validation` (off merged PR #4 head)
**Status:** Scope correction — the original "88 routes missing zod validation" figure from `docs/audits/CODEBASE-AUDIT-2026-04-10.md` was inflated. Real zod gap is much narrower; Tier 1 shipped as depth upgrades on weak schemas, not coverage expansion.

---

## What the audit claimed

The billion-dollar-agency audit (`CODEBASE-AUDIT-2026-04-10.md`, risk register item SEC-14) flagged "88 API routes missing zod validation" as a Tier 1 P1 item. The original plan was to pick 20 high-priority routes and add zod schemas over ~5–10 hours of focused work.

## What I actually found

Re-running the measurement with a tighter filter:

| Measurement | Count |
|---|---|
| Mutation handlers (POST/PATCH/PUT/DELETE) | 58 |
| Handlers that import zod | 35 |
| Handlers that call `safeParse` or `.parse` | 38 |
| Handlers that call `request.json()` | 30 |
| **Handlers that call `request.json()` but do NOT import zod** | **0** |

Of the original 58 mutation handlers, **every route that actually reads a JSON body already validates it with zod**. The "27 routes without zod" list I started with turned out to be:

- **15 stub routes** — 501 not-implemented handlers (`ai/{advisor,outcome,protocols,quiz,skin-analysis}`) and 7× 8-line `dashboard/entry/{ceo-note, consult-notes, eod-recap, inventory, review, room-issue, staff-note}` placeholders that do auth checks + `return { success: true }`. No body read, no logic, no risk.
- **Routes that use text/formData** instead of `request.json()` (webhooks, file uploads) — caught by different grep.
- **False positives from quote-style matching** (`"zod"` vs `'zod'`) — `contact/route.ts` has had zod since Wave 9, but a naive `grep -rl "from 'zod'"` missed it.

## What the real Tier 1 gap was

Depth, not coverage. Of the 35 routes that already had zod imports, several used the weakest-possible schema patterns:

| Route | Old schema | Risk |
|---|---|---|
| `consultation/submit` | `z.record(z.unknown())` + `as Partial<ConsultationFormData>` cast | PII intake data flowed into Airtable with no field-level typing |
| `dashboard/consult` (POST) | `z.record(z.unknown())` | AI copilot engine crashed at runtime on shape mismatches; authed but permissioned |
| `webhooks/mangomint` | no envelope validation — raw `JSON.parse` + switch | Handler crashed on non-object bodies; event/data extraction was loose |
| `webhooks/stripe` | no validation on `session.metadata` (user-controllable) | Metadata injection flowed verbatim into Airtable `Client Name`, `Notes` fields |

These are the ones I fixed in this pass.

## What shipped

### New
- `src/lib/validation/parse-body.ts` — shared `parseJsonWithSchema` / `parseTextWithSchema` helpers with uniform 400/422 responses
- `src/lib/validation/__tests__/parse-body.test.ts` — 9 tests (happy path, malformed JSON, schema mismatch, null body, missing fields, HMAC-preserving sync path)

### Hardened
- `src/app/api/webhooks/mangomint/route.ts` — envelope schema rejects non-object bodies before the event switch runs
- `src/app/api/webhooks/stripe/route.ts` — `StripeMetadataSchema` caps `planId`/`tier`/`clientName` lengths and enforces string types on metadata fields
- `src/lib/consultation/schema.ts` — exports `submitIntakeSchema` (full form schema minus photos, `.partial().passthrough()`)
- `src/app/api/consultation/submit/route.ts` — uses `submitIntakeSchema` instead of `z.record(z.unknown())`; returns 422 with `details` on parse failure
- `src/app/api/dashboard/consult/route.ts` — `ConsultInputSchema` matches the `ConsultInput` interface from the copilot engine; enforces `client.name` length, `membershipStatus` enum, array bounds, `timeAvailable` range

### Intentionally NOT touched
- **12 stub routes** (5 ai/* + 7 dashboard/entry/*) — no body processing to validate. Documented here for the next pass: when these get wired up, add zod at that time.
- **3 routes using permissive `z.record(z.unknown())` where the field is genuinely a grab-bag**: `webhooks/meta-capi.custom_data`, `ai/chat.visitorInfo`, `ai/intake.intakeData`. These are Meta pixel/visitor metadata fields that are intentionally schema-less.

## What the audit's "88" number should say

After this pass, the correct read is:

> All mutation handlers that read a JSON or text body validate it with zod. 12 stub routes are not implemented — they'll need validation when wired up. 3 routes use `z.record` intentionally for grab-bag fields.

Risk register update recommended:
- **SEC-14** status: `OPEN (88 routes)` → `RESOLVED (coverage) / OPEN (stubs — 12 routes on wire-up)`

## Where this leaves Tier 1

| Original Tier 1 item | Status |
|---|---|
| zod validation coverage (88 routes) | **Resolved — was overstated** |
| zod validation depth (weak schemas) | **Shipped** (5 schemas hardened, shared helper + tests added) |
| Sentry wiring audit | Pending |
| Dependency sweep / replay hardening | Pending |
| Tenant middleware hostname hardcode | Pending |
| mastermind/sessions list-without-scope | Pending |
| Dead code cleanup (18 .tmp files, 24 orphans) | Pending |
| 105 API routes missing integration tests | Pending |

Next passes should skip zod and go straight to the remaining items. Sentry wiring is the biggest remaining Tier 1 win because it affects how we detect the breaks we just stopped papering over.
