import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const apiRoot = path.join(root, 'src/app/api');
const outputPath = path.join(root, 'docs/codex-handoff/01-route-readiness-generated.md');

const METHOD_RE = /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\b/g;
const AUTH_RE = /getSession|getPatientSession|requireAuth|verifySession|cookies\(|jwtVerify|generateAccessCode|ACCESS_CODE_REQUIRED/;
const RATE_LIMIT_RE = /rateLimit\(|RATE_LIMITS|rateLimitResponse/;
const PERMISSION_RE = /hasPermission|requirePermission|allowedRoles|canAccessPage/;
const BODY_RE = /request\.json\(|req\.json\(|formData\(/;
const VALIDATION_RE = /z\.object|safeParse|parse\(|sanitizeFormulaValue|escapeHtml/;
const AIRTABLE_RE = /Tables\.|fetchAll|fetchFirst|rateLimitedQuery|Airtable/;
const MUTATION_RE = /\.create\(|\.update\(|\.destroy\(|updateRecord|createRecord|deleteRecord/;
const EXTERNAL_SERVICES = [
  ['Airtable', /Tables\.|fetchAll|fetchFirst|rateLimitedQuery|Airtable/],
  ['Stripe', /Stripe|stripe/i],
  ['Mangomint', /Mangomint|MangoMint/i],
  ['Cherry', /Cherry/i],
  ['Plaid', /Plaid/i],
  ['Anthropic', /Anthropic|claude/i],
  ['Resend', /Resend/i],
  ['Meta', /META_|graph\.facebook/i],
  ['n8n', /N8N|n8n/i],
  ['Sentry', /Sentry|captureException/i],
];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    if (entry.isFile() && /^route\.tsx?$/.test(entry.name)) return [fullPath];
    return [];
  });
}

function rel(filePath) {
  return path.relative(root, filePath);
}

function routePath(filePath) {
  const relative = path.relative(apiRoot, path.dirname(filePath));
  return `/api/${relative === '' ? '' : relative}`.replace(/\/$/, '');
}

function methods(source) {
  const found = new Set();
  let match;
  while ((match = METHOD_RE.exec(source))) found.add(match[1]);
  METHOD_RE.lastIndex = 0;
  return [...found].sort();
}

function lineOf(source, pattern) {
  const idx = source.search(pattern);
  if (idx < 0) return '';
  return source.slice(0, idx).split('\n').length;
}

function riskFor(info) {
  if (info.stub) return 'low';
  if (info.mutates && !info.hasAuth && !info.route.startsWith('/api/webhooks/')) {
    return info.hasValidation && info.hasRateLimit ? 'high' : 'critical';
  }
  if (info.mutates && info.route.startsWith('/api/webhooks/') && !info.signatureLikely) return 'critical';
  if (info.route.startsWith('/api/dashboard/') && !info.hasAuth) return 'high';
  if (info.acceptsBody && !info.hasValidation) return 'high';
  if (info.touchesAirtable && !info.hasAuth && !info.route.startsWith('/api/webhooks/') && !info.route.startsWith('/api/plan/')) return 'high';
  return 'medium';
}

const files = walk(apiRoot).sort();
const rows = files.map((filePath) => {
  const source = fs.readFileSync(filePath, 'utf8');
  const info = {
    file: rel(filePath),
    route: routePath(filePath),
    methods: methods(source),
    stub: source.includes('not_implemented'),
    hasAuth: AUTH_RE.test(source),
    hasPermission: PERMISSION_RE.test(source),
    acceptsBody: BODY_RE.test(source),
    hasValidation: VALIDATION_RE.test(source),
    hasRateLimit: RATE_LIMIT_RE.test(source),
    touchesAirtable: AIRTABLE_RE.test(source),
    mutates: MUTATION_RE.test(source),
    signatureLikely: /signature|constructEvent|timingSafeEqual|createHmac/i.test(source),
    externalServices: EXTERNAL_SERVICES.filter(([, pattern]) => pattern.test(source)).map(([name]) => name),
    firstInterestingLine:
      lineOf(source, /not_implemented/) ||
      lineOf(source, AUTH_RE) ||
      lineOf(source, BODY_RE) ||
      lineOf(source, AIRTABLE_RE),
  };
  return { ...info, risk: riskFor(info) };
});

const totals = {
  apiRoutes: rows.length,
  stubs: rows.filter((row) => row.stub).length,
  realOrProxy: rows.filter((row) => !row.stub).length,
  dashboardRoutes: rows.filter((row) => row.route.startsWith('/api/dashboard/')).length,
  dashboardWithAuth: rows.filter((row) => row.route.startsWith('/api/dashboard/') && row.hasAuth).length,
  dashboardWithoutAuth: rows.filter((row) => row.route.startsWith('/api/dashboard/') && !row.hasAuth).length,
  acceptsBody: rows.filter((row) => row.acceptsBody).length,
  withValidation: rows.filter((row) => row.hasValidation).length,
  publicMutations: rows.filter((row) => row.mutates && !row.hasAuth && !row.route.startsWith('/api/webhooks/')).length,
  publicMutationsWithRateLimit: rows.filter((row) => row.mutates && !row.hasAuth && !row.route.startsWith('/api/webhooks/') && row.hasRateLimit).length,
};

function checkbox(value) {
  return value ? 'yes' : 'no';
}

const markdown = [
  '# Route Readiness Generated Report',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  '## Totals',
  '',
  `- API route files: ${totals.apiRoutes}`,
  `- Stub route files: ${totals.stubs}`,
  `- Real/proxy route files: ${totals.realOrProxy}`,
  `- Dashboard route files: ${totals.dashboardRoutes}`,
  `- Dashboard routes with auth markers: ${totals.dashboardWithAuth}`,
  `- Dashboard routes without auth markers: ${totals.dashboardWithoutAuth}`,
  `- Routes accepting body/form data: ${totals.acceptsBody}`,
  `- Routes with validation markers: ${totals.withValidation}`,
  `- Non-webhook public mutation candidates: ${totals.publicMutations}`,
  `- Non-webhook public mutation candidates with rate limits: ${totals.publicMutationsWithRateLimit}`,
  '',
  '## Critical And High Risk Candidates',
  '',
  '| Risk | Route | Methods | Stub | Auth | Permission | Body | Validation | Rate Limit | Signature | Services | File | Line |',
  '|---|---|---:|---|---|---|---|---|---|---|---|---|---:|',
  ...rows
    .filter((row) => row.risk === 'critical' || row.risk === 'high')
    .map((row) => `| ${row.risk} | \`${row.route}\` | ${row.methods.join(', ') || '-'} | ${checkbox(row.stub)} | ${checkbox(row.hasAuth)} | ${checkbox(row.hasPermission)} | ${checkbox(row.acceptsBody)} | ${checkbox(row.hasValidation)} | ${checkbox(row.hasRateLimit)} | ${checkbox(row.signatureLikely)} | ${row.externalServices.join(', ') || '-'} | \`${row.file}\` | ${row.firstInterestingLine || '-'} |`),
  '',
  '## All Routes',
  '',
  '| Risk | Route | Methods | Stub | Auth | Permission | Body | Validation | Rate Limit | Signature | Airtable | Mutates | File |',
  '|---|---|---:|---|---|---|---|---|---|---|---|---|---|',
  ...rows.map((row) => `| ${row.risk} | \`${row.route}\` | ${row.methods.join(', ') || '-'} | ${checkbox(row.stub)} | ${checkbox(row.hasAuth)} | ${checkbox(row.hasPermission)} | ${checkbox(row.acceptsBody)} | ${checkbox(row.hasValidation)} | ${checkbox(row.hasRateLimit)} | ${checkbox(row.signatureLikely)} | ${checkbox(row.touchesAirtable)} | ${checkbox(row.mutates)} | \`${row.file}\` |`),
  '',
].join('\n');

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, markdown);
console.log(`Wrote ${path.relative(root, outputPath)}`);
