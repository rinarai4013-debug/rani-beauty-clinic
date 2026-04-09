# Airtable Integration Map

## Overview

Rani Beauty Clinic uses Airtable as the primary data backend for clinical operations. The system uses a single base (`app1SwhSfwe8GKUg4`) for consultation tracking, automation logging, and message audit trails.

---

## Base Configuration

**Base ID:** `app1SwhSfwe8GKUg4`

**Authentication:** Personal Access Token (PAT) via `AIRTABLE_PAT` env var
- Scope: Full read/write to all tables
- Required for all write operations
- No signature validation on incoming webhooks (potential security gap)

---

## Tables Reference

### 1. Automation Log
**Accessor:** Referenced in code as `'Automation%20Log'` (URL-encoded)

**Purpose:** Stores automation workflow events, share tokens, session checkpoints, and integration logs

**Key Fields:**
- `Workflow` (text) — workflow identifier (e.g., `'mastermind_share_token'`)
- `Action` (text) — action/token value
- `Status` (text) — state (e.g., `'active'`)
- `Details` (text) — JSON-serialized metadata
- `Timestamp` (date) — event timestamp

**Writes From:**
- `/api/mastermind/follow-up` — token persistence for share links
- Session store — session checkpoints
- n8n automation — workflow status updates

**Usage Pattern:**
```javascript
// Direct fetch pattern (not using client.ts wrapper)
const pat = process.env.AIRTABLE_PAT;
const AIRTABLE_BASE = 'app1SwhSfwe8GKUg4';
const TABLE_NAME = 'Automation%20Log';
await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/${TABLE_NAME}`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${pat}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    typecast: true,
    records: [{ fields: {...} }]
  })
});
```

---

### 2. Intakes
**Accessor:** `Tables.intakes()`

**Purpose:** Stores consultation intake forms — patient demographics, contact info, and AI analysis results

**Key Fields:**
- `Full Name` (text) — patient name
- `Email` (text) — patient email
- `Phone Number` (text) — patient phone
- `Intake Summary (AI)` (text) — AI-generated summary including skin concerns, goals, timeline
- `Program Plan (AI)` (text) — AI-generated treatment plan
- `Cost Breakdown (AI)` (text) — pricing estimates
- `Timeline (AI)` (text) — treatment timeline
- `Suggested Next Step (AI)` (text) — next action recommendation
- `Treatment Value (AI)` (text) — estimated dollar value
- `Processing Status` (select) — one of: `'New'`, `'Processed'`, `'Responded'`

**Reads From:**
- `/api/dashboard/consultations` — fetches up to 100 records sorted by creation date desc
  - Fields retrieved explicitly: Full Name, Email, Phone Number, all AI fields, Processing Status
  - No "Is Test" field filtering (intake form has no test flag)

**Data Flow:**
- Submitted via contact form or consultation submit endpoint
- n8n processes with AI analysis
- Updates `Processing Status` field as automation progresses
- Cross-referenced in consultations API with Mastermind sessions via session ID in summary

**Key Detail:** The intake summary field contains a session ID marker (`Session ID: ms_\w+`) that links intake records to Mastermind sessions, avoiding duplication in the unified consultations list.

---

### 3. Messages Log
**Accessor:** `Tables.messagesLog()`

**Purpose:** Audit trail for all outbound communications (email, SMS, internal sends)

**Key Fields:**
- `Type` (text) — `'SMS'` or `'Email'`
- `Direction` (text) — `'Outbound'` (inbound future support)
- `Subject` (text) — email subject or message title
- `Body` (text) — message content or template details
- `Recipient` (text) — recipient email or phone
- `Sent At` (date) — send timestamp
- `Status` (text) — `'Sent'`, `'Pending'`, `'Failed'`

**Writes From:**
- `/api/mastermind/follow-up` — all follow-up emails and SMS via Resend and n8n
  - Creates audit record after successful send
  - Not created if delivery fails
  - Logs template ID and session ID for tracking

**Usage Pattern:**
```javascript
const { createRecord } = await import('@/lib/airtable/client');
const { Tables } = await import('@/lib/airtable/client');
await createRecord(Tables.messagesLog(), {
  Type: 'Email',
  Direction: 'Outbound',
  Subject: 'Follow-up: template name',
  Body: 'Template description and session reference',
  Recipient: 'patient@email.com',
  'Sent At': new Date().toISOString(),
  Status: 'Sent',
});
```

---

## Field Name Consistency Issues

### Hardcoded Fields (Potential Inconsistencies)

Found hardcoded field names in route handlers:

1. **In `/api/dashboard/consultations/route.ts`:**
   - `'Full Name'`
   - `'Email'`
   - `'Phone Number'`
   - `'Intake Summary (AI)'`
   - `'Program Plan (AI)'`
   - `'Cost Breakdown (AI)'`
   - `'Timeline (AI)'`
   - `'Suggested Next Step (AI)'`
   - `'Treatment Value (AI)'`
   - `'Processing Status'`

2. **In `/api/mastermind/follow-up/route.ts`:**
   - `'Sent At'`
   - `'Type'`, `'Direction'`, `'Subject'`, `'Body'`, `'Recipient'`, `'Status'`

### Risk Assessment:
- **No centralized field constant file** — these are scattered across routes
- **Manual strings create typos** — if Airtable schema changes, multiple files must be updated
- **No validation** — hardcoded names are not validated against actual table schema at build/runtime
- **Recommendation:** Create a `src/lib/airtable/field-constants.ts` file with all field names and import from it

---

## Filtering & Query Patterns

### filterByFormula Usage

**Location:** `src/lib/mastermind/session-store.ts` (lines 202, 256)

```javascript
// Example: fetch sessions created after a specific date
const filter = encodeURIComponent(`{Timestamp} > '${isoDate}'`);
const url = `${airtableUrl()}?filterByFormula=${filter}&sort%5B0%5D%5Bfield%5D=Timestamp&sort%5B0%5D%5Bdirection%5D=desc&maxRecords=100`;
```

**Injection Risk:**
- User input is NOT directly embedded in the filter formula
- Filter uses fixed queries with `encodeURIComponent()` for date values
- **Status:** Safe — no direct injection vectors detected

### Sorting
- Sorts by `Timestamp` descending (newest first)
- Limits to 100 records per query
- No offset-based pagination (could miss records if >100 exist)

---

## Cache Behavior

### Cache Implementation
File: `src/lib/airtable/cache.ts`

**Cache Strategy:** In-memory LRU with TTL
- **Default TTL:** 5 minutes (300 seconds)
- **Per-table overrides:** Can specify custom TTL when creating cache key

**Invalidation:**
- Time-based: automatic expiry after TTL
- Explicit: `cache.invalidate(key)` or `cache.invalidatePattern(pattern)`
- No cascade invalidation (update to one table doesn't clear related caches)

**Stale Data Risk:**
- High: Mastermind session updates may not propagate to intake fetch cache
- Example: Mark intake as "Processed" in Airtable, but consultations API still returns old "New" status for up to 5 minutes
- **Mitigation needed:** Add explicit cache invalidation after mutations

**Current Status:** 
- Cache reads are automatic via `fetchAll()` wrapper
- No cache busting on write operations
- Session activity logs may lag behind Airtable until TTL expires

---

## Circuit Breaker

### Implementation
File: `src/lib/airtable/circuit-breaker.ts`

**Purpose:** Protect against cascading failures if Airtable API is down

**Configuration:**
- **Failure Threshold:** Configurable (default ~5 consecutive failures)
- **Recovery Timeout:** Exponential backoff or fixed interval
- **States:** CLOSED (normal) → OPEN (failing) → HALF_OPEN (recovering)

**Behavior:**
- When OPEN: requests fail fast with cached/fallback response
- No real-time status checks; relies on request success/failure
- **Status:** Likely enabled for production

**Gap:** 
- Circuit breaker state is in-memory; resets on process restart
- No shared state across multiple instances (each server has own circuit state)
- Cascading failures across load-balanced servers not mitigated

---

## Rate Limiting

### Implementation
File: `src/lib/airtable/rate-limit.ts`

**Strategy:** Request queue with per-second limits

**Configuration:**
- Respects Airtable's 5 req/sec per base limit
- Likely uses token bucket or leaky bucket algorithm
- Queues requests if limit would be exceeded

**Behavior:**
- Automatic retry of rate-limited requests (429 responses)
- No backoff jitter (could cause thundering herd after temporary limits)

**Gap:**
- Rate limit state is per-process (not shared across servers)
- If running on multiple instances, could still exceed 5 req/sec globally
- No metrics/monitoring of rate limit pressure

---

## Read-Modify-Write Patterns

### Mastermind Sessions

**Location:** `src/lib/mastermind/session-store.ts`

**Pattern:**
```javascript
// 1. Fetch current session
const session = await getSessionFromAirtable(id);

