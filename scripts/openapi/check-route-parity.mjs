#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

const ROOT = process.cwd();
const API_ROOT = path.join(ROOT, 'src', 'app', 'api');
const OPENAPI_FILE = path.join(ROOT, 'openapi.yaml');

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, acc);
      continue;
    }
    if (entry.isFile() && entry.name === 'route.ts') {
      acc.push(fullPath);
    }
  }
  return acc;
}

function routeFileToApiPath(filePath) {
  const rel = path.relative(API_ROOT, filePath).replace(/\\/g, '/');
  const noSuffix = rel.replace(/\/route\.ts$/, '');
  const normalizedParams = noSuffix.replace(/\[(.+?)\]/g, '{$1}');
  return `/api/${normalizedParams}`;
}

function isOpenApiPathKey(key) {
  return typeof key === 'string' && key.startsWith('/api/');
}

function printDiff(label, values) {
  if (!values.length) return;
  console.error(`\n${label} (${values.length}):`);
  for (const value of values) {
    console.error(`- ${value}`);
  }
}

function main() {
  if (!fs.existsSync(API_ROOT)) {
    console.error(`API directory not found: ${API_ROOT}`);
    process.exit(1);
  }
  if (!fs.existsSync(OPENAPI_FILE)) {
    console.error(`OpenAPI file not found: ${OPENAPI_FILE}`);
    process.exit(1);
  }

  const routeFiles = walk(API_ROOT);
  const routePaths = routeFiles.map(routeFileToApiPath);
  const routeSet = new Set(routePaths);

  const openapiRaw = fs.readFileSync(OPENAPI_FILE, 'utf8');
  const openapi = YAML.parse(openapiRaw) || {};
  const openapiPaths = Object.keys(openapi.paths || {}).filter(isOpenApiPathKey);
  const openapiSet = new Set(openapiPaths);

  const missingFromOpenApi = [...routeSet].filter((p) => !openapiSet.has(p)).sort();
  const missingRouteFile = [...openapiSet].filter((p) => !routeSet.has(p)).sort();

  console.log(`Route files: ${routeSet.size}`);
  console.log(`OpenAPI paths: ${openapiSet.size}`);

  if (!missingFromOpenApi.length && !missingRouteFile.length) {
    console.log('OpenAPI parity check passed: route files and OpenAPI paths are in sync.');
    process.exit(0);
  }

  printDiff('Missing from OpenAPI spec', missingFromOpenApi);
  printDiff('Missing route files for OpenAPI paths', missingRouteFile);
  process.exit(1);
}

main();
