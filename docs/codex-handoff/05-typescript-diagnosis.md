# TypeScript Timeout Diagnosis

> Generated: 2026-04-07 | Read-only analysis
> Updated: 2026-04-07 evening — single-file hang eliminates graph hypothesis
> Status: **Parked** — toolchain investigation, not a deploy blocker

---

## Observed Symptoms

1. `tsc --project tsconfig.critical.json --noEmit` hangs past 90s (critical config has ~35 entry files)
2. `tsc --project tsconfig.critical.json --listFilesOnly` hangs past 45s
3. **`tsc --noEmit middleware.ts` hangs on a single file** — 30s+ with no output
4. TypeScript 5.9.3 is installed and `tsc --version` returns instantly
5. `next dev` may be running in the background during these tests

---

## What This Rules Out

The single-file hang is the key evidence. If `tsc` can't compile one 113-line file, the problem **cannot be**:

| Hypothesis | Status | Why eliminated |
|---|---|---|
| Too many files (1,863) | **Eliminated** | Single file hangs too |
| Import-graph fan-out from SaaS cross-imports | **Eliminated** | `middleware.ts` has 2 imports (NextRequest, NextResponse from 'next/server') |
| Duplicate "page 3.tsx" files | **Eliminated** | Not in scope of a single-file check |
| Backup .ts.bak/.ts.full files | **Eliminated** | Not in scope of a single-file check |
| useTenantDashboard cross-import leak | **Eliminated** | Not in scope of a single-file check |

---

## Remaining Hypotheses (ranked by likelihood)

### 1. `next` TypeScript plugin hang

`tsconfig.json` L20-23 declares `"plugins": [{ "name": "next" }]`. This plugin hooks into the compiler to provide route-level type safety. It may:
- Try to communicate with a running `next dev` server
- Try to read/write `.next/types/` which `next dev` is actively modifying
- Deadlock waiting for a lock file

**Test (30 seconds):**
Add `"plugins": []` to `tsconfig.critical.json` compilerOptions to override the inherited plugin. Also set `"incremental": false` to avoid `.tsbuildinfo` lock contention.

```jsonc
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": true,
    "plugins": [],
    "incremental": false
  }
}
```

If `tsc` completes instantly after this, the `next` plugin is the entire problem.

### 2. `.tsbuildinfo` lock contention

`tsconfig.json` L19 has `"incremental": true` but no explicit `tsBuildInfoFile`. If `next dev` holds a lock on the default `.tsbuildinfo`, a second `tsc` process will wait indefinitely.

**Test:** Kill `next dev`, delete `.tsbuildinfo` and `.next/`, retry.

### 3. Filesystem / macOS metadata stall

Evidence supporting this:
- 4 "page 3.tsx" Finder-copy duplicates exist (Finder copies can leave extended attributes and Spotlight metadata)
- Workspace is on Desktop, which macOS may sync to iCloud
- `.next/` directory can have thousands of small files that Spotlight indexes

**Test:** `fs_usage -f filesys $(pgrep -f "tsc")` while tsc is hanging — shows what filesystem calls are blocking.

### 4. Pathological `@types` or package type resolution

Even with `skipLibCheck: true`, TypeScript still resolves type entry points from `node_modules`. A broken `exports` field in a package's `package.json` or a circular `typeVersions` map can stall the resolver.

**Test:** `node --inspect-brk node_modules/typescript/bin/tsc --noEmit middleware.ts` — attach Chrome DevTools, pause at the hang, examine the call stack.

---

## Diagnostic Playbook (for tomorrow's session)

Run in order, stop at the first one that reveals the cause:

```bash
# 0. Kill any running next dev
pkill -f "next dev" 2>/dev/null
rm -f .tsbuildinfo
rm -rf .next/types

# 1. Quick test: plugin override (if this works, stop — plugin is the cause)
node node_modules/typescript/bin/tsc \
  --noEmit --skipLibCheck \
  --plugins '[]' --incremental false \
  middleware.ts \
  --extendedDiagnostics --pretty false

# 2. If still hanging: minimal invocation (no config file at all)
node node_modules/typescript/bin/tsc \
  --noEmit --skipLibCheck \
  --target ES2017 --module esnext --moduleResolution bundler \
  --jsx preserve --strict \
  middleware.ts

# 3. If still hanging: trace what's blocking
# In terminal 1:
node node_modules/typescript/bin/tsc --noEmit middleware.ts &
TSC_PID=$!
# In terminal 2 (within 5 seconds):
sudo fs_usage -f filesys $TSC_PID 2>&1 | head -200

# 4. Nuclear option: attach debugger
node --inspect-brk node_modules/typescript/bin/tsc --noEmit middleware.ts
# Open chrome://inspect, connect, look at call stack when paused
```

---

## Why This Doesn't Block Day 1

`next.config.mjs` L12-14:
```javascript
typescript: {
  ignoreBuildErrors: true,
},
```

Vercel builds and `next build` skip TypeScript checking entirely. The site deploys regardless. The `tsc` hang is a **developer experience and CI problem**, not a production blocker.

The stabilization work (rate limits, auth guards, CORS patch) is verified by:
- `node --check <file>` (syntax validation — works)
- `git diff --check` (whitespace/merge conflict check — works)
- Route readiness script (`node scripts/route-readiness.mjs` — works)
- Manual curl/smoke tests post-deploy

---

## Previously Investigated (kept for reference but no longer primary suspects)

### Cross-import leak from excluded directories

`src/hooks/useTenantDashboard.ts` (159 lines) imports 8 modules from `@/lib/saas/tenant-dashboard/*`, pulling 77 SaaS/tenant files into the graph despite tsconfig exclude. This is real but **not the hang cause** — it would cause slowness, not a single-file hang.

### Duplicate/backup files

- 4 "page 3.tsx" files (1,681 lines total)
- 4 `.ts.bak`/`.ts.full` files in `src/lib/airtable/`

These add compile targets but don't cause hangs.

### Dead code cleanup list (still valid, do when convenient)

```
DELETE:
  src/app/(marketing)/near/[city]/[service]/page 3.tsx  (469 lines)
  src/app/(marketing)/near/[city]/page 3.tsx            (532 lines)
  src/app/(saas)/marketing/page 3.tsx                   (541 lines)
  src/app/(dashboard)/dashboard/providers/[name]/page 3.tsx (139 lines)
  src/lib/airtable/client.ts.bak
  src/lib/airtable/client.ts.full
  src/lib/airtable/tables.ts.bak
  src/lib/airtable/tables.ts.full

ADD TO tsconfig.json EXCLUDE:
  src/hooks/useTenantDashboard.ts
  src/components/tenant
  src/app/(saas)
```
