# Rani Beauty Clinic — Project Tools

Scripts that live alongside the application but aren't part of the Next.js build.

## `env-audit.sh` — Verify production env vars

Cross-checks `vercel env ls production` against a curated list of env vars
that the app actually reads. Categorizes misses as CRITICAL / HIGH / MEDIUM
and exits non-zero when CRITICAL or HIGH vars are missing (CI-friendly).

```bash
# From the project root, after vercel link:
./tools/env-audit.sh                    # audits production (default)
./tools/env-audit.sh preview            # audits preview
./tools/env-audit.sh development        # audits development
```

**Requirements:** Vercel CLI installed and logged in (`vercel login`),
project linked (`vercel link`).

**Exit codes:**
- `0` — all CRITICAL + HIGH vars set
- `1` — one or more CRITICAL or HIGH vars missing
- `2` — CLI not installed or not logged in
- `3` — project not linked

**Keeping the required list current:** the script has three arrays
(`CRITICAL_VARS`, `HIGH_VARS`, `MEDIUM_VARS`) that must stay in sync with:

- `docs/codex-handoff/ROUTE-AUTH-AUDIT.md` auth primitives reference
- `docs/compliance/AUDIT-RUNBOOK.md` BAA inventory
- `CLAUDE.md` environment variables section

When you add a new env var to the codebase, add it to the right severity
array in `env-audit.sh`. The script will also show a list of "defined but
not documented" vars on each run, so drift is visible.

## Related external tools

The workspace-level `tools/` directory at `~/Desktop/Claude/tools/` contains:

- `tools/offload/` — sweeps old downloads, sessions, and caches to external storage
- `tools/airtable-backup/` — daily Airtable backup with launchd scheduling

Those are separate from this directory because they're cross-project (they
back up both rani-beauty-clinic and anatomi-website bases) and live at the
workspace root alongside other shared infrastructure.
