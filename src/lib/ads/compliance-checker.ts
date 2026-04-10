/**
 * Ads War Machine - Compliance Checker
 *
 * Ad compliance engine for medical advertising.
 * Checks FDA, HIPAA, FTC, and Washington State rules.
 * Maintains prohibited claims list, required disclaimers,
 * and auto-inserts compliance language.
 *
 * CRITICAL: Always "injection" - never "infusion."
 */

// ── TYPES ──

export type ComplianceCategory =
  | 'fda'
  | 'hipaa'
  | 'ftc'
  | 'wa_state'
  | 'platform_meta'
  | 'platform_google'
  | 'internal';

export type ComplianceSeverity = 'violation' | 'warning' | 'suggestion';

export interface ComplianceCheckInput {
  headline: string;
  bodyText: string;
  callToAction: string;
  service: string;
  platform: 'meta' | 'google';
  landingPageUrl?: string;
  imageDescription?: string;
  targetAudience?: string;
}

export interface ComplianceResult {
  isCompliant: boolean;
  overallScore: number; // 0-100
  violations: ComplianceIssue[];
  warnings: ComplianceIssue[];
  suggestions: ComplianceIssue[];
  requiredDisclaimers: string[];
  correctedCopy?: CorrectedCopy;
  approvalStatus: 'approved' | 'needs_revision' | 'rejected';
  reviewNotes: string[];
}

export interface ComplianceIssue {
  id: string;
  category: ComplianceCategory;
  severity: ComplianceSeverity;
  title: string;
  description: string;
  affectedText: string;
  suggestedFix: string;
  regulation: string;
}

export interface CorrectedCopy {
  headline: string;
  bodyText: string;
  callToAction: string;
  disclaimers: string[];
  changes: { original: string; corrected: string; reason: string }[];
  /**
   * Matches the checker found but could NOT auto-replace from the safe-
   * replacement dictionary. Surfaced so callers see visible failure instead
   * of a silent pass-through of the original (uncorrected) copy.
   */
  unreplaced: string[];
}

export interface DisclaimerRequirement {
  service: string;
  disclaimers: string[];
  category: ComplianceCategory;
}

// ── ISSUE ID COUNTER ──
// Bug 10 fix: module-scoped monotonic counter so issue ids can never
// collide. The previous scheme `${category}_${violations.length + warnings.length}`
// produced duplicate ids any time two issues in the same category landed
// in the same bucket (e.g. two 'fda' warnings in sequence).
let issueIdCounter = 0;
function nextIssueId(category: ComplianceCategory): string {
  return `${category}_${++issueIdCounter}`;
}

/**
 * Test-only reset for the module-scoped id counter. Exported so tests can
 * assert deterministic ids without cross-test bleed-through. Not part of
 * the public runtime API.
 */
export function _resetIssueCounter(): void {
  issueIdCounter = 0;
}

// ── PROHIBITED CLAIMS ──

interface ProhibitedClaim {
  pattern: RegExp;
  category: ComplianceCategory;
  severity: ComplianceSeverity;
  description: string;
  regulation: string;
  suggestedAlternative: string;
}

