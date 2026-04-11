# Junk File Cleanup Plan

> Generated: 2026-04-08

## Summary

Found **9 Finder-copy duplicate files** in `src/`. All are macOS Finder
duplicates (files with ` 3` or ` 4` appended to the name). Each has a
corresponding original file in the same directory. None are imported or
referenced by any other source file.

## Files Identified

### Page duplicates (5)

| File | Lines | Original exists | Imported anywhere | Safe to delete |
|------|-------|----------------|-------------------|---------------|
| `src/app/(dashboard)/dashboard/providers/[name]/page 3.tsx` | 139 | Yes (`page.tsx`) | No | **Yes** |
| `src/app/(marketing)/near/[city]/[service]/page 3.tsx` | 469 | Yes (`page.tsx`) | No | **Yes** |
| `src/app/(marketing)/near/[city]/page 3.tsx` | 532 | Yes (`page.tsx`) | No | **Yes** |
| `src/app/(saas)/admin/layout 3.tsx` | 192 | Yes (`layout.tsx`) | No | **Yes** |
| `src/app/(saas)/marketing/page 3.tsx` | 541 | Yes (`page.tsx`) | No | **Yes** |

### Data file duplicates (4)

| File | Lines | Original exists | Imported anywhere | Safe to delete |
|------|-------|----------------|-------------------|---------------|
| `src/data/ads/creative-library 3.ts` | 359 | Yes (`creative-library.ts`) | No | **Yes** |
| `src/data/ads/creative-library 4.ts` | — | Yes (`creative-library.ts`) | No | **Yes** |
| `src/data/ads/keyword-library 3.ts` | 417 | Yes (`keyword-library.ts`) | No | **Yes** |
| `src/data/ads/keyword-library 4.ts` | — | Yes (`keyword-library.ts`) | No | **Yes** |

### Previously documented but not found (cleaned up already?)

| File | Status |
|------|--------|
| `src/lib/airtable/client.ts.bak` | Not found |
| `src/lib/airtable/client.ts.full` | Not found |
| `src/lib/airtable/tables.ts.bak` | Not found |
| `src/lib/airtable/tables.ts.full` | Not found |

## Verification

All files verified with `rg` (ripgrep) — no source file imports or
references any of the duplicate files. The originals exist in each case.

## Action

All 9 files deleted in commit `Remove duplicate junk source files`.
Total lines removed: ~2,649 of dead code.
