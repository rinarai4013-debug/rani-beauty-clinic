import fs from 'fs';
import path from 'path';

const domains = ['skinspirit.com','idealimage.com','anushkaspa.com','seattleplasticsurgery.com','kusumotoaesthetic.com'];
const dir = path.join(process.cwd(), 'audits/evidence/competitors');

function statusFor(file) {
  if (!fs.existsSync(file)) return null;
  const txt = fs.readFileSync(file, 'utf8');
  let status = null;
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^HTTP\/[^ ]+\s+(\d{3})/i);
    if (m) status = Number(m[1]);
  }
  return status;
}

function parseTypes(html) {
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const types = new Set();
  let scripts = 0;
  let invalid = 0;
  let m;

  function addTypes(obj) {
    if (!obj) return;
    if (Array.isArray(obj)) return obj.forEach(addTypes);
    if (typeof obj !== 'object') return;
    if (obj['@graph'] && Array.isArray(obj['@graph'])) {
      obj['@graph'].forEach(addTypes);
      return;
    }
    const t = obj['@type'];
    if (Array.isArray(t)) t.forEach((x) => types.add(String(x)));
    else if (t) types.add(String(t));
  }

  while ((m = regex.exec(html))) {
    scripts += 1;
    const raw = m[1].trim();
    try {
      const parsed = JSON.parse(raw);
      addTypes(parsed);
    } catch {
      invalid += 1;
    }
  }
  return { scripts, invalid, types: Array.from(types).sort() };
}

const out = [];
for (const d of domains) {
  const homeHead = path.join(dir, `${d}_.headers.txt`);
  const homeBody = path.join(dir, `${d}_.body.txt`);
  const llmsHead = path.join(dir, `${d}_llms.txt.headers.txt`);

  const homeStatus = statusFor(homeHead);
  const llmsStatus = statusFor(llmsHead);

  let schema = { scripts: 0, invalid: 0, types: [] };
  if (fs.existsSync(homeBody)) {
    const html = fs.readFileSync(homeBody, 'utf8');
    schema = parseTypes(html);
  }

  out.push({ domain: d, homeStatus, llmsStatus, schema });
}

const outFile = path.join(dir, 'summary.json');
fs.writeFileSync(outFile, JSON.stringify(out, null, 2));
console.log(`Wrote ${outFile}`);
for (const row of out) {
  console.log(`${row.domain}\thome:${row.homeStatus ?? 'ERR'}\tllms:${row.llmsStatus ?? 'ERR'}\tschemaScripts:${row.schema.scripts}\tinvalid:${row.schema.invalid}\ttypes:${row.schema.types.join(',')}`);
}
