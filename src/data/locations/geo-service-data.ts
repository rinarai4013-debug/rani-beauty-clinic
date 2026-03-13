import { clinicInfo } from "@/data/clinic-info";

// All service slugs that get geo-service combo pages
export const allServiceSlugs = [
  "laser-hair-removal",
  "hydrafacial",
  "rf-microneedling",
  "biorepeel",
  "botox-dysport",
  "dermal-fillers",
  "red-light-therapy",
  "laser-acne-facial",
  "chemical-peels",
  "ai-skin-analysis",
  "sofwave",
  "scar-reduction",
  "glp1-weight-management",
  "peptide-therapy",
  "nad-injections",
  "vitamin-injections",
  "hormone-therapy",
  "blood-work",
] as const;

export type ServiceSlug = (typeof allServiceSlugs)[number];

interface ServiceInfo {
  slug: ServiceSlug;
  name: string;
  shortDescription: string;
  category: "aesthetic" | "wellness";
  keyBenefits: string[];
  technology?: string;
  priceRange: string;
  faqs: { question: string; answer: string }[];
}

export const serviceDirectory: Record<ServiceSlug, ServiceInfo> = {
  "laser-hair-removal": {
    slug: "laser-hair-removal",
    name: "Laser Hair Removal",
    shortDescription:
      "Permanent hair reduction for all skin types using the Candela GentleMax Pro Plus with dual-wavelength technology and integrated cooling for pain-free treatments.",
    category: "aesthetic",
    keyBenefits: [
      "Safe for all skin types (Fitzpatrick I-VI)",
      "Dual-wavelength technology (Alexandrite 755nm + Nd:YAG 1064nm)",
      "Integrated air cooling for pain-free comfort",
      "Permanent hair reduction in 6-8 sessions",
    ],
    technology: "Candela GentleMax Pro Plus",
    priceRange: "$79 - $1,199 per session",
    faqs: [
      {
        question: "How many laser hair removal sessions will I need?",
        answer:
          "Most clients need 6-8 sessions spaced 4-8 weeks apart for optimal permanent hair reduction. The exact number depends on your hair color, thickness, and the treatment area.",
      },
      {
        question: "Is laser hair removal safe for dark skin?",
        answer:
          "Yes. Our Candela GentleMax Pro Plus features the Nd:YAG 1064nm wavelength, which is specifically designed for safe and effective treatment on darker skin tones (Fitzpatrick IV-VI).",
      },
      {
        question: "Does laser hair removal hurt?",
        answer:
          "Our system features integrated DCD (Dynamic Cooling Device) that sprays a cooling mist before each pulse, making treatments virtually pain-free. Most clients describe it as a mild snap.",
      },
    ],
  },
  hydrafacial: {
    slug: "hydrafacial",
    name: "HydraFacial MD",
    shortDescription:
      "Multi-step facial treatment that cleanses, exfoliates, extracts, and hydrates skin using Vortex-Fusion technology for an immediate glow with zero downtime.",
    category: "aesthetic",
    keyBenefits: [
      "Immediate visible results after one session",
      "Zero downtime — return to activities right away",
      "Customizable with boosters for specific concerns",
      "Suitable for all skin types and conditions",
    ],
    technology: "HydraFacial MD",
    priceRange: "$99 - $575 per session",
    faqs: [
      {
        question: "How often should I get a HydraFacial?",
        answer:
          "For optimal results, we recommend monthly HydraFacial treatments. This maintains your skin's health and keeps your complexion clear and hydrated year-round.",
      },
      {
        question: "Can I wear makeup after a HydraFacial?",
        answer:
          "While you can apply makeup immediately after, we recommend letting your skin breathe for at least 6 hours to maximize the benefits of the treatment serums.",
      },
    ],
  },
  "rf-microneedling": {
    slug: "rf-microneedling",
    name: "RF Microneedling",
    shortDescription:
      "Collagen-stimulating skin tightening treatment using the Cutera Secret Pro to deliver radiofrequency energy through precision microneedles for firmer, smoother skin.",
    category: "aesthetic",
    keyBenefits: [
      "Stimulates collagen and elastin production",
      "Treats wrinkles, scarring, laxity, and stretch marks",
      "Customizable needle depth for different areas",
      "Results improve over 3-6 months as collagen rebuilds",
    ],
    technology: "Cutera Secret Pro",
    priceRange: "$495 - $1,500 per session",
    faqs: [
      {
        question: "How many RF microneedling sessions do I need?",
        answer:
          "Most clients see significant improvement with 3 sessions spaced 4-6 weeks apart. A maintenance session every 6-12 months helps sustain results.",
      },
      {
        question: "What is the downtime for RF microneedling?",
        answer:
          "Expect 2-3 days of mild redness and swelling, similar to a sunburn. Most clients return to normal activities within 24-48 hours.",
      },
    ],
  },
  biorepeel: {
    slug: "biorepeel",
    name: "BioRePeel",
    shortDescription:
      "Innovative TCA-based biorevitalization treatment combining exfoliation with hydration and bio-stimulation for improved skin texture without downtime.",
    category: "aesthetic",
    keyBenefits: [
      "Zero downtime chemical peel alternative",
      "Combines exfoliation + hydration + bio-stimulation",
      "Suitable for face, neck, body, and intimate areas",
      "Visible improvement in skin texture and tone",
    ],
    priceRange: "$225 - $575 per session",
    faqs: [
      {
        question: "What makes BioRePeel different from a regular chemical peel?",
        answer:
          "BioRePeel uses a biphasic technology that exfoliates while simultaneously delivering amino acids, vitamins, and GABA to nourish and bio-stimulate the skin — all without the typical peeling and downtime.",
      },
    ],
  },
  "botox-dysport": {
    slug: "botox-dysport",
    name: "Botox & Dysport",
    shortDescription:
      "Neurotoxin injections for wrinkle reduction administered under the supervision of Dr. Alexander Landfield, a board-certified neurologist, for precise, natural-looking results.",
    category: "aesthetic",
    keyBenefits: [
      "Neurologist-supervised for maximum precision",
      "Natural-looking results that preserve expression",
      "Quick 15-20 minute treatment sessions",
      "Results last 3-4 months on average",
    ],
    priceRange: "Starting at $12/unit",
    faqs: [
      {
        question:
          "Why does having a neurologist supervise Botox matter?",
        answer:
          "Botox is a neurotoxin that works by blocking nerve signals to muscles. A neurologist like Dr. Landfield has deep expertise in neuromuscular anatomy, enabling more precise placement and better outcomes.",
      },
      {
        question: "What is the difference between Botox and Dysport?",
        answer:
          "Both are botulinum toxin type A products. Dysport tends to spread slightly more, making it ideal for larger areas like the forehead. Botox is more precise for smaller areas. Our team will recommend the best option for your goals.",
      },
    ],
  },
  "dermal-fillers": {
    slug: "dermal-fillers",
    name: "Dermal Fillers",
    shortDescription:
      "Hyaluronic acid-based injectable fillers to restore volume, contour facial features, and smooth deep lines for a refreshed, youthful appearance.",
    category: "aesthetic",
    keyBenefits: [
      "Immediate volume restoration and contouring",
      "Natural-looking enhancement of cheeks, lips, and jawline",
      "Results last 6-18 months depending on product",
      "Reversible with hyaluronidase if needed",
    ],
    priceRange: "Starting at $650/syringe",
    faqs: [
      {
        question: "How long do dermal fillers last?",
        answer:
          "Depending on the product and area treated, fillers typically last 6-18 months. Lip fillers tend to last 6-9 months while cheek fillers can last 12-18 months.",
      },
    ],
  },
  "red-light-therapy": {
    slug: "red-light-therapy",
    name: "Red Light Therapy",
    shortDescription:
      "Non-invasive photobiomodulation therapy using specific wavelengths of red and near-infrared light to reduce inflammation, promote healing, and support cellular repair.",
    category: "aesthetic",
    keyBenefits: [
      "Reduces inflammation and promotes healing",
      "Supports collagen production and skin renewal",
      "Non-invasive with zero downtime",
      "Can enhance results of other treatments",
    ],
    priceRange: "$49 - $99 per session",
    faqs: [
      {
        question: "How does red light therapy work?",
        answer:
          "Red light at 630-660nm and near-infrared light at 810-850nm penetrate the skin to stimulate mitochondrial function, increasing cellular energy (ATP) production. This accelerates healing, reduces inflammation, and promotes collagen synthesis.",
      },
    ],
  },
  "laser-acne-facial": {
    slug: "laser-acne-facial",
    name: "Laser Acne Facial",
    shortDescription:
      "Specialized facial treatment combining laser technology with deep cleansing to target active acne, reduce inflammation, and treat post-acne scarring.",
    category: "aesthetic",
    keyBenefits: [
      "Targets active acne and prevents new breakouts",
      "Reduces post-acne scarring and hyperpigmentation",
      "Combines laser precision with clinical extractions",
      "Safe for acne-prone and sensitive skin types",
    ],
    priceRange: "$475 per session",
    faqs: [
      {
        question: "How does the laser acne facial work?",
        answer:
          "The treatment combines Nd:YAG laser energy to kill acne-causing bacteria and reduce inflammation with professional extractions and therapeutic products to clear and calm the skin.",
      },
    ],
  },
  "chemical-peels": {
    slug: "chemical-peels",
    name: "Chemical Peels",
    shortDescription:
      "Professional-grade chemical exfoliation treatments including VI Peel and PRX T33 to address hyperpigmentation, acne scarring, fine lines, and uneven texture.",
    category: "aesthetic",
    keyBenefits: [
      "Multiple formulations for different concerns",
      "Effective for hyperpigmentation and sun damage",
      "Improves skin texture and reduces fine lines",
      "Safe for most skin types when properly selected",
    ],
    priceRange: "$325 - $475 per session",
    faqs: [
      {
        question: "Which type of chemical peel is right for me?",
        answer:
          "During your consultation, we assess your skin type, concerns, and goals to recommend the best peel. VI Peel is excellent for pigmentation and anti-aging, while PRX T33 offers deep revitalization without traditional peeling.",
      },
    ],
  },
  "ai-skin-analysis": {
    slug: "ai-skin-analysis",
    name: "AI Skin Analysis",
    shortDescription:
      "Advanced imaging technology that analyzes your skin at the sub-surface level to identify concerns invisible to the naked eye, creating a data-driven treatment plan.",
    category: "aesthetic",
    keyBenefits: [
      "Identifies sun damage, pigmentation, and wrinkles below the surface",
      "Creates an objective baseline for tracking progress",
      "Data-driven personalized treatment recommendations",
      "Quick, non-invasive assessment",
    ],
    priceRange: "Complimentary with consultation",
    faqs: [
      {
        question: "What does the AI skin analysis show?",
        answer:
          "The analysis maps your skin for wrinkles, texture irregularities, pore size, UV damage, pigmentation depth, and redness. This helps us identify concerns before they become visible and create a proactive treatment plan.",
      },
    ],
  },
  sofwave: {
    slug: "sofwave",
    name: "Sofwave",
    shortDescription:
      "FDA-cleared ultrasonic skin tightening technology that lifts and firms the skin on the face, neck, and brow using Synchronous Ultrasound Parallel Beam technology (SUPERB).",
    category: "aesthetic",
    keyBenefits: [
      "Non-invasive alternative to surgical facelift",
      "Lifts brows, tightens jawline, and smooths neck",
      "Single treatment with results over 3-6 months",
      "Minimal discomfort with built-in cooling",
    ],
    priceRange: "$1,150 - $3,999 per session",
    faqs: [
      {
        question: "How is Sofwave different from RF microneedling?",
        answer:
          "Sofwave uses focused ultrasound energy at a precise depth of 1.5mm to stimulate collagen without breaking the skin surface. RF microneedling uses tiny needles to deliver radiofrequency energy at adjustable depths. Sofwave is ideal for lifting and tightening, while RF micro is better for texture and scarring.",
      },
    ],
  },
  "scar-reduction": {
    slug: "scar-reduction",
    name: "Scar Reduction",
    shortDescription:
      "Specialized treatment protocols combining laser, RF microneedling, and topical therapies to reduce the appearance of acne scars, surgical scars, and stretch marks.",
    category: "aesthetic",
    keyBenefits: [
      "Multi-modality approach for best results",
      "Treats acne scars, surgical scars, and stretch marks",
      "Stimulates natural skin remodeling",
      "Customized plan based on scar type and depth",
    ],
    priceRange: "$325 - $695 per session",
    faqs: [
      {
        question: "How many scar reduction sessions will I need?",
        answer:
          "Most clients see significant improvement with 3-6 sessions depending on scar depth and type. We create a customized plan during your consultation that may combine multiple technologies for optimal results.",
      },
    ],
  },
  "glp1-weight-management": {
    slug: "glp1-weight-management",
    name: "GLP-1 Weight Management",
    shortDescription:
      "Physician-supervised weight loss using Semaglutide and Tirzepatide with in-house blood work, custom dosing, and ongoing medical monitoring under Dr. Landfield's supervision.",
    category: "wellness",
    keyBenefits: [
      "Physician-supervised by Dr. Alexander Landfield",
      "In-house blood work and health monitoring",
      "Custom dosing protocols for Semaglutide or Tirzepatide",
      "Average 15-22% body weight reduction",
    ],
    priceRange: "$249 - $699/month",
    faqs: [
      {
        question: "How much weight can I lose on GLP-1 medication?",
        answer:
          "Clinical studies show average weight loss of 15% body weight with Semaglutide and up to 22.5% with Tirzepatide over 12-18 months. Individual results vary based on adherence, diet, and exercise.",
      },
      {
        question: "Do I need blood work before starting GLP-1?",
        answer:
          "Yes. We require baseline blood work to ensure GLP-1 medication is safe for you. This includes metabolic panel, thyroid function, and other markers. All blood work is done conveniently in our clinic.",
      },
    ],
  },
  "peptide-therapy": {
    slug: "peptide-therapy",
    name: "Peptide Therapy",
    shortDescription:
      "Targeted bioactive peptide protocols including BPC-157, GHK-Cu, TB-500, and AOD-9604 for recovery, anti-aging, gut health, and performance optimization.",
    category: "wellness",
    keyBenefits: [
      "Targeted support for recovery, sleep, and vitality",
      "Multiple peptide options for different goals",
      "Physician-supervised cycling protocols",
      "Subcutaneous injections for convenient self-administration",
    ],
    priceRange: "$299 - $699/month",
    faqs: [
      {
        question: "What are the most popular peptides?",
        answer:
          "BPC-157 is popular for gut health and tissue healing, GHK-Cu for skin and hair rejuvenation, TB-500 for injury recovery, and AOD-9604 for targeted fat loss. We customize protocols based on your specific goals.",
      },
    ],
  },
  "nad-injections": {
    slug: "nad-injections",
    name: "NAD+ Injections",
    shortDescription:
      "Nicotinamide adenine dinucleotide injections to boost cellular energy, support brain function, enhance recovery, and promote healthy aging at the cellular level.",
    category: "wellness",
    keyBenefits: [
      "Boosts cellular energy and mitochondrial function",
      "Supports cognitive clarity and brain health",
      "Promotes DNA repair and healthy aging",
      "Quick subcutaneous injections with minimal downtime",
    ],
    priceRange: "$299/month",
    faqs: [
      {
        question: "What does NAD+ do for your body?",
        answer:
          "NAD+ is a coenzyme found in every cell that plays a critical role in energy metabolism, DNA repair, and cellular signaling. As we age, NAD+ levels decline. Supplementation supports energy, mental clarity, and the body's natural repair processes.",
      },
    ],
  },
  "vitamin-injections": {
    slug: "vitamin-injections",
    name: "Vitamin Injections",
    shortDescription:
      "Direct intramuscular delivery of essential vitamins and nutrients including B12, Lipo-Mino, Glutathione, and Biotin for rapid absorption and immediate benefits.",
    category: "wellness",
    keyBenefits: [
      "Bypass digestive system for 100% absorption",
      "Immediate energy and wellness boost",
      "Multiple formulations for different needs",
      "Quick 5-minute appointments",
    ],
    priceRange: "$25 - $75 per injection",
    faqs: [
      {
        question: "How often should I get vitamin injections?",
        answer:
          "Most clients benefit from weekly B12 or Lipo-Mino injections for sustained energy. Glutathione injections are typically done weekly for skin brightening. We can customize a schedule based on your goals.",
      },
    ],
  },
  "hormone-therapy": {
    slug: "hormone-therapy",
    name: "Hormone Therapy",
    shortDescription:
      "Bioidentical hormone replacement therapy (BHRT) for men and women, including testosterone, estrogen, progesterone, and DHEA, with comprehensive blood panel monitoring.",
    category: "wellness",
    keyBenefits: [
      "Comprehensive blood panels to guide treatment",
      "Bioidentical hormones for natural balance",
      "Available for both men and women",
      "Ongoing monitoring and dosage adjustment",
    ],
    priceRange: "$249 - $449/month",
    faqs: [
      {
        question: "How do I know if I need hormone therapy?",
        answer:
          "Common signs include persistent fatigue, mood changes, weight gain, low libido, brain fog, and sleep issues. We start with comprehensive blood work to measure your hormone levels and determine if therapy is appropriate.",
      },
    ],
  },
  "blood-work": {
    slug: "blood-work",
    name: "Blood Work Services",
    shortDescription:
      "In-house blood draws with comprehensive panels reviewed by Dr. Landfield. Convenient testing for metabolic health, hormone levels, thyroid function, and wellness screening.",
    category: "wellness",
    keyBenefits: [
      "Convenient in-house blood draws",
      "Results reviewed by Dr. Alexander Landfield",
      "Multiple panel options for different needs",
      "Foundation for data-driven treatment plans",
    ],
    priceRange: "$49 - $249 per panel",
    faqs: [
      {
        question: "Do I need to fast before blood work?",
        answer:
          "For metabolic and lipid panels, we recommend fasting for 8-12 hours before your appointment. Water is fine. Hormone panels and general wellness screenings typically do not require fasting.",
      },
    ],
  },
};

