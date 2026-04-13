// Unified Service Catalog - Single source of truth for all services, pricing, and metadata
// Sources: pricing.ts (authoritative prices), aesthetic-services.ts, wellness-services.ts

export type ServiceCategory =
  | 'laser-hair-removal'
  | 'facial'
  | 'chemical-peel'
  | 'rf-microneedling'
  | 'skin-tightening'
  | 'scar-reduction'
  | 'laser'
  | 'injectables'
  | 'wellness'
  | 'weight-management'
  | 'hormones'
  | 'labs'
  | 'skincare'
  | 'hair'
  | 'consultation';

export interface UnifiedService {
  id: string;
  name: string;
  category: ServiceCategory;
  price: number;
  duration: number; // minutes
  sessions: number; // typical course
  description: string;
  concerns: string[];
  bodyAreas: string[];
  parentSlug?: string;
  financingEligible: boolean;
  packageDiscounts?: { qty: number; discount: number }[];
  note?: string;
  results?: string;
  downtime?: string;
  active?: boolean; // defaults to true when omitted
  requiredDevice?: string; // optional explicit device tag override
  qualifiedProviders?: string[]; // optional role/skill tags allowed to perform
  roomRequirement?: string; // optional room/equipment station tag
  leadTimeDays?: number; // optional minimum lead time before first session
  requiresLabs?: boolean; // optional hard prerequisite gate
}

// ─── Full Service Catalog ───────────────────────────────────────────

