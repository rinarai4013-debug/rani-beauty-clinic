'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Star,
  CheckCircle2,
  Clock,
  Shield,
  Heart,
  TrendingUp,
  Calendar,
  Phone,
  MapPin,
  Mail,
  ChevronRight,
  Award,
  Zap,
  Target,
  ArrowRight,
  CreditCard,
  Gift,
  User,
  Activity,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════ */

interface PlanData {
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

/* ═══════════════════════════════════════════════════════════════
   Animation variants
   ═══════════════════════════════════════════════════════════════ */

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay, ease: 'easeOut' as const },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (delay: number) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, delay, ease: 'easeOut' as const },
  }),
};

/* ═══════════════════════════════════════════════════════════════
   AI Output Parsing Engine

   Parses the AI-generated programPlan, costBreakdown, and timeline
   fields instead of hardcoded concern matching.
   ═══════════════════════════════════════════════════════════════ */

// Known Rani services with pricing for matching
const SERVICE_CATALOG: Record<string, { price: number; duration: string; category: string }> = {
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

interface ParsedTreatment {
  name: string;
  sessions: number;
  pricePerSession: number;
  total: number;
  category: string;
  duration: string;
}

interface ParsedPhase {
  title: string;
  weekRange: string;
  description: string;
  treatments: string[];
}

/** Match a treatment name from AI text to our catalog */
function matchService(text: string): { key: string; catalog: { price: number; duration: string; category: string } } | null {
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
function parseCostBreakdown(costText: string | null): ParsedTreatment[] {
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
function parseProgramPlan(planText: string | null): { phases: ParsedPhase[]; highlights: string[] } {
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
      // Lines starting with - or • or numbered items that mention treatments
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
function parseTimeline(timelineText: string | null): { week: string; description: string }[] {
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
function extractTotalValue(plan: PlanData): number {
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

/* ═══════════════════════════════════════════════════════════════
   Treatment Packages (AI-Parsed)
   ═══════════════════════════════════════════════════════════════ */

interface LineItem {
  service: string;
  qty: number;
  unitPrice: number;
  total: number;
}

interface TreatmentPackage {
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

function buildPackagesFromAI(plan: PlanData): TreatmentPackage[] {
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
function buildFallbackPackages(plan: PlanData): TreatmentPackage[] {
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

/* ═══════════════════════════════════════════════════════════════
   Roadmap Builder (AI-Parsed)
   ═══════════════════════════════════════════════════════════════ */

interface Appointment {
  number: number;
  weekLabel: string;
  date: string;
  dayOfWeek: string;
  time: string;
  treatments: string[];
  duration: string;
  notes?: string;
}

interface Phase {
  phase: number;
  title: string;
  duration: string;
  description: string;
  icon: typeof Sparkles;
  appointments: Appointment[];
}

function getNextClinicDate(startDate: Date, weekOffset: number, preferredDay: number): Date {
  const d = new Date(startDate);
  d.setDate(d.getDate() + weekOffset * 7);
  const currentDay = d.getDay();
  let diff = preferredDay - currentDay;
  if (diff < 0) diff += 7;
  d.setDate(d.getDate() + diff);
  if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  return d;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function buildRoadmapFromAI(plan: PlanData): Phase[] {
  const { phases: parsedPhases } = parseProgramPlan(plan.programPlan);
  const timelineEntries = parseTimeline(plan.timeline);

  const startDate = new Date();
  if (startDate.getDay() === 0) startDate.setDate(startDate.getDate() + 1);
  if (startDate.getDay() === 6) startDate.setDate(startDate.getDate() + 2);

  const times = ['10:00 AM', '11:30 AM', '1:00 PM', '2:30 PM', '4:00 PM'];
  const preferredDays = [2, 3, 4, 2, 5, 3]; // Tue, Wed, Thu cycling
  const phaseIcons = [Target, Zap, TrendingUp, Star];

  let globalApptNum = 0;

  // If we have parsed phases from programPlan, use those
  if (parsedPhases.length > 0) {
    return parsedPhases.map((pp, phaseIdx) => {
      // Parse week range to get offset
      const weekMatch = pp.weekRange.match(/(\d+)/);
      const startWeek = weekMatch ? parseInt(weekMatch[1], 10) - 1 : phaseIdx * 4;

      // Build appointments for each treatment in this phase
      const appointments: Appointment[] = [];

      pp.treatments.forEach((treatment, tIdx) => {
        globalApptNum++;
        const weekOffset = startWeek + tIdx;
        const dayPref = preferredDays[(globalApptNum - 1) % preferredDays.length];
        const d = getNextClinicDate(startDate, weekOffset, dayPref);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        // Estimate duration from matched service
        const match = matchService(treatment);
        const duration = match?.catalog.duration || '60 min';

        // Truncate verbose treatment descriptions to a clean name
        let treatmentName = treatment;
        // Remove leading "Phase X" references and narrative verbs
        treatmentName = treatmentName.replace(/^Phase\s*\d+\s*/i, '').trim();
        treatmentName = treatmentName.replace(/^(introduces|deploys|utilizes|begins|starts|initiates|applies|combines|features|includes|delivers|provides|targets)\s+/i, '').trim();
        // Remove verbose qualifiers
        treatmentName = treatmentName.replace(/\s+specifically\s+calibrated\s+for\s+/i, ' — ').trim();
        if (treatmentName.length > 80) {
          // Try to extract just the service name (first sentence or up to first comma/parenthesis)
          const shortMatch = treatmentName.match(/^([^,(]+)/);
          treatmentName = shortMatch ? shortMatch[1].trim() : treatmentName.substring(0, 80) + '...';
        }
        // Capitalize first letter
        if (treatmentName.length > 0) {
          treatmentName = treatmentName.charAt(0).toUpperCase() + treatmentName.slice(1);
        }

        appointments.push({
          number: globalApptNum,
          weekLabel: `Week ${weekOffset + 1}`,
          date: formatDate(d),
          dayOfWeek: dayNames[d.getDay()],
          time: times[(globalApptNum - 1) % times.length],
          treatments: [treatmentName],
          duration,
        });
      });

      return {
        phase: phaseIdx + 1,
        title: pp.title,
        duration: pp.weekRange,
        description: pp.description,
        icon: phaseIcons[phaseIdx % phaseIcons.length],
        appointments,
      };
    });
  }

  // If we have timeline entries, convert those to phases
  if (timelineEntries.length > 0) {
    // Group timeline entries into 3-4 phases
    const chunkSize = Math.ceil(timelineEntries.length / 3);
    const chunks = [
      timelineEntries.slice(0, chunkSize),
      timelineEntries.slice(chunkSize, chunkSize * 2),
      timelineEntries.slice(chunkSize * 2),
    ].filter(c => c.length > 0);

    const phaseNames = ['Foundation & Prep', 'Active Treatment', 'Enhancement & Results', 'Maintenance'];

    return chunks.map((chunk, i) => {
      const appointments: Appointment[] = chunk.map((entry) => {
        globalApptNum++;
        const weekMatch = entry.week.match(/(\d+)/);
        const weekOffset = weekMatch ? parseInt(weekMatch[1], 10) - 1 : globalApptNum * 2;
        const dayPref = preferredDays[(globalApptNum - 1) % preferredDays.length];
        const d = getNextClinicDate(startDate, weekOffset, dayPref);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        return {
          number: globalApptNum,
          weekLabel: entry.week,
          date: formatDate(d),
          dayOfWeek: dayNames[d.getDay()],
          time: times[(globalApptNum - 1) % times.length],
          treatments: [entry.description],
          duration: '60 min',
        };
      });

      return {
        phase: i + 1,
        title: phaseNames[i] || `Phase ${i + 1}`,
        duration: chunk.length > 1 ? `${chunk[0].week} – ${chunk[chunk.length - 1].week}` : chunk[0].week,
        description: 'Targeted treatments designed for your specific goals.',
        icon: phaseIcons[i % phaseIcons.length],
        appointments,
      };
    });
  }

  // Final fallback — build from packages/treatments found
  const parsedTreatments = parseCostBreakdown(plan.costBreakdown);
  const treatmentNames = parsedTreatments.length > 0
    ? parsedTreatments.map(t => `${t.name}${t.sessions > 1 ? ` — Session 1 of ${t.sessions}` : ''}`)
    : ['Comprehensive Consultation + First Treatment'];

  return [
    {
      phase: 1,
      title: 'Assessment & First Treatment',
      duration: 'Week 1-2',
      description: 'Your comprehensive consultation and initial treatment session to establish your baseline and begin your transformation.',
      icon: Target,
      appointments: [{
        number: 1,
        weekLabel: 'Week 1',
        date: formatDate(getNextClinicDate(startDate, 0, 2)),
        dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][getNextClinicDate(startDate, 0, 2).getDay()],
        time: '10:00 AM',
        treatments: ['Comprehensive Consultation', treatmentNames[0] || 'Initial Assessment'],
        duration: '90 min',
      }],
    },
    {
      phase: 2,
      title: 'Active Treatment Phase',
      duration: 'Week 3-8',
      description: 'Your core treatment series targeting your primary concerns with advanced clinical protocols.',
      icon: Zap,
      appointments: treatmentNames.slice(0, 4).map((t, idx) => {
        globalApptNum = idx + 2;
        const d = getNextClinicDate(startDate, 2 + idx * 2, preferredDays[idx % preferredDays.length]);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return {
          number: globalApptNum,
          weekLabel: `Week ${3 + idx * 2}`,
          date: formatDate(d),
          dayOfWeek: dayNames[d.getDay()],
          time: times[idx % times.length],
          treatments: [t],
          duration: matchService(t)?.catalog.duration || '60 min',
        };
      }),
    },
    {
      phase: 3,
      title: 'Enhancement & Results',
      duration: 'Week 9-14',
      description: 'Advanced treatments to enhance and build on your initial results. Collagen remodeling reaches peak effect.',
      icon: TrendingUp,
      appointments: [{
        number: globalApptNum + 1,
        weekLabel: 'Week 10',
        date: formatDate(getNextClinicDate(startDate, 10, 3)),
        dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][getNextClinicDate(startDate, 10, 3).getDay()],
        time: '2:30 PM',
        treatments: ['Follow-up assessment + Enhancement session'],
        duration: '75 min',
      }],
    },
    {
      phase: 4,
      title: 'Maintenance & Longevity',
      duration: 'Ongoing',
      description: 'Monthly maintenance to sustain and protect your results. Your treatment coordinator will customize each visit.',
      icon: Star,
      appointments: [{
        number: globalApptNum + 2,
        weekLabel: 'Monthly',
        date: formatDate(getNextClinicDate(startDate, 18, 3)),
        dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][getNextClinicDate(startDate, 18, 3).getDay()],
        time: '11:30 AM',
        treatments: ['Monthly maintenance session + Progress evaluation'],
        duration: '60 min',
        notes: 'Enroll in Glow Membership for best value',
      }],
    },
  ];
}

/* ═══════════════════════════════════════════════════════════════
   Shimmer / Skeleton Component
   ═══════════════════════════════════════════════════════════════ */

function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-shimmer rounded bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:200%_100%] ${className}`}
      style={{ backgroundSize: '200% 100%' }}
    />
  );
}

function LoadingSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-3">
      <p className="text-sm uppercase tracking-widest text-[#C9A96E] font-semibold">{label}</p>
      <Shimmer className="h-4 w-full bg-[#0F1D2C]/10" />
      <Shimmer className="h-4 w-3/4 bg-[#0F1D2C]/10" />
      <Shimmer className="h-4 w-5/6 bg-[#0F1D2C]/10" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Score Ring Component
   ═══════════════════════════════════════════════════════════════ */

function ScoreRing({
  score,
  maxScore = 100,
  label,
  color,
  size = 140,
}: {
  score: number;
  maxScore?: number;
  label: string;
  color: string;
  size?: number;
}) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / maxScore) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(201,169,110,0.15)"
            strokeWidth="8"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            whileInView={{ strokeDashoffset: circumference - progress }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-heading text-3xl font-bold text-[#0F1D2C]">
            {score}
          </span>
        </div>
      </div>
      <span className="text-xs font-semibold uppercase tracking-widest text-[#0F1D2C]/60">
        {label}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Section Divider
   ═══════════════════════════════════════════════════════════════ */

function SectionDivider() {
  return (
    <div className="flex items-center justify-center py-8 print:py-4">
      <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#C9A96E]/40" />
      <div className="mx-4 h-1.5 w-1.5 rotate-45 bg-[#C9A96E]" />
      <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#C9A96E]/40" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   AI Plan Summary — Structured display of program plan
   ═══════════════════════════════════════════════════════════════ */

function PlanSummary({ plan }: { plan: PlanData }) {
  const { phases, highlights } = useMemo(() => parseProgramPlan(plan.programPlan), [plan.programPlan]);
  const totalValue = extractTotalValue(plan);
  const parsedTreatments = useMemo(() => parseCostBreakdown(plan.costBreakdown), [plan.costBreakdown]);
  const totalSessions = parsedTreatments.reduce((s, t) => s + t.sessions, 0);

  if (!plan.programPlan) {
    return <LoadingSkeleton label="Building Your Treatment Plan..." />;
  }

  return (
    <div className="space-y-6">
      {/* Plan highlights / overview */}
      {highlights.length > 0 && (
        <div className="space-y-3">
          {highlights.map((h, i) => (
            <p key={i} className="text-[#0F1D2C]/80 leading-relaxed text-base md:text-lg">
              {h}
            </p>
          ))}
        </div>
      )}

      {/* If no highlights, show a brief structured summary */}
      {highlights.length === 0 && phases.length > 0 && (
        <p className="text-[#0F1D2C]/80 leading-relaxed text-base md:text-lg">
          Your personalized program includes {phases.length} phases designed to address your specific concerns
          {parsedTreatments.length > 0 && ` with ${parsedTreatments.length} targeted treatments`}. Each phase builds
          on the results of the previous one for optimal outcomes.
        </p>
      )}

      {/* Phase summary pills */}
      {phases.length > 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {phases.map((p, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[#F8F6F1] border border-[#C9A96E]/10">
              <div className="w-7 h-7 rounded-lg bg-[#C9A96E]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-[#C9A96E]">{i + 1}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0F1D2C]">{p.title}</p>
                <p className="text-xs text-[#0F1D2C]/50">{p.weekRange}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Key metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-[#C9A96E]/10">
        <div className="text-center p-4 rounded-xl bg-[#F8F6F1]">
          <p className="font-heading text-2xl text-[#0F1D2C]">
            {totalValue > 0 ? `$${totalValue.toLocaleString()}` : '—'}
          </p>
          <p className="text-[10px] uppercase tracking-widest text-[#0F1D2C]/40 mt-1">Plan Value</p>
        </div>
        <div className="text-center p-4 rounded-xl bg-[#F8F6F1]">
          <p className="font-heading text-2xl text-[#0F1D2C]">
            {totalSessions > 0 ? totalSessions : parsedTreatments.length > 0 ? parsedTreatments.length : '—'}
          </p>
          <p className="text-[10px] uppercase tracking-widest text-[#0F1D2C]/40 mt-1">Sessions</p>
        </div>
        <div className="text-center p-4 rounded-xl bg-[#F8F6F1]">
          <p className="font-heading text-2xl text-[#0F1D2C]">
            {phases.length > 0 ? `${phases.length}` : '3-4'}
          </p>
          <p className="text-[10px] uppercase tracking-widest text-[#0F1D2C]/40 mt-1">Phases</p>
        </div>
        <div className="text-center p-4 rounded-xl bg-[#F8F6F1]">
          <p className="font-heading text-2xl text-[#C9A96E]">90%+</p>
          <p className="text-[10px] uppercase tracking-widest text-[#0F1D2C]/40 mt-1">Confidence</p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════ */

export default function TreatmentPlanClient({ planId }: { planId: string }) {
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const trackEvent = (action: string, tier?: string) => {
    fetch(`/api/plan/${planId}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, tier, timestamp: new Date().toISOString() }),
    }).catch(() => {});
  };

  useEffect(() => {
    async function fetchPlan() {
      try {
        const res = await fetch(`/api/plan/${planId}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to load plan');
        }
        const data = await res.json();
        setPlan(data.plan);
        trackEvent('viewed');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
    fetchPlan();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  const packages = useMemo(() => (plan ? buildPackagesFromAI(plan) : []), [plan]);
  const roadmap = useMemo(() => (plan ? buildRoadmapFromAI(plan) : []), [plan]);

  // ─── Loading State ───
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F6F1] flex items-center justify-center">
        <div className="text-center space-y-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="mx-auto w-12 h-12 border-2 border-[#C9A96E] border-t-transparent rounded-full"
          />
          <div>
            <p className="font-heading text-xl text-[#0F1D2C]">Preparing Your Plan</p>
            <p className="text-sm text-[#0F1D2C]/50 mt-1">Crafting your personalized treatment roadmap...</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Error State ───
  if (error || !plan) {
    return (
      <div className="min-h-screen bg-[#F8F6F1] flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-[#0F1D2C]/5 flex items-center justify-center">
            <Shield className="w-8 h-8 text-[#0F1D2C]/40" />
          </div>
          <h1 className="font-heading text-2xl text-[#0F1D2C]">Plan Not Found</h1>
          <p className="text-[#0F1D2C]/60 text-sm leading-relaxed">
            {error || 'We could not locate this treatment plan. Please check your link or contact us for assistance.'}
          </p>
          <a
            href="tel:+14252078870"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0F1D2C] text-white rounded-lg text-sm font-semibold tracking-wide hover:bg-[#1A2A3C] transition-colors"
          >
            <Phone className="w-4 h-4" />
            Call Us: (425) 207-8870
          </a>
        </div>
      </div>
    );
  }

  const currentScore = plan.skinHealthScore ?? 62;
  const projectedScore = plan.projectedScore ?? 89;
  const mangomintBookingUrl = 'https://booking.mangomint.com/876418';
  const cherryFinancingUrl = 'https://patient.withcherry.com/apply/rani-beauty-clinic';

  return (
    <>
      {/* ─── Print Styles ─── */}
      <style jsx global>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          nav, footer, .no-print, .mobile-cta { display: none !important; }
          .print-break { page-break-before: always; }
          .print-avoid-break { page-break-inside: avoid; }
          * { animation: none !important; transition: none !important; }
        }
      `}</style>

      <div className="min-h-screen bg-[#F8F6F1] font-body text-[#0F1D2C]">
        {/* ═══════════════════════════════════════════════════════════
           HERO SECTION
           ═══════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-[#0F1D2C] text-white">
          <div className="absolute inset-0 opacity-[0.03]">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 25% 25%, #C9A96E 1px, transparent 1px), radial-gradient(circle at 75% 75%, #C9A96E 1px, transparent 1px)',
                backgroundSize: '60px 60px',
              }}
            />
          </div>

          <div className="h-1 bg-gradient-to-r from-[#C9A96E]/0 via-[#C9A96E] to-[#C9A96E]/0" />

          <div className="relative max-w-4xl mx-auto px-6 py-16 md:py-24 text-center">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
              className="mb-8"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A96E]">
                Rani Beauty Clinic
              </p>
              <div className="mt-2 mx-auto w-12 h-px bg-[#C9A96E]/40" />
            </motion.div>

            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.15}
              className="font-heading text-3xl md:text-5xl lg:text-6xl leading-tight"
            >
              Your Personalized
              <br />
              <span className="text-[#C9A96E]">Treatment Roadmap</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.3}
              className="mt-6 text-lg md:text-xl text-white/70 max-w-xl mx-auto leading-relaxed"
            >
              Prepared exclusively for{' '}
              <span className="text-[#C9A96E] font-semibold">{plan.clientName}</span>
            </motion.p>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.4}
              className="mt-4 text-xs uppercase tracking-widest text-white/40"
            >
              Created {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </motion.p>
          </div>

          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 60" fill="none" className="w-full">
              <path d="M0 60V30C240 0 480 0 720 15C960 30 1200 30 1440 0V60H0Z" fill="#F8F6F1" />
            </svg>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
           SKIN HEALTH SCORE
           ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-4xl mx-auto px-6 py-12 md:py-16 print-avoid-break">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-center mb-10"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A96E] mb-3">
              Your Skin Health Assessment
            </p>
            <h2 className="font-heading text-2xl md:text-3xl text-[#0F1D2C]">
              Where You Are &mdash; Where You&apos;re Going
            </h2>
          </motion.div>

          <motion.div
            variants={scaleIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0.15}
            className="bg-white rounded-2xl shadow-sm border border-[#C9A96E]/10 p-8 md:p-12"
          >
            <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-20">
              <ScoreRing score={currentScore} label="Current Score" color="#0F1D2C" />
              <div className="hidden md:flex flex-col items-center gap-2">
                <ArrowRight className="w-8 h-8 text-[#C9A96E]" />
                <span className="text-[10px] uppercase tracking-widest text-[#C9A96E] font-semibold">
                  Your Journey
                </span>
              </div>
              <div className="flex md:hidden items-center gap-2 -my-2">
                <div className="h-8 w-px bg-[#C9A96E]/30" />
                <ChevronRight className="w-5 h-5 text-[#C9A96E]" />
                <div className="h-8 w-px bg-[#C9A96E]/30" />
              </div>
              <ScoreRing score={projectedScore} label="Projected Score" color="#C9A96E" />
            </div>

            <div className="mt-8 pt-6 border-t border-[#C9A96E]/10 text-center">
              <p className="text-sm text-[#0F1D2C]/60 leading-relaxed max-w-lg mx-auto">
                Based on your intake assessment, following our recommended plan could improve your overall
                skin health score by{' '}
                <span className="font-semibold text-[#C9A96E]">
                  {projectedScore - currentScore} points
                </span>{' '}
                within the first 90 days.
              </p>
            </div>
          </motion.div>
        </section>

        <SectionDivider />

        {/* ═══════════════════════════════════════════════════════════
           WHAT WE FOUND
           ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-4xl mx-auto px-6 py-12 print-avoid-break">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-center mb-10"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A96E] mb-3">
              Clinical Insights
            </p>
            <h2 className="font-heading text-2xl md:text-3xl text-[#0F1D2C]">
              What We Found
            </h2>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0.1}
            className="bg-white rounded-2xl shadow-sm border border-[#C9A96E]/10 p-8 md:p-10"
          >
            {plan.intakeSummary ? (
              <div className="space-y-6">
                <p className="text-[#0F1D2C]/80 leading-relaxed text-base md:text-lg">
                  {plan.intakeSummary}
                </p>

                {plan.skinConcerns.length > 0 && (
                  <div className="pt-4 border-t border-[#C9A96E]/10">
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#0F1D2C]/40 mb-3">
                      Primary Concerns Identified
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {plan.skinConcerns.map((concern, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F8F6F1] rounded-full text-xs font-medium text-[#0F1D2C]/70 border border-[#C9A96E]/15"
                        >
                          <Activity className="w-3 h-3 text-[#C9A96E]" />
                          {concern}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#C9A96E]/10">
                  {plan.skinType && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#C9A96E]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Sparkles className="w-4 h-4 text-[#C9A96E]" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#0F1D2C]/40">Skin Type</p>
                        <p className="text-sm text-[#0F1D2C]/70 mt-0.5">{plan.skinType}</p>
                      </div>
                    </div>
                  )}
                  {plan.treatmentHistory && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#C9A96E]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Clock className="w-4 h-4 text-[#C9A96E]" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#0F1D2C]/40">Treatment History</p>
                        <p className="text-sm text-[#0F1D2C]/70 mt-0.5">{plan.treatmentHistory}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <LoadingSkeleton label="Generating Your Analysis..." />
            )}
          </motion.div>
        </section>

        <SectionDivider />

        {/* ═══════════════════════════════════════════════════════════
           YOUR TREATMENT PLAN (AI Program Plan — PARSED)
           ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-4xl mx-auto px-6 py-12 print-break print-avoid-break">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-center mb-10"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A96E] mb-3">
              Your Custom Protocol
            </p>
            <h2 className="font-heading text-2xl md:text-3xl text-[#0F1D2C]">
              Your Treatment Plan
            </h2>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0.1}
            className="bg-white rounded-2xl shadow-sm border border-[#C9A96E]/10 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-[#0F1D2C] to-[#1A2A3C] px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#C9A96E]/20 flex items-center justify-center">
                  <Award className="w-5 h-5 text-[#C9A96E]" />
                </div>
                <div>
                  <h3 className="font-heading text-lg text-white">
                    Personalized Aesthetic Program
                  </h3>
                  <p className="text-xs text-white/50 mt-0.5">
                    Designed for {plan.firstName}&apos;s unique profile
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 md:p-10">
              <PlanSummary plan={plan} />
            </div>
          </motion.div>
        </section>

        <SectionDivider />

        {/* ═══════════════════════════════════════════════════════════
           TREATMENT ROADMAP — Appointment Schedule
           ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-4xl mx-auto px-6 py-12 print-break print-avoid-break">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-center mb-12"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A96E] mb-3">
              Your Appointment Schedule
            </p>
            <h2 className="font-heading text-2xl md:text-3xl text-[#0F1D2C]">
              Treatment Roadmap
            </h2>
            <p className="mt-3 text-sm text-[#0F1D2C]/50 max-w-lg mx-auto">
              Your personalized appointment schedule. Dates are suggested starting points — we&apos;ll confirm exact times when you book.
            </p>
          </motion.div>

          <div className="space-y-10">
            {roadmap.map((phase, i) => {
              const Icon = phase.icon;
              return (
                <motion.div
                  key={phase.phase}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={i * 0.1}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#C9A96E]/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#C9A96E]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#C9A96E] bg-[#C9A96E]/10 px-2 py-0.5 rounded">
                          Phase {phase.phase}
                        </span>
                        <span className="text-[10px] uppercase tracking-widest text-[#0F1D2C]/40">
                          {phase.duration}
                        </span>
                      </div>
                      <h3 className="font-heading text-lg text-[#0F1D2C] mt-0.5">{phase.title}</h3>
                    </div>
                  </div>

                  <p className="text-sm text-[#0F1D2C]/55 leading-relaxed mb-4 ml-[52px]">
                    {phase.description}
                  </p>

                  <div className="space-y-3 ml-[52px]">
                    {phase.appointments.map((appt) => (
                      <div
                        key={appt.number}
                        className="bg-white rounded-xl border border-[#C9A96E]/10 p-4 md:p-5 shadow-sm"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-bold text-white bg-[#0F1D2C] px-2 py-0.5 rounded">
                                Appt {appt.number}
                              </span>
                              <span className="text-xs text-[#0F1D2C]/50">
                                {appt.duration}
                              </span>
                            </div>
                            <ul className="space-y-1">
                              {appt.treatments.map((t, ti) => (
                                <li key={ti} className="flex items-start gap-2">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#C9A96E] flex-shrink-0 mt-0.5" />
                                  <span className="text-sm text-[#0F1D2C]/75 font-medium">{t}</span>
                                </li>
                              ))}
                            </ul>
                            {appt.notes && (
                              <p className="mt-2 text-xs text-[#C9A96E] bg-[#C9A96E]/5 rounded-lg px-3 py-1.5 inline-block">
                                {appt.notes}
                              </p>
                            )}
                          </div>

                          <div className="sm:text-right flex-shrink-0">
                            <p className="text-sm font-semibold text-[#0F1D2C]">
                              {appt.dayOfWeek}, {appt.date}
                            </p>
                            <p className="text-xs text-[#0F1D2C]/50">
                              {appt.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        <SectionDivider />

        {/* ═══════════════════════════════════════════════════════════
           TREATMENT PACKAGES (Good / Better / Best) with Pay Buttons
           ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-5xl mx-auto px-6 py-12 print-break print-avoid-break">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-center mb-12"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A96E] mb-3">
              Choose Your Path
            </p>
            <h2 className="font-heading text-2xl md:text-3xl text-[#0F1D2C]">
              Treatment Packages
            </h2>
            <p className="mt-3 text-sm text-[#0F1D2C]/50 max-w-lg mx-auto">
              Each package is tailored to your specific needs. All include a comprehensive consultation and
              personalized aftercare protocol.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((pkg, i) => (
              <motion.div
                key={pkg.tier}
                variants={scaleIn}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.1}
                className={`relative rounded-2xl border overflow-hidden flex flex-col ${
                  pkg.highlight
                    ? 'border-[#C9A96E] shadow-lg shadow-[#C9A96E]/10 bg-white'
                    : 'border-[#C9A96E]/15 bg-white'
                }`}
              >
                {pkg.highlight && (
                  <div className="bg-[#C9A96E] text-white text-[10px] font-bold uppercase tracking-widest text-center py-1.5">
                    Most Popular
                  </div>
                )}

                <div className="p-6 md:p-8 flex-1 flex flex-col">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A96E]">
                    {pkg.tier}
                  </p>
                  <h3 className="font-heading text-xl text-[#0F1D2C] mt-1">{pkg.name}</h3>

                  <div className="mt-4 mb-1">
                    <span className="font-heading text-3xl text-[#0F1D2C]">
                      ${pkg.price.toLocaleString()}
                    </span>
                    {pkg.savings && (
                      <span className="ml-2 text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        {pkg.savings}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#0F1D2C]/40 mb-6">
                    or ${pkg.monthlyPayment}/mo with Cherry
                  </p>

                  {/* Line-item pricing */}
                  <div className="space-y-2.5 flex-1">
                    {pkg.lineItems.map((item, j) => (
                      <div key={j} className="flex items-start justify-between gap-2 text-sm">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#C9A96E] flex-shrink-0 mt-0.5" />
                          <span className="text-[#0F1D2C]/70">
                            {item.service}
                            {item.qty > 1 && (
                              <span className="text-[#0F1D2C]/40"> x{item.qty}</span>
                            )}
                          </span>
                        </div>
                        <span className="text-[#0F1D2C]/50 font-medium whitespace-nowrap">
                          ${item.total.toLocaleString()}
                        </span>
                      </div>
                    ))}

                    {pkg.extras.map((extra, j) => (
                      <div key={`e-${j}`} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#C9A96E]/50 flex-shrink-0 mt-0.5" />
                        <span className="text-[#0F1D2C]/45 text-xs">{extra}</span>
                      </div>
                    ))}

                    <div className="pt-2 mt-2 border-t border-[#C9A96E]/10 flex justify-between text-sm font-semibold">
                      <span className="text-[#0F1D2C]/60">{pkg.sessions} treatments</span>
                      <span className="text-[#0F1D2C]">${pkg.price.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Dual CTA Buttons */}
                  <div className="mt-8 space-y-2.5">
                    {/* Book Consultation / Select */}
                    <a
                      href={mangomintBookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackEvent('selected_tier', pkg.tier)}
                      className={`block text-center py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-all duration-300 ${
                        pkg.highlight
                          ? 'bg-[#C9A96E] text-white hover:bg-[#B8964F] shadow-sm'
                          : 'bg-[#0F1D2C] text-white hover:bg-[#1A2A3C]'
                      }`}
                    >
                      Book Consultation
                    </a>

                    {/* Cherry Financing */}
                    <a
                      href={cherryFinancingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackEvent('financing_click', pkg.tier)}
                      className="block text-center py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider border border-[#C9A96E]/30 text-[#C9A96E] hover:bg-[#C9A96E]/5 transition-all duration-300"
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5" />
                        Apply for 0% Financing
                      </span>
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <SectionDivider />

        {/* ═══════════════════════════════════════════════════════════
           EXPECTED RESULTS
           ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-4xl mx-auto px-6 py-12 print-avoid-break">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-center mb-10"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A96E] mb-3">
              What to Expect
            </p>
            <h2 className="font-heading text-2xl md:text-3xl text-[#0F1D2C]">
              Expected Results
            </h2>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0.1}
            className="bg-white rounded-2xl shadow-sm border border-[#C9A96E]/10 p-8 md:p-10"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Calendar,
                  title: 'Week 2-4',
                  description: 'Initial improvement in skin texture and radiance. Hydration levels improve visibly. Skin feels smoother to the touch.',
                },
                {
                  icon: TrendingUp,
                  title: 'Month 2-3',
                  description: 'Significant visible changes. Collagen remodeling begins. Concerns like fine lines, uneven tone, and texture show marked improvement.',
                },
                {
                  icon: Star,
                  title: 'Month 4-6',
                  description: 'Optimal results achieved. Full collagen maturation delivers peak improvement. Maintenance protocol preserves lasting results.',
                },
              ].map((result, i) => {
                const Icon = result.icon;
                return (
                  <div key={i} className="text-center md:text-left">
                    <div className="w-12 h-12 mx-auto md:mx-0 rounded-xl bg-[#C9A96E]/10 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-[#C9A96E]" />
                    </div>
                    <h3 className="font-heading text-lg text-[#0F1D2C] mb-2">{result.title}</h3>
                    <p className="text-sm text-[#0F1D2C]/60 leading-relaxed">{result.description}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 pt-6 border-t border-[#C9A96E]/10 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F8F6F1] rounded-full">
                <Shield className="w-4 h-4 text-[#C9A96E]" />
                <span className="text-xs font-semibold text-[#0F1D2C]/60">
                  Confidence Level: 90%+ based on clinical protocols and your skin profile
                </span>
              </div>
            </div>
          </motion.div>
        </section>

        <SectionDivider />

        {/* ═══════════════════════════════════════════════════════════
           FINANCING OPTIONS
           ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-4xl mx-auto px-6 py-12 print-avoid-break">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-center mb-10"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A96E] mb-3">
              Flexible Payment Options
            </p>
            <h2 className="font-heading text-2xl md:text-3xl text-[#0F1D2C]">
              Financing Made Simple
            </h2>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0.1}
            className="bg-gradient-to-br from-[#0F1D2C] to-[#1A2A3C] rounded-2xl p-8 md:p-12 text-white overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#C9A96E]/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#C9A96E]/5 rounded-full blur-3xl" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#C9A96E]/20 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-[#C9A96E]" />
                </div>
                <div>
                  <h3 className="font-heading text-lg">Cherry Financing</h3>
                  <p className="text-xs text-white/50">0% APR available for qualified applicants</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {packages.map((pkg) => (
                  <div
                    key={pkg.tier}
                    className={`rounded-xl p-5 ${
                      pkg.highlight ? 'bg-[#C9A96E]/15 border border-[#C9A96E]/30' : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A96E] mb-1">
                      {pkg.tier}
                    </p>
                    <p className="font-heading text-2xl mb-0.5">
                      ${pkg.monthlyPayment}
                      <span className="text-sm text-white/50">/mo</span>
                    </p>
                    <p className="text-xs text-white/40">
                      ${pkg.price.toLocaleString()} over {pkg.price <= 2000 ? 6 : pkg.price <= 4000 ? 12 : 18} months
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C9A96E]" />
                  <span className="text-sm text-white/70">No hard credit check</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C9A96E]" />
                  <span className="text-sm text-white/70">Instant approval</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C9A96E]" />
                  <span className="text-sm text-white/70">0% APR plans available</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <a
                  href={cherryFinancingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent('financing_apply')}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-[#C9A96E] text-[#0F1D2C] rounded-lg text-sm font-bold uppercase tracking-wider hover:bg-[#B8964F] transition-all duration-300"
                >
                  <CreditCard className="w-4 h-4" />
                  Check Your Rate — No Impact to Credit
                </a>
              </div>
            </div>
          </motion.div>
        </section>

        <SectionDivider />

        {/* ═══════════════════════════════════════════════════════════
           RESERVE YOUR PLAN CTA
           ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-4xl mx-auto px-6 py-12 print-avoid-break">
          <motion.div
            variants={scaleIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="relative bg-white rounded-2xl shadow-lg border border-[#C9A96E]/20 overflow-hidden"
          >
            <div className="h-1 bg-gradient-to-r from-[#C9A96E]/0 via-[#C9A96E] to-[#C9A96E]/0" />

            <div className="p-8 md:p-12 text-center">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#C9A96E]/10 mb-6"
              >
                <Gift className="w-8 h-8 text-[#C9A96E]" />
              </motion.div>

              <h2 className="font-heading text-2xl md:text-3xl text-[#0F1D2C] mb-3">
                Reserve Your Treatment Plan
              </h2>
              <p className="text-[#0F1D2C]/60 text-base max-w-lg mx-auto mb-2">
                Secure your spot with a $250 fully-refundable consultation deposit.
                This guarantees your pricing and priority scheduling.
              </p>
              <p className="text-xs text-[#0F1D2C]/40 mb-8">
                Your deposit is applied to any treatment package you choose.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href={mangomintBookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent('selected_tier', 'Deposit')}
                  className="inline-flex items-center gap-3 px-10 py-4 bg-[#C9A96E] text-white rounded-xl text-base font-semibold uppercase tracking-wider hover:bg-[#B8964F] transition-all duration-300 shadow-lg shadow-[#C9A96E]/20 hover:shadow-[#C9A96E]/30 hover:scale-[1.02]"
                >
                  Reserve with $250 Deposit
                  <ArrowRight className="w-5 h-5" />
                </a>

                <a
                  href={cherryFinancingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent('financing_apply')}
                  className="inline-flex items-center gap-2 px-8 py-4 border-2 border-[#C9A96E]/30 text-[#0F1D2C] rounded-xl text-sm font-semibold uppercase tracking-wider hover:border-[#C9A96E] hover:bg-[#C9A96E]/5 transition-all duration-300"
                >
                  <CreditCard className="w-4 h-4 text-[#C9A96E]" />
                  Apply for Financing
                </a>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-[#0F1D2C]/40">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  Fully refundable
                </span>
                <span className="flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5" />
                  No obligation
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Locks in your pricing
                </span>
              </div>
            </div>
          </motion.div>
        </section>

        <SectionDivider />

        {/* ═══════════════════════════════════════════════════════════
           YOUR TREATMENT ARCHITECT
           ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-4xl mx-auto px-6 py-12 print-avoid-break">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="bg-white rounded-2xl shadow-sm border border-[#C9A96E]/10 p-8 md:p-10"
          >
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              <div className="flex-shrink-0 w-28 h-28 rounded-2xl bg-gradient-to-br from-[#C9A96E]/20 to-[#0F1D2C]/5 flex items-center justify-center">
                <User className="w-12 h-12 text-[#C9A96E]/60" />
              </div>

              <div className="text-center md:text-left">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A96E] mb-1">
                  Your Treatment Architect
                </p>
                <h3 className="font-heading text-xl text-[#0F1D2C]">Dr. Rani</h3>
                <p className="text-sm text-[#0F1D2C]/50 mt-0.5 mb-4">
                  Medical Director &bull; Board-Certified Physician
                </p>
                <p className="text-sm text-[#0F1D2C]/65 leading-relaxed max-w-lg">
                  As a physician-supervised medical aesthetics specialist, Dr. Rani combines clinical
                  expertise with an artistic eye to create natural, transformative results. Every treatment
                  plan is crafted with precision, safety, and your unique goals in mind.
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-3">
                  {['Physician-Supervised', 'Advanced Certifications', 'Personalized Care'].map(
                    (badge) => (
                      <span
                        key={badge}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F8F6F1] rounded-full text-[10px] font-semibold uppercase tracking-wider text-[#0F1D2C]/50 border border-[#C9A96E]/10"
                      >
                        <CheckCircle2 className="w-3 h-3 text-[#C9A96E]" />
                        {badge}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
           NEXT STEP (from AI)
           ═══════════════════════════════════════════════════════════ */}
        {plan.suggestedNextStep && (
          <>
            <SectionDivider />
            <section className="max-w-4xl mx-auto px-6 py-8 print-avoid-break">
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={0}
                className="bg-[#C9A96E]/5 rounded-2xl border border-[#C9A96E]/15 p-6 md:p-8"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#C9A96E]/15 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-[#C9A96E]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A96E] mb-1">
                      Suggested Next Step
                    </p>
                    <p className="text-[#0F1D2C]/75 leading-relaxed">{plan.suggestedNextStep}</p>
                  </div>
                </div>
              </motion.div>
            </section>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════
           FOOTER
           ═══════════════════════════════════════════════════════════ */}
        <footer className="bg-[#0F1D2C] text-white mt-12">
          <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A96E] mb-4">
                  Contact
                </p>
                <div className="space-y-3">
                  <a
                    href="tel:+14252078870"
                    className="flex items-center gap-2.5 text-sm text-white/70 hover:text-[#C9A96E] transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    (425) 207-8870
                  </a>
                  <a
                    href="mailto:info@ranibeautyclinic.com"
                    className="flex items-center gap-2.5 text-sm text-white/70 hover:text-[#C9A96E] transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    info@ranibeautyclinic.com
                  </a>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A96E] mb-4">
                  Location
                </p>
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-white/70 leading-relaxed">
                    401 Olympia Ave NE #101
                    <br />
                    Renton, WA 98056
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A96E] mb-4">
                  Hours
                </p>
                <div className="space-y-1.5 text-sm text-white/70">
                  <p>Mon - Fri: 10am - 7pm</p>
                  <p>Saturday: 10am - 5pm</p>
                  <p>Sunday: Closed</p>
                </div>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-white/10 text-center">
              <p className="text-[11px] text-white/30 leading-relaxed max-w-2xl mx-auto">
                This treatment plan is a personalized recommendation based on your intake assessment and is not a
                guarantee of results. Individual results may vary. All treatments are performed under physician
                supervision. Pricing is valid for 30 days from the date shown above. Financing subject to credit
                approval through Cherry Technologies, Inc.
              </p>
              <p className="mt-4 text-[10px] text-white/20 uppercase tracking-widest">
                &copy; {new Date().getFullYear()} Rani Beauty Clinic. All Rights Reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
