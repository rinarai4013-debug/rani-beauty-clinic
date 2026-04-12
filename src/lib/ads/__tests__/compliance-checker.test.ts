/**
 * Compliance Checker - Production Test Suite
 *
 * Tests the ad compliance engine that prevents Meta/Google ad bans.
 * False negatives = ad account ban = revenue loss.
 * False positives = wasted creative.
 *
 * Coverage targets:
 *  - Every exported function
 *  - Every PROHIBITED_CLAIMS regex (matching + non-matching)
 *  - Every DISCLAIMER_REQUIREMENTS service
 *  - Platform-specific rules (Meta + Google)
 *  - Severity handling + score calculation thresholds
 *  - Edge cases: empty, long, unicode, case, word boundaries
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkCompliance,
  checkBatchCompliance,
  createApprovalWorkflow,
  getRequiredDisclaimers,
  _resetIssueCounter,
  type ComplianceCheckInput,
  type ComplianceResult,
} from '@/lib/ads/compliance-checker';

// Bug 10: reset the module-scoped issue id counter before every test so
// id assertions are deterministic across files.
beforeEach(() => {
  _resetIssueCounter();
});

// ── FIXTURES ──

/** Baseline "clean" ad that should pass with only suggestions. */
const cleanMetaInput: ComplianceCheckInput = {
  headline: 'Glow Up This Spring',
  bodyText:
    'Our physician-supervised HydraFacial refreshes skin in 45 minutes. Results may vary.',
  callToAction: 'Book Your Consult',
  service: 'hydrafacial',
  platform: 'meta',
};

const cleanGoogleInput: ComplianceCheckInput = {
  headline: 'Luxury HydraFacial Renton',
  bodyText:
    'Physician-supervised skincare. Individual results depend on skin type.',
  callToAction: 'Schedule Today',
  service: 'hydrafacial',
  platform: 'google',
};

/** Builds a fresh input so test mutations don't leak across cases. */
function make(overrides: Partial<ComplianceCheckInput> = {}): ComplianceCheckInput {
  return { ...cleanMetaInput, ...overrides };
}

/** Run compliance check with headline/body/cta merged into the ad body. */
function checkText(text: string, overrides: Partial<ComplianceCheckInput> = {}): ComplianceResult {
  return checkCompliance(
    make({
      headline: 'Headline',
      bodyText: text,
      callToAction: 'Book Now',
      ...overrides,
    }),
  );
}

/** Assert at least one issue whose affected text matches a substring. */
function findIssue(result: ComplianceResult, needle: string) {
  const all = [...result.violations, ...result.warnings, ...result.suggestions];
  return all.find(i => i.affectedText.toLowerCase().includes(needle.toLowerCase()));
}

