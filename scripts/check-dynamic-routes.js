#!/usr/bin/env node

const { spawnSync } = require('child_process');
const { readdirSync, readFileSync } = require('fs');
const { join } = require('path');

const API_ROOT = join(process.cwd(), 'src', 'app', 'api');
const DYNAMIC_USAGE_REGEX = /\b(getSession\(|cookies\(|headers\()/;
const DYNAMIC_EXPORT_REGEX = /export const dynamic\s*=\s*['\"]force-dynamic['\"];?/;
const REVALIDATE_EXPORT_REGEX = /export const revalidate\s*=\s*0;?/;

function listRouteFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listRouteFiles(fullPath));
      continue;
    }
    if (entry.isFile() && entry.name === 'route.ts') {
      files.push(fullPath);
    }
  }
  return files;
}

function main() {
  const routeFiles = listRouteFiles(API_ROOT);
  const missing = [];

  for (const file of routeFiles) {
    const source = readFileSync(file, 'utf8');
    if (!DYNAMIC_USAGE_REGEX.test(source)) {
      continue;
    }

    const hasDynamic = DYNAMIC_EXPORT_REGEX.test(source);
    const hasRevalidate = REVALIDATE_EXPORT_REGEX.test(source);

    if (!hasDynamic || !hasRevalidate) {
      missing.push(file);
    }
  }

  if (missing.length > 0) {
    console.error('[check:dynamic] Missing required runtime exports in API routes:');
    for (const file of missing) {
      console.error(` - ${file}`);
    }
    process.exit(1);
  }

  const typecheck = spawnSync('npx', ['tsc', '--noEmit', '--skipLibCheck'], {
    encoding: 'utf8',
    stdio: 'pipe',
  });
  if (typecheck.status !== 0) {
    console.error('[check:dynamic] TypeScript validation failed (npx tsc --noEmit --skipLibCheck).');
    if (typecheck.stdout) process.stdout.write(typecheck.stdout);
    if (typecheck.stderr) process.stderr.write(typecheck.stderr);
    process.exit(typecheck.status || 1);
  }

  console.log(`[check:dynamic] OK: ${routeFiles.length} route files checked, ${missing.length} missing exports`);
}

main();
