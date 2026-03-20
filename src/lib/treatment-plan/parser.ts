// AI Output Parsing Engine
//
// Parses the AI-generated programPlan, costBreakdown, and timeline
// fields into structured data for treatment plan rendering.
//
// Extracted from TreatmentPlanClient.tsx for testability.

/* ═══════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════ */

export interface PlanData {
  id: string;
  clientName: string;
  firstName: string;
  email: string;
  phone: string;
  skinConcerns: string[];
  targetAreas: string[];
  treatmentInterests: string[];
  skinType: string;
  treatmentHistory: string;
  processingStatus: string;
  intakeSummary: string | null;
  programPlan: string | null;
  costBreakdown: string | null;
  timeline: string | null;
  suggestedNextStep: string | null;
  treatmentValue: string | null;
  skinHealthScore: number | null;
  projectedScore: number | null;
  intelligenceReady: boolean;
}

export interface ParsedTreatment {
  name: string;
  sessions: number;
  pricePerSession: number;
  total: number;
  category: string;
  duration: string;
}

export interface ParsedPhase {
  title: string;
  weekRange: string;
  description: string;
  treatments: string[];
}

export interface LineItem {
  service: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface TreatmentPackage {
  tier: string;
  name: string;
  price: number;
  sessions: number;
  lineItems: LineItem[];
  extras: string[];
  highlight?: boolean;
  savings?: string;
  monthlyPayment: number;
}

/* ═══════════════════════════════════════════════════════════════
   Service Catalog
   ═══════════════════════════════════════════════════════════════ */

export const SERVICE_CATALOG: Record<string, { price: number; duration: string; category: string }> = {
  'sofwave': { price: 2750, duration: '60 min', category: 'Skin Tightening' },
  'sofwave full face': { price: 2750, duration: '60 min', category: 'Skin Tightening' },
  'sofwave full face + neck': { price: 4500, duration: '90 min', category: 'Skin Tightening' },
  'hydrafacial': { price: 275, duration: '60 min', category: 'Facial' },
  'hydrafacial signature': { price: 275, duration: '60 min', category: 'Facial' },
  'hydrafacial platinum': { price: 350, duration: '75 min', category: 'Facial' },
  'rf microneedling': { price: 495, duration: '75 min', category: 'Skin Renewal' },
  'rf microneedling face': { price: 495, duration: '75 min', category: 'Skin Renewal' },
  'rf microneedling face + neck': { price: 650, duration: '90 min', category: 'Skin Renewal' },
  'vi peel': { price: 395, duration: '45 min', category: 'Chemical Peel' },
  'vi peel purify': { price: 395, duration: '45 min', category: 'Chemical Peel' },
  'vi peel precision plus': { price: 450, duration: '45 min', category: 'Chemical Peel' },
  'prx-t33': { price: 495, duration: '30 min', category: 'Biorevitalization' },
  'prx': { price: 495, duration: '30 min', category: 'Biorevitalization' },
  'picoway': { price: 450, duration: '45 min', category: 'Laser' },
  'picoway laser': { price: 450, duration: '45 min', category: 'Laser' },
  'botox': { price: 350, duration: '30 min', category: 'Injectables' },
  'dermal fillers': { price: 650, duration: '45 min', category: 'Injectables' },
  'filler': { price: 650, duration: '45 min', category: 'Injectables' },
  'laser hair removal': { price: 225, duration: '30 min', category: 'Laser' },
  'glp-1': { price: 499, duration: '30 min', category: 'Wellness' },
  'glp-1 program': { price: 499, duration: '30 min', category: 'Wellness' },
  'vitamin d3': { price: 50, duration: '15 min', category: 'Wellness' },
  'vitamin injection': { price: 50, duration: '15 min', category: 'Wellness' },
  'b12': { price: 35, duration: '15 min', category: 'Wellness' },
  'b12 injection': { price: 35, duration: '15 min', category: 'Wellness' },
  'nad+': { price: 250, duration: '30 min', category: 'Wellness' },
  'nad+ injection': { price: 250, duration: '30 min', category: 'Wellness' },
  'glutathione': { price: 100, duration: '15 min', category: 'Wellness' },
  'glutathione mega': { price: 100, duration: '15 min', category: 'Wellness' },
  'tri-immune': { price: 75, duration: '15 min', category: 'Wellness' },
  'tri-immune boost': { price: 75, duration: '15 min', category: 'Wellness' },
  'tretinoin': { price: 99, duration: '—', category: 'Rx Skincare' },
  'tretinoin 0.05%': { price: 99, duration: '—', category: 'Rx Skincare' },
  'medical-grade skincare kit': { price: 195, duration: '—', category: 'Skincare' },
  'skincare kit': { price: 195, duration: '—', category: 'Skincare' },
  'rx skincare protocol': { price: 99, duration: '—', category: 'Rx Skincare' },
  'glow stack': { price: 75, duration: '15 min', category: 'Wellness' },
  'glow stack vitamins': { price: 75, duration: '15 min', category: 'Wellness' },
  'folix hair restoration': { price: 500, duration: '60 min', category: 'Hair' },
  'consultation': { price: 0, duration: '30 min', category: 'Consultation' },
  'skin consultation': { price: 0, duration: '30 min', category: 'Consultation' },
  'dermaplaning': { price: 150, duration: '30 min', category: 'Facial' },
};

/** Match a treatment name from AI text to our catalog */
export function matchService(text: string): { key: string; catalog: { price: number; duration: string; category: string } } | null {
  const lower = text.toLowerCase().trim();

  // Direct match
  if (SERVICE_CATALOG[lower]) {
    return { key: lower, catalog: SERVICE_CATALOG[lower] };
  }

  // Fuzzy match — find the longest catalog key that appears in the text
  let bestMatch: { key: string; catalog: { price: number; duration: string; category: string } } | null = null;
  let bestLen = 0;

  for (const [key, val] of Object.entries(SERVICE_CATALOG)) {
    if (lower.includes(key) && key.length > bestLen) {
      bestMatch = { key, catalog: val };
      bestLen = key.length;
    }
  }

  return bestMatch;
}

/** Parse the AI cost breakdown text into structured line items */
export function parseCostBreakdown(costText: string | null): ParsedTreatment[] {
  if (!costText) return [];

  const treatments: ParsedTreatment[] = [];
  const seen = new Set<string>();

  // Split by lines and look for pricing patterns
  const lines = costText.split('\n').filter(l => l.trim());

  for (const line of lines) {
    // Pattern: "Service Name: $X,XXX" or "Service Name ($XXX)" or "Service x N: $X,XXX"
    // Also handles: "- Service Name: $X per session x N sessions = $X,XXX"
    const priceMatch = line.match(/\$[\d,]+(?:\.\d{2})?/g);
    if (!priceMatch || priceMatch.length === 0) continue;

    // Extract the service name (text before the first dollar sign)
    const nameSection = line.split('$')[0]
      .replace(/^[-•*\d.)\s]+/, '') // Remove leading bullets/numbers
      .replace(/[:=–—]+\s*$/, '') // Remove trailing colons/dashes
      .trim();

    if (!nameSection || nameSection.length < 2) continue;

    // Skip subtotal/summary/aggregate lines early
    if (/total|subtotal|grand|sum|discount|savings|package|program|investment|maintenance plan|estimated|overall|combined|with \d+-month/i.test(nameSection)) continue;
    // Skip lines that are clearly headers or section labels (no specific treatment)
    if (/^(core|phase|step|option|tier|plan|monthly|annual|weekly)\b/i.test(nameSection.trim())) continue;

    // Try to match to catalog
    const match = matchService(nameSection);

    // Parse quantity
    const qtyMatch = line.match(/x\s*(\d+)|(\d+)\s*(?:sessions?|treatments?|visits?|months?)/i);
    const qty = qtyMatch ? parseInt(qtyMatch[1] || qtyMatch[2], 10) : 1;

    // Parse prices
    const prices = priceMatch.map(p => parseInt(p.replace(/[$,]/g, ''), 10)).filter(p => !isNaN(p));

    // Use the largest price as total, or calculate from unit price
    const total = prices.length > 1 ? Math.max(...prices) : prices[0] || 0;

    // Skip lines with suspiciously high values that look like aggregates (> $5000 per individual item without catalog match)
    if (!match && total > 5000) continue;

    const unitPrice = match?.catalog.price || (qty > 1 ? Math.round(total / qty) : total);

    // Clean up the display name
    let displayName = nameSection
      .replace(/\s*x\s*\d+/i, '')
      .replace(/\s*\(\d+\s*(?:sessions?|treatments?)\)/i, '')
      .trim();

    // Capitalize first letter of each word
    displayName = displayName.replace(/\b\w/g, c => c.toUpperCase());

    // Skip if we already have this treatment or if it's a total/subtotal line (second check after cleanup)
    const normName = displayName.toLowerCase();
    if (seen.has(normName)) continue;
    if (/total|subtotal|grand|sum|discount|savings|package|investment|maintenance plan/i.test(normName)) continue;

    seen.add(normName);

    treatments.push({
      name: displayName,
      sessions: qty,
      pricePerSession: unitPrice,
      total: total || unitPrice * qty,
      category: match?.catalog.category || 'Treatment',
      duration: match?.catalog.duration || '45 min',
    });
  }

