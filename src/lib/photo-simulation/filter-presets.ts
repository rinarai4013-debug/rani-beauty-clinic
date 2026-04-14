/**
 * Treatment-to-filter mappings for photo simulation.
 * Every service category and individual service maps to visual filter presets.
 */

import type { FilterStep } from './filters';
import type { ServiceCategory } from '@/data/services/unified-catalog';

export interface TreatmentPreset {
  label: string;
  filters: FilterStep[];
  description: string;
}

// ─── Core Visual Presets ────────────────────────────────────────────

export const TREATMENT_PRESETS: Record<string, TreatmentPreset> = {
  'skin-rejuvenation': {
    label: 'Skin Rejuvenation',
    filters: [
      { filter: 'skinSmoothing', intensity: 0.6 },
      { filter: 'glow', intensity: 0.4 },
    ],
    description: 'Smoother, more radiant skin',
  },
  'tone-correction': {
    label: 'Tone Correction',
    filters: [
      { filter: 'toneEvening', intensity: 0.7 },
      { filter: 'brightening', intensity: 0.5 },
    ],
    description: 'More even skin tone',
  },
  'skin-tightening': {
    label: 'Skin Tightening & Lifting',
    filters: [
      { filter: 'skinSmoothing', intensity: 0.3 },
      { filter: 'glow', intensity: 0.6 },
    ],
    description: 'Firmer, lifted appearance',
  },
  'acne-improvement': {
    label: 'Acne & Texture Improvement',
    filters: [
      { filter: 'skinSmoothing', intensity: 0.8 },
      { filter: 'toneEvening', intensity: 0.4 },
    ],
    description: 'Clearer, smoother complexion',
  },
  'anti-aging': {
    label: 'Fine Line & Wrinkle Reduction',
    filters: [
      { filter: 'skinSmoothing', intensity: 0.5 },
      { filter: 'glow', intensity: 0.5 },
      { filter: 'toneEvening', intensity: 0.3 },
    ],
    description: 'Youthful, refreshed look',
  },
  'volume-restoration': {
    label: 'Volume Restoration & Contour Support',
    filters: [
      { filter: 'skinSmoothing', intensity: 0.45 },
      { filter: 'glow', intensity: 0.55 },
      { filter: 'toneEvening', intensity: 0.25 },
    ],
    description: 'Restored facial volume with smoother contour transitions',
  },
  'overall-glow': {
    label: 'Healthy Glow',
    filters: [
      { filter: 'glow', intensity: 0.7 },
      { filter: 'brightening', intensity: 0.4 },
    ],
    description: 'Healthy, luminous glow',
  },
  'pigmentation-reduction': {
    label: 'Dark Spot & Pigmentation Reduction',
    filters: [
      { filter: 'toneEvening', intensity: 0.8 },
      { filter: 'brightening', intensity: 0.6 },
      { filter: 'glow', intensity: 0.2 },
    ],
    description: 'Visibly reduced dark spots and even complexion',
  },
  'pore-refinement': {
    label: 'Pore Refinement',
    filters: [
      { filter: 'skinSmoothing', intensity: 0.7 },
      { filter: 'glow', intensity: 0.3 },
    ],
    description: 'Minimized pores, refined texture',
  },
  'scar-improvement': {
    label: 'Scar & Texture Repair',
    filters: [
      { filter: 'skinSmoothing', intensity: 0.9 },
      { filter: 'toneEvening', intensity: 0.5 },
      { filter: 'glow', intensity: 0.2 },
    ],
    description: 'Smoother skin surface, reduced scarring appearance',
  },
  'brightening-hydration': {
    label: 'Brightening & Deep Hydration',
    filters: [
      { filter: 'brightening', intensity: 0.7 },
      { filter: 'glow', intensity: 0.6 },
    ],
    description: 'Dewy, hydrated, radiant skin',
  },
  'collagen-boost': {
    label: 'Collagen Stimulation',
    filters: [
      { filter: 'skinSmoothing', intensity: 0.4 },
      { filter: 'glow', intensity: 0.5 },
      { filter: 'brightening', intensity: 0.3 },
    ],
    description: 'Plumper, firmer skin from within',
  },
  'body-contouring': {
    label: 'Body Contouring & Toning',
    filters: [
      { filter: 'skinSmoothing', intensity: 0.4 },
      { filter: 'toneEvening', intensity: 0.3 },
    ],
    description: 'Smoother body contours',
  },
  'hair-restoration': {
    label: 'Hair Density Improvement',
    filters: [
      { filter: 'glow', intensity: 0.3 },
      { filter: 'brightening', intensity: 0.2 },
    ],
    description: 'Healthier, fuller-looking hair',
  },
  'wellness-vitality': {
    label: 'Wellness & Vitality Boost',
    filters: [
      { filter: 'glow', intensity: 0.5 },
      { filter: 'brightening', intensity: 0.5 },
      { filter: 'toneEvening', intensity: 0.2 },
    ],
    description: 'Energized, healthy appearance from the inside out',
  },
};

// ─── Service Category → Preset Mapping ──────────────────────────────
// Maps every ServiceCategory to the most relevant presets

