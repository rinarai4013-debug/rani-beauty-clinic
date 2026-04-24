#!/usr/bin/env node

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

  console.log(`[check:dynamic] OK: ${routeFiles.length} route files checked, ${missing.length} missing exports`);
}

main();
