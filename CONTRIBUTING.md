# Contributing

This repository is protected and CI-gated. Every change must be submitted through a pull request to `main`.

## Branch + PR workflow

1. Start from latest `main`.
2. Create a focused branch for one scope of work.
3. Keep PRs small and reviewable.
4. Merge only after all required checks are green.

## Required checks on every PR

- `Typecheck` (`tsc --noEmit`)
- `Test` (`vitest run`)
- `Vercel – rani-beauty-clinic`
- `Vercel – rani-build-clone`
- `Dependency Review`

## Local verification before pushing

```bash
npm run typecheck
npx vitest run
```

For targeted changes, run focused suites first, then run full test suite before merge.

## Security guardrails

- Never interpolate raw user input into Airtable `filterByFormula`.
- Use `sanitizeFormulaValue` for any value entering an Airtable formula string.
- Validate request input with Zod at route boundaries.
- Preserve auth + role checks and avoid introducing dev bypass logic.

## Testing expectations

- New behavior requires tests.
- Security fixes require regression tests.
- Favor route-level integration tests for API handlers and unit tests for libraries.

## Coding style

- TypeScript strictness first; avoid unsafe `any`.
- Keep route handlers thin and push logic to `src/lib/*`.
- Prefer small, composable helpers over large route files.

## Ownership

- Default code owner: `@sukhithebanker` (see `.github/CODEOWNERS`).