export const UNIFIED_CATALOG: UnifiedService[] = [
  // ═══ LASER HAIR REMOVAL ═══
  { id: 'lhr-upper-lip', name: 'Laser Hair Removal - Upper Lip', category: 'laser-hair-removal', price: 79, duration: 5, sessions: 6, description: 'Permanent hair reduction for the upper lip area', concerns: ['unwanted-hair'], bodyAreas: ['face'], financingEligible: false, parentSlug: 'laser-hair-removal' },
  { id: 'lhr-chin', name: 'Laser Hair Removal - Chin', category: 'laser-hair-removal', price: 79, duration: 8, sessions: 6, description: 'Permanent hair reduction for the chin', concerns: ['unwanted-hair'], bodyAreas: ['face'], financingEligible: false, parentSlug: 'laser-hair-removal' },
  { id: 'lhr-cheeks', name: 'Laser Hair Removal - Cheeks', category: 'laser-hair-removal', price: 89, duration: 8, sessions: 6, description: 'Permanent hair reduction for cheeks and sideburn area', concerns: ['unwanted-hair'], bodyAreas: ['face'], financingEligible: false, parentSlug: 'laser-hair-removal' },
  { id: 'lhr-neck', name: 'Laser Hair Removal - Neck', category: 'laser-hair-removal', price: 89, duration: 10, sessions: 6, description: 'Permanent hair reduction for the neck', concerns: ['unwanted-hair'], bodyAreas: ['neck'], financingEligible: false, parentSlug: 'laser-hair-removal' },
  { id: 'lhr-small-areas', name: 'Laser Hair Removal - Small Areas', category: 'laser-hair-removal', price: 79, duration: 5, sessions: 6, description: 'Sideburns, ears, brows, jawline, or forehead', concerns: ['unwanted-hair'], bodyAreas: ['face'], financingEligible: false, parentSlug: 'laser-hair-removal', note: 'Sideburns, ears, brows, jawline, forehead' },
  { id: 'lhr-underarms', name: 'Laser Hair Removal - Underarms', category: 'laser-hair-removal', price: 149, duration: 10, sessions: 6, description: 'Permanent hair reduction for underarms', concerns: ['unwanted-hair'], bodyAreas: ['arms'], financingEligible: false, parentSlug: 'laser-hair-removal' },
  { id: 'lhr-half-arms', name: 'Laser Hair Removal - Half Arms', category: 'laser-hair-removal', price: 185, duration: 18, sessions: 6, description: 'Permanent hair reduction for upper or lower arms', concerns: ['unwanted-hair'], bodyAreas: ['arms'], financingEligible: false, parentSlug: 'laser-hair-removal' },
  { id: 'lhr-full-arms', name: 'Laser Hair Removal - Full Arms', category: 'laser-hair-removal', price: 375, duration: 28, sessions: 6, description: 'Complete arm hair reduction from shoulder to wrist', concerns: ['unwanted-hair'], bodyAreas: ['arms'], financingEligible: true, parentSlug: 'laser-hair-removal' },
  { id: 'lhr-full-face', name: 'Laser Hair Removal - Full Face', category: 'laser-hair-removal', price: 275, duration: 25, sessions: 6, description: 'Full facial hair reduction including all zones', concerns: ['unwanted-hair'], bodyAreas: ['face'], financingEligible: true, parentSlug: 'laser-hair-removal' },
  { id: 'lhr-full-brazilian', name: 'Laser Hair Removal - Full Brazilian', category: 'laser-hair-removal', price: 225, duration: 20, sessions: 6, description: 'Complete bikini area hair reduction', concerns: ['unwanted-hair'], bodyAreas: ['bikini'], financingEligible: true, parentSlug: 'laser-hair-removal', packageDiscounts: [{ qty: 6, discount: 17 }] },
  { id: 'lhr-pantyline', name: 'Laser Hair Removal - Pantyline', category: 'laser-hair-removal', price: 135, duration: 13, sessions: 6, description: 'Hair reduction along the bikini line', concerns: ['unwanted-hair'], bodyAreas: ['bikini'], financingEligible: false, parentSlug: 'laser-hair-removal' },
  { id: 'lhr-buttocks', name: 'Laser Hair Removal - Buttocks', category: 'laser-hair-removal', price: 275, duration: 18, sessions: 6, description: 'Complete buttocks hair reduction', concerns: ['unwanted-hair'], bodyAreas: ['body'], financingEligible: true, parentSlug: 'laser-hair-removal' },
  { id: 'lhr-half-legs', name: 'Laser Hair Removal - Half Legs', category: 'laser-hair-removal', price: 225, duration: 23, sessions: 6, description: 'Upper or lower leg hair reduction', concerns: ['unwanted-hair'], bodyAreas: ['legs'], financingEligible: true, parentSlug: 'laser-hair-removal' },
  { id: 'lhr-full-legs', name: 'Laser Hair Removal - Full Legs', category: 'laser-hair-removal', price: 400, duration: 20, sessions: 6, description: 'Complete leg hair reduction from hip to ankle', concerns: ['unwanted-hair'], bodyAreas: ['legs'], financingEligible: true, parentSlug: 'laser-hair-removal' },
  { id: 'lhr-feet-toes', name: 'Laser Hair Removal - Feet & Toes', category: 'laser-hair-removal', price: 79, duration: 5, sessions: 6, description: 'Hair reduction for feet and toes', concerns: ['unwanted-hair'], bodyAreas: ['feet'], financingEligible: false, parentSlug: 'laser-hair-removal' },
  { id: 'lhr-hands-fingers', name: 'Laser Hair Removal - Hands & Fingers', category: 'laser-hair-removal', price: 79, duration: 5, sessions: 6, description: 'Hair reduction for hands and fingers', concerns: ['unwanted-hair'], bodyAreas: ['hands'], financingEligible: false, parentSlug: 'laser-hair-removal' },
  { id: 'lhr-full-chest', name: 'Laser Hair Removal - Full Chest', category: 'laser-hair-removal', price: 225, duration: 18, sessions: 6, description: 'Complete chest hair reduction', concerns: ['unwanted-hair'], bodyAreas: ['chest'], financingEligible: true, parentSlug: 'laser-hair-removal' },
  { id: 'lhr-areolas', name: 'Laser Hair Removal - Areolas', category: 'laser-hair-removal', price: 79, duration: 5, sessions: 6, description: 'Hair reduction around the areola area', concerns: ['unwanted-hair'], bodyAreas: ['chest'], financingEligible: false, parentSlug: 'laser-hair-removal' },
  { id: 'lhr-full-abs', name: 'Laser Hair Removal - Full Abs', category: 'laser-hair-removal', price: 275, duration: 18, sessions: 6, description: 'Complete abdominal hair reduction', concerns: ['unwanted-hair'], bodyAreas: ['abdomen'], financingEligible: true, parentSlug: 'laser-hair-removal' },
  { id: 'lhr-happy-trail', name: 'Laser Hair Removal - Happy Trail', category: 'laser-hair-removal', price: 79, duration: 5, sessions: 6, description: 'Hair reduction for the lower abdominal line', concerns: ['unwanted-hair'], bodyAreas: ['abdomen'], financingEligible: false, parentSlug: 'laser-hair-removal' },
  { id: 'lhr-full-back', name: 'Laser Hair Removal - Full Back', category: 'laser-hair-removal', price: 375, duration: 35, sessions: 6, description: 'Complete back hair reduction', concerns: ['unwanted-hair'], bodyAreas: ['back'], financingEligible: true, parentSlug: 'laser-hair-removal' },
  { id: 'lhr-full-body', name: 'Laser Hair Removal - Full Body', category: 'laser-hair-removal', price: 1199, duration: 105, sessions: 6, description: 'Complete head-to-toe hair reduction - best value', concerns: ['unwanted-hair'], bodyAreas: ['face', 'arms', 'legs', 'chest', 'back', 'bikini', 'abdomen'], financingEligible: true, parentSlug: 'laser-hair-removal', note: 'Best value', packageDiscounts: [{ qty: 6, discount: 17 }] },

  // ═══ HYDRAFACIAL ═══
  { id: 'hydrafacial-express', name: 'Express Facial', category: 'facial', price: 99, duration: 60, sessions: 1, description: 'Quick-refresh facial with deep cleansing and hydration', concerns: ['dull-skin', 'large-pores'], bodyAreas: ['face'], financingEligible: false, parentSlug: 'hydrafacial' },
  { id: 'hydrafacial-signature', name: 'Signature HydraFacial', category: 'facial', price: 225, duration: 60, sessions: 1, description: 'Our signature multi-step facial with extraction, hydration, and antioxidant protection', concerns: ['dull-skin', 'aging-skin', 'hyperpigmentation', 'large-pores', 'acne'], bodyAreas: ['face'], financingEligible: false, parentSlug: 'hydrafacial', note: 'Members get at $199' },
  { id: 'hydrafacial-back', name: 'Back HydraFacial', category: 'facial', price: 325, duration: 45, sessions: 1, description: 'Deep cleansing and hydrating treatment for back skin', concerns: ['acne', 'dull-skin'], bodyAreas: ['back'], financingEligible: false, parentSlug: 'hydrafacial' },
  { id: 'hydrafacial-keravive', name: 'Keravive Scalp Treatment', category: 'facial', price: 575, duration: 60, sessions: 3, description: 'HydraFacial technology for scalp health and hair growth', concerns: [], bodyAreas: ['scalp'], financingEligible: true, parentSlug: 'hydrafacial' },
  { id: 'hydrafacial-dermaplaning', name: 'Dermaplaning Add-On', category: 'facial', price: 49, duration: 15, sessions: 1, description: 'Gentle exfoliation to remove peach fuzz and dead skin cells', concerns: ['dull-skin'], bodyAreas: ['face'], financingEligible: false, parentSlug: 'hydrafacial' },
  { id: 'hydrafacial-neck-decollete', name: 'Neck + Décolleté Add-On', category: 'facial', price: 125, duration: 15, sessions: 1, description: 'Extend your HydraFacial benefits to the neck and chest', concerns: ['aging-skin', 'sun-damage'], bodyAreas: ['neck', 'chest'], financingEligible: false, parentSlug: 'hydrafacial' },
  { id: 'hydrafacial-red-light', name: 'Red Light Therapy Add-On', category: 'facial', price: 49, duration: 15, sessions: 1, description: 'LED light therapy for collagen stimulation and healing', concerns: ['aging-skin', 'acne'], bodyAreas: ['face'], financingEligible: false, parentSlug: 'hydrafacial' },

  // ═══ LASER FACIALS ═══
  { id: 'laser-facial-ndyag', name: 'ND:Yag Laser Facial', category: 'laser', price: 475, duration: 90, sessions: 3, description: 'Treats acne, rosacea, sun damage, fine lines, jawline laxity, and acne scarring', concerns: ['acne', 'aging-skin', 'sun-damage', 'skin-laxity', 'hyperpigmentation'], bodyAreas: ['face'], financingEligible: true, parentSlug: 'laser-facial', packageDiscounts: [{ qty: 3, discount: 9 }] },

  // ═══ CHEMICAL PEELS ═══
  { id: 'vi-peel', name: 'VI Peel', category: 'chemical-peel', price: 325, duration: 30, sessions: 3, description: 'Medical-grade chemical peel for all skin types - Original, Advanced, Precision Plus, Purify, or Body', concerns: ['acne', 'hyperpigmentation', 'aging-skin', 'sun-damage', 'dull-skin'], bodyAreas: ['face', 'body'], financingEligible: false, parentSlug: 'vi-peel', note: 'All variants', packageDiscounts: [{ qty: 3, discount: 8 }] },
  { id: 'biorepeel-face', name: 'BioRePeel Face', category: 'chemical-peel', price: 350, duration: 60, sessions: 3, description: 'Innovative bi-phasic peel with zero downtime for radiant skin', concerns: ['dull-skin', 'aging-skin', 'acne', 'large-pores'], bodyAreas: ['face'], financingEligible: false, parentSlug: 'biorepeel', packageDiscounts: [{ qty: 3, discount: 10 }] },
  { id: 'biorepeel-face-neck', name: 'BioRePeel Face & Neck', category: 'chemical-peel', price: 450, duration: 60, sessions: 3, description: 'Extended BioRePeel coverage for face and neck rejuvenation', concerns: ['dull-skin', 'aging-skin', 'skin-laxity'], bodyAreas: ['face', 'neck'], financingEligible: false, parentSlug: 'biorepeel' },
  { id: 'biorepeel-back', name: 'BioRePeel Back', category: 'chemical-peel', price: 575, duration: 60, sessions: 3, description: 'Back treatment for acne and texture improvement', concerns: ['acne', 'dull-skin'], bodyAreas: ['back'], financingEligible: true, parentSlug: 'biorepeel' },
  { id: 'biorepeel-intimate', name: 'BioRePeel Intimate Area', category: 'chemical-peel', price: 425, duration: 60, sessions: 3, description: 'Gentle peel for intimate area skin rejuvenation', concerns: ['hyperpigmentation'], bodyAreas: ['bikini'], financingEligible: false, parentSlug: 'biorepeel' },
  { id: 'biorepeel-underarms', name: 'BioRePeel Underarms', category: 'chemical-peel', price: 275, duration: 60, sessions: 3, description: 'Underarm skin brightening and smoothing', concerns: ['hyperpigmentation', 'dull-skin'], bodyAreas: ['arms'], financingEligible: false, parentSlug: 'biorepeel' },
  { id: 'biorepeel-hands', name: 'BioRePeel Hands', category: 'chemical-peel', price: 225, duration: 60, sessions: 3, description: 'Hand rejuvenation for age spots and texture', concerns: ['sun-damage', 'aging-skin'], bodyAreas: ['hands'], financingEligible: false, parentSlug: 'biorepeel' },
  { id: 'prx-t33', name: 'PRX-T33', category: 'chemical-peel', price: 475, duration: 60, sessions: 3, description: 'Non-peeling biorevitalization for deep hydration and collagen stimulation', concerns: ['aging-skin', 'dull-skin', 'hyperpigmentation', 'acne'], bodyAreas: ['face'], financingEligible: false, parentSlug: 'prx-t33' },

  // ═══ RF MICRONEEDLING ═══
  { id: 'rf-micro-face', name: 'RF Microneedling - Full Face', category: 'rf-microneedling', price: 750, duration: 90, sessions: 3, description: 'Cutera Secret RF microneedling for skin renewal, collagen production, and texture improvement', concerns: ['aging-skin', 'acne', 'large-pores', 'skin-laxity', 'dull-skin'], bodyAreas: ['face'], financingEligible: true, parentSlug: 'rf-microneedling', packageDiscounts: [{ qty: 3, discount: 11 }] },
  { id: 'rf-micro-face-neck', name: 'RF Microneedling - Full Face & Neck', category: 'rf-microneedling', price: 1100, duration: 90, sessions: 3, description: 'Extended RF microneedling covering face and neck for comprehensive rejuvenation', concerns: ['aging-skin', 'skin-laxity', 'dull-skin'], bodyAreas: ['face', 'neck'], financingEligible: true, parentSlug: 'rf-microneedling', packageDiscounts: [{ qty: 3, discount: 15 }] },
  { id: 'rf-micro-abdomen-small', name: 'RF Microneedling - Abdomen (Small)', category: 'rf-microneedling', price: 595, duration: 120, sessions: 3, description: 'Skin tightening and stretch mark improvement for smaller abdominal areas', concerns: ['skin-laxity', 'body-contouring'], bodyAreas: ['abdomen'], financingEligible: true, parentSlug: 'rf-microneedling' },
  { id: 'rf-micro-back-legs', name: 'RF Microneedling - Back of Legs', category: 'rf-microneedling', price: 795, duration: 120, sessions: 3, description: 'Cellulite and skin texture improvement for the back of legs', concerns: ['skin-laxity', 'body-contouring'], bodyAreas: ['legs'], financingEligible: true, parentSlug: 'rf-microneedling' },
  { id: 'rf-micro-arms', name: 'RF Microneedling - Arms', category: 'rf-microneedling', price: 495, duration: 120, sessions: 3, description: 'Skin tightening for upper arms', concerns: ['skin-laxity'], bodyAreas: ['arms'], financingEligible: true, parentSlug: 'rf-microneedling' },
  { id: 'rf-micro-buttocks', name: 'RF Microneedling - Buttocks', category: 'rf-microneedling', price: 695, duration: 120, sessions: 3, description: 'Skin tightening and cellulite improvement for buttocks', concerns: ['skin-laxity', 'body-contouring'], bodyAreas: ['body'], financingEligible: true, parentSlug: 'rf-microneedling' },
  { id: 'rf-micro-abdomen-large', name: 'RF Microneedling - Abdomen (Large)', category: 'rf-microneedling', price: 1100, duration: 120, sessions: 3, description: 'Full abdominal skin tightening and rejuvenation', concerns: ['skin-laxity', 'body-contouring'], bodyAreas: ['abdomen'], financingEligible: true, parentSlug: 'rf-microneedling' },
  { id: 'rf-micro-legs', name: 'RF Microneedling - Legs', category: 'rf-microneedling', price: 1500, duration: 120, sessions: 3, description: 'Full leg skin tightening and texture improvement', concerns: ['skin-laxity', 'body-contouring'], bodyAreas: ['legs'], financingEligible: true, parentSlug: 'rf-microneedling' },

  // ═══ SOFWAVE ═══
  { id: 'sofwave-brow', name: 'Sofwave Brow Lift', category: 'skin-tightening', price: 1150, duration: 30, sessions: 1, description: 'Non-invasive brow lifting and forehead tightening', concerns: ['skin-laxity', 'aging-skin'], bodyAreas: ['face'], financingEligible: true, parentSlug: 'sofwave' },
  { id: 'sofwave-lower-face', name: 'Sofwave Lower Face (Jawline)', category: 'skin-tightening', price: 2250, duration: 45, sessions: 1, description: 'Jawline definition and lower face tightening', concerns: ['skin-laxity', 'aging-skin'], bodyAreas: ['face'], financingEligible: true, parentSlug: 'sofwave' },
  { id: 'sofwave-neck', name: 'Sofwave Neck / Submental', category: 'skin-tightening', price: 1750, duration: 45, sessions: 1, description: 'Neck skin tightening and submental area refinement', concerns: ['skin-laxity', 'aging-skin'], bodyAreas: ['neck'], financingEligible: true, parentSlug: 'sofwave' },
  { id: 'sofwave-full-face', name: 'Sofwave Full Face', category: 'skin-tightening', price: 2250, duration: 60, sessions: 1, description: 'Comprehensive full-face skin tightening and lifting', concerns: ['skin-laxity', 'aging-skin'], bodyAreas: ['face'], financingEligible: true, parentSlug: 'sofwave' },
  { id: 'sofwave-full-face-neck', name: 'Sofwave Full Face + Neck', category: 'skin-tightening', price: 3999, duration: 90, sessions: 1, description: 'Our most comprehensive non-invasive tightening - full face and neck', concerns: ['skin-laxity', 'aging-skin'], bodyAreas: ['face', 'neck'], financingEligible: true, parentSlug: 'sofwave' },

  // ═══ SCAR REDUCTION ═══
  { id: 'scar-laser-small', name: 'Laser Scar Revision (Small)', category: 'scar-reduction', price: 325, duration: 40, sessions: 3, description: 'Targeted laser treatment for small scars', concerns: ['acne'], bodyAreas: ['face', 'body'], financingEligible: false, parentSlug: 'scar-reduction' },
  { id: 'scar-rf-micro', name: 'RF Microneedling for Scars', category: 'scar-reduction', price: 550, duration: 60, sessions: 3, description: 'RF microneedling specifically targeting scar tissue remodeling', concerns: ['acne'], bodyAreas: ['face', 'body'], financingEligible: true, parentSlug: 'scar-reduction' },
  { id: 'scar-combination', name: 'Scar Combination Therapy', category: 'scar-reduction', price: 695, duration: 75, sessions: 3, description: 'Multi-modality approach combining laser, RF, and peels for optimal scar improvement', concerns: ['acne'], bodyAreas: ['face', 'body'], financingEligible: true, parentSlug: 'scar-reduction' },

  // ═══ INJECTABLES ═══
  { id: 'botox', name: 'Botox', category: 'injectables', price: 350, duration: 30, sessions: 1, description: 'Neuromodulator for wrinkle reduction - forehead, crow\'s feet, frown lines, brow lift', concerns: ['aging-skin'], bodyAreas: ['face'], financingEligible: true, parentSlug: 'botox' },
  { id: 'dermal-fillers', name: 'Dermal Fillers', category: 'injectables', price: 650, duration: 45, sessions: 1, description: 'Hyaluronic acid fillers for volume restoration - lips, cheeks, jawline, nasolabial folds', concerns: ['aging-skin', 'skin-laxity'], bodyAreas: ['face'], financingEligible: true, parentSlug: 'dermal-fillers' },

  // ═══ WELLNESS INJECTIONS ═══
  { id: 'b12-injection', name: 'Vitamin B12 Injection', category: 'wellness', price: 25, duration: 5, sessions: 1, description: 'Energy-boosting B12 methylcobalamin injection', concerns: ['body-contouring'], bodyAreas: [], financingEligible: false, parentSlug: 'wellness-injections' },
  { id: 'lipo-b-injection', name: 'Lipo-B (MIC + B12) Injection', category: 'wellness', price: 35, duration: 5, sessions: 1, description: 'Fat metabolism support injection with MIC lipotropics + B12', concerns: ['body-contouring'], bodyAreas: [], financingEligible: false, parentSlug: 'wellness-injections' },
  { id: 'biotin-injection', name: 'Biotin Injection', category: 'wellness', price: 35, duration: 5, sessions: 1, description: 'Hair, skin, and nails support injection', concerns: [], bodyAreas: [], financingEligible: false, parentSlug: 'wellness-injections' },
  { id: 'glutathione-injection', name: 'Glutathione Injection', category: 'wellness', price: 49, duration: 15, sessions: 1, description: 'Master antioxidant for skin brightening and detoxification', concerns: ['hyperpigmentation', 'dull-skin'], bodyAreas: [], financingEligible: false, parentSlug: 'wellness-injections' },
  { id: 'tri-immune-injection', name: 'Tri-Immune Boost Injection', category: 'wellness', price: 75, duration: 15, sessions: 1, description: 'Glutathione, zinc, and vitamin C immune support', concerns: [], bodyAreas: [], financingEligible: false, parentSlug: 'wellness-injections' },
  { id: 'vitamin-d3-injection', name: 'Vitamin D3 Injection', category: 'wellness', price: 50, duration: 15, sessions: 1, description: 'High-dose vitamin D3 for bone health and immune support', concerns: [], bodyAreas: [], financingEligible: false, parentSlug: 'wellness-injections' },
  { id: 'nad-injection', name: 'NAD+ Injection', category: 'wellness', price: 149, duration: 15, sessions: 1, description: 'Cellular energy, brain health, and longevity support', concerns: ['aging-skin'], bodyAreas: [], financingEligible: false, parentSlug: 'wellness-injections' },
  { id: 'sermorelin', name: 'Sermorelin (Growth Hormone Peptide)', category: 'wellness', price: 299, duration: 15, sessions: 1, description: 'Growth hormone stimulation for recovery, body composition, and vitality', concerns: ['aging-skin', 'body-contouring'], bodyAreas: [], financingEligible: false, parentSlug: 'wellness-injections', note: 'Monthly program' },

  // ═══ WEIGHT MANAGEMENT (GLP-1) ═══
  { id: 'glp1-semaglutide-m1', name: 'Semaglutide - Month 1 (0.25mg)', category: 'weight-management', price: 349, duration: 15, sessions: 1, description: 'GLP-1 weight loss program - starting dose', concerns: ['body-contouring'], bodyAreas: [], financingEligible: true, parentSlug: 'glp-1-weight-management' },
  { id: 'glp1-semaglutide-m2', name: 'Semaglutide - Month 2 (0.5mg)', category: 'weight-management', price: 399, duration: 15, sessions: 1, description: 'GLP-1 weight loss program - titration dose', concerns: ['body-contouring'], bodyAreas: [], financingEligible: true, parentSlug: 'glp-1-weight-management' },
  { id: 'glp1-semaglutide-m3', name: 'Semaglutide - Month 3 (1.0mg)', category: 'weight-management', price: 449, duration: 15, sessions: 1, description: 'GLP-1 weight loss program - therapeutic dose', concerns: ['body-contouring'], bodyAreas: [], financingEligible: true, parentSlug: 'glp-1-weight-management' },
  { id: 'glp1-semaglutide-m4', name: 'Semaglutide - Month 4+ (1.7mg)', category: 'weight-management', price: 499, duration: 15, sessions: 1, description: 'GLP-1 weight loss program - maintenance dose', concerns: ['body-contouring'], bodyAreas: [], financingEligible: true, parentSlug: 'glp-1-weight-management' },
  { id: 'glp1-tirzepatide-m1', name: 'Tirzepatide - Month 1 (2.5mg)', category: 'weight-management', price: 449, duration: 15, sessions: 1, description: 'Dual GIP/GLP-1 weight loss - starting dose', concerns: ['body-contouring'], bodyAreas: [], financingEligible: true, parentSlug: 'glp-1-weight-management' },
  { id: 'glp1-tirzepatide-m2', name: 'Tirzepatide - Month 2 (5mg)', category: 'weight-management', price: 499, duration: 15, sessions: 1, description: 'Dual GIP/GLP-1 weight loss - titration dose', concerns: ['body-contouring'], bodyAreas: [], financingEligible: true, parentSlug: 'glp-1-weight-management' },
  { id: 'glp1-tirzepatide-m3', name: 'Tirzepatide - Month 3 (7.5mg)', category: 'weight-management', price: 549, duration: 15, sessions: 1, description: 'Dual GIP/GLP-1 weight loss - therapeutic dose', concerns: ['body-contouring'], bodyAreas: [], financingEligible: true, parentSlug: 'glp-1-weight-management' },

  // ═══ LABS ═══
  { id: 'lab-blood-draw', name: 'Blood Draw Fee', category: 'labs', price: 25, duration: 5, sessions: 1, description: 'Per-visit venipuncture fee', concerns: [], bodyAreas: [], financingEligible: false, parentSlug: 'labs' },
  { id: 'lab-glp1-starter', name: 'GLP-1 Starter Lab Package', category: 'labs', price: 199, duration: 15, sessions: 1, description: 'CMP + A1C + Lipid + Thyroid + CBC for GLP-1 initiation', concerns: [], bodyAreas: [], financingEligible: false, parentSlug: 'labs' },
  { id: 'lab-glp1-quarterly', name: 'GLP-1 Quarterly Monitoring', category: 'labs', price: 99, duration: 10, sessions: 1, description: 'CMP + A1C + Lipid panel for ongoing GLP-1 monitoring', concerns: [], bodyAreas: [], financingEligible: false, parentSlug: 'labs' },
  { id: 'lab-hrt-starter', name: 'HRT Starter Panel', category: 'labs', price: 249, duration: 15, sessions: 1, description: 'Full hormones + metabolic panel for hormone therapy initiation', concerns: [], bodyAreas: [], financingEligible: false, parentSlug: 'labs' },
  { id: 'lab-hrt-quarterly', name: 'HRT Quarterly Monitoring', category: 'labs', price: 119, duration: 10, sessions: 1, description: 'Key hormones + metabolic markers for ongoing HRT monitoring', concerns: [], bodyAreas: [], financingEligible: false, parentSlug: 'labs' },
  { id: 'lab-wellness-screening', name: 'Wellness Screening Panel', category: 'labs', price: 149, duration: 15, sessions: 1, description: 'CMP + CBC + Lipid + Thyroid + Vitamin D comprehensive screening', concerns: [], bodyAreas: [], financingEligible: false, parentSlug: 'labs' },
  { id: 'lab-body-composition', name: 'Body Composition Analysis', category: 'labs', price: 49, duration: 10, sessions: 1, description: 'InBody scan for body fat, muscle mass, and hydration analysis', concerns: ['body-contouring'], bodyAreas: [], financingEligible: false, parentSlug: 'labs' },

  // ═══ SKINCARE ═══
  { id: 'tretinoin', name: 'Tretinoin Rx', category: 'skincare', price: 99, duration: 0, sessions: 1, description: 'Prescription-strength retinoid for acne, texture, and aging', concerns: ['acne', 'aging-skin', 'hyperpigmentation', 'dull-skin'], bodyAreas: ['face'], financingEligible: false, parentSlug: 'tretinoin', note: 'Monthly subscription' },
  { id: 'skincare-kit', name: 'Medical-Grade Skincare Kit', category: 'skincare', price: 195, duration: 0, sessions: 1, description: 'Curated medical-grade skincare regimen', concerns: ['dull-skin', 'aging-skin', 'acne'], bodyAreas: ['face'], financingEligible: false, parentSlug: 'medical-grade-skincare' },

  // ═══ HAIR ═══
  { id: 'folix-hair', name: 'Folix Hair Restoration', category: 'hair', price: 500, duration: 60, sessions: 3, description: 'Advanced hair restoration treatment for thinning hair', concerns: [], bodyAreas: ['scalp'], financingEligible: true, parentSlug: 'folix-hair-restoration' },

  // ═══ CONSULTATION ═══
  { id: 'consultation', name: 'Consultation', category: 'consultation', price: 150, duration: 30, sessions: 1, description: 'Comprehensive skin assessment with personalized treatment roadmap', concerns: [], bodyAreas: ['face'], financingEligible: false, parentSlug: 'consultation', note: '$150 deposit applies to treatment' },
];