export function generateGeoServiceMeta(
  cityName: string,
  serviceInfo: ServiceInfo
) {
  return {
    metaTitle: `${serviceInfo.name} Near ${cityName}, WA | Rani Beauty Clinic`,
    metaDescription: `${serviceInfo.name} for ${cityName}, WA residents at Rani Beauty Clinic in Renton. ${serviceInfo.shortDescription.slice(0, 120)}. Physician-supervised. Book today!`,
  };
}

export function generateGeoServiceContent(
  cityName: string,
  driveTime: string,
  serviceInfo: ServiceInfo
) {
  const isWellness = serviceInfo.category === "wellness";
  const categoryLabel = isWellness ? "medical wellness" : "aesthetic";

  return {
    h1: `${serviceInfo.name} for ${cityName}, WA Residents`,
    intro: `${cityName} residents seeking ${isWellness ? "physician-supervised " : ""}${serviceInfo.name.toLowerCase()} can find expert care at ${clinicInfo.name} in Renton, just ${driveTime} away. Our ${serviceInfo.name.toLowerCase()} treatments are performed under the supervision of ${clinicInfo.medicalDirector.name}, ${clinicInfo.medicalDirector.specialty}, ensuring the highest standards of safety and efficacy.`,
    description: serviceInfo.shortDescription,
    benefits: serviceInfo.keyBenefits,
    technology: serviceInfo.technology,
    pricing: serviceInfo.priceRange,
    faqs: serviceInfo.faqs.map((faq) => ({
      question: faq.question.replace(
        /\?$/,
        ` near ${cityName}?`
      ).replace(` near ${cityName} near ${cityName}?`, ` near ${cityName}?`),
      answer: faq.answer,
    })),
    cta: `Ready to get started with ${serviceInfo.name.toLowerCase()}? ${cityName} residents can book a consultation at ${clinicInfo.name} by calling ${clinicInfo.phone} or scheduling online. We are open ${clinicInfo.hours.formatted} with free parking available.`,
  };
}