export const CATEGORY_TO_PRESETS: Record<ServiceCategory, string[]> = {
  'facial': ['brightening-hydration', 'overall-glow', 'pore-refinement'],
  'laser-hair-removal': ['skin-rejuvenation'],
  'chemical-peel': ['tone-correction', 'pigmentation-reduction', 'acne-improvement'],
  'rf-microneedling': ['collagen-boost', 'scar-improvement', 'skin-tightening'],
  'skin-tightening': ['skin-tightening', 'anti-aging', 'collagen-boost'],
  'scar-reduction': ['scar-improvement', 'skin-rejuvenation'],
  'laser': ['pigmentation-reduction', 'acne-improvement', 'tone-correction'],
  'injectables': ['anti-aging', 'skin-tightening'],
  'wellness': ['wellness-vitality', 'overall-glow'],
  'weight-management': ['body-contouring', 'wellness-vitality'],
  'hormones': ['wellness-vitality', 'overall-glow'],
  'labs': ['wellness-vitality'],
  'skincare': ['overall-glow', 'tone-correction', 'brightening-hydration'],
  'hair': ['hair-restoration'],
  'consultation': ['overall-glow'],
};

// ─── Individual Service → Preset Mapping ────────────────────────────
// Overrides for specific services that need different presets than their category

export const SERVICE_TO_PRESETS: Record<string, string[]> = {
  // Facials
  'hydrafacial-signature': ['brightening-hydration', 'pore-refinement', 'overall-glow'],
  'hydrafacial-express': ['overall-glow', 'brightening-hydration'],
  'hydrafacial-keravive': ['hair-restoration'],

  // Chemical Peels
  'vi-peel': ['pigmentation-reduction', 'acne-improvement', 'tone-correction'],
  'biorepeel-face': ['overall-glow', 'pore-refinement', 'acne-improvement'],
  'prx-t33': ['collagen-boost', 'brightening-hydration', 'anti-aging'],

  // RF Microneedling
  'rf-micro-face': ['collagen-boost', 'scar-improvement', 'pore-refinement'],
  'rf-micro-face-neck': ['collagen-boost', 'skin-tightening', 'anti-aging'],
  'rf-micro-abdomen-small': ['body-contouring', 'skin-tightening'],
  'rf-micro-abdomen-large': ['body-contouring', 'skin-tightening'],

  // Sofwave
  'sofwave-full-face': ['skin-tightening', 'anti-aging', 'collagen-boost'],
  'sofwave-full-face-neck': ['skin-tightening', 'anti-aging', 'collagen-boost'],
  'sofwave-brow': ['skin-tightening', 'anti-aging'],
  'sofwave-lower-face': ['skin-tightening', 'anti-aging'],
  'sofwave-neck': ['skin-tightening', 'collagen-boost'],

  // Laser
  'laser-facial-ndyag': ['acne-improvement', 'pigmentation-reduction', 'skin-rejuvenation'],

  // Scar
  'scar-laser-small': ['scar-improvement', 'skin-rejuvenation'],
  'scar-rf-micro': ['scar-improvement', 'collagen-boost'],
  'scar-combination': ['scar-improvement', 'skin-rejuvenation', 'collagen-boost'],

  // Injectables
  'botox': ['anti-aging', 'skin-tightening'],
  'botox-dysport': ['anti-aging', 'skin-tightening'],
  'dysport': ['anti-aging'],
  'xeomin': ['anti-aging'],
  'dermal-fillers': ['volume-restoration', 'anti-aging'],
  'filler': ['volume-restoration', 'anti-aging'],
  'fillers': ['volume-restoration', 'anti-aging'],
  'juvederm': ['volume-restoration'],
  'restylane': ['volume-restoration'],
  'radiesse': ['volume-restoration'],
  'sculptra': ['volume-restoration', 'collagen-boost'],

  // Broad service aliases for simulation ingestion
  'rf-microneedling': ['collagen-boost', 'scar-improvement', 'skin-tightening'],
  'sofwave': ['skin-tightening', 'anti-aging', 'collagen-boost'],
  'laser-hair-removal': ['skin-rejuvenation'],

  // Wellness
  'glutathione-injection': ['brightening-hydration', 'overall-glow'],
  'nad-injection': ['wellness-vitality', 'overall-glow'],
  'b12-injection': ['wellness-vitality'],

  // Weight Management
  'glp1-semaglutide-m1': ['body-contouring', 'wellness-vitality'],
  'glp1-tirzepatide-m1': ['body-contouring', 'wellness-vitality'],
  'glp1-semaglutide-m2': ['body-contouring', 'wellness-vitality'],
  'glp1-semaglutide-m3': ['body-contouring', 'wellness-vitality'],
  'glp1-semaglutide-m4': ['body-contouring', 'wellness-vitality'],
  'glp1-tirzepatide-m2': ['body-contouring', 'wellness-vitality'],
  'glp1-tirzepatide-m3': ['body-contouring', 'wellness-vitality'],
  'glp-1': ['body-contouring', 'wellness-vitality'],

  // Hormones / peptides
  'hrt-female-start': ['wellness-vitality', 'overall-glow'],
  'hrt-female-optimize': ['wellness-vitality', 'overall-glow'],
  'trt-male-start': ['wellness-vitality', 'overall-glow'],
  'trt-male-optimize': ['wellness-vitality', 'overall-glow'],
  'thyroid-optimization': ['wellness-vitality'],
  'peptide-bpc157-recovery': ['wellness-vitality', 'collagen-boost'],
  'peptide-cjc1295-ipamorelin': ['wellness-vitality', 'collagen-boost'],
  'peptide-elite-stack': ['wellness-vitality', 'collagen-boost'],

  // Skincare
  'tretinoin': ['acne-improvement', 'anti-aging', 'tone-correction'],
  'skincare-kit': ['overall-glow', 'tone-correction'],

  // Hair
  'folix-hair': ['hair-restoration'],
};

/**
 * Get the best filter presets for a given service ID or category.
 * Checks service-specific overrides first, then falls back to category mapping.
 */
export function getPresetsForService(serviceId: string, category: ServiceCategory): string[] {
  return SERVICE_TO_PRESETS[serviceId] || CATEGORY_TO_PRESETS[category] || ['overall-glow'];
}
