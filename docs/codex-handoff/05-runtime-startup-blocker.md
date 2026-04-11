# Runtime Startup Blocker

Generated: 2026-04-07

## Status

Local `next dev` is blocked in this workspace.

Observed behavior:

- `npm run dev` starts `node node_modules/.bin/next dev`
- Next does not print its normal ready banner
- no process binds `localhost:3000`
- clearing `.next` does not resolve the issue
- the process must be stopped manually

## Commands Tried

```bash
npm run dev
lsof -nP -iTCP:3000 -sTCP:LISTEN
pkill -f 'node_modules/.bin/next dev'
rm -rf .next
npm run dev
```

## Dependency Tree Findings

The local `node_modules` tree contains many Finder-copy duplicate package directories:

```bash
find node_modules -maxdepth 1 -mindepth 1 -name '* 2' | wc -l
```

After a partial quarantine attempt, 408 top-level duplicates still remained in `node_modules`; 39 were moved to `/tmp/rani-node-modules-duplicates`.

Examples:

- `node_modules/@next 2`
- `node_modules/@types 2`
- `node_modules/typescript 2`
- `node_modules/vite 2`
- `node_modules/zod 2`

The first SWC load test took roughly 30 seconds:

```bash
node -e "require('@next/swc-darwin-arm64'); console.log('swc ok')"
```

After the partial duplicate quarantine, the same SWC load returned quickly. However, `next dev` still failed to bind to port 3000.

An attempted whole-folder quarantine also stalled:

```bash
mv node_modules /tmp/rani-node-modules-quarantine && npm install
```

It was stopped before `npm install` began. `node_modules` remained present afterward.

## Recommendation

Do not keep incrementally moving duplicate package folders. Some moves were slow enough to hang on individual package directories.

Use a clean dependency reinstall in a controlled pass, preferably outside this stuck filesystem state:

1. preserve current source changes
2. remove `node_modules`
3. reinstall from the lockfile
4. rerun:
   - `npm run typecheck:critical`
   - `npm run dev`
   - local smoke checks for `/api/health`, CORS preflight, contact, magic link, upload, and dashboard login

This should be done as a separate operational cleanup step from the route security patch.