  return treatments;
}

/** Parse the AI program plan into structured phases */
export function parseProgramPlan(planText: string | null): { phases: ParsedPhase[]; highlights: string[] } {
  if (!planText) return { phases: [], highlights: [] };

  const phases: ParsedPhase[] = [];
  const highlights: string[] = [];

  // Try to split by phase/step/week markers
  const phasePatterns = [
    /(?:Phase|Step|Stage)\s*(\d+)[:\s-]*/gi,
    /(?:Week|Weeks?)\s*(\d+(?:\s*[-–]\s*\d+)?)[:\s-]*/gi,
    /(?:Month|Months?)\s*(\d+(?:\s*[-–]\s*\d+)?)[:\s-]*/gi,
  ];

  // Split text into paragraphs
  const paragraphs = planText.split(/\n\n+/).filter(p => p.trim());

  // Try to detect phases
  let currentPhase: { title: string; content: string; weekRange: string } | null = null;
  const detectedPhases: { title: string; content: string; weekRange: string }[] = [];

  for (const para of paragraphs) {
    let foundPhase = false;

    for (const pattern of phasePatterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(para);
      if (match) {
        if (currentPhase) detectedPhases.push(currentPhase);

        // Extract the title from the rest of the line
        const restOfLine = para.substring(match.index + match[0].length).split('\n')[0].trim();
        const title = restOfLine.replace(/^[-–:]\s*/, '').trim() || `Phase ${detectedPhases.length + 1}`;

        // Clean and truncate title
        let cleanTitle = title.replace(/\*+/g, '').trim();
        // Remove leading action verbs that come from AI narrative
        cleanTitle = cleanTitle.replace(/^(introduces|deploys|utilizes|begins|starts|initiates|applies|combines|features|includes|delivers|provides|targets)\s+/i, '').trim();
        // Remove verbose qualifiers after the service name
        cleanTitle = cleanTitle.replace(/\s+specifically\s+.*/i, '').trim();
        cleanTitle = cleanTitle.replace(/\s+calibrated\s+.*/i, '').trim();
        cleanTitle = cleanTitle.replace(/\s+designed\s+.*/i, '').trim();
        // If title is still too long, take first meaningful clause
        if (cleanTitle.length > 45) {
          const clauseMatch = cleanTitle.match(/^([^,.(]+)/);
          cleanTitle = clauseMatch ? clauseMatch[1].trim() : cleanTitle.substring(0, 45);
        }
        // Remove trailing prepositions/articles/connectors
        cleanTitle = cleanTitle.replace(/\s+(for|to|with|and|the|a|an|in|on|at|by|of|is|that|which)$/i, '').trim();
        // Capitalize first letter
        cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

        currentPhase = {
          title: cleanTitle,
          content: para,
          weekRange: match[0].trim().replace(/[:\s-]+$/, ''),
        };
        foundPhase = true;
        break;
      }
    }

    if (!foundPhase && currentPhase) {
      currentPhase.content += '\n\n' + para;
    } else if (!foundPhase && !currentPhase) {
      // First paragraph before any phase — treat as overview/highlight
      const sentences = para.split(/[.!]\s+/).filter(s => s.trim().length > 10);
      for (const s of sentences.slice(0, 3)) {
        highlights.push(s.trim().replace(/[.!]+$/, '') + '.');
      }
    }
  }

  if (currentPhase) detectedPhases.push(currentPhase);

  // Convert to ParsedPhases
  for (const dp of detectedPhases) {
    // Extract treatments mentioned in this phase
    const treatments: string[] = [];
    const lines = dp.content.split('\n').filter(l => l.trim());

    for (const line of lines) {
      // Lines starting with - or * or numbered items that mention treatments
      if (/^[-•*]\s+/.test(line.trim()) || /^\d+[.)]\s+/.test(line.trim())) {
        const cleaned = line.replace(/^[-•*\d.)]+\s*/, '').trim();
        if (cleaned.length > 5 && cleaned.length < 200) {
          treatments.push(cleaned.replace(/\*+/g, '').trim());
        }
      } else {
        // Check if line mentions any known service
        const match = matchService(line);
        if (match && !treatments.some(t => t.toLowerCase().includes(match.key))) {
          treatments.push(line.replace(/^[-•*\d.)]+\s*/, '').replace(/\*+/g, '').trim());
        }
      }
    }

    // Build description from non-treatment lines
    const descLines = lines.filter(l => {
      const cleaned = l.replace(/^[-•*\d.)]+\s*/, '').trim();
      return !treatments.includes(cleaned) && cleaned.length > 20 && !/^(Phase|Step|Stage|Week|Month)\s/i.test(cleaned);
    });
    const description = descLines.slice(0, 2).map(l => l.replace(/\*+/g, '').trim()).join(' ').substring(0, 250);

    phases.push({
      title: dp.title.substring(0, 60),
      weekRange: dp.weekRange,
      description: description || `Targeted treatments for optimal results.`,
      treatments: treatments.length > 0 ? treatments : ['Treatment session as prescribed'],
    });
  }

  // If no phases were detected, create a single phase from the entire plan
  if (phases.length === 0 && planText.trim()) {
    const allTreatments: string[] = [];
    const lines = planText.split('\n').filter(l => l.trim());

    for (const line of lines) {
      if (/^[-•*]\s+/.test(line.trim()) || /^\d+[.)]\s+/.test(line.trim())) {
        const cleaned = line.replace(/^[-•*\d.)]+\s*/, '').replace(/\*+/g, '').trim();
        if (cleaned.length > 5 && cleaned.length < 200) {
          allTreatments.push(cleaned);
        }
      }
    }

    if (allTreatments.length > 0) {
      // Split treatments into 3 phases
      const chunkSize = Math.ceil(allTreatments.length / 3);
      const chunks = [
        allTreatments.slice(0, chunkSize),
        allTreatments.slice(chunkSize, chunkSize * 2),
        allTreatments.slice(chunkSize * 2),
      ].filter(c => c.length > 0);

      const phaseNames = ['Foundation & Assessment', 'Active Treatment', 'Enhancement & Maintenance'];
      const phaseWeeks = ['Week 1-4', 'Week 5-10', 'Week 11+'];

      chunks.forEach((chunk, i) => {
        phases.push({
          title: phaseNames[i] || `Phase ${i + 1}`,
          weekRange: phaseWeeks[i] || `Phase ${i + 1}`,
          description: 'Targeted treatments designed for your specific concerns.',
          treatments: chunk,
        });
      });
    } else {
      // Fallback — use the text as a single phase description
      const firstSentences = planText.split(/[.!]\s+/).slice(0, 3).join('. ') + '.';
      phases.push({
        title: 'Your Treatment Protocol',
        weekRange: 'Weeks 1-12',
        description: firstSentences.substring(0, 250),
        treatments: ['Personalized treatment sessions as outlined above'],
      });
    }

    // Extract highlights from the beginning
    if (highlights.length === 0) {
      const sentences = planText.split(/[.!]\s+/).filter(s => s.trim().length > 15);
      for (const s of sentences.slice(0, 3)) {
        highlights.push(s.trim().replace(/[.!]+$/, '') + '.');
      }
    }
  }

  return { phases, highlights };
}