// ─── Lookup Helpers ─────────────────────────────────────────────────

const _byId = new Map<string, UnifiedService>();
const _byCategory = new Map<ServiceCategory, UnifiedService[]>();

for (const svc of UNIFIED_CATALOG) {
  _byId.set(svc.id, svc);
  const list = _byCategory.get(svc.category) || [];
  list.push(svc);
  _byCategory.set(svc.category, list);
}

export function getServiceById(id: string): UnifiedService | undefined {
  return _byId.get(id);
}

export function getServicesByCategory(category: ServiceCategory): UnifiedService[] {
  return _byCategory.get(category) || [];
}

export function searchServices(query: string): UnifiedService[] {
  const lower = query.toLowerCase().trim();
  if (!lower) return UNIFIED_CATALOG;
  return UNIFIED_CATALOG.filter(
    (s) =>
      s.name.toLowerCase().includes(lower) ||
      s.description.toLowerCase().includes(lower) ||
      s.category.includes(lower) ||
      s.concerns.some((c) => c.includes(lower))
  );
}

export function getServicesByConcern(concern: string): UnifiedService[] {
  return UNIFIED_CATALOG.filter((s) => s.concerns.includes(concern));
}

// ─── Legacy Compatibility ───────────────────────────────────────────
// Build a SERVICE_CATALOG-compatible lookup for parser.ts matchService()

