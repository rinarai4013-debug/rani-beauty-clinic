/**
 * Service Image Mapping
 *
 * Maps service slugs → local image paths in /public/images/services/
 * All images sourced from booking.ranibeautyclinic.com
 *
 * Each service can have:
 *   - image: primary treatment/hero image
 *   - hoverImage: secondary image for hover effects
 *   - category: for grouping (face / body / non-surgical / wellness)
 */

export interface ServiceImageEntry {
  /** Primary treatment image */
  image: string;
  /** Secondary image (card hover, gallery) */
  hoverImage?: string;
  /** Category for filtering & panels */
  category: "face" | "body" | "non-surgical" | "wellness";
}

/**
 * Maps service slug (used in routes) → image paths
 * Keys match slugs from aesthetic-services.ts / wellness-services.ts
 */
export const serviceImages: Record<string, ServiceImageEntry> = {
  // ─── Aesthetic Services ─────────────────────────────────────
  "laser-hair-removal": {
    image: "/images/services/laserhairremovals/laser-hero.jpg",
    hoverImage: "/images/services/laserhairremovals/laser-hover.jpg",
    category: "body",
  },
  hydrafacial: {
    image: "/images/services/hydrafacial/1.png",
    hoverImage: "/images/services/hydrafacial/2.webp",
    category: "face",
  },
  "rf-microneedling": {
    image: "/images/services/fullface/1.jpg",
    hoverImage: "/images/services/fullface/2.jpg",
    category: "face",
  },
  biorepeel: {
    image: "/images/services/biorepeel/1.jpg",
    hoverImage: "/images/services/biorepeel/2.webp",
    category: "face",
  },
  "botox-dysport": {
    image: "/images/services/botox/1.png",
    hoverImage: "/images/services/botox/2.webp",
    category: "face",
  },
  "dermal-fillers": {
    image: "/images/services/lipfiller/1.jpg",
    hoverImage: "/images/services/lipfiller/2.jpg",
    category: "face",
  },
  "red-light-therapy": {
    image: "/images/services/redlight/1.webp",
    hoverImage: "/images/services/redlight/2.webp",
    category: "non-surgical",
  },
  "laser-acne-facial": {
    image: "/images/services/laserfacialacne/1.webp",
    hoverImage: "/images/services/laserfacialacne/2.jpg",
    category: "face",
  },
  "chemical-peels": {
    image: "/images/services/vipeel/1.webp",
    hoverImage: "/images/services/vipeel/2.webp",
    category: "face",
  },
  "ai-skin-analysis": {
    image: "/images/services/laserfacial/1.avif",
    hoverImage: "/images/services/laserfacial/2.jpg",
    category: "face",
  },
  sofwave: {
    image: "/images/services/softwave/1.jpg",
    hoverImage: "/images/services/softwave/2.webp",
    category: "non-surgical",
  },
  "scar-reduction": {
    image: "/images/services/acnescarvipeel/1.png",
    hoverImage: "/images/services/acnescarvipeel/2.jpg",
    category: "face",
  },

  // ─── Wellness Services ──────────────────────────────────────
  "glp1-weight-management": {
    image: "/images/services/wellness/glp1-1.jpg",
    hoverImage: "/images/services/wellness/glp1-2.jpg",
    category: "wellness",
  },
  "nad-injections": {
    image: "/images/services/wellness/nad-1.jpg",
    hoverImage: "/images/services/wellness/nad-2.jpg",
    category: "wellness",
  },
  "vitamin-injections": {
    image: "/images/services/wellness/vitamin-1.jpg",
    hoverImage: "/images/services/wellness/vitamin-2.jpg",
    category: "wellness",
  },
  "hormone-therapy": {
    image: "/images/services/wellness/hormone-1.jpg",
    hoverImage: "/images/services/wellness/hormone-2.jpg",
    category: "wellness",
  },
  "blood-work": {
    image: "/images/services/wellness/bloodwork-1.jpg",
    hoverImage: "/images/services/wellness/bloodwork-2.jpg",
    category: "wellness",
  },
};

/**
 * Maps service variation slugs → image paths
 * Keys are "parentSlug/variationSlug"
 */
