import fs from 'node:fs';

const raw = JSON.parse(
  fs.readFileSync('src/lib/medical/boomrx-formulary.raw.json', 'utf8'),
);

const PRICE_RE = /\$(\d+(?:\.\d{1,2})?)/g;
const corrupt = [];

if (!Array.isArray(raw?.price_lines)) {
  console.error('FAIL: invalid raw formulary payload');
  process.exit(1);
}

for (const [index, line] of raw.price_lines.entries()) {
  const matches = (String(line || '').match(PRICE_RE) || []);
  if (matches.length !== 1) {
    corrupt.push({ index, count: matches.length, line: String(line) });
  }
}

if (corrupt.length === 0) {
  console.log('OK: 0 corrupt rows');
  process.exit(0);
}

console.error(`FAIL: ${corrupt.length} corrupt rows`);
for (const row of corrupt) {
  console.error(`  [${row.index}] ${row.count} prices: ${row.line.slice(0, 160)}`);
}
process.exit(1);