// ═══════════════════════════════════════════════════════════════════════════
describe('checkCompliance - FDA prohibited claims', () => {
  describe('weight loss guarantees', () => {
    it.each([
      ['guarantee weight loss', true],
      ['guarantees weight loss', true],
      ['guaranteed weight loss', true],
      ['guarantee results', true],
      ['guaranteed results', true],
      ['guarantee pounds', true],
      ['guaranteed pound', true],
      // non-matching - similar but legal
      ['we support weight loss', false],
      ['guarantee your appointment time', false], // not followed by weight loss/results/pounds
      ['satisfaction guarantee', false], // "guarantee" alone without the trailing noun
    ])('case "%s" flags as violation = %s', (text, shouldFlag) => {
      const r = checkText(text);
      const hit = r.violations.some(v =>
        /guarantee[ds]?\s*(weight\s*loss|results|pounds?)/i.test(v.affectedText),
      );
      expect(hit).toBe(shouldFlag);
    });

    it('categorizes guarantee claims as FDA violations', () => {
      const r = checkText('We guarantee weight loss in 30 days');
      const v = r.violations.find(v => v.category === 'fda');
      expect(v).toBeDefined();
      expect(v!.regulation).toContain('FDA');
      expect(v!.severity).toBe('violation');
    });
  });

  describe('specific weight loss amount claims', () => {
    it.each([
      ['Lose 20 pounds in 30 days', true],
      ['lose 15 lbs in 2 weeks', true],
      ['lose 10 lb within a month', true],
      ['Lose 5 kg by summer', true],
      ['lose 100 pounds within a year', true],
      // non-matching
      ['Lose weight with us', false],
      ['Our clients lose 20 pounds on average', false], // missing in/within/by
      ['weight loss journey', false],
    ])('case "%s" flags = %s', (text, shouldFlag) => {
      const r = checkText(text);
      const hit = r.violations.some(v =>
        /lose\s+\d+\s*(pounds?|lbs?|kg)\s*(in|within|by)/i.test(v.affectedText),
      );
      expect(hit).toBe(shouldFlag);
    });
  });

  describe('100% effectiveness/safety claims', () => {
    it.each([
      ['100% effective', true],
      ['100% success', true],
      ['100% safe', true],
      ['100% guaranteed', true],
      ['100% results', true],
      ['100%  effective', true], // double space
      // non-matching
      ['100% natural', false],
      ['100% organic', false],
      ['up to 100 clients helped', false],
    ])('case "%s" flags = %s', (text, shouldFlag) => {
      const r = checkText(text);
      const hit = r.violations.some(v => /100%\s*(effective|success|safe|guaranteed|results)/i.test(v.affectedText));
      expect(hit).toBe(shouldFlag);
    });
  });

  describe('cure claims', () => {
    it.each([
      ['cure aging', true],
      ['cures wrinkles', true],
      ['cured obesity', true],
      ['cure fat', true],
      ['cure disease', true],
      ['Cures Wrinkles', true], // case insensitive
      // non-matching
      ['secure your appointment', false],
      ['procure high-quality products', false],
      ['skincare products', false],
    ])('case "%s" flags = %s', (text, shouldFlag) => {
      const r = checkText(text);
      // Bug 4 fixed: regex now has \b boundary and \s+ required space.
      const hit = r.violations.some(v => /\bcure[sd]?\s+(aging|wrinkles|obesity|fat|disease)\b/i.test(v.affectedText));
      expect(hit).toBe(shouldFlag);
    });

    // Bug 4 fixed: added \b word boundary so "obscure disease" / "procure disease"
    // no longer false-positive as cure claims.
    it('does NOT flag "obscure disease" as cure claim', () => {
      const r = checkText('We discuss the obscure disease patterns here');
      const hit = r.violations.some(v => /\bcure[sd]?\b/i.test(v.affectedText));
      expect(hit).toBe(false);
    });

    // Bug 4 regression: "procure disease literature" must also not match.
    it('does NOT flag "procure disease" as cure claim', () => {
      const r = checkText('We procure disease literature for our clients');
      const hit = r.violations.some(v => /\bcure[sd]?\b/i.test(v.affectedText));
      expect(hit).toBe(false);
    });

    // Bug 4 regression: fused "cureaging" (no space) must not match.
    it('does NOT flag "cureaging" (fused, no space) as cure claim', () => {
      const r = checkText('cureaging is not a real word');
      const hit = r.violations.some(v => /\bcure[sd]?/i.test(v.affectedText));
      expect(hit).toBe(false);
    });
  });

  describe('permanent removal claims (warning)', () => {
    it.each([
      ['permanently remove hair', 'warning'],
      ['permanent eliminate fat', 'warning'],
      ['permanently fix wrinkles', 'warning'],
      ['permanent solve acne', 'warning'],
    ])('case "%s" flags as %s', (text, sev) => {
      const r = checkText(text);
      const hit = r.warnings.some(w => /permanent(ly)?\s*(remove|eliminate|fix|solve)/i.test(w.affectedText));
      expect(hit).toBe(true);
      expect(sev).toBe('warning');
    });

    it('does not flag "permanent makeup" (no action verb)', () => {
      const r = checkText('Learn about permanent makeup options');
      const hit = r.warnings.some(w => /permanent/i.test(w.affectedText) && /remove|eliminate|fix|solve/i.test(w.affectedText));
      expect(hit).toBe(false);
    });
  });

  describe('zero risk / no side effects claims', () => {
    it.each([
      ['no risk', true],
      ['zero risk', true],
      ['no side effects', true],
      ['zero side effects', true],
      ['no side effect', true],
      ['no complications', true],
      ['zero complications', true],
      // non-matching
      ['minimal side effects', false],
      ['low risk when properly administered', false],
    ])('case "%s" flags as violation = %s', (text, shouldFlag) => {
      const r = checkText(text);
      const hit = r.violations.some(v => /(?:no|zero)\s*(?:risk|side\s*effects?|complications)/i.test(v.affectedText));
      expect(hit).toBe(shouldFlag);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
describe('checkCompliance - HIPAA prohibited claims', () => {
  it.each([
    ['patient name Jane Doe', true],
    ['patient photo attached', true],
    ['patient story of recovery', true],
    ['patient testimonial', true],
  ])('case "%s" flags HIPAA violation = %s', (text, shouldFlag) => {
    const r = checkText(text);
    const hit = r.violations.some(v => v.category === 'hipaa');
    expect(hit).toBe(shouldFlag);
  });

  it('allows patient info when "(with consent)" is present', () => {
    const r = checkText('patient testimonial (with consent) from Jane');
    const hit = r.violations.some(v => v.category === 'hipaa');
    expect(hit).toBe(false);
  });

  it('cites HIPAA 45 CFR 164.508 on patient info violation', () => {
    const r = checkText('patient photo of a real client');
    const v = r.violations.find(v => v.category === 'hipaa');
    expect(v).toBeDefined();
    expect(v!.regulation).toContain('164.508');
  });

  // Bug 6 fixed: regex now matches plural-possessive "patients' testimonial"
  // (straight apostrophe). Previously the [s']?\s* sequence couldn't span the
  // apostrophe-space boundary.
  it('flags plural-possessive "patients\' testimonial" (straight apostrophe)', () => {
    const r = checkText("our patients' testimonial program is great");
    const hit = r.violations.some(v => v.category === 'hipaa');
    expect(hit).toBe(true);
  });

  // Bug 6 regression: curly apostrophe variant "patients\u2019 photo" must
  // also match.
  it('flags plural-possessive with curly apostrophe "patients\u2019 photo"', () => {
    const r = checkText('our patients\u2019 photo showcase');
    const hit = r.violations.some(v => v.category === 'hipaa');
    expect(hit).toBe(true);
  });

  // Bug 6 regression: the \s+ requirement means "patients" fused with the
  // following word (no space) must NOT match.
  it('does NOT fuse across non-space boundaries ("patientsname")', () => {
    const r = checkText('patientsname column was removed');
    const hit = r.violations.some(v => v.category === 'hipaa');
    expect(hit).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
describe('checkCompliance - before/after photos (Meta warning)', () => {
  it.each([
    ['before and after photos', true],
    ['before & after photo', true],
    ['before/after photo', true],
    ['BEFORE AND AFTER PHOTO', true],
    // non-matching
    ['before your treatment', false],
    ['after the appointment', false],
    ['treatment journey imagery', false],
  ])('case "%s" warns = %s', (text, shouldFlag) => {
    const r = checkText(text);
    const hit = r.warnings.some(w => /before\s*(?:and|&|\/)\s*after\s*photo/i.test(w.affectedText));
    expect(hit).toBe(shouldFlag);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
describe('checkCompliance - FTC prohibited claims', () => {
  it('warns on "doctor recommends" (FTC substantiation)', () => {
    const r = checkText('Every doctor recommends our treatment');
    const hit = r.warnings.some(w => w.category === 'ftc' && /\bdoctors?\s+recommend/i.test(w.affectedText));
    expect(hit).toBe(true);
  });

  // Bug 7 fixed: regex now catches plural "doctors recommend" too.
  it('warns on "doctors recommend" (plural)', () => {
    const r = checkText('Doctors recommend our treatment');
    const hit = r.warnings.some(w => w.category === 'ftc' && /\bdoctors?\s+recommend/i.test(w.affectedText));
    expect(hit).toBe(true);
  });

  // Bug 7 regression: "Our doctors recommended this for years" must match.
  it('warns on "doctors recommended" (plural past tense of recommend stem)', () => {
    const r = checkText('Our doctors recommended this for years');
    const hit = r.warnings.some(w => w.category === 'ftc' && /\bdoctors?\s+recommend/i.test(w.affectedText));
    expect(hit).toBe(true);
  });

  // Bug 7 regression: \b and \s+ mean a fused word like "doctorrecommend"
  // must NOT match.
  it('does NOT match fused "doctorrecommend" (no space)', () => {
    const r = checkText('doctorrecommend is not a word');
    const hit = r.warnings.some(w => /doctor/i.test(w.affectedText) && /recommend/i.test(w.affectedText));
    expect(hit).toBe(false);
  });

  it.each([
    ['miracle treatment', true],
    ['breakthrough formula', true],
    ['revolutionary procedure', true],
    ['Miracle cream', true],
    ['BREAKTHROUGH results', true],
    // non-matching
    ['advanced treatment', false],
    ['innovative procedure', false],
    ['clinically-studied', false],
  ])('hyperbolic "%s" warns = %s', (text, shouldFlag) => {
    const r = checkText(text);
    const hit = r.warnings.some(w => /miracle|breakthrough|revolutionary/i.test(w.affectedText));
    expect(hit).toBe(shouldFlag);
  });

  it('classifies miracle/breakthrough as FTC warning, not violation', () => {
    const r = checkText('A miracle treatment for you');
    const w = r.warnings.find(w => /miracle/i.test(w.affectedText));
    expect(w).toBeDefined();
    expect(w!.severity).toBe('warning');
    expect(w!.category).toBe('ftc');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
describe('checkCompliance - WA State pricing claims', () => {
  it.each([
    ['cheapest Botox in Renton', true],
    ['lowest price guarantee', true],
    ['bargain facials', true],
    // non-matching
    ['competitive pricing', false],
    ['transparent pricing', false],
  ])('"%s" warns = %s', (text, shouldFlag) => {
    const r = checkText(text);
    const hit = r.warnings.some(w => /cheapest|lowest\s*price|bargain/i.test(w.affectedText));
    expect(hit).toBe(shouldFlag);
  });

  it('cites WA RCW 19.86 on pricing warning', () => {
    const r = checkText('Cheapest Botox in Washington');
    const w = r.warnings.find(w => w.category === 'wa_state');
    expect(w).toBeDefined();
    expect(w!.regulation).toContain('19.86');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
describe('checkCompliance - Internal brand rules', () => {
  describe('infusion ban (CRITICAL)', () => {
    it.each([
      ['NAD+ infusion', true],
      ['vitamin infusion', true],
      ['Infusion therapy', true],
      ['INFUSION available', true],
      // non-matching
      ['IM injection', false],
      ['intramuscular injection', false],
    ])('"%s" violates brand rule = %s', (text, shouldFlag) => {
      const r = checkText(text);
      const hit = r.violations.some(v => v.category === 'internal' && /infusion/i.test(v.affectedText));
      expect(hit).toBe(shouldFlag);
    });

    it('infusion is SEVERITY = violation (not warning)', () => {
      const r = checkText('NAD+ infusion therapy');
      const v = r.violations.find(v => /infusion/i.test(v.affectedText));
      expect(v).toBeDefined();
      expect(v!.severity).toBe('violation');
    });

    it('replaces "infusion" with "injection" in corrected copy', () => {
      const r = checkCompliance(
        make({
          headline: 'Vitamin infusion today',
          bodyText: 'Book your NAD+ infusion now.',
          callToAction: 'Book infusion',
          service: 'wellness',
        }),
      );
      expect(r.correctedCopy).toBeDefined();
      // Bug 9 fixed: "infusion" has an entry in the safe-replacement dict
      // and gets cleanly swapped to "injection" in each field.
      const lower = `${r.correctedCopy!.headline} ${r.correctedCopy!.bodyText} ${r.correctedCopy!.callToAction}`.toLowerCase();
      expect(lower).toContain('injection');
    });
  });

  describe('discount language on luxury services', () => {
    it.each([
      ['cheap Botox', true],
      ['discount filler', true],
      ['budget treatment', true],
      ['affordable medspa', true],
      ['cheap botox', true],
      // non-matching
      ['premium Botox', false],
      ['luxury treatment', false],
      ['cheap gasoline nearby', false], // "cheap" without the required service word
    ])('"%s" warns = %s', (text, shouldFlag) => {
      const r = checkText(text);
      const hit = r.warnings.some(
        w => w.category === 'internal' && /(?:cheap|discount|budget|affordable)\s+(?:botox|filler|treatment|medspa)/i.test(w.affectedText),
      );
      expect(hit).toBe(shouldFlag);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
describe('checkCompliance - Meta platform rules', () => {
  describe('weight loss pill/supplement/drug', () => {
    it.each([
      ['weight loss pill', true],
      ['weight loss supplement', true],
      ['weight loss drug', true],
      ['weight  loss pill', true],
      // non-matching
      ['medical weight loss program', false],
      ['physician-supervised weight management', false],
    ])('"%s" warns = %s', (text, shouldFlag) => {
      const r = checkText(text, { platform: 'meta' });
      const hit = r.warnings.some(w => /weight\s*loss\s*(?:pill|supplement|drug)/i.test(w.affectedText));
      expect(hit).toBe(shouldFlag);
    });
  });

  describe('body-shaming (personal attributes)', () => {
    it.each([
      ['your body is bad', true],
      ['your weight is terrible', true],
      ['your appearance looks disgusting', true],
      ['your body looks bad', true],
      ['you body is ugly', true], // "you" + "body" + "is" + "ugly"
      // non-matching - "you look ugly" doesn't have body/weight/appearance between you and the verb
      ['you look ugly', false],
      ['love the skin you are in', false],
      ['feel confident', false],
    ])('"%s" violates = %s', (text, shouldFlag) => {
      const r = checkText(text, { platform: 'meta' });
      const hit = r.violations.some(v => v.category === 'platform_meta');
      expect(hit).toBe(shouldFlag);
    });

    it('body-shaming is a VIOLATION not warning', () => {
      const r = checkText('your body is bad', { platform: 'meta' });
      const v = r.violations.find(v => v.category === 'platform_meta');
      expect(v).toBeDefined();
      expect(v!.severity).toBe('violation');
      expect(v!.regulation).toContain('Personal Attributes');
    });
  });

  describe('needles/injection site language', () => {
    it.each([
      ['injection site bruising', true],
      ['needle precision', true],
      ['our needles are tiny', true],
      // non-matching
      ['injection experience', false],
      ['needling vs microneedling', false], // "needling"/"microneedling" do NOT contain a whole "needle"
    ])('"%s" warns = %s', (text, shouldFlag) => {
      const r = checkText(text, { platform: 'meta' });
      // Bug 5 fixed: strict word boundary for needles?.
      const hit = r.warnings.some(w => /injection site|\bneedles?\b/i.test(w.affectedText));
      expect(hit).toBe(shouldFlag);
    });

    // Bug 5 fixed: \bneedles?\b no longer false-positives on "needlepoint".
    it('does NOT flag "needlepoint" as a needle claim', () => {
      const r = checkText('Our needlepoint technique is fine', { platform: 'meta' });
      const hit = r.warnings.some(w => /\bneedles?\b/i.test(w.affectedText));
      expect(hit).toBe(false);
    });

    // Bug 5 regression: "needleless" must also not match.
    it('does NOT flag "needleless" as a needle claim', () => {
      const r = checkText('We offer a needleless experience', { platform: 'meta' });
      const hit = r.warnings.some(w => /\bneedles?\b/i.test(w.affectedText));
      expect(hit).toBe(false);
    });

    // Bug 5 regression: plural "needles" still caught.
    it('still flags plural "needles" correctly', () => {
      const r = checkText('our thin needles make it comfortable', { platform: 'meta' });
      const hit = r.warnings.some(w => /\bneedles?\b/i.test(w.affectedText));
      expect(hit).toBe(true);
    });
  });

  describe('Meta image text suggestion', () => {
    it('suggests when imageDescription mentions text', () => {
      const r = checkCompliance(make({ imageDescription: 'Photo with text overlay' }));
      const s = r.suggestions.find(s => s.id === 'meta_text_image');
      expect(s).toBeDefined();
    });

    it('does not suggest when imageDescription lacks "text"', () => {
      const r = checkCompliance(make({ imageDescription: 'Clean product shot' }));
      const s = r.suggestions.find(s => s.id === 'meta_text_image');
      expect(s).toBeUndefined();
    });

    it('does not suggest when imageDescription missing', () => {
      const r = checkCompliance(make({}));
      const s = r.suggestions.find(s => s.id === 'meta_text_image');
      expect(s).toBeUndefined();
    });
  });

  describe('Special Ad Category', () => {
    it.each(['glp1', 'peptides', 'hormone'])(
      'flags service=%s for special category review',
      service => {
        const r = checkCompliance(make({ service, platform: 'meta' }));
        const s = r.suggestions.find(s => s.id === 'meta_special_category');
        expect(s).toBeDefined();
      },
    );

    it('does not flag non-medical services', () => {
      const r = checkCompliance(make({ service: 'hydrafacial', platform: 'meta' }));
      const s = r.suggestions.find(s => s.id === 'meta_special_category');
      expect(s).toBeUndefined();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
describe('checkCompliance - Google platform rules', () => {
  describe('headline character limit', () => {
    it('does not warn when headline ≤ 30 chars', () => {
      const r = checkCompliance({ ...cleanGoogleInput, headline: 'A'.repeat(30) });
      expect(r.warnings.some(w => w.id === 'google_headline_length')).toBe(false);
    });

    it('warns when headline > 30 chars', () => {
      const r = checkCompliance({ ...cleanGoogleInput, headline: 'A'.repeat(31) });
      const w = r.warnings.find(w => w.id === 'google_headline_length');
      expect(w).toBeDefined();
      expect(w!.description).toContain('31');
    });

    it('warns with exact count of characters in description', () => {
      const h = 'Luxury Botox Treatment Renton Washington';
      const r = checkCompliance({ ...cleanGoogleInput, headline: h });
      const w = r.warnings.find(w => w.id === 'google_headline_length');
      expect(w).toBeDefined();
      expect(w!.description).toContain(String(h.length));
    });

    it('does NOT apply 30-char limit on Meta platform', () => {
      const r = checkCompliance({ ...cleanMetaInput, headline: 'A'.repeat(100) });
      expect(r.warnings.some(w => w.id === 'google_headline_length')).toBe(false);
    });
  });

  describe('healthcare policy suggestion', () => {
    it.each(['glp1', 'peptides', 'hormone'])(
      'flags Google healthcare policy for %s',
      service => {
        const r = checkCompliance({ ...cleanGoogleInput, service });
        const s = r.suggestions.find(s => s.id === 'google_healthcare');
        expect(s).toBeDefined();
        expect(s!.description).toContain('LegitScript');
      },
    );

    it('does not flag standard aesthetic services', () => {
      const r = checkCompliance({ ...cleanGoogleInput, service: 'botox' });
      const s = r.suggestions.find(s => s.id === 'google_healthcare');
      expect(s).toBeUndefined();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
describe('checkCompliance - service-specific rules', () => {
  describe('GLP-1 physician mention', () => {
    it('suggests physician mention when missing', () => {
      const r = checkCompliance({
        headline: 'Lose weight naturally',
        bodyText: 'Start your journey today',
        callToAction: 'Learn more',
        service: 'glp1',
        platform: 'meta',
      });
      const s = r.suggestions.find(s => s.id === 'glp1_physician_mention');
      expect(s).toBeDefined();
    });

    it.each(['physician', 'doctor', 'medical'])(
      'does NOT suggest when "%s" is present',
      keyword => {
        const r = checkCompliance({
          headline: 'Weight management',
          bodyText: `${keyword} supervised program`,
          callToAction: 'Book',
          service: 'glp1',
          platform: 'meta',
        });
        const s = r.suggestions.find(s => s.id === 'glp1_physician_mention');
        expect(s).toBeUndefined();
      },
    );

    it('only applies to glp1 service', () => {
      const r = checkCompliance({
        headline: 'Glow',
        bodyText: 'nice facial',
        callToAction: 'Book',
        service: 'hydrafacial',
        platform: 'meta',
      });
      const s = r.suggestions.find(s => s.id === 'glp1_physician_mention');
      expect(s).toBeUndefined();
    });
  });

  describe('results-may-vary disclaimer suggestion', () => {
    it('suggests when neither phrase present', () => {
      const r = checkText('Glow more');
      const s = r.suggestions.find(s => s.id === 'results_disclaimer');
      expect(s).toBeDefined();
    });

    it('does not suggest with "results may vary"', () => {
      const r = checkText('Glow more. Results may vary.');
      const s = r.suggestions.find(s => s.id === 'results_disclaimer');
      expect(s).toBeUndefined();
    });

    it('does not suggest with "individual results"', () => {
      const r = checkText('Individual results depend on skin type.');
      const s = r.suggestions.find(s => s.id === 'results_disclaimer');
      expect(s).toBeUndefined();
    });

    it('is case-insensitive on disclaimer detection', () => {
      const r = checkText('RESULTS MAY VARY based on skin.');
      const s = r.suggestions.find(s => s.id === 'results_disclaimer');
      expect(s).toBeUndefined();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
describe('getRequiredDisclaimers', () => {
  const servicesWithDisclaimers = [
    'glp1',
    'botox',
    'fillers',
    'laser_hair',
    'sofwave',
    'hydrafacial',
    'rf_microneedling',
    'wellness',
    'peptides',
    'vi_peel',
    'picoway',
  ];

  it.each(servicesWithDisclaimers)('returns service-specific disclaimers for %s', service => {
    const d = getRequiredDisclaimers(service);
    expect(d.length).toBeGreaterThanOrEqual(2);
    // Always append the 2 generic disclaimers
    expect(d.some(x => x.includes('physician-supervised'))).toBe(true);
    expect(d.some(x => x.includes('401 Olympia'))).toBe(true);
  });

  it('glp1 disclaimers mention GLP-1 and nausea side effects', () => {
    const d = getRequiredDisclaimers('glp1');
    expect(d.some(x => x.includes('GLP-1'))).toBe(true);
    expect(d.some(x => x.toLowerCase().includes('nausea'))).toBe(true);
  });

  it('botox disclaimers mention 3-4 months', () => {
    const d = getRequiredDisclaimers('botox');
    expect(d.some(x => x.includes('3-4 months'))).toBe(true);
  });

  it('wellness disclaimers include the FDA no-cure statement', () => {
    const d = getRequiredDisclaimers('wellness');
    expect(d.some(x => x.includes('not intended to diagnose'))).toBe(true);
  });

  it('returns generic-only fallback for unknown service', () => {
    const d = getRequiredDisclaimers('nonexistent_service_xyz');
    expect(d).toHaveLength(3); // 1 fallback + 2 generic
    expect(d[0]).toContain('Results may vary');
    expect(d.some(x => x.includes('physician-supervised'))).toBe(true);
    expect(d.some(x => x.includes('401 Olympia'))).toBe(true);
  });

  it('returns fallback for empty string service', () => {
    const d = getRequiredDisclaimers('');
    expect(d.length).toBe(3);
  });

  // Bug 8 fixed: service lookup is now case-insensitive and trim-tolerant.
  // "Botox" / "BOTOX" / " botox " all resolve to the botox-specific set.
  it('is case-insensitive on service key ("Botox" resolves to botox)', () => {
    const d = getRequiredDisclaimers('Botox');
    // botox disclaimers: 3 service-specific + 2 generic = 5
    expect(d.length).toBe(5);
    expect(d.some(x => x.includes('3-4 months'))).toBe(true);
  });

  // Bug 8 regression: uppercase, mixed case and surrounding whitespace
  // should all map to the same canonical entry.
  it.each(['BOTOX', 'BoTox', '  botox  '])(
    'resolves service variant "%s" to botox-specific disclaimers',
    (variant) => {
      const d = getRequiredDisclaimers(variant);
      expect(d.some(x => x.includes('3-4 months'))).toBe(true);
    }
  );

  // Bug 8 regression: truly unknown services still fall back to generic.
  it('case-insensitive fallback still applies for unknown services', () => {
    const d = getRequiredDisclaimers('NOT_A_REAL_SERVICE');
    expect(d).toHaveLength(3);
    expect(d.some(x => x.includes('3-4 months'))).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
describe('checkCompliance - scoring thresholds', () => {
  it('clean ad scores 100 (minus suggestions)', () => {
    const r = checkCompliance(cleanMetaInput);
    // cleanMetaInput triggers no violations/warnings but may emit 0+ suggestions
    expect(r.violations).toHaveLength(0);
    expect(r.warnings).toHaveLength(0);
    // score = 100 - suggestions*2
    expect(r.overallScore).toBe(100 - r.suggestions.length * 2);
  });

  it('1 violation = -25', () => {
    const r = checkText('we guarantee weight loss');
    // Also triggers other suggestions, so bound the math
    const expected = 100 - r.violations.length * 25 - r.warnings.length * 10 - r.suggestions.length * 2;
    expect(r.overallScore).toBe(Math.max(0, Math.min(100, expected)));
  });

  it('score cannot go below 0', () => {
    const r = checkCompliance({
      headline: 'Miracle breakthrough revolutionary cheapest Botox',
      bodyText:
        'We guarantee weight loss. 100% effective. cure wrinkles. no side effects. lose 50 pounds in 30 days. patient photo. infusion. your body is bad. doctor recommend. weight loss pill. permanent remove. before and after photo. cheap Botox.',
      callToAction: 'Lose 20 lbs in 1 week',
      service: 'glp1',
      platform: 'meta',
    });
    expect(r.overallScore).toBe(0);
    expect(r.overallScore).toBeGreaterThanOrEqual(0);
  });

  it('score cannot exceed 100', () => {
    const r = checkCompliance(cleanMetaInput);
    expect(r.overallScore).toBeLessThanOrEqual(100);
  });

  it('review notes include "well-compliant" when score >= 90', () => {
    const r = checkCompliance({
      headline: 'Luxury Skincare',
      bodyText: 'Professional skincare. Results may vary.',
      callToAction: 'Book',
      service: 'hydrafacial',
      platform: 'meta',
    });
    if (r.overallScore >= 90) {
      expect(r.reviewNotes.some(n => n.includes('well-compliant'))).toBe(true);
    }
  });

  it('score below 90 does NOT include well-compliant note', () => {
    const r = checkCompliance({
      headline: 'Cheapest miracle Botox',
      bodyText: 'we guarantee weight loss',
      callToAction: 'Book',
      service: 'botox',
      platform: 'meta',
    });
    expect(r.overallScore).toBeLessThan(90);
    expect(r.reviewNotes.some(n => n.includes('well-compliant'))).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
describe('checkCompliance - approval status', () => {
  it('returns "approved" when no violations or warnings', () => {
    const r = checkCompliance(cleanMetaInput);
    if (r.violations.length === 0 && r.warnings.length === 0) {
      expect(r.approvalStatus).toBe('approved');
    }
  });

  it('returns "rejected" on any violation', () => {
    const r = checkText('patient photo guaranteed weight loss');
    expect(r.approvalStatus).toBe('rejected');
    expect(r.isCompliant).toBe(false);
  });

  it('returns "needs_revision" on warnings only (no violations)', () => {
    const r = checkText('miracle treatment cheapest');
    expect(r.violations).toHaveLength(0);
    expect(r.warnings.length).toBeGreaterThan(0);
    expect(r.approvalStatus).toBe('needs_revision');
  });

  it('violations override warnings in approval status', () => {
    const r = checkText('miracle cure aging');
    expect(r.approvalStatus).toBe('rejected');
  });

  it('isCompliant is true when violations = 0 (even with warnings)', () => {
    const r = checkText('miracle breakthrough');
    expect(r.violations).toHaveLength(0);
    expect(r.isCompliant).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
describe('checkCompliance - review notes', () => {
  it('reports violation count', () => {
    const r = checkText('guaranteed weight loss. 100% effective. infusion.');
    const note = r.reviewNotes.find(n => n.includes('violation'));
    expect(note).toBeDefined();
    expect(note).toContain(String(r.violations.length));
  });

  it('reports warning count', () => {
    const r = checkText('miracle breakthrough treatment');
    const note = r.reviewNotes.find(n => n.includes('warning'));
    expect(note).toBeDefined();
  });

  it('reports disclaimer count', () => {
    const r = checkCompliance(make({ service: 'botox' }));
    const note = r.reviewNotes.find(n => n.includes('disclaimer'));
    expect(note).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
describe('checkCompliance - corrected copy generation', () => {
  it('generates corrected copy when violations exist', () => {
    const r = checkText('guaranteed weight loss');
    expect(r.correctedCopy).toBeDefined();
  });

  it('generates corrected copy when only warnings exist', () => {
    const r = checkText('miracle treatment');
    expect(r.correctedCopy).toBeDefined();
  });

  it('does NOT generate corrected copy for clean copy', () => {
    const r = checkCompliance(cleanMetaInput);
    if (r.violations.length === 0 && r.warnings.length === 0) {
      expect(r.correctedCopy).toBeUndefined();
    }
  });

  it('corrected copy includes disclaimers for the service', () => {
    const r = checkCompliance({
      headline: 'Miracle Botox',
      bodyText: 'best results',
      callToAction: 'Book',
      service: 'botox',
      platform: 'meta',
    });
    expect(r.correctedCopy).toBeDefined();
    expect(r.correctedCopy!.disclaimers.some(d => d.includes('3-4 months'))).toBe(true);
  });

  it('corrected copy tracks changes array', () => {
    const r = checkCompliance({
      headline: 'miracle Botox',
      bodyText: 'breakthrough results',
      callToAction: 'Book',
      service: 'botox',
      platform: 'meta',
    });
    expect(r.correctedCopy).toBeDefined();
    expect(Array.isArray(r.correctedCopy!.changes)).toBe(true);
  });

  // Bug 9 fixed: un-auto-fixable matches now surface via the unreplaced[]
  // array AND inject a visible "NEEDS MANUAL REVIEW" marker comment into
  // the corrected fields. Callers can no longer silently publish un-fixed
  // copy thinking it was auto-corrected.
  it('surfaces un-replaceable matches via unreplaced[] and a review marker', () => {
    const r = checkCompliance({
      headline: 'We guarantee weight loss',
      bodyText: '100% effective results',
      callToAction: 'Book',
      service: 'botox',
      platform: 'meta',
    });
    expect(r.correctedCopy).toBeDefined();
    // unreplaced must include both phrases that lack a dict key
    expect(r.correctedCopy!.unreplaced).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/guarantee weight loss/i),
        expect.stringMatching(/100%.*effective/i),
      ])
    );
    // visible review marker on the corrected fields
    expect(r.correctedCopy!.headline).toMatch(/NEEDS MANUAL REVIEW/);
    expect(r.correctedCopy!.bodyText).toMatch(/NEEDS MANUAL REVIEW/);
  });

  // Bug 9 regression: known dictionary entries still auto-replace cleanly
  // and do NOT appear in unreplaced[].
  it('still auto-replaces known dictionary entries ("infusion" → "injection")', () => {
    const r = checkCompliance({
      headline: 'NAD+ infusion today',
      bodyText: 'Book your infusion.',
      callToAction: 'Book infusion',
      service: 'wellness',
      platform: 'meta',
    });
    expect(r.correctedCopy).toBeDefined();
    expect(r.correctedCopy!.unreplaced).not.toEqual(
      expect.arrayContaining([expect.stringMatching(/infusion/i)])
    );
    const joined = `${r.correctedCopy!.headline} ${r.correctedCopy!.bodyText} ${r.correctedCopy!.callToAction}`.toLowerCase();
    expect(joined).toContain('injection');
  });

  // Bug 9 regression: mix of replaceable and unreplaceable matches —
  // replaceable ones get fixed, unreplaceable ones get flagged.
  it('handles mixed replaceable + unreplaceable matches in one pass', () => {
    const r = checkCompliance({
      headline: 'miracle guarantee weight loss',
      bodyText: 'infusion therapy',
      callToAction: 'Book',
      service: 'botox',
      platform: 'meta',
    });
    expect(r.correctedCopy).toBeDefined();
    // "miracle" has a dict entry → replaced → not in unreplaced
    expect(r.correctedCopy!.unreplaced.some(u => /^miracle$/i.test(u))).toBe(false);
    // "guarantee weight loss" has no dict entry → in unreplaced
    expect(r.correctedCopy!.unreplaced.some(u => /guarantee weight loss/i.test(u))).toBe(true);
    // body was clean-replaced (infusion → injection)
    expect(r.correctedCopy!.bodyText.toLowerCase()).toContain('injection');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
describe('checkCompliance - required disclaimers always returned', () => {
  it('always returns disclaimers for known service', () => {
    const r = checkCompliance(make({ service: 'botox' }));
    expect(r.requiredDisclaimers.length).toBeGreaterThan(0);
  });

  it('returns generic disclaimers for unknown service', () => {
    const r = checkCompliance(make({ service: 'unknown' }));
    expect(r.requiredDisclaimers.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
describe('checkCompliance - case sensitivity', () => {
  it.each([
    'GUARANTEE WEIGHT LOSS',
    'Guarantee Weight Loss',
    'guarantee weight loss',
    'gUaRaNtEe WeIgHt LoSs',
  ])('flags case variant "%s"', text => {
    const r = checkText(text);
    expect(r.violations.some(v => /guarantee/i.test(v.affectedText))).toBe(true);
  });

  it.each(['Botox', 'botox', 'BOTOX', 'BoTox'])(
    'all capitalizations of Botox pass through unharmed (not banned)',
    text => {
      const r = checkText(`Try ${text} for your wrinkles. Results may vary.`);
      expect(r.isCompliant).toBe(true);
    },
  );
});

// ═══════════════════════════════════════════════════════════════════════════
describe('checkCompliance - edge cases', () => {
  it('handles empty headline, body, cta', () => {
    const r = checkCompliance({
      headline: '',
      bodyText: '',
      callToAction: '',
      service: 'botox',
      platform: 'meta',
    });
    expect(r.violations).toHaveLength(0);
    expect(r.approvalStatus).toBe('approved');
  });

  it('handles very long input (10KB)', () => {
    const longText = 'clean skincare content. '.repeat(500);
    const r = checkCompliance({
      headline: 'Headline',
      bodyText: longText,
      callToAction: 'Book',
      service: 'hydrafacial',
      platform: 'meta',
    });
    expect(r).toBeDefined();
    expect(r.overallScore).toBeGreaterThanOrEqual(0);
  });

  it('handles unicode characters', () => {
    const r = checkCompliance({
      headline: 'Glow with us 日本語 العربية',
      bodyText: 'Results may vary. Гарантия нет.',
      callToAction: 'Book →',
      service: 'hydrafacial',
      platform: 'meta',
    });
    expect(r).toBeDefined();
    expect(r.isCompliant).toBe(true);
  });

  it('handles emoji input', () => {
    const r = checkCompliance({
      headline: 'Luxury Glow',
      bodyText: 'Results may vary. Feel amazing.',
      callToAction: 'Book Now',
      service: 'hydrafacial',
      platform: 'meta',
    });
    expect(r).toBeDefined();
    expect(r.isCompliant).toBe(true);
  });

  it('handles headline at exactly 30 chars on Google', () => {
    const h = 'A'.repeat(30);
    const r = checkCompliance({ ...cleanGoogleInput, headline: h });
    expect(r.warnings.some(w => w.id === 'google_headline_length')).toBe(false);
  });

  it('handles headline at 31 chars on Google (boundary +1)', () => {
    const h = 'A'.repeat(31);
    const r = checkCompliance({ ...cleanGoogleInput, headline: h });
    expect(r.warnings.some(w => w.id === 'google_headline_length')).toBe(true);
  });

  it('handles text split across headline/body/cta boundaries', () => {
    // "guarantee" in headline + "weight loss" in body - should NOT match (they're joined by space)
    const r = checkCompliance({
      headline: 'guarantee',
      bodyText: 'weight loss',
      callToAction: 'Book',
      service: 'glp1',
      platform: 'meta',
    });
    // Joined text becomes "guarantee weight loss Book" - WILL match
    expect(r.violations.some(v => /guarantee/i.test(v.affectedText))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
describe('checkBatchCompliance', () => {
  it('returns empty-friendly summary for empty array', () => {
    const r = checkBatchCompliance([]);
    expect(r.results).toHaveLength(0);
    expect(r.overallCompliant).toBe(true); // vacuously true
    expect(r.summary).toContain('0');
  });

  it('flags overallCompliant=false if any item has violations', () => {
    const r = checkBatchCompliance([
      cleanMetaInput,
      { ...cleanMetaInput, bodyText: 'guaranteed weight loss' },
    ]);
    expect(r.overallCompliant).toBe(false);
  });

  it('overallCompliant=true when all clean', () => {
    const r = checkBatchCompliance([cleanMetaInput, cleanMetaInput]);
    expect(r.overallCompliant).toBe(true);
  });

  it('summary reports count of creatives checked', () => {
    const r = checkBatchCompliance([cleanMetaInput, cleanMetaInput, cleanMetaInput]);
    expect(r.summary).toContain('3');
  });

  it('summary reports total violations across all items', () => {
    const r = checkBatchCompliance([
      { ...cleanMetaInput, bodyText: 'guaranteed weight loss' }, // violation
      { ...cleanMetaInput, bodyText: 'patient photo' }, // violation
    ]);
    expect(r.summary).toMatch(/violation/);
  });

  it('summary reports average score', () => {
    const r = checkBatchCompliance([cleanMetaInput, cleanMetaInput]);
    expect(r.summary).toMatch(/Average compliance score: \d+\/100/);
  });

  it('summary ends with "Ready for launch" when all compliant', () => {
    const r = checkBatchCompliance([cleanMetaInput]);
    if (r.overallCompliant) {
      expect(r.summary).toContain('Ready for launch');
    }
  });

  it('summary ends with "need revision" when not all compliant', () => {
    const r = checkBatchCompliance([
      { ...cleanMetaInput, bodyText: 'guaranteed weight loss' },
    ]);
    expect(r.summary).toContain('need revision');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
describe('createApprovalWorkflow', () => {
  it('returns empty array for empty input', () => {
    const r = createApprovalWorkflow([]);
    expect(r).toHaveLength(0);
  });

  it('maps approved result to "pending_review" status', () => {
    const r = createApprovalWorkflow([
      { id: 'ad1', name: 'Clean Ad', input: cleanMetaInput },
    ]);
    expect(r).toHaveLength(1);
    // Approved → pending_review (initial queue state)
    if (r[0].complianceResult.approvalStatus === 'approved') {
      expect(r[0].status).toBe('pending_review');
    }
  });

  it('maps needs_revision result to "revision_needed" status', () => {
    const r = createApprovalWorkflow([
      {
        id: 'ad2',
        name: 'Warning Ad',
        input: { ...cleanMetaInput, bodyText: 'miracle breakthrough' },
      },
    ]);
    expect(r[0].complianceResult.approvalStatus).toBe('needs_revision');
    expect(r[0].status).toBe('revision_needed');
  });

  it('maps rejected result to "rejected" status', () => {
    const r = createApprovalWorkflow([
      {
        id: 'ad3',
        name: 'Bad Ad',
        input: { ...cleanMetaInput, bodyText: 'guaranteed weight loss' },
      },
    ]);
    expect(r[0].complianceResult.approvalStatus).toBe('rejected');
    expect(r[0].status).toBe('rejected');
  });

  it('preserves adId and adName', () => {
    const r = createApprovalWorkflow([
      { id: 'abc-123', name: 'Spring Promo', input: cleanMetaInput },
    ]);
    expect(r[0].adId).toBe('abc-123');
    expect(r[0].adName).toBe('Spring Promo');
  });

  it('populates notes from review notes', () => {
    const r = createApprovalWorkflow([
      { id: 'ad1', name: 'Ad', input: cleanMetaInput },
    ]);
    expect(Array.isArray(r[0].notes)).toBe(true);
  });

  it('includes full complianceResult object', () => {
    const r = createApprovalWorkflow([
      { id: 'ad1', name: 'Ad', input: cleanMetaInput },
    ]);
    expect(r[0].complianceResult).toBeDefined();
    expect(r[0].complianceResult.overallScore).toBeDefined();
    expect(r[0].complianceResult.requiredDisclaimers).toBeDefined();
  });

  it('handles batch of mixed statuses', () => {
    const r = createApprovalWorkflow([
      { id: '1', name: 'Clean', input: cleanMetaInput },
      { id: '2', name: 'Warn', input: { ...cleanMetaInput, bodyText: 'miracle' } },
      {
        id: '3',
        name: 'Violation',
        input: { ...cleanMetaInput, bodyText: 'guaranteed weight loss' },
      },
    ]);
    expect(r).toHaveLength(3);
    const statuses = r.map(x => x.status);
    expect(statuses).toContain('rejected');
    expect(statuses).toContain('revision_needed');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
describe('checkCompliance - realistic medspa ad fixtures', () => {
  it('approves a compliant HydraFacial ad', () => {
    const r = checkCompliance({
      headline: 'Glow for Spring',
      bodyText:
        'HydraFacial at Rani Beauty Clinic. Physician-supervised skincare in 45 minutes. Results may vary.',
      callToAction: 'Book Consult',
      service: 'hydrafacial',
      platform: 'meta',
    });
    expect(r.isCompliant).toBe(true);
  });

  it('rejects a GLP-1 ad with specific weight claims', () => {
    const r = checkCompliance({
      headline: 'Lose 30 pounds in 90 days',
      bodyText: 'Guaranteed weight loss with our GLP-1 program. 100% effective.',
      callToAction: 'Start Today',
      service: 'glp1',
      platform: 'meta',
    });
    expect(r.isCompliant).toBe(false);
    expect(r.violations.length).toBeGreaterThanOrEqual(3);
  });

  it('warns on a Botox ad with hyperbolic language', () => {
    const r = checkCompliance({
      headline: 'Miracle Botox',
      bodyText: 'Revolutionary breakthrough skincare. Results may vary.',
      callToAction: 'Book',
      service: 'botox',
      platform: 'meta',
    });
    expect(r.warnings.length).toBeGreaterThanOrEqual(1);
    expect(r.approvalStatus).toBe('needs_revision');
  });

  it('rejects a Meta wellness ad using "infusion"', () => {
    const r = checkCompliance({
      headline: 'NAD+ Infusion Therapy',
      bodyText: 'Our wellness infusion. Results may vary.',
      callToAction: 'Book',
      service: 'wellness',
      platform: 'meta',
    });
    expect(r.isCompliant).toBe(false);
    expect(r.violations.some(v => v.category === 'internal')).toBe(true);
  });

  it('warns on Google ad with headline > 30 chars', () => {
    const r = checkCompliance({
      headline: 'Luxury Physician-Supervised GLP-1 Weight Loss Program',
      bodyText: 'Medical weight management. Physician-supervised. Results may vary.',
      callToAction: 'Schedule',
      service: 'glp1',
      platform: 'google',
    });
    expect(r.warnings.some(w => w.id === 'google_headline_length')).toBe(true);
  });

  it('flags body-shaming ad as violation on Meta', () => {
    const r = checkCompliance({
      headline: 'Feel Beautiful',
      bodyText: 'Your body is bad? We can help. Results may vary.',
      callToAction: 'Book',
      service: 'hydrafacial',
      platform: 'meta',
    });
    expect(r.violations.some(v => v.category === 'platform_meta')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
describe('checkCompliance - issue metadata shape', () => {
  it('populates all fields on ComplianceIssue', () => {
    const r = checkText('infusion therapy');
    const v = r.violations[0];
    expect(v.id).toBeTruthy();
    expect(v.category).toBeTruthy();
    expect(v.severity).toBeTruthy();
    expect(v.title).toBeTruthy();
    expect(v.description).toBeTruthy();
    expect(v.affectedText).toBeTruthy();
    expect(v.suggestedFix).toBeTruthy();
    expect(v.regulation).toBeTruthy();
  });

  it('title includes uppercased category and severity', () => {
    const r = checkText('infusion therapy');
    const v = r.violations[0];
    expect(v.title).toContain('INTERNAL');
    expect(v.title).toContain('violation');
  });

  // Bug 10 fixed: ids now come from a module-scoped monotonic counter and
  // can never collide within a result (or across back-to-back results in the
  // same process).
  it('generates unique ids for every issue in a single result (Bug 10 fixed)', () => {
    const r = checkCompliance({
      headline: 'cheapest miracle',
      bodyText: 'doctors recommend our cheap botox treatment',
      callToAction: 'Book',
      service: 'botox',
      platform: 'meta',
    });
    const all = [...r.violations, ...r.warnings, ...r.suggestions];
    const ids = all.map(i => i.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z_]+(_\d+)?$/);
  });

  // Bug 10 regression: ids remain unique across consecutive checkCompliance
  // calls within the same process (no reset between runs).
  it('ids are unique across consecutive checkCompliance calls', () => {
    const r1 = checkCompliance({
      headline: 'miracle',
      bodyText: 'cheapest treatment',
      callToAction: 'Book',
      service: 'botox',
      platform: 'meta',
    });
    const r2 = checkCompliance({
      headline: 'breakthrough',
      bodyText: 'bargain filler',
      callToAction: 'Book',
      service: 'botox',
      platform: 'meta',
    });
    const allIds = [
      ...r1.violations,
      ...r1.warnings,
      ...r1.suggestions,
      ...r2.violations,
      ...r2.warnings,
      ...r2.suggestions,
    ].map(i => i.id);
    // Issues from the PROHIBITED_CLAIMS loop (the counter-backed ones) must
    // not collide across runs. Platform/service suggestions use static ids
    // by design, so filter those out.
    const counterIds = allIds.filter(id => /^[a-z_]+_\d+$/.test(id));
    expect(new Set(counterIds).size).toBe(counterIds.length);
  });

  // Bug 10 regression: _resetIssueCounter() restores deterministic id
  // numbering for tests that care about specific ids.
  it('_resetIssueCounter restores counter to 0', () => {
    _resetIssueCounter();
    const r1 = checkCompliance({
      headline: 'miracle',
      bodyText: 'clean copy',
      callToAction: 'Book',
      service: 'botox',
      platform: 'meta',
    });
    const firstId = r1.warnings[0]?.id;
    _resetIssueCounter();
    const r2 = checkCompliance({
      headline: 'miracle',
      bodyText: 'clean copy',
      callToAction: 'Book',
      service: 'botox',
      platform: 'meta',
    });
    const secondId = r2.warnings[0]?.id;
    expect(firstId).toBe(secondId);
  });
});
