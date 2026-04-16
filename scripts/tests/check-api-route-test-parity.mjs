import { readdir, readFile, access } from 'fs/promises';
import path from 'path';

const ROOT = process.cwd();
const API_ROOT = path.join(ROOT, 'src', 'app', 'api');
const SRC_ROOT = path.join(ROOT, 'src');

async function walk(dir, out = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, out);
      continue;
    }
    out.push(fullPath);
  }
  return out;
}

function isRouteFile(filePath) {
  return filePath.endsWith(`${path.sep}route.ts`);
}

function isTestFile(filePath) {
  return filePath.endsWith('.test.ts');
}

function toRouteFilePath(candidate) {
  if (!candidate) return null;
  if (candidate.endsWith('/route')) return `${candidate}.ts`;
  if (candidate.endsWith('/route.ts')) return candidate;
  return null;
}

function resolveImportToRoute(importSpec, testFile) {
  let candidate = null;

  if (importSpec.startsWith('@/app/api/')) {
    candidate = path.join(ROOT, 'src', importSpec.slice(2));
  } else if (importSpec.startsWith('src/app/api/')) {
    candidate = path.join(ROOT, importSpec);
  } else if (importSpec.startsWith('/src/app/api/')) {
    candidate = path.join(ROOT, importSpec.slice(1));
  } else if (importSpec.startsWith('./') || importSpec.startsWith('../')) {
    candidate = path.resolve(path.dirname(testFile), importSpec);
  }

  if (!candidate) return null;
  return toRouteFilePath(path.normalize(candidate));
}

function collectImportSpecs(content) {
  const specs = new Set();
  const fromRegex = /\bfrom\s+['"]([^'"]+)['"]/g;
  const dynamicRegex = /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g;

  let match = fromRegex.exec(content);
  while (match) {
    specs.add(match[1]);
    match = fromRegex.exec(content);
  }

  match = dynamicRegex.exec(content);
  while (match) {
    specs.add(match[1]);
    match = dynamicRegex.exec(content);
  }

  return [...specs];
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function rel(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join('/');
}

async function main() {
  const apiFiles = await walk(API_ROOT);
  const srcFiles = await walk(SRC_ROOT);

  const routeFiles = apiFiles.filter(isRouteFile).map((f) => path.normalize(f));
  const testFiles = srcFiles.filter(isTestFile).map((f) => path.normalize(f));
  const coveredRoutes = new Set();

  for (const testFile of testFiles) {
    if (testFile.endsWith(`${path.sep}route.test.ts`)) {
      const siblingRoute = path.join(path.dirname(testFile), 'route.ts');
      if (await fileExists(siblingRoute)) {
        coveredRoutes.add(path.normalize(siblingRoute));
      }
    }

    const content = await readFile(testFile, 'utf8');
    const importSpecs = collectImportSpecs(content);

    for (const spec of importSpecs) {
      const routePath = resolveImportToRoute(spec, testFile);
      if (!routePath) continue;
      if (routeFiles.includes(routePath)) {
        coveredRoutes.add(routePath);
      }
    }
  }

  const uncovered = routeFiles.filter((f) => !coveredRoutes.has(f)).sort();

  console.log(`Route files: ${routeFiles.length}`);
  console.log(`Covered by tests: ${coveredRoutes.size}`);
  console.log(`Uncovered: ${uncovered.length}`);

  if (uncovered.length > 0) {
    console.error('\nUncovered route files:');
    for (const filePath of uncovered) {
      console.error(`- ${rel(filePath)}`);
    }
    process.exit(1);
  }

  console.log('\nAPI route test parity check passed.');
}

main().catch((error) => {
  console.error('Route parity check failed with an unexpected error.');
  console.error(error);
  process.exit(1);
});