export function buildLegacyCatalog(): Record<string, { price: number; duration: string; category: string }> {
  const catalog: Record<string, { price: number; duration: string; category: string }> = {};

  for (const svc of UNIFIED_CATALOG) {
    const durStr = svc.duration > 0 ? `${svc.duration} min` : ' - ';
    const catStr = CATEGORY_LABELS[svc.category] || svc.category;

    // Primary key: full name lowercased
    catalog[svc.name.toLowerCase()] = { price: svc.price, duration: durStr, category: catStr };

    // Short aliases for common matches
    const shortName = svc.name
      .replace(/^Laser Hair Removal - /, '')
      .replace(/^RF Microneedling - /, 'rf microneedling ')
      .replace(/^Sofwave /, 'sofwave ')
      .replace(/^BioRePeel /, 'biorepeel ')
      .toLowerCase()
      .trim();

    if (shortName !== svc.name.toLowerCase()) {
      catalog[shortName] = { price: svc.price, duration: durStr, category: catStr };
    }
  }

  // Add extra aliases for fuzzy matching
  catalog['hydrafacial'] = catalog['signature hydrafacial'];
  catalog['hydrafacial signature'] = catalog['signature hydrafacial'];
  catalog['rf microneedling'] = catalog['rf microneedling full face'];
  catalog['rf microneedling face'] = catalog['rf microneedling full face'];
  catalog['rf microneedling face + neck'] = catalog['rf microneedling full face & neck'];
  catalog['sofwave'] = catalog['sofwave full face'];
  catalog['sofwave full face + neck'] = catalog['sofwave full face + neck'] || catalog['sofwave full face & neck'];
  catalog['vi peel purify'] = catalog['vi peel'];
  catalog['vi peel precision plus'] = catalog['vi peel'];
  catalog['prx'] = catalog['prx-t33'];
  catalog['picoway'] = { price: 450, duration: '45 min', category: 'Laser' };
  catalog['picoway laser'] = { price: 450, duration: '45 min', category: 'Laser' };
  catalog['botox'] = { price: 350, duration: '30 min', category: 'Injectables' };
  catalog['dermal fillers'] = { price: 650, duration: '45 min', category: 'Injectables' };
  catalog['filler'] = { price: 650, duration: '45 min', category: 'Injectables' };
  catalog['laser hair removal'] = { price: 225, duration: '30 min', category: 'Laser' };
  catalog['glp-1'] = catalog['semaglutide - month 1 (0.25mg)'] || { price: 349, duration: '15 min', category: 'Weight Management' };
  catalog['glp-1 program'] = catalog['glp-1'];
  catalog['b12'] = catalog['vitamin b12 injection'];
  catalog['b12 injection'] = catalog['vitamin b12 injection'];
  catalog['nad+'] = catalog['nad+ injection'];
  catalog['nad+ injection'] = catalog['nad+ injection'];
  catalog['glutathione'] = catalog['glutathione injection'];
  catalog['glutathione mega'] = catalog['glutathione injection'];
  catalog['tri-immune'] = catalog['tri-immune boost injection'];
  catalog['tri-immune boost'] = catalog['tri-immune boost injection'];
  catalog['vitamin d3'] = catalog['vitamin d3 injection'];
  catalog['vitamin injection'] = catalog['vitamin d3 injection'];
  catalog['tretinoin 0.05%'] = catalog['tretinoin rx'];
  catalog['medical-grade skincare kit'] = catalog['medical-grade skincare kit'];
  catalog['skincare kit'] = catalog['medical-grade skincare kit'];
  catalog['rx skincare protocol'] = catalog['tretinoin rx'];
  catalog['glow stack'] = { price: 75, duration: '15 min', category: 'Wellness' };
  catalog['glow stack vitamins'] = { price: 75, duration: '15 min', category: 'Wellness' };
  catalog['folix hair restoration'] = catalog['folix hair restoration'];
  catalog['skin consultation'] = catalog['consultation'];
  catalog['dermaplaning'] = catalog['dermaplaning add-on'];
  catalog['consultation'] = catalog['consultation'];

  // Additional fuzzy aliases for common variations
  catalog['rf micro-needling'] = catalog['rf microneedling full face'];
  catalog['rf micro needling'] = catalog['rf microneedling full face'];
  catalog['lhr'] = catalog['laser hair removal'];
  catalog['laser hair'] = catalog['laser hair removal'];
  catalog['semaglutide'] = catalog['glp-1'];
  catalog['tirzepatide'] = catalog['tirzepatide - month 1 (2.5mg)'] || catalog['glp-1'];
  catalog['tretinoin'] = catalog['tretinoin rx'];
  catalog['laser facial'] = catalog['nd:yag laser facial'];
  catalog['nd:yag'] = catalog['nd:yag laser facial'];
  catalog['ndyag'] = catalog['nd:yag laser facial'];
  catalog['biorepeel'] = catalog['biorepeel face'];
  catalog['bio repeel'] = catalog['biorepeel face'];
  catalog['biore peel'] = catalog['biorepeel face'];

  return catalog;
}

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  'laser-hair-removal': 'Laser Hair Removal',
  'facial': 'Facials & HydraFacial',
  'chemical-peel': 'Chemical Peels',
  'rf-microneedling': 'RF Microneedling',
  'skin-tightening': 'Skin Tightening',
  'scar-reduction': 'Scar Reduction',
  'laser': 'Laser Treatments',
  'injectables': 'Injectables',
  'wellness': 'Wellness Injections',
  'weight-management': 'Weight Management',
  'hormones': 'Hormone Therapy',
  'labs': 'Labs & Testing',
  'skincare': 'Rx Skincare',
  'hair': 'Hair Restoration',
  'consultation': 'Consultation',
};

// Categories useful for the consultation wizard and plan builder
export const SERVICE_CATEGORIES: { id: ServiceCategory; label: string; icon: string }[] = [
  { id: 'facial', label: 'Facials & HydraFacial', icon: 'Sparkles' },
  { id: 'laser-hair-removal', label: 'Laser Hair Removal', icon: 'Zap' },
  { id: 'rf-microneedling', label: 'RF Microneedling', icon: 'Target' },
  { id: 'skin-tightening', label: 'Skin Tightening', icon: 'TrendingUp' },
  { id: 'chemical-peel', label: 'Chemical Peels', icon: 'Droplets' },
  { id: 'laser', label: 'Laser Treatments', icon: 'Sun' },
  { id: 'scar-reduction', label: 'Scar Reduction', icon: 'Shield' },
  { id: 'wellness', label: 'Wellness Injections', icon: 'Heart' },
  { id: 'weight-management', label: 'Weight Management', icon: 'Activity' },
  { id: 'labs', label: 'Labs & Testing', icon: 'TestTube' },
  { id: 'skincare', label: 'Rx Skincare', icon: 'Palette' },
  { id: 'hair', label: 'Hair Restoration', icon: 'Scissors' },
];
