#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const API_ROOT = path.join(ROOT, 'src', 'app', 'api');
const API_TESTS_ROOT = path.join(API_ROOT, '__tests__');

function walkFiles(dir, matcher, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, matcher, acc);
      continue;
    }
    if (entry.isFile() && matcher(fullPath)) {
      acc.push(fullPath);
    }
  }
  return acc;
}

function normalizeApiPath(apiPath) {
  return apiPath.replace(/\[(.+?)\]/g, '{$1}');
}

function routeFileToApiPath(filePath) {
  const rel = path.relative(API_ROOT, filePath).replace(/\\/g, '/');
  const noSuffix = rel.replace(/\/route\.ts$/, '');
  return normalizeApiPath(`/api/${noSuffix}`);
}

function extractImportedRoutePaths(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const patterns = [
    /from\s+['"]@\/app\/api([^'"]+)\/route['"]/g,
    /import\(\s*['"]@\/app\/api([^'"]+)\/route['"]\s*\)/g,
    /require\(\s*['"]@\/app\/api([^'"]+)\/route['"]\s*\)/g,
  ];
  const imports = [];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const segment = match[1];
      imports.push(normalizeApiPath(`/api${segment}`));
    }
  }
  return imports;
}

function printList(label, values) {
  if (!values.length) return;
  console.error(`\n${label} (${values.length}):`);
  for (const value of values) {
    console.error(`- ${value}`);
  }
}

function main() {
  if (!fs.existsSync(API_ROOT)) {
    console.error(`Missing API root: ${API_ROOT}`);
    process.exit(1);
  }
  if (!fs.existsSync(API_TESTS_ROOT)) {
    console.error(`Missing API tests root: ${API_TESTS_ROOT}`);
    process.exit(1);
  }

  const routeFiles = walkFiles(API_ROOT, (p) => p.endsWith('/route.ts'));
  const testFiles = walkFiles(API_TESTS_ROOT, (p) => p.endsWith('.test.ts'));

  const routePaths = routeFiles.map(routeFileToApiPath).sort();
  const routePathSet = new Set(routePaths);

  const importedRoutePaths = new Set();
  for (const testFile of testFiles) {
    for (const routePath of extractImportedRoutePaths(testFile)) {
      importedRoutePaths.add(routePath);
    }
  }

  const missingRouteImports = routePaths
    .filter((routePath) => !importedRoutePaths.has(routePath))
    .sort();

  const staleTestImports = [...importedRoutePaths]
    .filter((routePath) => !routePathSet.has(routePath))
    .sort();

  console.log(`API route files: ${routePaths.length}`);
  console.log(`Imported by API tests: ${importedRoutePaths.size}`);

  if (!missingRouteImports.length && !staleTestImports.length) {
    console.log('Route test parity passed: every API route file is covered by at least one route import in API integration tests.');
    process.exit(0);
  }

  printList('Routes missing from API integration test imports', missingRouteImports);
  printList('Stale API route imports (no matching route file)', staleTestImports);
  process.exit(1);
}

main();

