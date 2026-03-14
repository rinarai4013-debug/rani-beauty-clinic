export interface GalleryPage {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  serviceSlug: string;
  category: "aesthetic" | "wellness";
  description: string;
  resultTimeline: string;
  sessionsNeeded: string;
  maintenanceInfo: string;
  images: string[];
  faqs: { question: string; answer: string }[];
}

export const galleryPages: GalleryPage[] = [
  {
    slug: "laser-hair-removal",
    title: "Laser Hair Removal Before & After",
    metaTitle: "Laser Hair Removal Results | Renton, WA",
    metaDescription:
      "See real laser hair removal before and after results at Rani Beauty Clinic in Renton, WA. Smooth, hair-free skin with the Candela GentleMax Pro Plus.",
    serviceSlug: "laser-hair-removal",
    category: "aesthetic",
    images: [
      "/images/services/laserhairremovals/fullbodylaser.jpeg",
      "/images/services/laserhairremovals/fullbodylaser2.jpeg",
      "/images/services/laserhairremovals/laser-gallery-1.jpg",
      "/images/services/laserhairremovals/FullFaceLaserHairRemoval.jpeg",
      "/images/services/laserhairremovals/underarms.jpeg",
      "/images/services/laserhairremovals/fullback.jpeg",
      "/images/services/laserhairremovals/fulllegs.jpeg",
      "/images/services/laserhairremovals/neck.jpeg",
      "/images/services/laserhairremovals/chin.png",
    ],
    description:
      "Our patients typically see 70-90% permanent hair reduction after completing their series. Results become progressively visible after each session as follicles are disabled. Most enjoy smooth, maintenance-free skin for years.",
    resultTimeline: "Visible reduction after 2-3 sessions, optimal results at 6-8 sessions spaced 4-8 weeks apart.",
    sessionsNeeded: "6-8 sessions for most body areas; hormonal areas may require additional maintenance.",
    maintenanceInfo: "Annual touch-up sessions may be needed for hormonal areas like the chin or bikini line.",
    faqs: [
      { question: "How soon will I see laser hair removal results?", answer: "Treated hairs shed within 1-3 weeks after each session. Noticeable reduction is typically visible after 2-3 treatments, with optimal results after completing the full series of 6-8 sessions." },
      { question: "Are laser hair removal results permanent?", answer: "Laser hair removal provides permanent hair reduction, not complete removal. Most patients achieve 70-90% reduction. Some fine or hormonal hairs may regrow over time, requiring occasional maintenance sessions." },
      { question: "Do laser hair removal results vary by skin tone?", answer: "Our Candela GentleMax Pro Plus features dual wavelengths (Alexandrite 755nm and Nd:YAG 1064nm), making it safe and effective for all skin types including darker skin tones (Fitzpatrick IV-VI)." },
    ],
  },
  {
    slug: "hydrafacial",
    title: "HydraFacial Before & After",
    metaTitle: "HydraFacial Results | Renton, WA",
    metaDescription:
      "View HydraFacial before and after photos at Rani Beauty Clinic in Renton, WA. Clearer, hydrated skin with instant visible results after one session.",
    serviceSlug: "hydrafacial",
    category: "aesthetic",
    images: [
      "/images/services/hydrafacial/1.png",
      "/images/services/hydrafacial/2.webp",
      "/images/services/signaturehydrafacial/1.jpg",
      "/images/services/signaturehydrafacial/2.jpeg",
      "/images/services/diorhydrafacial/1.jpg",
      "/images/services/diorhydrafacial/2.webp",
    ],
    description:
      "HydraFacial delivers immediate visible improvement in skin clarity, hydration, and texture. Patients leave with a noticeable glow after just one treatment. Results compound with consistent monthly sessions.",
    resultTimeline: "Immediate glow after first session. Cumulative improvement over monthly treatments.",
    sessionsNeeded: "1 session for instant results; monthly treatments recommended for sustained improvement.",
    maintenanceInfo: "Monthly maintenance sessions keep skin clear, hydrated, and youthful long-term.",
    faqs: [
      { question: "Can you see HydraFacial results after one treatment?", answer: "Yes. HydraFacial provides immediate visible results including improved hydration, smoother texture, and a radiant glow. Many patients schedule treatments before events for an instant skin refresh." },
      { question: "How long do HydraFacial results last?", answer: "The immediate glow lasts 5-7 days. For sustained improvement in skin health, texture, and clarity, monthly treatments are recommended to maintain and build upon results over time." },
      { question: "Is HydraFacial effective for acne-prone skin?", answer: "Yes. HydraFacial's vortex extraction deeply cleanses pores and removes congestion. Combined with targeted serums, it can significantly reduce active breakouts and prevent future acne without irritation." },
    ],
  },
  {
    slug: "rf-microneedling",
    title: "RF Microneedling Before & After",
    metaTitle: "RF Microneedling Results | Renton, WA",
    metaDescription:
      "See RF microneedling before and after results at Rani Beauty Clinic in Renton, WA. Tighter skin, reduced scars, and improved texture with Cutera Secret Pro.",
    serviceSlug: "rf-microneedling",
    category: "aesthetic",
    images: [
      "/images/services/cutera/1.jpg",
      "/images/services/cutera/2.webp",
      "/images/services/fullface/1.jpg",
      "/images/services/fullface/2.jpg",
      "/images/services/faceneck/1.avif",
      "/images/services/faceneck/2.webp",
    ],
    description:
      "RF microneedling with the Cutera Secret Pro stimulates deep collagen remodeling. Patients see progressive improvement in skin tightness, texture, and scar appearance over 3-6 months as new collagen forms.",
    resultTimeline: "Initial improvement within 2-4 weeks; full collagen remodeling over 3-6 months post-treatment.",
    sessionsNeeded: "3-4 sessions spaced 4-6 weeks apart for optimal results.",
    maintenanceInfo: "Annual maintenance sessions help sustain collagen production and skin quality.",
    faqs: [
      { question: "How long until RF microneedling results are visible?", answer: "You may notice improved texture and tightness within 2-4 weeks. The most dramatic results appear 3-6 months after your final session as deep collagen remodeling continues beneath the surface." },
      { question: "Does RF microneedling help with acne scars?", answer: "Yes. RF microneedling is one of the most effective treatments for acne scarring. The combination of microneedles and radiofrequency energy breaks down scar tissue and stimulates organized collagen rebuilding." },
      { question: "How does RF microneedling compare to regular microneedling?", answer: "RF microneedling delivers radiofrequency energy deep into the dermis, producing significantly more collagen remodeling than traditional microneedling alone. Results are more dramatic, especially for skin laxity and deep scars." },
    ],
  },
  {
    slug: "botox-dysport",
    title: "Botox & Dysport Before & After",
    metaTitle: "Botox & Dysport Results | Renton, WA",
    metaDescription:
      "View Botox and Dysport before and after photos at Rani Beauty Clinic in Renton, WA. Natural-looking wrinkle reduction supervised by a neurologist.",
    serviceSlug: "botox-dysport",
    category: "aesthetic",
    images: [
      "/images/services/botox/1.png",
      "/images/services/botox/2.webp",
      "/images/services/traptox/1.png",
      "/images/services/traptox/2.jpg",
      "/images/services/lipfiller/1.jpg",
      "/images/services/lipfiller/2.jpg",
    ],
    description:
      "Our neurologist-supervised Botox and Dysport treatments deliver natural-looking wrinkle reduction. Results appear within 3-7 days, with full effect at two weeks. Our conservative approach prevents a frozen look.",
    resultTimeline: "Initial smoothing within 3-5 days; full results at 10-14 days post-treatment.",
    sessionsNeeded: "Single session; repeat every 3-4 months to maintain results.",
    maintenanceInfo: "Regular treatments every 3-4 months. Some patients find they need fewer units over time as muscles weaken.",
    faqs: [
      { question: "How quickly do Botox results appear?", answer: "You will begin to notice smoothing of dynamic wrinkles within 3-5 days after injection. Full results are typically visible by day 10-14. Dysport may show results 1-2 days faster than Botox for some patients." },
      { question: "Will Botox make me look frozen?", answer: "Not at Rani Beauty Clinic. Dr. Landfield's neurological expertise ensures precise dosing and placement for natural-looking results that soften wrinkles while preserving your facial expressions and character." },
      { question: "How long do Botox results last?", answer: "Results typically last 3-4 months. With consistent treatment, some patients find their results last longer over time as the targeted muscles gradually weaken and require less product." },
    ],
  },
  {
    slug: "dermal-fillers",
    title: "Dermal Fillers Before & After",
    metaTitle: "Dermal Filler Results | Renton, WA",
    metaDescription:
      "See dermal filler before and after results at Rani Beauty Clinic in Renton, WA. Natural volume restoration for lips, cheeks, jawline, and under eyes.",
    serviceSlug: "dermal-fillers",
    category: "aesthetic",
    images: [
      "/images/services/lipfiller/1.jpg",
      "/images/services/lipfiller/2.jpg",
      "/images/services/cheekfiller/1.webp",
      "/images/services/cheekfiller/2.webp",
      "/images/services/jawlinefiller/1.webp",
      "/images/services/eyefiller/1.webp",
    ],
    description:
      "Dermal fillers provide immediate volume restoration and facial contouring. Results are visible right away, with final settling at two weeks. Our approach focuses on natural enhancement that complements your features.",
    resultTimeline: "Immediate volume; minor swelling resolves in 3-7 days; final results at 2 weeks.",
    sessionsNeeded: "Single session per treatment area. May layer over multiple visits for subtle enhancement.",
    maintenanceInfo: "Results last 6-18 months depending on filler type and treatment area. Touch-ups maintain results.",
    faqs: [
      { question: "Are dermal filler results immediate?", answer: "Yes, you will see volume and contour improvement immediately after injection. Expect mild swelling for 3-7 days. Final results settle at about two weeks when any swelling fully resolves and the filler integrates naturally." },
      { question: "How long do different types of fillers last?", answer: "Lip fillers typically last 6-9 months. Cheek and midface fillers last 12-18 months. Jawline and chin fillers can last 12-24 months. Individual metabolism and lifestyle factors affect longevity." },
      { question: "Can dermal fillers be reversed?", answer: "Hyaluronic acid fillers can be dissolved with hyaluronidase if needed. This is one reason HA fillers are preferred — they offer a safety net. Non-HA fillers cannot be reversed, which is why we primarily use HA-based products." },
    ],
  },
  {
    slug: "chemical-peels",
    title: "Chemical Peels Before & After",
    metaTitle: "Chemical Peel Results | Renton, WA",
    metaDescription:
      "View chemical peel before and after photos at Rani Beauty Clinic in Renton, WA. Improved texture, reduced pigmentation, and clearer skin after treatment.",
    serviceSlug: "chemical-peels",
    category: "aesthetic",
    images: [
      "/images/services/vipeel/1.webp",
      "/images/services/vipeel/2.webp",
      "/images/services/acnevipeel/1.jpg",
      "/images/services/acnevipeel/2.webp",
      "/images/services/hyperpigmintaionpeel/1.webp",
      "/images/services/cosmelan/1.png",
    ],
    description:
      "Chemical peels reveal fresher, more even-toned skin by removing damaged outer layers. Light peels show subtle improvement immediately, while medium-depth peels produce dramatic results after the peeling phase completes.",
    resultTimeline: "Light peels: 1-3 days recovery. Medium peels: 5-7 days of peeling, full results at 2-3 weeks.",
    sessionsNeeded: "Light peels: monthly series of 4-6. Medium peels: 1-3 sessions spaced 4-8 weeks apart.",
    maintenanceInfo: "Maintenance peels every 4-8 weeks sustain results. Sun protection is essential year-round.",
    faqs: [
      { question: "How long does chemical peel peeling last?", answer: "Light peels cause minimal flaking for 1-3 days. Medium-depth peels like the VI Peel involve visible peeling for 5-7 days. The new skin beneath is smoother, brighter, and more even-toned." },
      { question: "Which chemical peel is best for hyperpigmentation?", answer: "The VI Peel is our most effective peel for hyperpigmentation, including melasma, sun spots, and post-inflammatory hyperpigmentation. It combines multiple acids with lightening agents for comprehensive pigment correction." },
      { question: "Can I get a chemical peel if I have sensitive skin?", answer: "Yes. We offer gentle options like lactic acid peels specifically formulated for sensitive and rosacea-prone skin. Your clinician will assess your skin type and recommend the appropriate peel strength for safe, effective results." },
    ],
  },
  {
    slug: "scar-reduction",
    title: "Scar Reduction Before & After",
    metaTitle: "Scar Reduction Results | Renton, WA",
    metaDescription:
      "See scar reduction before and after results at Rani Beauty Clinic in Renton, WA. Multi-modality treatments for acne scars, surgical scars, and more.",
    serviceSlug: "scar-reduction",
    category: "aesthetic",
    images: [
      "/images/services/acnescarvipeel/1.png",
      "/images/services/acnescarvipeel/2.jpg",
      "/images/services/cutera/1.jpg",
      "/images/services/cutera/2.webp",
      "/images/services/laserresurfacing/1.webp",
      "/images/services/laserresurfacing/2.webp",
    ],
    description:
      "Our multi-modality scar reduction approach combines RF microneedling, chemical peels, and targeted therapies to progressively improve scar texture, color, and depth. Most patients see significant improvement over a treatment series.",
    resultTimeline: "Initial improvement at 4-6 weeks; dramatic results over 3-6 months with multiple sessions.",
    sessionsNeeded: "3-6 sessions depending on scar severity, spaced 4-6 weeks apart.",
    maintenanceInfo: "Occasional maintenance treatments may help with continued improvement. Results are long-lasting.",
    faqs: [
      { question: "Can old scars be improved with treatment?", answer: "Yes. Even scars that are years or decades old can be improved. While older scars may require more sessions, RF microneedling and chemical peels can break down fibrotic tissue and stimulate new collagen to remodel scar texture." },
      { question: "Which treatment is best for acne scars?", answer: "RF microneedling with the Cutera Secret Pro is typically our primary recommendation for acne scars. It effectively treats rolling, boxcar, and ice-pick scars. We often combine it with chemical peels for comprehensive results." },
      { question: "How much improvement can I expect from scar treatments?", answer: "Most patients achieve 50-80% improvement in scar appearance over a full treatment series. Results vary based on scar type, age, and depth. Our team sets realistic expectations during your consultation." },
    ],
  },
  {
    slug: "glp1-weight-management",
    title: "GLP-1 Weight Loss Before & After",
    metaTitle: "GLP-1 Weight Loss Results | Renton, WA",
    metaDescription:
      "See GLP-1 weight loss before and after transformations at Rani Beauty Clinic in Renton, WA. Physician-supervised Semaglutide and Tirzepatide results.",
    serviceSlug: "glp1-weight-management",
    category: "wellness",
    images: [
      "/images/services/wellness/glp1-1.jpg",
      "/images/services/wellness/glp1-2.jpg",
      "/images/services/wellness/peptide-1.jpg",
      "/images/services/wellness/vitamin-1.jpg",
      "/images/services/wellness/bloodwork-1.jpg",
      "/images/services/wellness/hormone-1.jpg",
    ],
    description:
      "Our physician-supervised GLP-1 program helps patients achieve 15-22% total body weight loss. Results begin within the first month and continue throughout the treatment program with consistent medication and lifestyle support.",
    resultTimeline: "Weight loss begins within 2-4 weeks; significant results at 3 months; peak results at 12-15 months.",
    sessionsNeeded: "Ongoing weekly self-injections with monthly in-person check-ups and quarterly blood work.",
    maintenanceInfo: "Long-term maintenance may include continued low-dose medication or transition to lifestyle-only maintenance.",
    faqs: [
      { question: "How much weight can I lose with GLP-1 medications?", answer: "Clinical studies show average weight loss of 15-17% with Semaglutide and 20-25% with Tirzepatide over 12-15 months. Individual results vary based on starting weight, adherence, and lifestyle modifications." },
      { question: "How quickly does GLP-1 weight loss start?", answer: "Most patients notice reduced appetite within the first 1-2 weeks. Measurable weight loss typically begins within 2-4 weeks. Significant visible changes often appear by month 2-3 as the medication reaches therapeutic doses." },
      { question: "Will I regain weight after stopping GLP-1 medication?", answer: "Some weight regain is common if medication is stopped abruptly without lifestyle changes. Our program includes a structured maintenance phase with gradual tapering and sustainable lifestyle modifications to preserve your results." },
    ],
  },
  {
    slug: "sofwave",
    title: "Sofwave Before & After",
    metaTitle: "Sofwave Skin Tightening Results | Renton, WA",
    metaDescription:
      "View Sofwave before and after results at Rani Beauty Clinic in Renton, WA. Non-invasive skin tightening for face, neck, and jawline with zero downtime.",
    serviceSlug: "sofwave",
    category: "aesthetic",
    images: [
      "/images/services/softwave/1.jpg",
      "/images/services/softwave/2.webp",
      "/images/services/neckfiller/1.webp",
      "/images/services/neckfiller/2.webp",
      "/images/services/jawlinefiller/1.webp",
      "/images/services/jawlinefiller/2.webp",
    ],
    description:
      "Sofwave delivers noticeable skin tightening and lifting with a single treatment and zero downtime. Ultrasound energy stimulates collagen production deep in the dermis, with results that continue improving for months.",
    resultTimeline: "Some immediate tightening; progressive improvement over 3-6 months as collagen rebuilds.",
    sessionsNeeded: "1 session; some patients benefit from a second treatment at 6-12 months.",
    maintenanceInfo: "Annual treatments help maintain skin tightness and counteract ongoing aging.",
    faqs: [
      { question: "How long do Sofwave results last?", answer: "Sofwave results typically last 1-2 years. The treatment stimulates new collagen production that continues building for 3-6 months. Annual maintenance sessions can extend and enhance results over time." },
      { question: "Is Sofwave painful?", answer: "Most patients describe Sofwave as a warm, tolerable sensation. The device includes an integrated cooling system that protects the skin surface. No anesthesia is typically needed, and the treatment takes about 30-45 minutes." },
      { question: "How does Sofwave compare to a surgical facelift?", answer: "Sofwave provides moderate tightening and lifting without surgery, anesthesia, or downtime. It is ideal for mild to moderate skin laxity. A surgical facelift provides more dramatic results for severe laxity but involves significant recovery time." },
    ],
  },
];