/** Parse AI timeline text into structured appointment data */
export function parseTimeline(timelineText: string | null): { week: string; description: string }[] {
  if (!timelineText) return [];

  const entries: { week: string; description: string }[] = [];
  const lines = timelineText.split('\n').filter(l => l.trim());

  for (const line of lines) {
    // Match "Week X:" or "Month X:" or "Week X-Y:" patterns
    const weekMatch = line.match(/(?:Week|Weeks?|Month|Months?)\s*(\d+(?:\s*[-–]\s*\d+)?)/i);
    if (weekMatch) {
      const weekLabel = weekMatch[0].replace(/\s*[-–:]\s*$/, '').trim();
      const desc = line.substring(line.indexOf(weekMatch[0]) + weekMatch[0].length)
        .replace(/^[\s:–-]+/, '')
        .replace(/\*+/g, '')
        .trim();
      if (desc.length > 5) {
        entries.push({ week: weekLabel, description: desc });
      }
    }
  }

  return entries;
}

/** Extract total plan value from AI cost breakdown or treatmentValue */
export function extractTotalValue(plan: PlanData): number {
  // Try treatmentValue first
  if (plan.treatmentValue) {
    const match = plan.treatmentValue.match(/\$[\d,]+/);
    if (match) return parseInt(match[0].replace(/[$,]/g, ''), 10);
  }

  // Try costBreakdown — look for total/grand total line
  if (plan.costBreakdown) {
    const lines = plan.costBreakdown.split('\n');
    for (const line of lines.reverse()) {
      if (/total|grand|estimated|investment|program/i.test(line)) {
        const match = line.match(/\$[\d,]+/);
        if (match) return parseInt(match[0].replace(/[$,]/g, ''), 10);
      }
    }
    // Fall back to largest dollar amount
    const allPrices = plan.costBreakdown.match(/\$[\d,]+/g);
    if (allPrices) {
      const values = allPrices.map(p => parseInt(p.replace(/[$,]/g, ''), 10));
      return Math.max(...values);
    }
  }

  return 0;
}