const PROHIBITED_CLAIMS: ProhibitedClaim[] = [
  // FDA - Weight loss guarantees
  {
    pattern: /guarantee[ds]?\s*(weight\s*loss|results|pounds?)/i,
    category: 'fda',
    severity: 'violation',
    description: 'Cannot guarantee weight loss results. FDA prohibits guaranteed outcome claims for medical treatments.',
    regulation: 'FDA 21 CFR Part 201 - Labeling',
    suggestedAlternative: 'Replace with "results may vary" or "individual results depend on multiple factors"',
  },
  {
    pattern: /lose\s+\d+\s*(pounds?|lbs?|kg)\s*(in|within|by)/i,
    category: 'fda',
    severity: 'violation',
    description: 'Cannot promise specific weight loss amounts in a timeframe. This constitutes a guaranteed outcome claim.',
    regulation: 'FTC Health Claims Guidelines',
    suggestedAlternative: 'Use "patients may experience significant weight loss" without specific numbers',
  },
  {
    pattern: /100%\s*(effective|success|safe|guaranteed|results)/i,
    category: 'fda',
    severity: 'violation',
    description: 'Cannot claim 100% effectiveness or safety. No medical treatment has a 100% rate.',
    regulation: 'FDA Advertising Standards',
    suggestedAlternative: 'Use specific success rates if supported by data, with "results may vary"',
  },
  {
    // Bug 4 fix: anchor with \b so "obscure disease" / "procure disease" don't
    // false-positive, and require \s+ so "cureaging" can't match either.
    pattern: /\bcure[sd]?\s+(aging|wrinkles|obesity|fat|disease)\b/i,
    category: 'fda',
    severity: 'violation',
    description: 'Cannot use the word "cure" for cosmetic or weight loss treatments.',
    regulation: 'FDA 21 CFR 101.93',
    suggestedAlternative: 'Use "treat," "address," "improve," or "reduce the appearance of"',
  },
  {
    pattern: /permanent(ly)?\s*(remove|eliminate|fix|solve)/i,
    category: 'fda',
    severity: 'warning',
    description: 'Claims of permanent results require strong clinical evidence and appropriate disclaimers.',
    regulation: 'FTC Advertising Substantiation',
    suggestedAlternative: 'Use "long-lasting" or "sustained results with maintenance"',
  },
  // HIPAA
  {
    // Bug 6 fix: allow plural-possessive ("patients' testimonial"), straight
    // or curly apostrophe, and require a real space between patient[s']? and
    // the disclosure noun so it can't fuse across words.
    pattern: /\bpatients?['\u2019]?\s+(name|photo|story|testimonial)(?!\s*\(with\s*consent\))/i,
    category: 'hipaa',
    severity: 'violation',
    description: 'Patient-identifiable information requires written consent. Never use real patient names/photos without documented consent.',
    regulation: 'HIPAA Privacy Rule 45 CFR 164.508',
    suggestedAlternative: 'Use first name + last initial only, or use stock photos with consent documentation',
  },
  {
    pattern: /before\s*(?:and|&|\/)\s*after\s*photo/i,
    category: 'platform_meta',
    severity: 'warning',
    description: 'Before/after photos are restricted on Meta ads and require careful handling on Google.',
    regulation: 'Meta Advertising Policy 4.3',
    suggestedAlternative: 'Use "results representation" or "treatment journey" imagery without direct B/A comparison',
  },
  // FTC
  {
    // Bug 7 fix: catch both singular and plural ("doctor recommends" AND
    // "doctors recommend"). Require \s+ to prevent cross-word fusion.
    pattern: /\bdoctors?\s+recommend/i,
    category: 'ftc',
    severity: 'warning',
    description: 'Claims that "doctors recommend" require substantiation. Generic claims may be misleading.',
    regulation: 'FTC Endorsement Guidelines',
    suggestedAlternative: 'Use "physician-supervised" or "available with medical guidance"',
  },
  {
    pattern: /(?:no|zero)\s*(?:risk|side\s*effects?|complications)/i,
    category: 'fda',
    severity: 'violation',
    description: 'Cannot claim zero risk or no side effects for any medical treatment.',
    regulation: 'FDA Advertising Standards',
    suggestedAlternative: 'Use "minimal side effects" or "excellent safety profile when administered by qualified professionals"',
  },
  {
    pattern: /miracle|breakthrough|revolutionary/i,
    category: 'ftc',
    severity: 'warning',
    description: 'Hyperbolic claims like "miracle" or "breakthrough" may be considered misleading.',
    regulation: 'FTC Deceptive Advertising Policy',
    suggestedAlternative: 'Use "advanced," "clinically-studied," or "innovative"',
  },
  // WA State
  {
    pattern: /cheapest|lowest\s*price|bargain/i,
    category: 'wa_state',
    severity: 'warning',
    description: 'Price comparison claims must be substantiated under WA Consumer Protection Act.',
    regulation: 'WA RCW 19.86 Consumer Protection Act',
    suggestedAlternative: 'State actual prices without comparative claims',
  },
  // Internal brand rules
  {
    pattern: /infusion/i,
    category: 'internal',
    severity: 'violation',
    description: 'Rani Beauty Clinic does IM INJECTIONS only. Never use the word "infusion."',
    regulation: 'Internal Brand Guidelines',
    suggestedAlternative: 'Replace "infusion" with "injection"',
  },
  {
    pattern: /(?:cheap|discount|budget|affordable)\s+(?:botox|filler|treatment|medspa)/i,
    category: 'internal',
    severity: 'warning',
    description: 'Brand voice is luxury-positioned. Avoid discount-first language.',
    regulation: 'Internal Brand Guidelines',
    suggestedAlternative: 'Use "accessible pricing," "financing available," or state the price directly',
  },
  // Platform-specific
  {
    pattern: /weight\s*loss\s*(?:pill|supplement|drug)/i,
    category: 'platform_meta',
    severity: 'warning',
    description: 'Meta restricts ads that reference weight loss products. Frame as "medical weight loss program."',
    regulation: 'Meta Advertising Policy 4.12',
    suggestedAlternative: 'Use "medical weight loss program" or "physician-supervised weight management"',
  },
  {
    pattern: /(?:you|your)\s*(?:body|weight|appearance)\s*(?:is|looks?)\s*(?:bad|ugly|terrible|disgusting)/i,
    category: 'platform_meta',
    severity: 'violation',
    description: 'Ads cannot contain body-shaming language or negative self-image messaging.',
    regulation: 'Meta Advertising Policy 4.3 - Personal Attributes',
    suggestedAlternative: 'Focus on aspirational outcomes rather than current dissatisfaction',
  },
  {
    // Bug 5 fix: strict word boundary on "needle(s)" so "needlepoint" and
    // "needleless" don't false-positive. Plural OK.
    pattern: /injection site|\bneedles?\b/i,
    category: 'platform_meta',
    severity: 'warning',
    description: 'Avoid showing or describing needles/injection sites in Meta ad creative.',
    regulation: 'Meta Advertising Policy - Graphic Content',
    suggestedAlternative: 'Focus on results and experience rather than the procedure details',
  },
];

// ── REQUIRED DISCLAIMERS BY SERVICE ──

const DISCLAIMER_REQUIREMENTS: DisclaimerRequirement[] = [
  {
    service: 'glp1',
    disclaimers: [
      'Results may vary. Individual weight loss depends on starting point, adherence, and lifestyle factors.',
      'GLP-1 therapy requires medical evaluation and ongoing physician supervision.',
      'Side effects may include nausea, decreased appetite, and injection site reactions.',
      'Not a substitute for a healthy diet and regular exercise.',
    ],
    category: 'fda',
  },
  {
    service: 'botox',
    disclaimers: [
      'Results may vary. Botox is a prescription treatment administered by licensed professionals.',
      'Side effects may include temporary bruising, headache, or mild discomfort at injection sites.',
      'Results typically last 3-4 months and may vary by individual.',
    ],
    category: 'fda',
  },
  {
    service: 'fillers',
    disclaimers: [
      'Results may vary. Dermal fillers are prescription treatments requiring professional administration.',
      'Side effects may include swelling, bruising, and tenderness at injection sites.',
      'Consult with our provider to determine the best treatment plan for your goals.',
    ],
    category: 'fda',
  },
  {
    service: 'laser_hair',
    disclaimers: [
      'Individual results vary. Multiple sessions are typically required for optimal results.',
      'Not suitable for all hair/skin types. Consultation required to determine eligibility.',
    ],
    category: 'fda',
  },
  {
    service: 'sofwave',
    disclaimers: [
      'Results may vary. Sofwave is FDA-cleared for lifting the eyebrow and submental and neck tissue.',
      'Individual results depend on skin condition, age, and treatment parameters.',
    ],
    category: 'fda',
  },
  {
    service: 'hydrafacial',
    disclaimers: [
      'Results may vary. HydraFacial is suitable for most skin types.',
      'Consult with our team if you have active skin conditions.',
    ],
    category: 'fda',
  },
  {
    service: 'rf_microneedling',
    disclaimers: [
      'Results may vary. Multiple sessions may be recommended for optimal results.',
      'Temporary redness and swelling are normal post-treatment responses.',
    ],
    category: 'fda',
  },
  {
    service: 'wellness',
    disclaimers: [
      'Wellness injections are not intended to diagnose, treat, cure, or prevent any disease.',
      'Individual results depend on health status and lifestyle factors.',
    ],
    category: 'fda',
  },
  {
    service: 'peptides',
    disclaimers: [
      'Results may vary. Peptide therapy requires medical evaluation and ongoing supervision.',
      'Not a replacement for standard medical care. Consult with our physician for personalized protocols.',
    ],
    category: 'fda',
  },
  {
    service: 'vi_peel',
    disclaimers: [
      'Results may vary. Peeling and recovery time varies by individual and peel strength.',
      'Sun protection is required during and after treatment. Follow all aftercare instructions.',
    ],
    category: 'fda',
  },
  {
    service: 'picoway',
    disclaimers: [
      'Results may vary. Multiple sessions may be required depending on the condition being treated.',
      'Not suitable for all skin types. Consultation required.',
    ],
    category: 'fda',
  },
];

// ── MAIN COMPLIANCE CHECKER ──

export function checkCompliance(input: ComplianceCheckInput): ComplianceResult {
  const allText = `${input.headline} ${input.bodyText} ${input.callToAction}`;
  const violations: ComplianceIssue[] = [];
  const warnings: ComplianceIssue[] = [];
  const suggestions: ComplianceIssue[] = [];

  // Check against prohibited claims
  for (const claim of PROHIBITED_CLAIMS) {
    const match = allText.match(claim.pattern);
    if (match) {
      const issue: ComplianceIssue = {
        // Bug 10 fix: use the module-scoped unique counter instead of the
        // collision-prone length-based id.
        id: nextIssueId(claim.category),
        category: claim.category,
        severity: claim.severity,
        title: `${claim.category.toUpperCase()} ${claim.severity}: Prohibited claim detected`,
        description: claim.description,
        affectedText: match[0],
        suggestedFix: claim.suggestedAlternative,
        regulation: claim.regulation,
      };

      if (claim.severity === 'violation') violations.push(issue);
      else if (claim.severity === 'warning') warnings.push(issue);
      else suggestions.push(issue);
    }
  }

  // Platform-specific checks
  if (input.platform === 'meta') {
    checkMetaCompliance(input, warnings, suggestions);
  } else {
    checkGoogleCompliance(input, warnings, suggestions);
  }

  // Service-specific checks
  checkServiceCompliance(input, warnings, suggestions);

  // Get required disclaimers
  const requiredDisclaimers = getRequiredDisclaimers(input.service);

  // Generate corrected copy if issues found
  let correctedCopy: CorrectedCopy | undefined;
  if (violations.length > 0 || warnings.length > 0) {
    correctedCopy = generateCorrectedCopy(input, [...violations, ...warnings]);
  }

  // Score
  const score = calculateComplianceScore(violations, warnings, suggestions);

  // Approval status
  let approvalStatus: ComplianceResult['approvalStatus'];
  if (violations.length > 0) approvalStatus = 'rejected';
  else if (warnings.length > 0) approvalStatus = 'needs_revision';
  else approvalStatus = 'approved';

  // Review notes
  const reviewNotes: string[] = [];
  if (violations.length > 0) reviewNotes.push(`${violations.length} compliance violation(s) must be fixed before publishing.`);
  if (warnings.length > 0) reviewNotes.push(`${warnings.length} warning(s) should be addressed for best compliance.`);
  if (requiredDisclaimers.length > 0) reviewNotes.push(`${requiredDisclaimers.length} disclaimer(s) required for ${input.service} advertising.`);
  if (score >= 90) reviewNotes.push('Copy is well-compliant. Ready for review.');

  return {
    isCompliant: violations.length === 0,
    overallScore: score,
    violations,
    warnings,
    suggestions,
    requiredDisclaimers,
    correctedCopy,
    approvalStatus,
    reviewNotes,
  };
}

// ── META-SPECIFIC CHECKS ──

function checkMetaCompliance(
  input: ComplianceCheckInput,
  warnings: ComplianceIssue[],
  suggestions: ComplianceIssue[],
): void {
  // Text-to-image ratio (Meta prefers <20% text on images)
  if (input.imageDescription && input.imageDescription.toLowerCase().includes('text')) {
    suggestions.push({
      id: 'meta_text_image',
      category: 'platform_meta',
      severity: 'suggestion',
      title: 'Meta image text ratio',
      description: 'Meta may limit reach if ad images contain more than 20% text overlay.',
      affectedText: 'Image with text overlay',
      suggestedFix: 'Keep text overlay minimal. Use the primary text field for ad copy instead.',
      regulation: 'Meta Advertising Best Practices',
    });
  }

  // Special Ad Categories (medical)
  if (['glp1', 'peptides', 'hormone'].includes(input.service)) {
    suggestions.push({
      id: 'meta_special_category',
      category: 'platform_meta',
      severity: 'suggestion',
      title: 'Consider Special Ad Category',
      description: 'Medical weight loss and hormone-related ads may require Special Ad Category designation on Meta.',
      affectedText: input.service,
      suggestedFix: 'Review Meta Special Ad Categories policy and enable if required for your service type.',
      regulation: 'Meta Special Ad Categories Policy',
    });
  }
}

// ── GOOGLE-SPECIFIC CHECKS ──

function checkGoogleCompliance(
  input: ComplianceCheckInput,
  warnings: ComplianceIssue[],
  suggestions: ComplianceIssue[],
): void {
  // Character limits
  if (input.headline.length > 30) {
    warnings.push({
      id: 'google_headline_length',
      category: 'platform_google',
      severity: 'warning',
      title: 'Google headline exceeds 30 characters',
      description: `Headline is ${input.headline.length} characters. Google RSA headlines must be 30 characters or fewer.`,
      affectedText: input.headline,
      suggestedFix: `Shorten headline to 30 characters: "${input.headline.slice(0, 27)}..."`,
      regulation: 'Google Ads RSA Requirements',
    });
  }

  // Healthcare and medicine policy
  if (['glp1', 'peptides', 'hormone'].includes(input.service)) {
    suggestions.push({
      id: 'google_healthcare',
      category: 'platform_google',
      severity: 'suggestion',
      title: 'Google Healthcare Policy',
      description: 'Healthcare-related ads on Google must comply with healthcare and medicines policy. LegitScript certification may be required.',
      affectedText: input.service,
      suggestedFix: 'Verify compliance with Google Healthcare and Medicines policy. Consider LegitScript certification.',
      regulation: 'Google Ads Healthcare Policy',
    });
  }
}

// ── SERVICE-SPECIFIC CHECKS ──

function checkServiceCompliance(
  input: ComplianceCheckInput,
  warnings: ComplianceIssue[],
  suggestions: ComplianceIssue[],
): void {
  const allText = `${input.headline} ${input.bodyText} ${input.callToAction}`;

  // GLP-1 specific
  if (input.service === 'glp1') {
    if (!allText.toLowerCase().includes('physician') && !allText.toLowerCase().includes('doctor') && !allText.toLowerCase().includes('medical')) {
      suggestions.push({
        id: 'glp1_physician_mention',
        category: 'internal',
        severity: 'suggestion',
        title: 'Include physician supervision mention',
        description: 'GLP-1 ads should mention physician supervision for credibility and compliance.',
        affectedText: 'Missing physician mention',
        suggestedFix: 'Add "physician-supervised" or "with medical oversight" to the ad copy.',
        regulation: 'Internal Best Practice + WA Medical Advertising Law',
      });
    }
  }

  // Check for "results may vary" or similar disclaimer language
  if (!allText.toLowerCase().includes('results may vary') && !allText.toLowerCase().includes('individual results')) {
    suggestions.push({
      id: 'results_disclaimer',
      category: 'fda',
      severity: 'suggestion',
      title: 'Add results disclaimer',
      description: 'Medical advertising should include a disclaimer that results may vary.',
      affectedText: 'Missing disclaimer',
      suggestedFix: 'Add "Results may vary" to the ad copy or landing page.',
      regulation: 'FDA/FTC General Advertising Guidelines',
    });
  }
}

// ── GET REQUIRED DISCLAIMERS ──

export function getRequiredDisclaimers(service: string): string[] {
  // Bug 8 fix: normalize the lookup so "Botox" / "BOTOX" / " botox "
  // don't silently fall through to the generic fallback.
  const key = (service ?? '').trim().toLowerCase();
  const requirement = DISCLAIMER_REQUIREMENTS.find(
    d => d.service.toLowerCase() === key
  );
  const genericDisclaimers = [
    'All treatments at Rani Beauty Clinic are physician-supervised.',
    'Rani Beauty Clinic | 401 Olympia Ave NE, Suite 101, Renton, WA 98056',
  ];

  if (requirement) {
    return [...requirement.disclaimers, ...genericDisclaimers];
  }

  return [
    'Results may vary. Consult with our provider for personalized recommendations.',
    ...genericDisclaimers,
  ];
}

// ── CORRECTED COPY GENERATOR ──

function generateCorrectedCopy(
  input: ComplianceCheckInput,
  issues: ComplianceIssue[],
): CorrectedCopy {
  let correctedHeadline = input.headline;
  let correctedBody = input.bodyText;
  let correctedCTA = input.callToAction;
  const changes: CorrectedCopy['changes'] = [];
  const unreplaced: string[] = [];

  for (const issue of issues) {
    const pattern = new RegExp(escapeRegex(issue.affectedText), 'gi');
    const replacement = getSafeReplacement(issue);

    const appearsInHeadline = pattern.test(correctedHeadline);
    pattern.lastIndex = 0;
    const appearsInBody = pattern.test(correctedBody);
    pattern.lastIndex = 0;
    const appearsInCTA = pattern.test(correctedCTA);
    pattern.lastIndex = 0;

    if (replacement === null) {
      // Bug 9 fix: visible failure for un-auto-fixable matches. Track the
      // original and annotate the corrected field with a manual-review
      // comment so callers never silently publish un-fixed copy.
      if (appearsInHeadline || appearsInBody || appearsInCTA) {
        if (!unreplaced.includes(issue.affectedText)) {
          unreplaced.push(issue.affectedText);
        }
        const marker = `// NEEDS MANUAL REVIEW: could not auto-replace "${issue.affectedText}"`;
        if (appearsInHeadline && !correctedHeadline.includes(marker)) {
          correctedHeadline = `${marker}\n${correctedHeadline}`;
        }
        if (appearsInBody && !correctedBody.includes(marker)) {
          correctedBody = `${marker}\n${correctedBody}`;
        }
        if (appearsInCTA && !correctedCTA.includes(marker)) {
          correctedCTA = `${marker}\n${correctedCTA}`;
        }
      }
      continue;
    }

    if (appearsInHeadline) {
      const original = correctedHeadline;
      correctedHeadline = correctedHeadline.replace(pattern, replacement);
      if (correctedHeadline !== original) {
        changes.push({ original: issue.affectedText, corrected: replacement, reason: issue.description });
      }
    }

    if (appearsInBody) {
      const original = correctedBody;
      correctedBody = correctedBody.replace(pattern, replacement);
      if (correctedBody !== original) {
        changes.push({ original: issue.affectedText, corrected: replacement, reason: issue.description });
      }
    }

    if (appearsInCTA) {
      const original = correctedCTA;
      correctedCTA = correctedCTA.replace(pattern, replacement);
      if (correctedCTA !== original) {
        changes.push({ original: issue.affectedText, corrected: replacement, reason: issue.description });
      }
    }
  }

  const disclaimers = getRequiredDisclaimers(input.service);

  return {
    headline: correctedHeadline,
    bodyText: correctedBody,
    callToAction: correctedCTA,
    disclaimers,
    changes,
    unreplaced,
  };
}

/**
 * Looks up a safe replacement for an issue's affectedText.
 *
 * Returns `null` when no replacement exists so callers can surface the
 * failure instead of silently passing the original text through as a
 * "corrected" value (Bug 9).
 */
function getSafeReplacement(issue: ComplianceIssue): string | null {
  const replacements: Record<string, string> = {
    'infusion': 'injection',
    'cure': 'treat',
    'cures': 'treats',
    'guarantee': 'support',
    'guaranteed': 'expected',
    'miracle': 'advanced',
    'breakthrough': 'innovative',
    'revolutionary': 'advanced',
    'no side effects': 'minimal side effects',
    'zero risk': 'low risk when properly administered',
    'cheapest': 'competitively priced',
    'permanent': 'long-lasting',
  };

  const lowerText = issue.affectedText.toLowerCase().trim();
  if (replacements[lowerText]) return replacements[lowerText];

  // Explicit null signals "no safe replacement available" — caller must
  // handle this visibly rather than pretending the text is fixed.
  return null;
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── COMPLIANCE SCORE ──

function calculateComplianceScore(
  violations: ComplianceIssue[],
  warnings: ComplianceIssue[],
  suggestions: ComplianceIssue[],
): number {
  let score = 100;
  score -= violations.length * 25; // each violation = -25
  score -= warnings.length * 10; // each warning = -10
  score -= suggestions.length * 2; // each suggestion = -2
  return Math.max(0, Math.min(100, score));
}

// ── BATCH COMPLIANCE CHECK ──

export function checkBatchCompliance(
  items: ComplianceCheckInput[],
): { results: ComplianceResult[]; overallCompliant: boolean; summary: string } {
  const results = items.map(item => checkCompliance(item));
  const overallCompliant = results.every(r => r.isCompliant);
  const totalViolations = results.reduce((sum, r) => sum + r.violations.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);
  const avgScore = results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.overallScore, 0) / results.length) : 0;

  let summary = `Checked ${items.length} ad creatives. Average compliance score: ${avgScore}/100. `;
  if (totalViolations > 0) summary += `${totalViolations} violation(s) found that must be fixed. `;
  if (totalWarnings > 0) summary += `${totalWarnings} warning(s) that should be reviewed. `;
  if (overallCompliant) summary += 'All creatives pass compliance. Ready for launch.';
  else summary += 'Some creatives need revision before launch.';

  return { results, overallCompliant, summary };
}

// ── APPROVAL WORKFLOW ──

export interface ApprovalWorkflowItem {
  adId: string;
  adName: string;
  complianceResult: ComplianceResult;
  reviewer?: string;
  reviewDate?: string;
  approvedDate?: string;
  status: 'pending_review' | 'in_review' | 'approved' | 'revision_needed' | 'rejected';
  notes: string[];
}

export function createApprovalWorkflow(
  ads: { id: string; name: string; input: ComplianceCheckInput }[],
): ApprovalWorkflowItem[] {
  return ads.map(ad => {
    const result = checkCompliance(ad.input);
    return {
      adId: ad.id,
      adName: ad.name,
      complianceResult: result,
      status: result.approvalStatus === 'approved'
        ? 'pending_review'
        : result.approvalStatus === 'needs_revision'
          ? 'revision_needed'
          : 'rejected',
      notes: result.reviewNotes,
    };
  });
}
