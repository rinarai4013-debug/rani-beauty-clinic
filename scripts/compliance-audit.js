#!/usr/bin/env node
/**
 * Compliance audit · plain-JS version.
 *
 * Converted from compliance-audit.ts on 2026-04-23. The TS source uses
 * --experimental-strip-types which requires Node >= 22.6. Vercel's build image
 * runs Node 20, which fails the build. Keeping the TS file for local dev
 * (Node 22) and using this JS version for the `compliance:audit` npm script.
 *
 * Do NOT add type annotations here. If you need to evolve the logic, edit both
 * this file and the .ts sibling.
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const findings = [];

const EXCLUDED_PATH_SEGMENTS = [
  "__tests__",
  "/test/",
  ".test.",
  ".stories.",
  "/node_modules/",
  "data/square-audit-",
];

const INFUSION_EXTENSIONS = new Set([".tsx", ".ts", ".md", ".json", ".txt"]);
const INFUSION_SCAN_ROOTS = ["src/app", "src/components", "src/data", "public"];

const DIAGNOSTIC_SCAN_ROOTS = [
  "src/data/services",
  "src/data/seo",
  "src/app/services",
  "src/app/wellness",
  "src/app/peptides",
];
const DIAGNOSTIC_EXTENSIONS = new Set([".ts", ".tsx", ".md"]);
const DISEASE_PATTERN =
  /\b(disease|cancer|diabetes|hypertension|obesity|migraine|migraine(s)?|arthritis|anemia|insomnia|asthma|infection|pcos|depression|anxiety|heart disease|cardiovascular disease)\b/i;
const HIGH_RISK_VERBS = /\b(cures?|eliminates?|prevents?)\b/i;
const NEGATED_CLAIM_PATTERN = /\b(not|never|no)\b.{0,30}\b(cure|eliminate|prevent)\b/i;
const SAFE_FDA_DISCLOSURE =
  /not intended to diagnose,\s*treat,\s*cure,\s*or prevent any disease/i;
const SAFE_REVIEW_MARKER = /CLINICAL REVIEW NEEDED/i;

const FOOTER_REQUIREMENTS = [
  { file: "src/components/services/ServicePageTemplate.tsx", include: "<BoomRxComplianceFooter" },
  { file: "src/app/services/page.tsx", include: "<BoomRxComplianceFooter" },
  { file: "src/app/wellness/page.tsx", include: "<BoomRxComplianceFooter" },
  { file: "src/app/services/[slug]/[variation]/page.tsx", include: "<BoomRxComplianceFooter" },
  { file: "src/app/wellness/[slug]/[variation]/page.tsx", include: "<BoomRxComplianceFooter" },
  { file: "src/app/peptides/page.tsx", include: "<BoomRxComplianceFooter" },
  { file: "src/app/peptides/[slug]/page.tsx", include: "<BoomRxComplianceFooter" },
  { file: "src/app/peptides/protocol/[slug]/page.tsx", include: "<BoomRxComplianceFooter" },
  { file: "src/app/peptides/protocols/page.tsx", include: "<BoomRxComplianceFooter" },
  { file: "src/app/peptides/category/[category]/page.tsx", include: "<BoomRxComplianceFooter" },
  { file: "src/app/peptides/quiz/page.tsx", include: "<BoomRxComplianceFooter" },
];

const PEPTIDE_NOTICE_REQUIREMENTS = [
  "src/app/peptides/page.tsx",
  "src/app/peptides/[slug]/page.tsx",
  "src/app/peptides/protocol/[slug]/page.tsx",
  "src/app/peptides/protocols/page.tsx",
  "src/app/peptides/category/[category]/page.tsx",
  "src/app/peptides/quiz/page.tsx",
];

function shouldSkipFile(filePath) {
  const normalized = filePath.replaceAll("\\", "/");
  return EXCLUDED_PATH_SEGMENTS.some((part) => normalized.includes(part));
}

function walkDir(dir, onFile) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (shouldSkipFile(full)) continue;
    if (entry.isDirectory()) {
      walkDir(full, onFile);
      continue;
    }
    onFile(full);
  }
}

function rel(filePath) {
  return path.relative(ROOT, filePath).replaceAll("\\", "/");
}

function readFile(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function addFinding(filePath, line, rule, snippet) {
  findings.push({
    file: rel(filePath),
    line,
    rule,
    snippet: snippet.trim().slice(0, 240),
  });
}

function scanForInfusion() {
  for (const root of INFUSION_SCAN_ROOTS) {
    walkDir(path.join(ROOT, root), (filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      if (!INFUSION_EXTENSIONS.has(ext)) return;
      const content = readFile(filePath);
      const lines = content.split(/\r?\n/);
      lines.forEach((line, idx) => {
        if (/\binfusion\b/i.test(line)) {
          addFinding(filePath, idx + 1, "Banned term: infusion", line);
        }
      });
    });
  }
}

function scanDiagnosticClaims() {
  for (const root of DIAGNOSTIC_SCAN_ROOTS) {
    walkDir(path.join(ROOT, root), (filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      if (!DIAGNOSTIC_EXTENSIONS.has(ext)) return;
      const normalized = rel(filePath);
      if (normalized.includes("/api/")) return;

      const lines = readFile(filePath).split(/\r?\n/);
      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return;
        if (SAFE_FDA_DISCLOSURE.test(trimmed)) return;
        if (SAFE_REVIEW_MARKER.test(trimmed)) return;
        if (/^(\/\/|\/\*|\*|\*)/.test(trimmed)) return;
        if (NEGATED_CLAIM_PATTERN.test(trimmed)) return;

        if (HIGH_RISK_VERBS.test(trimmed) && DISEASE_PATTERN.test(trimmed)) {
          addFinding(filePath, idx + 1, "Diagnostic claim language", line);
        }
      });
    });
  }
}

function ensureIncludes(file, include, rule) {
  const fullPath = path.join(ROOT, file);
  if (!fs.existsSync(fullPath)) {
    findings.push({ file, line: 1, rule, snippet: "Required file missing" });
    return;
  }
  const content = readFile(fullPath);
  if (!content.includes(include)) {
    findings.push({ file, line: 1, rule, snippet: `Missing required token: ${include}` });
  }
}

function checkCoverageAndLegal() {
  for (const req of FOOTER_REQUIREMENTS) {
    ensureIncludes(req.file, req.include, "Compliance footer coverage");
  }

  for (const page of PEPTIDE_NOTICE_REQUIREMENTS) {
    ensureIncludes(page, "<CompoundedDisclosureNotice", "FDA notice in peptide page body");
  }

  ensureIncludes(
    "src/app/peptides/protocol/[slug]/page.tsx",
    "telehealth consult",
    "Protocol consult requirement",
  );
  ensureIncludes(
    "src/components/boomrx/BoomRxComplianceFooter.tsx",
    "/legal/compounded-disclosure",
    "Disclosure link in footer",
  );
  ensureIncludes(
    "src/app/legal/compounded-disclosure/page.tsx",
    "RCW 18.71",
    "Legal disclosure page",
  );
  ensureIncludes(
    "src/app/legal/compounded-disclosure/page.tsx",
    "WAC 246-918",
    "Legal disclosure page",
  );
  ensureIncludes(
    "src/app/legal/compounded-disclosure/page.tsx",
    "WAC 246-933",
    "Legal disclosure page",
  );
}

function printFindingsAndExit() {
  if (findings.length === 0) {
    console.log("\u2705 Compliance audit passed.");
    process.exit(0);
  }

  console.error(`\u274C Compliance audit failed with ${findings.length} issue(s):\n`);
  for (const f of findings) {
    console.error(`- [${f.rule}] ${f.file}:${f.line}`);
    console.error(`  ${f.snippet}`);
  }
  process.exit(1);
}

scanForInfusion();
scanDiagnosticClaims();
checkCoverageAndLegal();
printFindingsAndExit();
