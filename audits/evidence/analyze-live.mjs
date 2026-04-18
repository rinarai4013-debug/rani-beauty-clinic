import fs from 'fs';
import path from 'path';

const urls = [
  'https://www.ranibeautyclinic.com/',
  'https://www.ranibeautyclinic.com/services',
  'https://www.ranibeautyclinic.com/services/cosmelan-peel',
  'https://www.ranibeautyclinic.com/services/microneedling-arrissence-undereye',
  'https://www.ranibeautyclinic.com/services/hydrafacial',
  'https://www.ranibeautyclinic.com/services/botox-dysport',
  'https://www.ranibeautyclinic.com/services/chemical-peels',
  'https://www.ranibeautyclinic.com/services/rf-microneedling',
  'https://www.ranibeautyclinic.com/services/sofwave',
  'https://www.ranibeautyclinic.com/wellness',
  'https://www.ranibeautyclinic.com/wellness/glp1-weight-management',
  'https://www.ranibeautyclinic.com/wellness/hormone-therapy',
  'https://www.ranibeautyclinic.com/pricing',
  'https://www.ranibeautyclinic.com/about',
  'https://www.ranibeautyclinic.com/contact',
  'https://www.ranibeautyclinic.com/blog',
  'https://www.ranibeautyclinic.com/blog/best-medspa-renton-wa',
  'https://www.ranibeautyclinic.com/locations/renton',
];

const evidenceDir = path.join(process.cwd(), 'audits/evidence/live');

function fileNameForUrl(url) {
  return url.replace('https://', '').replace(/[^A-Za-z0-9._-]/g, '_');
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].replace(/\s+/g, ' ').trim() : null;
}

function extractMetaTags(html) {
  const out = {};
  const metaRegex = /<meta\s+[^>]*>/gi;
  const metas = html.match(metaRegex) || [];
  for (const tag of metas) {
    const name = (tag.match(/\bname=["']([^"']+)["']/i) || [])[1];
    const prop = (tag.match(/\bproperty=["']([^"']+)["']/i) || [])[1];
    const content = (tag.match(/\bcontent=["']([^"']*)["']/i) || [])[1];
    if (!content) continue;
    if (name) out[name] = content;
    if (prop) out[prop] = content;
  }
  return out;
}

function extractLinks(html) {
  const out = [];
  const linkRegex = /<link\s+[^>]*>/gi;
  const links = html.match(linkRegex) || [];
  for (const tag of links) {
    const rel = (tag.match(/\brel=["']([^"']+)["']/i) || [])[1] || '';
    const href = (tag.match(/\bhref=["']([^"']+)["']/i) || [])[1] || '';
    const type = (tag.match(/\btype=["']([^"']+)["']/i) || [])[1] || '';
    if (rel || href || type) out.push({ rel, href, type });
  }
  return out;
}

function extractJsonLd(html) {
  const scripts = [];
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = regex.exec(html))) {
    const raw = m[1].trim();
    try {
      const parsed = JSON.parse(raw);
      scripts.push({ raw, parsed, valid: true });
    } catch (e) {
      scripts.push({ raw, error: String(e), valid: false });
    }
  }
  return scripts;
}

function flattenNodes(schemaObj) {
  if (!schemaObj || typeof schemaObj !== 'object') return [];
  if (Array.isArray(schemaObj)) return schemaObj.flatMap(flattenNodes);
  if (Array.isArray(schemaObj['@graph'])) return schemaObj['@graph'];
  return [schemaObj];
}

const summaries = [];
for (const url of urls) {
  const file = path.join(evidenceDir, `${fileNameForUrl(url)}.body.txt`);
  if (!fs.existsSync(file)) {
    summaries.push({ url, error: 'missing body file' });
    continue;
  }
  const html = fs.readFileSync(file, 'utf8');
  const title = extractTitle(html);
  const meta = extractMetaTags(html);
  const links = extractLinks(html);
  const jsonld = extractJsonLd(html);

  const canonical = (links.find((l) => l.rel.toLowerCase().includes('canonical')) || {}).href || null;
  const llmsAlternate = links.filter((l) => l.rel.toLowerCase().includes('alternate') && l.type === 'text/plain').map((l) => l.href);

  const nodes = jsonld.filter((s) => s.valid).flatMap((s) => flattenNodes(s.parsed));
  const types = [];
  const ids = [];
  const offers = [];

  for (const n of nodes) {
    const t = n?.['@type'];
    if (Array.isArray(t)) {
      for (const x of t) types.push(x);
    } else if (typeof t === 'string') {
      types.push(t);
    }
    if (n?.['@id']) ids.push(n['@id']);

    if (n?.offers?.['@type'] === 'Offer') {
      offers.push({
        nodeType: n?.['@type'],
        serviceName: n?.name,
        price: n.offers.price,
        priceCurrency: n.offers.priceCurrency,
        availability: n.offers.availability,
        priceValidUntil: n.offers.priceValidUntil,
        url: n.offers.url,
      });
    }
  }

  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const headBytes = headMatch ? Buffer.byteLength(headMatch[1], 'utf8') : null;

  summaries.push({
    url,
    title,
    titleLength: title ? title.length : null,
    description: meta['description'] || null,
    descriptionLength: meta['description'] ? meta['description'].length : null,
    canonical,
    robotsMeta: meta['robots'] || null,
    og: {
      title: meta['og:title'] || null,
      description: meta['og:description'] || null,
      url: meta['og:url'] || null,
      image: meta['og:image'] || null,
      type: meta['og:type'] || null,
    },
    twitter: {
      card: meta['twitter:card'] || null,
      title: meta['twitter:title'] || null,
      description: meta['twitter:description'] || null,
      image: meta['twitter:image'] || null,
    },
    geo: {
      region: meta['geo.region'] || null,
      placename: meta['geo.placename'] || null,
      position: meta['geo.position'] || null,
      icbm: meta['ICBM'] || null,
    },
    headings: {
      h1: (html.match(/<h1\b/gi) || []).length,
      h2: (html.match(/<h2\b/gi) || []).length,
    },
    hasArticleSummaryClass: /class=["'][^"']*article-summary[^"']*["']/i.test(html),
    hasFaqAnswerClass: /class=["'][^"']*faq-answer[^"']*["']/i.test(html),
    hasLlmsAlternateLink: llmsAlternate,
    jsonLdScriptCount: jsonld.length,
    jsonLdInvalidCount: jsonld.filter((s) => !s.valid).length,
    schemaTypes: Array.from(new Set(types)).sort(),
    schemaNodeCount: nodes.length,
    schemaIds: Array.from(new Set(ids)).sort(),
    offers,
    headBytes,
    htmlBytes: Buffer.byteLength(html, 'utf8'),
  });
}

const outPath = path.join(process.cwd(), 'audits/evidence/live-summary.json');
fs.writeFileSync(outPath, JSON.stringify(summaries, null, 2));
console.log(`Wrote ${outPath}`);

for (const s of summaries) {
  console.log([s.url, s.titleLength, s.descriptionLength, s.jsonLdScriptCount, s.jsonLdInvalidCount, s.headings?.h1, s.headings?.h2, s.headBytes, s.htmlBytes].join('\t'));
}