/** Build 3-tier treatment packages from AI output */
export function buildPackagesFromAI(plan: PlanData): TreatmentPackage[] {
  const parsedTreatments = parseCostBreakdown(plan.costBreakdown);

  if (parsedTreatments.length === 0) {
    // If we can't parse cost breakdown, try extracting from programPlan
    return buildFallbackPackages(plan);
  }

  // Build the "Recommended" package from the actual AI output
  const recommendedItems: LineItem[] = parsedTreatments.map(t => ({
    service: t.name,
    qty: t.sessions,
    unitPrice: t.pricePerSession,
    total: t.total,
  }));

  const recommendedTotal = recommendedItems.reduce((s, i) => s + i.total, 0);
  const totalFromAI = extractTotalValue(plan);
  const recommendedPrice = totalFromAI > 0 ? totalFromAI : recommendedTotal;

  // Build Essential (subset ~40-50% of recommended)
  const essentialItems: LineItem[] = [];
  let essentialBudget = Math.round(recommendedPrice * 0.35);

  // Always include consultation
  essentialItems.push({
    service: 'Comprehensive Consultation',
    qty: 1,
    unitPrice: 0,
    total: 0,
  });

  // Add the most impactful treatments up to budget
  const sortedByImpact = [...parsedTreatments].sort((a, b) => {
    // Prioritize treatments with lower per-session cost (entry-level)
    return a.pricePerSession - b.pricePerSession;
  });

  for (const t of sortedByImpact) {
    const singleSession = { service: t.name, qty: 1, unitPrice: t.pricePerSession, total: t.pricePerSession };
    if (essentialBudget >= t.pricePerSession) {
      essentialItems.push(singleSession);
      essentialBudget -= t.pricePerSession;
    }
  }

  const essentialTotal = essentialItems.reduce((s, i) => s + i.total, 0);

  // Build Platinum (recommended + enhancements ~130-150%)
  const platinumItems: LineItem[] = parsedTreatments.map(t => ({
    service: t.name,
    qty: Math.min(t.sessions + Math.ceil(t.sessions * 0.5), t.sessions + 3),
    unitPrice: t.pricePerSession,
    total: t.pricePerSession * Math.min(t.sessions + Math.ceil(t.sessions * 0.5), t.sessions + 3),
  }));

  // Add premium extras to Platinum
  const premiumExtras = [
    { service: 'Medical-Grade Skincare Kit', price: 195 },
    { service: 'Glow Stack Vitamins x4', price: 300 },
  ];

  for (const extra of premiumExtras) {
    if (!platinumItems.some(i => i.service.toLowerCase().includes(extra.service.toLowerCase().split(' ')[0]))) {
      platinumItems.push({
        service: extra.service,
        qty: 1,
        unitPrice: extra.price,
        total: extra.price,
      });
    }
  }

  const platinumTotal = platinumItems.reduce((s, i) => s + i.total, 0);
  // Apply discount but ensure Platinum is always MORE than Recommended
  const minPlatinumPrice = Math.round(recommendedPrice * 1.25); // At least 25% above Recommended
  let platinumPrice = Math.round(platinumTotal * 0.87); // 13% package discount
  if (platinumPrice < minPlatinumPrice) {
    platinumPrice = minPlatinumPrice;
  }
  const platinumSavings = platinumTotal - platinumPrice;

  const countSessions = (items: LineItem[]) => items.filter(i => i.unitPrice > 0).reduce((s, i) => s + i.qty, 0);

  return [
    {
      tier: 'Essential',
      name: 'Get Started',
      price: essentialTotal,
      sessions: countSessions(essentialItems),
      lineItems: essentialItems.filter(i => i.unitPrice > 0),
      extras: ['Custom treatment plan', 'Aftercare protocol'],
      monthlyPayment: Math.round(essentialTotal / 3) || 99,
    },
    {
      tier: 'Recommended',
      name: 'Best Results',
      price: recommendedPrice,
      sessions: countSessions(recommendedItems),
      lineItems: recommendedItems,
      extras: ['Priority scheduling', 'Aftercare protocol', 'Progress tracking'],
      highlight: true,
      savings: recommendedTotal > recommendedPrice ? `Save $${(recommendedTotal - recommendedPrice).toLocaleString()}` : undefined,
      monthlyPayment: Math.round(recommendedPrice / 12) || 199,
    },
    {
      tier: 'Platinum',
      name: 'Total Transformation',
      price: platinumPrice,
      sessions: countSessions(platinumItems),
      lineItems: platinumItems,
      extras: ['Priority scheduling', 'Dedicated treatment coordinator', 'Medical-grade skincare protocol', 'Progress tracking'],
      savings: platinumSavings > 0 ? `Save $${platinumSavings.toLocaleString()}` : undefined,
      monthlyPayment: Math.round(platinumPrice / 18) || 299,
    },
  ];
}

