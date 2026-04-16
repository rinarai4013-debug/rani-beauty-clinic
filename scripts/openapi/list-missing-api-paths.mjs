import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

const ROOT = process.cwd();
const API_ROOT = path.join(ROOT, 'src', 'app', 'api');
const OPENAPI_PATH = path.join(ROOT, 'openapi.yaml');

function walkRoutes(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkRoutes(full, out);
      continue;
    }
    if (entry.isFile() && entry.name === 'route.ts') {
      out.push(full);
    }
  }
  return out;
}

function routeFileToPath(routeFile) {
  const rel = path
    .relative(API_ROOT, path.dirname(routeFile))
    .split(path.sep)
    .join('/')
    .replace(/\[([^\]]+)\]/g, '{$1}');
  if (!rel || rel === '.') return '/api';
  return `/api/${rel}`;
}

function loadOpenApiPaths() {
  const content = fs.readFileSync(OPENAPI_PATH, 'utf8');
  const doc = YAML.parse(content);
  return new Set(Object.keys(doc?.paths || {}));
}

function main() {
  const strict = process.argv.includes('--strict');
  const routes = walkRoutes(API_ROOT).map(routeFileToPath).sort();
  const openApiPaths = loadOpenApiPaths();

  const missing = routes.filter((p) => !openApiPaths.has(p));

  console.log(`Route paths: ${routes.length}`);
  console.log(`Documented OpenAPI paths: ${openApiPaths.size}`);
  console.log(`Missing OpenAPI paths: ${missing.length}`);

  if (missing.length > 0) {
    console.log('\nMissing paths:');
    for (const p of missing) console.log(`- ${p}`);
  } else {
    console.log('\nOpenAPI path parity passed.');
  }

  if (strict && missing.length > 0) process.exit(1);
}

main();