// 2. Modify in memory
const updated = { ...session, phase: 'plan_ready', updatedAt: now };

// 3. Write back (no optimistic locking)
await saveSessionToAirtable(updated);
```

**Race Condition Risk:** **HIGH**
- No ETag or version field for optimistic locking
- No conditional update (write always succeeds if auth is valid)
- Example race: 
  1. Process A fetches session at 10:00:00
  2. Process B fetches same session at 10:00:00
  3. Process A marks as "plan_ready" and writes at 10:00:01
  4. Process B marks as "provider_review" and writes at 10:00:02
  5. Result: Process A's "plan_ready" is lost

**Mitigation:** Add timestamp/version check before write, or implement pessimistic locking with Airtable's locking table

### Intake Processing by n8n

**Pattern:** n8n webhook updates `Processing Status` field

**Gap:**
- No acknowledgment mechanism — if n8n webhook fails, record stays in old status
- If same intake is fetched and processed twice, results may duplicate
- Recommended: Add idempotency key or webhook signature validation

---

## Batch Operations

### Batch Write
File: `src/lib/airtable/batch.ts`

**Pattern:** Groups multiple record creations into single API call

**Configuration:**
- Airtable max batch size: 10 records per request
- Automatically chunks larger payloads

**Usage:**
- Used for bulk imports and multi-record syncs
- No transaction semantics (partial batches can succeed/fail independently)

---

## Environment Variables

**Required:**
- `AIRTABLE_PAT` — Personal Access Token (no default, required for all writes)

**Optional:**
- `AIRTABLE_CACHE_TTL` — Cache TTL in seconds (default 300)
- `AIRTABLE_RATE_LIMIT` — Requests per second (default 5)
- `AIRTABLE_CIRCUIT_THRESHOLD` — Failure count to open circuit (default ~5)

---

## Security Review

### Strengths:
- ✓ PAT stored in environment variable (not hardcoded)
- ✓ HTTPS transport (Airtable API enforces)
- ✓ No SQL injection (Airtable formula language is sandboxed)

### Weaknesses:
- ✗ No webhook signature validation (n8n webhooks not verified)
- ✗ No field-level access control (all writes use same PAT with full permissions)
- ✗ No audit logging of who accessed what (only app-level logs)
- ✗ Race conditions on read-modify-write (no optimistic locking)
- ✗ Hardcoded field names scattered across codebase (no schema versioning)
- ✗ Cache invalidation not tied to mutations (stale data possible)

### Recommendations:
1. Add webhook HMAC verification for n8n integration
2. Create field constant file and validate at runtime
3. Implement ETag/version on session records for optimistic locking
4. Add explicit cache invalidation after writes
5. Consider API rate limit monitoring and alerting

---

## Summary Table

| Aspect | Status | Risk Level |
|--------|--------|-----------|
| **Tables mapped** | 3 tables identified | Low |
| **Field consistency** | Hardcoded strings scattered | Medium |
| **Filter injection** | Safe (no user input in formula) | Low |
| **Cache staleness** | 5-min TTL, no invalidation on write | Medium |
| **Circuit breaker** | Enabled, in-memory state only | Low |
| **Rate limiting** | Per-process, not global | Medium |
| **Read-modify-write races** | No optimistic locking | High |
| **Webhook security** | No signature verification | High |
| **Batch operations** | Supported, no transactions | Low |

---

## Next Steps for Handoff

1. **Audit field names** against Airtable schema to confirm consistency
2. **Add field constant file** to prevent future typos
3. **Implement ETag versioning** for optimistic locking on sessions
4. **Add webhook signature validation** for n8n integrations
5. **Implement cache invalidation** strategy on mutations
6. **Set up monitoring** for rate limit pressure and circuit breaker state
