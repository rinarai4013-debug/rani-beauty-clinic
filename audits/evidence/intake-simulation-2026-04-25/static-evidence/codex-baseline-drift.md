# INTAKE-SIM-2026-04-25 Baseline Drift Report

| File | Audit SHA | Current SHA | Phase 1 Impact |
| --- | --- | --- | --- |
| `src/lib/mastermind/session.ts` | d62b740cb93cca64bc0a128c99c9228b35e64c8b2ce1f48e2713ea086e08a211 | a53cfa1d1ce91920d18e6b5cf3870bbda78172a18379fd14a8855a602534ff96 | Drifted due retry helper and best-effort save-path merge from canonical hardening (`getSessionByIdAsyncRetry`, `saveSessionBestEffort`). |
| `src/lib/mastermind/session-store.ts` | 0bd86c89982ddd853a4ba1cd68f225de8d4eb68c25eb15cf47d4e40ef0e6d7d9 | 43ecf4aa877a9262bd5f239e4bf1a997035f318ef745c37e3645c5a061fb79ad | Drifted due canonical typed Airtable error classes and capacity classification (`SessionStoreError`, `classifyAirtableError`). |
| `src/lib/consultation/schema.ts` | 0f0f1e5311af0f5b5215e34b6768e869910fc7301322baaace1974889c4532da | 85517d230516ee95fed99305374b80452de8d277041ff866c1a4b3b4efd92dd2 | Drifted by replacing restrictive `submitIntakeSchema` with canonical `submitCore` + clinical flags. |
| `src/app/api/consultation/submit/route.ts` | c929748aa3f70c7f83d38d0febdeb72131c9dedcf93087fd03b52ec4d6fb9865 | c03632c7cb7cf27f19d424b0c2b13dcbba4217d0099c0a29f0066a7b5d737c41 | Drifted due multi-fix patch: array coercion, 400-empty handling, medical flag evaluation, and session persistence error classification.
