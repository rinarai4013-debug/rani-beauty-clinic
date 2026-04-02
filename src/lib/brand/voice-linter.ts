/**
 * Brand Voice Linter
 *
 * Enforces Rani Beauty Clinic brand guidelines by detecting
 * banned/off-brand words and suggesting on-brand replacements.
 *
 * Key rule: Rani does IM INJECTIONS only. NEVER say "infusion."
 * Brand voice: luxury, confident, clinically-assured, educational + aspirational.
 */

// ── TYPES ──

interface Violation {
  word: string;
  suggestion: string;
  index: number;
}

interface LintResult {
  passed: boolean;
  violations: Violation[];
  score: number;
}

// ── BANNED RULES ──

const BANNED_RULES: { pattern: RegExp; suggestion: string }[] = [
  { pattern: /\binfusion\b/gi, suggestion: "injection" },
  { pattern: /\binfusions\b/gi, suggestion: "injections" },
  { pattern: /\banti[- ]aging\b/gi, suggestion: "age-optimization or rejuvenation" },
  { pattern: /\bfix\b/gi, suggestion: "optimize or enhance" },
  { pattern: /\bfixing\b/gi, suggestion: "optimizing or enhancing" },
  { pattern: /\bdiscount\b/gi, suggestion: "exclusive offer or member benefit" },
  { pattern: /\bsale\b/gi, suggestion: "exclusive offer or limited availability" },
  { pattern: /\bproblem areas?\b/gi, suggestion: "focus areas or treatment zones" },
  { pattern: /\bmama\b/gi, suggestion: "remove or use a different term" },
  { pattern: /\bcheap\b/gi, suggestion: "accessible or value-driven" },
  { pattern: /\bbargain\b/gi, suggestion: "exceptional value" },
];

// ── PREFERRED VOCABULARY ──

export const PREFERRED_WORDS = [
  "beautiful", "optimize", "enhance", "elevate", "state of the art",
  "gold standard", "injection", "rejuvenation", "transform", "radiant",
  "luminous", "physician-supervised", "board-certified", "curated",
  "bespoke", "elevated", "refined", "luxurious", "angel", "gorgeous",
];

// ── CORE FUNCTIONS ──

export function lintBrandVoice(text: string): LintResult {
  const violations: Violation[] = [];

  for (const rule of BANNED_RULES) {
    let match;
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    while ((match = regex.exec(text)) !== null) {
      violations.push({
        word: match[0],
        suggestion: rule.suggestion,
        index: match.index,
      });
    }
  }

  const score = Math.max(0, 100 - violations.length * 10);
  return { passed: violations.length === 0, violations, score };
}

export function isOnBrand(text: string): boolean {
  return lintBrandVoice(text).passed;
}

export function autoCorrectBrandVoice(text: string): string {
  let result = text;
  result = result.replace(/\binfusions?\b/gi, (m) => m.endsWith("s") ? "injections" : "injection");
  result = result.replace(/\banti[- ]aging\b/gi, "rejuvenation");
  result = result.replace(/\bproblem areas?\b/gi, "focus areas");
  result = result.replace(/\bdiscount\b/gi, "exclusive offer");
  result = result.replace(/\bcheap\b/gi, "accessible");
  result = result.replace(/\bbargain\b/gi, "exceptional value");
  return result;
}
