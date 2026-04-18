#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");

function read(filePath) {
  return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
}

function exists(filePath) {
  return fs.existsSync(path.join(repoRoot, filePath));
}

function runCheck(name, pass, details) {
  return { name, pass, details };
}

const results = [];

const robots = read("public/robots.txt");
const requiredRobotAgents = [
  "Google-Extended",
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-Web",
  "PerplexityBot",
  "Perplexity-User",
  "Applebot-Extended",
  "FacebookBot",
  "Meta-ExternalAgent",
  "Amazonbot",
  "YouBot",
  "Diffbot",
  "MistralAI-User",
];

const missingAgents = requiredRobotAgents.filter((agent) => !robots.includes(`User-agent: ${agent}`));
results.push(
  runCheck(
    "robots has required AI crawler coverage",
    missingAgents.length === 0,
    missingAgents.length === 0 ? "All required user agents are present." : `Missing: ${missingAgents.join(", ")}`
  )
);

results.push(
  runCheck(
    "robots points to sitemap index",
    /Sitemap:\s*https:\/\/www\.ranibeautyclinic\.com\/sitemap\.xml/i.test(robots),
    "Expected Sitemap: https://www.ranibeautyclinic.com/sitemap.xml"
  )
);

const layout = read("src/app/layout.tsx");
const enhancedSchemas = read("src/components/seo/EnhancedSchemas.tsx");
results.push(
  runCheck(
    "SearchAction uses /search endpoint in global schemas",
    layout.includes("/search?q={search_term_string}") &&
      enhancedSchemas.includes("/search?q={search_term_string}"),
    "Both layout and homepage schema should expose /search?q={search_term_string}"
  )
);

const searchPagePath = "src/app/search/page.tsx";
const searchPage = exists(searchPagePath) ? read(searchPagePath) : "";
results.push(
  runCheck(
    "search route exists with noindex hygiene",
    exists(searchPagePath) &&
      /robots:\s*\{\s*index:\s*false,\s*follow:\s*true,\s*\}/s.test(searchPage),
    "Expected src/app/search/page.tsx with robots.index=false"
  )
);

const dynamicParamFiles = [
  "src/app/services/[slug]/page.tsx",
  "src/app/services/[slug]/[variation]/page.tsx",
  "src/app/wellness/[slug]/page.tsx",
  "src/app/wellness/[slug]/[variation]/page.tsx",
  "src/app/blog/[slug]/page.tsx",
];
const missingDynamicParams = dynamicParamFiles.filter((file) => {
  const content = read(file);
  return !content.includes("export const dynamicParams = false;");
});
results.push(
  runCheck(
    "core dynamic routes enforce hard-404 behavior",
    missingDynamicParams.length === 0,
    missingDynamicParams.length === 0
      ? "All key routes export dynamicParams = false."
      : `Missing dynamicParams=false in: ${missingDynamicParams.join(", ")}`
  )
);

const blogPage = read("src/app/blog/[slug]/page.tsx");
const blogFaq = read("src/app/blog/[slug]/FAQSection.tsx");
results.push(
  runCheck(
    "speakable selectors map to real DOM classes",
    blogPage.includes(".article-summary") &&
      blogPage.includes(".faq-answer") &&
      blogPage.includes("article-summary") &&
      blogFaq.includes("faq-answer"),
    "Expected .article-summary and .faq-answer in schema + rendered markup"
  )
);

results.push(
  runCheck(
    "schema IDs are normalized (no /# fragments)",
    !/\/#(?:organization|localbusiness|website|medical-director|physician|webpage)/.test(
      `${layout}\n${enhancedSchemas}\n${blogPage}`
    ),
    "Found slash-fragment @id variants that should be normalized to #fragment"
  )
);

const llms = read("public/llms.txt");
const llmsFull = read("public/llms-full.txt");
const llmsRequiredPatterns = [
  /\$79/,
  /\$1,199/,
  /\$99/,
  /\$575/,
  /\$325/,
  /\$1,399/,
  /\$1,150/,
  /\$3,999/,
  /\$249/,
  /\$699/,
  /\$149/,
  /\$25/,
];
const llmsMissingPatterns = llmsRequiredPatterns.filter((pattern) => !pattern.test(llms));
const stalePatterns = [/\$2,750[–-]\$4,500/, /\$399[–-]\$599/, /Glutathione \(\$100\)/];
const staleMatches = stalePatterns.filter((pattern) => pattern.test(`${llms}\n${llmsFull}`));
results.push(
  runCheck(
    "llms files contain canonical pricing signals and no stale ranges",
    llmsMissingPatterns.length === 0 && staleMatches.length === 0,
    llmsMissingPatterns.length === 0 && staleMatches.length === 0
      ? "llms pricing snapshots look aligned."
      : `Missing canonical values: ${llmsMissingPatterns.map(String).join(", ")} | Stale patterns: ${staleMatches.map(String).join(", ")}`
  )
);

const serviceTemplate = read("src/components/services/ServicePageTemplate.tsx");
results.push(
  runCheck(
    "service offer schema supports alias mapping + AggregateOffer",
    serviceTemplate.includes("const OFFER_MAPPING") &&
      serviceTemplate.includes('"botox-dysport"') &&
      serviceTemplate.includes('"glp1-weight-management"') &&
      serviceTemplate.includes('"hormone-therapy"') &&
      serviceTemplate.includes('"@type": "AggregateOffer"'),
    "Expected alias map and AggregateOffer fallback in ServicePageTemplate"
  )
);

const score = results.filter((result) => result.pass).length;
const total = results.length;

for (const result of results) {
  const icon = result.pass ? "PASS" : "FAIL";
  console.log(`[${icon}] ${result.name}`);
  if (!result.pass) {
    console.log(`  -> ${result.details}`);
  }
}

console.log(`\nSEO/GEO Guardrails: ${score}/${total} checks passed`);

if (score !== total) {
  process.exit(1);
}