export const variationImages: Record<string, ServiceImageEntry> = {
  // ─── Laser Hair Removal Variations ──────────────────────────
  "laser-hair-removal/full-brazilian": {
    image: "/images/services/laserhairremovals/fullbrazilian.jpeg",
    hoverImage: "/images/services/laserhairremovals/fullbrazilian2.jpeg",
    category: "body",
  },
  "laser-hair-removal/underarms": {
    image: "/images/services/laserhairremovals/underarms.jpeg",
    hoverImage: "/images/services/laserhairremovals/underarms2.jpeg",
    category: "body",
  },
  "laser-hair-removal/full-legs": {
    image: "/images/services/laserhairremovals/fulllegs.jpeg",
    hoverImage: "/images/services/laserhairremovals/fulllegs2.jpeg",
    category: "body",
  },
  "laser-hair-removal/full-body": {
    image: "/images/services/laserhairremovals/fullbodylaser.jpeg",
    hoverImage: "/images/services/laserhairremovals/fullbodylaser2.jpeg",
    category: "body",
  },
  "laser-hair-removal/full-face": {
    image: "/images/services/laserhairremovals/FullFaceLaserHairRemoval.jpeg",
    hoverImage: "/images/services/laserhairremovals/FullFaceLaserHairRemoval2.jpeg",
    category: "body",
  },
  "laser-hair-removal/bikini-line": {
    image: "/images/services/laserhairremovals/pantyline.jpeg",
    hoverImage: "/images/services/laserhairremovals/pantyline2.jpeg",
    category: "body",
  },
  "laser-hair-removal/back": {
    image: "/images/services/laserhairremovals/fullback.jpeg",
    hoverImage: "/images/services/laserhairremovals/fullback2.jpeg",
    category: "body",
  },
  "laser-hair-removal/chest": {
    image: "/images/services/laserhairremovals/fullchest.jpeg",
    hoverImage: "/images/services/laserhairremovals/fullchest2.jpeg",
    category: "body",
  },
  "laser-hair-removal/arms": {
    image: "/images/services/arms/1.jpg",
    hoverImage: "/images/services/arms/2.jpeg",
    category: "body",
  },
  "laser-hair-removal/upper-lip": {
    image: "/images/services/laserhairremovals/upperlip.png",
    hoverImage: "/images/services/laserhairremovals/limitdtimeupperlip.jpeg",
    category: "body",
  },
  "laser-hair-removal/chin": {
    image: "/images/services/laserhairremovals/chin.png",
    hoverImage: "/images/services/laserhairremovals/chin2.png",
    category: "body",
  },
  "laser-hair-removal/neck": {
    image: "/images/services/laserhairremovals/neck.jpeg",
    hoverImage: "/images/services/laserhairremovals/neck2.jpeg",
    category: "body",
  },
  "laser-hair-removal/stomach": {
    image: "/images/services/laserhairremovals/fullabs.jpeg",
    hoverImage: "/images/services/laserhairremovals/fullabs2.jpeg",
    category: "body",
  },
  "laser-hair-removal/shoulders": {
    image: "/images/services/back/1.avif",
    hoverImage: "/images/services/back/2.jpg",
    category: "body",
  },
  "laser-hair-removal/feet-and-toes": {
    image: "/images/services/laserhairremovals/feettoes.jpeg",
    hoverImage: "/images/services/laserhairremovals/feettoes2.jpeg.png",
    category: "body",
  },

  // ─── Botox & Dysport Variations ─────────────────────────────
  "botox-dysport/forehead-lines": {
    image: "/images/services/botox/1.png",
    hoverImage: "/images/services/botox/2.webp",
    category: "face",
  },
  "botox-dysport/crows-feet": {
    image: "/images/services/traptox/1.png",
    hoverImage: "/images/services/traptox/2.jpg",
    category: "face",
  },
  "botox-dysport/frown-lines": {
    image: "/images/services/botox/1.png",
    hoverImage: "/images/services/botox/2.webp",
    category: "face",
  },
  "botox-dysport/lip-flip": {
    image: "/images/services/lipfiller/1.jpg",
    hoverImage: "/images/services/lipfiller/2.jpg",
    category: "face",
  },
  "botox-dysport/masseter": {
    image: "/images/services/traptox/1.png",
    hoverImage: "/images/services/traptox/2.jpg",
    category: "face",
  },

  // ─── Dermal Fillers Variations ──────────────────────────────
  "dermal-fillers/lips": {
    image: "/images/services/lipfiller/1.jpg",
    hoverImage: "/images/services/lipfiller/2.jpg",
    category: "face",
  },
  "dermal-fillers/cheeks": {
    image: "/images/services/cheekfiller/1.webp",
    hoverImage: "/images/services/cheekfiller/2.webp",
    category: "face",
  },
  "dermal-fillers/jawline": {
    image: "/images/services/jawlinefiller/1.webp",
    hoverImage: "/images/services/jawlinefiller/2.webp",
    category: "face",
  },
  "dermal-fillers/under-eyes": {
    image: "/images/services/eyefiller/1.webp",
    hoverImage: "/images/services/eyefiller/2.webp",
    category: "face",
  },
  "dermal-fillers/nasolabial-folds": {
    image: "/images/services/nosefiller/1.webp",
    hoverImage: "/images/services/nosefiller/2.webp",
    category: "face",
  },

  // ─── Chemical Peels Variations ──────────────────────────────
  "chemical-peels/vi-peel-original": {
    image: "/images/services/vipeel/1.webp",
    hoverImage: "/images/services/vipeel/2.webp",
    category: "face",
  },
  "chemical-peels/vi-peel-advanced": {
    image: "/images/services/acnevipeel/1.jpg",
    hoverImage: "/images/services/acnevipeel/2.webp",
    category: "face",
  },
  "chemical-peels/vi-peel-precision-plus": {
    image: "/images/services/hyperpigmintaionpeel/1.webp",
    hoverImage: "/images/services/hyperpigmintaionpeel/2.jpg",
    category: "face",
  },
  "chemical-peels/vi-peel-purify": {
    image: "/images/services/sensitivevipeel/1.webp",
    hoverImage: "/images/services/sensitivevipeel/2.avif",
    category: "face",
  },
  "chemical-peels/prx-t33": {
    image: "/images/services/cosmelan/1.png",
    hoverImage: "/images/services/cosmelan/2.jpg",
    category: "face",
  },

  // ─── RF Microneedling Variations ────────────────────────────
  "rf-microneedling/face": {
    image: "/images/services/fullface/1.jpg",
    hoverImage: "/images/services/fullface/2.jpg",
    category: "face",
  },
  "rf-microneedling/neck-and-decollete": {
    image: "/images/services/faceneck/1.avif",
    hoverImage: "/images/services/faceneck/2.webp",
    category: "face",
  },
  "rf-microneedling/acne-scars": {
    image: "/images/services/acnescarvipeel/1.png",
    hoverImage: "/images/services/acnescarvipeel/2.jpg",
    category: "face",
  },
  "rf-microneedling/stretch-marks": {
    image: "/images/services/abdomen/1.jpg",
    hoverImage: "/images/services/abdomen/2.jpg",
    category: "body",
  },
  "rf-microneedling/body": {
    image: "/images/services/abdomen/1.jpg",
    hoverImage: "/images/services/abdomen/2.jpg",
    category: "body",
  },
  "rf-microneedling/under-eyes": {
    image: "/images/services/eyefiller/1.webp",
    hoverImage: "/images/services/eyefiller/2.webp",
    category: "face",
  },

  // ─── BioRePeel Variations ───────────────────────────────────
  "biorepeel/face": {
    image: "/images/services/biorepeel/1.jpg",
    hoverImage: "/images/services/biorepeel/2.webp",
    category: "face",
  },
  "biorepeel/body": {
    image: "/images/services/chemback/1.jpg",
    hoverImage: "/images/services/chemback/2.jpg",
    category: "body",
  },
  "biorepeel/hands": {
    image: "/images/services/laserhairremovals/Handsangfingers.jpeg",
    hoverImage: "/images/services/laserhairremovals/Handsangfingers2.jpeg",
    category: "body",
  },
  "biorepeel/acne": {
    image: "/images/services/acnevipeel/1.jpg",
    hoverImage: "/images/services/acnevipeel/2.webp",
    category: "face",
  },
  "biorepeel/hyperpigmentation": {
    image: "/images/services/hyperpigmintaionpeel/1.webp",
    hoverImage: "/images/services/hyperpigmintaionpeel/2.jpg",
    category: "face",
  },

  // ─── Sofwave Variations ─────────────────────────────────────
  "sofwave/face-lift": {
    image: "/images/services/softwave/1.jpg",
    hoverImage: "/images/services/softwave/2.webp",
    category: "non-surgical",
  },
  "sofwave/brow-lift": {
    image: "/images/services/softwave/1.jpg",
    hoverImage: "/images/services/softwave/2.webp",
    category: "non-surgical",
  },
  "sofwave/jawline": {
    image: "/images/services/jawlinefiller/1.webp",
    hoverImage: "/images/services/jawlinefiller/2.webp",
    category: "non-surgical",
  },
  "sofwave/neck-tightening": {
    image: "/images/services/neckfiller/1.webp",
    hoverImage: "/images/services/neckfiller/2.webp",
    category: "non-surgical",
  },
  "sofwave/submental": {
    image: "/images/services/neck/1.jpg",
    hoverImage: "/images/services/neck/2.jpg",
    category: "non-surgical",
  },

  // ─── Scar Reduction Variations ──────────────────────────────
  "scar-reduction/acne-scars": {
    image: "/images/services/acnescarvipeel/1.png",
    hoverImage: "/images/services/acnescarvipeel/2.jpg",
    category: "face",
  },
  "scar-reduction/surgical-scars": {
    image: "/images/services/laserresurfacing/1.webp",
    hoverImage: "/images/services/laserresurfacing/2.webp",
    category: "body",
  },
  "scar-reduction/stretch-marks": {
    image: "/images/services/abdomen/1.jpg",
    hoverImage: "/images/services/abdomen/2.jpg",
    category: "body",
  },

  // ─── Peptide Therapy Variations (ARCHIVED — pending FDA reclassification) ───

  // ─── GLP-1 Weight Management Variations ─────────────────────
  "glp1-weight-management/semaglutide": {
    image: "/images/services/wellness/glp1-1.jpg",
    hoverImage: "/images/services/wellness/glp1-2.jpg",
    category: "wellness",
  },
  "glp1-weight-management/tirzepatide": {
    image: "/images/services/wellness/glp1-2.jpg",
    hoverImage: "/images/services/wellness/glp1-1.jpg",
    category: "wellness",
  },

  // ─── Hormone Therapy Variations ─────────────────────────────
  "hormone-therapy/testosterone": {
    image: "/images/services/wellness/hormone-1.jpg",
    hoverImage: "/images/services/wellness/hormone-2.jpg",
    category: "wellness",
  },
  "hormone-therapy/female-hrt": {
    image: "/images/services/wellness/hormone-2.jpg",
    hoverImage: "/images/services/wellness/hormone-1.jpg",
    category: "wellness",
  },
  "hormone-therapy/thyroid-optimization": {
    image: "/images/services/wellness/hormone-1.jpg",
    hoverImage: "/images/services/wellness/hormone-2.jpg",
    category: "wellness",
  },
  "hormone-therapy/dhea-therapy": {
    image: "/images/services/wellness/hormone-2.jpg",
    hoverImage: "/images/services/wellness/hormone-1.jpg",
    category: "wellness",
  },

  // ─── Vitamin Injections Variations ──────────────────────────
  "vitamin-injections/b12": {
    image: "/images/services/wellness/vitamin-1.jpg",
    hoverImage: "/images/services/wellness/vitamin-2.jpg",
    category: "wellness",
  },
  "vitamin-injections/glutathione": {
    image: "/images/services/wellness/vitamin-2.jpg",
    hoverImage: "/images/services/wellness/vitamin-1.jpg",
    category: "wellness",
  },
  "vitamin-injections/lipo-mino": {
    image: "/images/services/wellness/vitamin-1.jpg",
    hoverImage: "/images/services/wellness/vitamin-2.jpg",
    category: "wellness",
  },
  "vitamin-injections/biotin": {
    image: "/images/services/wellness/vitamin-2.jpg",
    hoverImage: "/images/services/wellness/vitamin-1.jpg",
    category: "wellness",
  },
};

/**
 * Category panel images for homepage ServiceCategoryPanels
 */
export const categoryImages = {
  face: "/images/services/hydrafacial/1.png",
  body: "/images/services/body-laser-cover.jpg",
  "non-surgical": "/images/services/softwave/1.jpg",
  wellness: "/images/services/wellness/hormone-2.jpg",
};

/**
 * Helper: get image for a service or variation
 */
export function getServiceImage(
  slug: string,
  variationSlug?: string
): ServiceImageEntry | null {
  if (variationSlug) {
    const key = `${slug}/${variationSlug}`;
    return variationImages[key] || serviceImages[slug] || null;
  }
  return serviceImages[slug] || null;
}