/** Fallback when we can't parse cost breakdown — extract treatments from programPlan */
export function buildFallbackPackages(plan: PlanData): TreatmentPackage[] {
  const text = plan.programPlan || plan.intakeSummary || '';
  const found: ParsedTreatment[] = [];
  const seen = new Set<string>();

  // Scan for any known service mentions
  for (const [key, catalog] of Object.entries(SERVICE_CATALOG)) {
    if (text.toLowerCase().includes(key) && !seen.has(catalog.category + key)) {
      seen.add(catalog.category + key);
      const displayName = key.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      found.push({
        name: displayName,
        sessions: 1,
        pricePerSession: catalog.price,
        total: catalog.price,
        category: catalog.category,
        duration: catalog.duration,
      });
    }
  }

  if (found.length === 0) {
    // Ultimate fallback — construct from concerns/interests
    const concerns = [...plan.skinConcerns, ...plan.targetAreas].join(' ').toLowerCase();
    const interests = plan.treatmentInterests.join(' ').toLowerCase();
    const combined = concerns + ' ' + interests;

    // Map general concerns to treatments
    if (/dry|hydrat|moisture/i.test(combined)) {
      found.push({ name: 'HydraFacial Signature', sessions: 3, pricePerSession: 275, total: 825, category: 'Facial', duration: '60 min' });
    }
    if (/acne|breakout|pore|congestion|oily/i.test(combined)) {
      found.push({ name: 'VI Peel Purify', sessions: 2, pricePerSession: 395, total: 790, category: 'Chemical Peel', duration: '45 min' });
      found.push({ name: 'HydraFacial Signature', sessions: 2, pricePerSession: 275, total: 550, category: 'Facial', duration: '60 min' });
    }
    if (/texture|scar|rough|uneven/i.test(combined)) {
      found.push({ name: 'RF Microneedling Face', sessions: 3, pricePerSession: 495, total: 1485, category: 'Skin Renewal', duration: '75 min' });
      found.push({ name: 'PRX-T33', sessions: 3, pricePerSession: 495, total: 1485, category: 'Biorevitalization', duration: '30 min' });
    }
    if (/aging|wrinkle|fine line|sag|lax|lift|tighten/i.test(combined)) {
      found.push({ name: 'Sofwave Full Face', sessions: 1, pricePerSession: 2750, total: 2750, category: 'Skin Tightening', duration: '60 min' });
      found.push({ name: 'RF Microneedling Face', sessions: 3, pricePerSession: 495, total: 1485, category: 'Skin Renewal', duration: '75 min' });
    }
    if (/pigment|dark spot|melasma|discolor|hyperpigment/i.test(combined)) {
      found.push({ name: 'PicoWay Laser', sessions: 3, pricePerSession: 450, total: 1350, category: 'Laser', duration: '45 min' });
      found.push({ name: 'VI Peel Precision Plus', sessions: 2, pricePerSession: 450, total: 900, category: 'Chemical Peel', duration: '45 min' });
    }
    if (/hair.*remov|unwanted.*hair/i.test(combined)) {
      found.push({ name: 'Laser Hair Removal', sessions: 6, pricePerSession: 225, total: 1350, category: 'Laser', duration: '30 min' });
    }
    if (/weight|glp|slim|body/i.test(combined)) {
      found.push({ name: 'GLP-1 Program', sessions: 3, pricePerSession: 499, total: 1497, category: 'Wellness', duration: '30 min' });
    }
    if (/vitamin|wellness|boost|immune|energy|fatigue/i.test(combined)) {
      found.push({ name: 'Tri-Immune Boost', sessions: 4, pricePerSession: 75, total: 300, category: 'Wellness', duration: '15 min' });
      found.push({ name: 'B12 Injection', sessions: 4, pricePerSession: 35, total: 140, category: 'Wellness', duration: '15 min' });
    }

    // If still nothing, add a general consultation + HydraFacial
    if (found.length === 0) {
      found.push({ name: 'HydraFacial Signature', sessions: 3, pricePerSession: 275, total: 825, category: 'Facial', duration: '60 min' });
      found.push({ name: 'VI Peel Purify', sessions: 2, pricePerSession: 395, total: 790, category: 'Chemical Peel', duration: '45 min' });
      found.push({ name: 'PRX-T33', sessions: 2, pricePerSession: 495, total: 990, category: 'Biorevitalization', duration: '30 min' });
    }
  }

  // Now build 3-tier packages from found treatments
  const recommendedItems: LineItem[] = found.map(t => ({
    service: t.name,
    qty: t.sessions,
    unitPrice: t.pricePerSession,
    total: t.total,
  }));

  const recommendedTotal = recommendedItems.reduce((s, i) => s + i.total, 0);

  // Essential — reduced subset
  const essentialItems: LineItem[] = found.slice(0, 2).map(t => ({
    service: t.name,
    qty: 1,
    unitPrice: t.pricePerSession,
    total: t.pricePerSession,
  }));
  const essentialTotal = essentialItems.reduce((s, i) => s + i.total, 0);

  // Platinum — expanded
  const platinumItems: LineItem[] = found.map(t => ({
    service: t.name,
    qty: t.sessions + Math.ceil(t.sessions * 0.5),
    unitPrice: t.pricePerSession,
    total: t.pricePerSession * (t.sessions + Math.ceil(t.sessions * 0.5)),
  }));
  const platinumRaw = platinumItems.reduce((s, i) => s + i.total, 0);
  const platinumPrice = Math.round(platinumRaw * 0.85);

  const countSessions = (items: LineItem[]) => items.filter(i => i.unitPrice > 0).reduce((s, i) => s + i.qty, 0);

  return [
    {
      tier: 'Essential',
      name: 'Get Started',
      price: essentialTotal,
      sessions: countSessions(essentialItems),
      lineItems: essentialItems,
      extras: ['Custom treatment plan', 'Aftercare protocol'],
      monthlyPayment: Math.round(essentialTotal / 3) || 99,
    },
    {
      tier: 'Recommended',
      name: 'Best Results',
      price: recommendedTotal,
      sessions: countSessions(recommendedItems),
      lineItems: recommendedItems,
      extras: ['Priority scheduling', 'Aftercare protocol'],
      highlight: true,
      monthlyPayment: Math.round(recommendedTotal / 12) || 199,
    },
    {
      tier: 'Platinum',
      name: 'Total Transformation',
      price: platinumPrice,
      sessions: countSessions(platinumItems),
      lineItems: platinumItems,
      extras: ['Priority scheduling', 'Dedicated treatment coordinator', 'Aftercare protocol'],
      savings: `Save $${(platinumRaw - platinumPrice).toLocaleString()}`,
      monthlyPayment: Math.round(platinumPrice / 18) || 299,
    },
  ];
}
