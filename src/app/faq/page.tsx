import { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ChevronDown, HelpCircle, Sparkles, Zap, Droplets, Target, Syringe, FlaskConical, Scale, Waves, MessageCircleQuestion } from "lucide-react";
import Hero from "@/components/sections/Hero";
import CTABanner from "@/components/sections/CTABanner";
import SectionLabel from "@/components/ui/SectionLabel";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import Badge from "@/components/ui/Badge";
import StructuredData from "@/components/seo/StructuredData";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import { clinicInfo } from "@/data/clinic-info";
import { aftercarePages } from "@/data/seo/aftercare-pages";
import { preparationPages } from "@/data/seo/preparation-pages";
import { sideEffectsPages } from "@/data/seo/side-effects-pages";
import { worthItPages } from "@/data/seo/worth-it-pages";
import { firstTimePages } from "@/data/seo/first-time-pages";
import { resultsTimelinePages } from "@/data/seo/results-timeline-pages";
import { demographicPages } from "@/data/seo/demographic-pages";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | Rani Beauty Clinic",
  description:
    "Get answers to the most common medspa questions: Botox cost, safety, laser hair removal, HydraFacial, dermal fillers, RF microneedling, GLP-1 weight management, and more. Physician-supervised care in Renton, WA.",
  keywords: [
    "medspa FAQ",
    "botox questions",
    "laser hair removal FAQ",
    "hydrafacial FAQ",
    "dermal fillers questions",
    "medspa renton wa",
    "botox cost",
    "is botox safe",
    "rf microneedling FAQ",
    "GLP-1 weight loss questions",
    "sofwave FAQ",
    "chemical peel questions",
  ],
  alternates: {
    canonical: `${clinicInfo.website}/faq`,
  },
  openGraph: {
    title: "Frequently Asked Questions | Rani Beauty Clinic",
    description:
      "Answers to the most-searched medspa questions - Botox, fillers, laser hair removal, HydraFacial, RF microneedling, GLP-1, and more. Physician-supervised in Renton, WA.",
    type: "website",
    url: `${clinicInfo.website}/faq`,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Rani Beauty Clinic FAQ" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Frequently Asked Questions | Rani Beauty Clinic",
    description:
      "Get expert answers to your medspa questions - Botox, fillers, laser, HydraFacial, and more.",
  },
};

// ---------------------------------------------------------------------------
// Collect FAQs from all SEO data files
// ---------------------------------------------------------------------------

interface FAQ {
  question: string;
  answer: string;
}

function collectFaqsFromPages(
  pages: { treatment: string; faqs: FAQ[] }[],
): { treatment: string; question: string; answer: string }[] {
  return pages.flatMap((p) =>
    p.faqs.map((f) => ({ treatment: p.treatment, question: f.question, answer: f.answer })),
  );
}

const allDataFaqs = [
  ...collectFaqsFromPages(aftercarePages),
  ...collectFaqsFromPages(preparationPages),
  ...collectFaqsFromPages(sideEffectsPages),
  ...collectFaqsFromPages(worthItPages),
  ...collectFaqsFromPages(firstTimePages),
  ...collectFaqsFromPages(resultsTimelinePages),
  ...collectFaqsFromPages(
    demographicPages.map((p) => ({ treatment: p.demographic, faqs: p.faqs })),
  ),
];

// ---------------------------------------------------------------------------
// 20 NEW standalone FAQs
// ---------------------------------------------------------------------------

const standaloneFaqs: { category: string; question: string; answer: string }[] = [
  {
    category: "Botox & Dysport",
    question: "How much does Botox cost?",
    answer:
      "Botox pricing at Rani Beauty Clinic is based on the number of units needed to achieve your goals. During your consultation, our team will assess your facial anatomy and provide a personalized treatment plan with transparent pricing. Factors like the treatment area and desired result affect the total cost. We also offer membership plans that include savings on injectables.",
  },
  {
    category: "Botox & Dysport",
    question: "Is Botox safe?",
    answer:
      "Botox has been FDA-approved for cosmetic use since 2002 and has an extensive safety profile backed by decades of clinical research. At Rani Beauty Clinic, every Botox treatment is performed under the supervision of Dr. Alexander Landfield, a board-certified neurologist whose expertise in neuromuscular anatomy adds an additional layer of safety and precision to every injection.",
  },
  {
    category: "Botox & Dysport",
    question: "What age should I start Botox?",
    answer:
      "There is no single ideal age to start Botox. Many patients begin preventative Botox in their late 20s or early 30s to slow the formation of dynamic wrinkles before they become static lines. Others start later when lines at rest become more noticeable. Our team will evaluate your skin, muscle movement, and goals to determine whether Botox is appropriate for you at any age.",
  },
  {
    category: "Botox & Dysport",
    question: "How do I choose between Botox and fillers?",
    answer:
      "Botox and fillers address different concerns. Botox relaxes muscles that cause dynamic wrinkles such as forehead lines, frown lines, and crow\u2019s feet. Dermal fillers restore lost volume, enhance contours, and smooth static folds like nasolabial lines. Many patients benefit from both. During your consultation at Rani Beauty Clinic, we will recommend the right combination based on your anatomy and aesthetic goals.",
  },
  {
    category: "Laser Hair Removal",
    question: "Does laser hair removal hurt?",
    answer:
      "Most patients describe laser hair removal as a quick snapping sensation, similar to a rubber band lightly flicking the skin. Our Candela GentleMax Pro Plus features an integrated cooling system that reduces discomfort during treatment. Sensitive areas like the bikini line or underarms may feel more intense, but sessions are short and highly tolerable for most patients.",
  },
  {
    category: "Laser Hair Removal",
    question: "How many laser hair removal sessions do I need?",
    answer:
      "Most patients need 6 to 8 sessions spaced 4 to 8 weeks apart for optimal permanent hair reduction. Hair grows in cycles, and the laser is most effective during the active growth phase. Additional factors like hair color, thickness, skin type, hormonal influences, and the treatment area all affect the total number of sessions. Our clinicians will create a personalized plan during your consultation.",
  },
  {
    category: "HydraFacial",
    question: "What is a HydraFacial?",
    answer:
      "A HydraFacial is a medical-grade facial treatment that cleanses, exfoliates, extracts impurities, and delivers nourishing serums to the skin in one session. It uses patented vortex technology to deeply hydrate and rejuvenate the skin without irritation or downtime. At Rani Beauty Clinic, our Signature HydraFacial is customized with targeted boosters based on your specific skin concerns.",
  },
  {
    category: "Dermal Fillers",
    question: "Are dermal fillers safe?",
    answer:
      "FDA-approved dermal fillers have a strong safety record when administered by trained, qualified injectors. At Rani Beauty Clinic, all filler treatments are performed under the medical supervision of Dr. Alexander Landfield. We use only FDA-approved hyaluronic acid fillers from trusted manufacturers, and our team is trained in both aesthetic technique and emergency protocols.",
  },
  {
    category: "Dermal Fillers",
    question: "How long do fillers last?",
    answer:
      "The longevity of dermal fillers depends on the product used, the treatment area, and your individual metabolism. Lip fillers typically last 6 to 12 months, cheek fillers can last 12 to 18 months, and some jawline or chin fillers may last up to 2 years. Our team will discuss expected duration during your consultation so you can plan maintenance appointments accordingly.",
  },
  {
    category: "RF Microneedling",
    question: "What is RF microneedling?",
    answer:
      "RF microneedling combines traditional microneedling with radiofrequency energy delivered through tiny needles into the deeper layers of the skin. This dual action stimulates collagen and elastin production more effectively than standard microneedling alone. At Rani Beauty Clinic, we use the Cutera Secret Pro for precise depth control and consistent results across all skin types.",
  },
  {
    category: "RF Microneedling",
    question: "Does microneedling hurt?",
    answer:
      "A topical numbing cream is applied before your RF microneedling session to minimize discomfort. Most patients describe the sensation as a warm prickling feeling. The Cutera Secret Pro is designed for patient comfort with adjustable depth and energy settings. Any mild redness or warmth after treatment typically subsides within 24 to 48 hours.",
  },
  {
    category: "GLP-1 Weight Management",
    question: "What is GLP-1 for weight loss?",
    answer:
      "GLP-1 receptor agonists are FDA-approved medications that help regulate appetite, slow gastric emptying, and support significant weight loss when combined with lifestyle modifications. At Rani Beauty Clinic, our GLP-1 Weight Management Program (The Rani Protocol) is physician-supervised and includes medication management, regular check-ins, blood work, and nutritional guidance.",
  },
  {
    category: "GLP-1 Weight Management",
    question: "How much weight can you lose on GLP-1?",
    answer:
      "Clinical studies show that patients on GLP-1 medications can lose 15 to 20 percent or more of their body weight over the course of treatment. Individual results vary based on adherence, lifestyle changes, starting weight, and metabolic factors. Our physician-supervised program at Rani Beauty Clinic includes regular monitoring and support to help you achieve sustainable results.",
  },
  {
    category: "Sofwave",
    question: "What is Sofwave?",
    answer:
      "Sofwave is an FDA-cleared, non-invasive skin tightening and lifting treatment that uses Synchronous Ultrasound Parallel Beam (SUPERB) technology to stimulate new collagen production in the mid-dermis. It effectively treats fine lines, wrinkles, and skin laxity on the face, neck, and brow with minimal discomfort and no downtime. Results develop gradually over 3 to 6 months as collagen remodels.",
  },
  {
    category: "General",
    question: "Is medspa treatment safe?",
    answer:
      "Medspa treatments are safe when performed in a properly supervised clinical environment. At Rani Beauty Clinic, every medical treatment is performed under the supervision of Dr. Alexander Landfield, a board-certified neurologist. We use only FDA-approved devices and products, follow evidence-based protocols, and conduct thorough health screenings before beginning any treatment program.",
  },
  {
    category: "General",
    question: "Do I need a consultation first?",
    answer:
      "We recommend a consultation before any new treatment. Consultations allow our team to assess your skin, health history, and goals to recommend the most effective treatment plan. For medical wellness services like GLP-1 weight management, a consultation with blood work is required. Consultations at Rani Beauty Clinic are thorough, educational, and pressure-free.",
  },
  {
    category: "General",
    question: "What payment options are available?",
    answer:
      "Rani Beauty Clinic accepts all major credit and debit cards through our Square payment system. We also offer financing options to help make treatments more accessible. Our membership program provides monthly savings on popular treatments. Contact our team to learn more about payment plans and membership benefits.",
  },
  {
    category: "General",
    question: "Is there downtime after treatments?",
    answer:
      "Downtime varies by treatment. Botox and HydraFacial have zero downtime - you can return to normal activities immediately. Laser hair removal and chemical peels may involve mild redness for 24 to 48 hours. RF microneedling typically requires 1 to 3 days of social downtime as the skin heals. Our team will provide detailed aftercare instructions and realistic expectations for every treatment.",
  },
  {
    category: "General",
    question: "Can I combine treatments?",
    answer:
      "Yes, many treatments can be combined in the same visit or as part of a comprehensive treatment plan. For example, Botox can be paired with dermal fillers, and HydraFacial can complement laser treatments. Our team will advise on the best sequencing and timing to maximize results while ensuring safety. Some combinations may need to be spaced out by a few weeks.",
  },
  {
    category: "General",
    question: "What skin types can be treated?",
    answer:
      "Rani Beauty Clinic treats all skin types and tones (Fitzpatrick I through VI). Our Candela GentleMax Pro Plus features dual-wavelength technology including the Nd:YAG 1064nm laser, which is specifically designed for safe and effective treatment on darker skin tones. During your consultation, we assess your skin type to select the optimal settings and protocols for your safety and results.",
  },
];

// ---------------------------------------------------------------------------
// Map treatments to categories
// ---------------------------------------------------------------------------

const treatmentToCategory: Record<string, string> = {
  "Botox": "Botox & Dysport",
  "Botox & Dysport": "Botox & Dysport",
  "Dysport": "Botox & Dysport",
  "Laser Hair Removal": "Laser Hair Removal",
  "HydraFacial": "HydraFacial",
  "RF Microneedling": "RF Microneedling",
  "Dermal Fillers": "Dermal Fillers",
  "Chemical Peels": "Chemical Peels",
  "VI Peel": "Chemical Peels",
  "PRX-T33": "Chemical Peels",
  "GLP-1 Weight Management": "GLP-1 Weight Management",
  "GLP-1": "GLP-1 Weight Management",
  "Sofwave": "Sofwave",
  "NAD+ Injections": "General",
  "Hormone Therapy": "General",
  "Blood Work": "General",
  "Men": "General",
  "Women Over 40": "General",
  "Brides": "General",
  "Teens": "General",
};

const categoryOrder = [
  "Botox & Dysport",
  "Laser Hair Removal",
  "HydraFacial",
  "RF Microneedling",
  "Dermal Fillers",
  "Chemical Peels",
  "GLP-1 Weight Management",
  "Sofwave",
  "General",
];

const categoryIcons: Record<string, typeof HelpCircle> = {
  "Botox & Dysport": Sparkles,
  "Laser Hair Removal": Zap,
  "HydraFacial": Droplets,
  "RF Microneedling": Target,
  "Dermal Fillers": Syringe,
  "Chemical Peels": FlaskConical,
  "GLP-1 Weight Management": Scale,
  "Sofwave": Waves,
  "General": MessageCircleQuestion,
};

// Build categorized FAQ map - deduplicate by question text
function buildCategorizedFaqs() {
  const seen = new Set<string>();
  const map: Record<string, FAQ[]> = {};
  for (const cat of categoryOrder) map[cat] = [];

  // Data-sourced FAQs
  for (const f of allDataFaqs) {
    const cat = treatmentToCategory[f.treatment] || "General";
    const key = f.question.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.add(key);
      map[cat]?.push({ question: f.question, answer: f.answer });
    }
  }

  // Standalone FAQs
  for (const f of standaloneFaqs) {
    const key = f.question.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.add(key);
      map[f.category]?.push({ question: f.question, answer: f.answer });
    }
  }

  return map;
}

const categorizedFaqs = buildCategorizedFaqs();

// Flatten all for schema
const allFaqsFlat: FAQ[] = categoryOrder.flatMap((cat) => categorizedFaqs[cat] || []);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FAQPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: allFaqsFlat.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };

  const breadcrumbs = [
    { name: "Home", url: clinicInfo.website },
    { name: "FAQ", url: `${clinicInfo.website}/faq` },
  ];

  return (
    <>
      <StructuredData data={faqSchema} />
      <BreadcrumbSchema items={breadcrumbs} />

      {/* Breadcrumb */}
      <div className="bg-rani-cream pt-28 pb-4">
        <div className="mx-auto max-w-7xl px-6">
          <nav aria-label="Breadcrumb" className="font-body text-sm text-rani-muted">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/" className="transition-colors hover:text-rani-navy">Home</Link>
              </li>
              <li><ChevronRight size={14} className="text-rani-muted/50" /></li>
              <li><span className="font-semibold text-rani-navy">FAQ</span></li>
            </ol>
          </nav>
        </div>
      </div>

      <Hero
        label="FREQUENTLY ASKED QUESTIONS"
        title="Your Questions, Answered"
        subtitle="Everything you need to know about our treatments, safety standards, and what to expect at Rani Beauty Clinic. Every answer is backed by physician-supervised expertise."
        primaryCTA={{ text: "Book Consultation", href: clinicInfo.consultation.url }}
        secondaryCTA={{ text: "Call Us", href: clinicInfo.phoneTel }}
        badges={["Physician Supervised", "Board-Certified MD", "100+ FAQs"]}
        dark
      />

      {/* Category Quick Nav */}
      <section className="border-b border-rani-border bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <FadeInOnScroll>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {categoryOrder.map((cat) => {
                const Icon = categoryIcons[cat] || HelpCircle;
                const count = categorizedFaqs[cat]?.length || 0;
                return (
                  <a
                    key={cat}
                    href={`#${cat.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                    className="group flex items-center gap-2 rounded-full border border-rani-border bg-rani-cream px-4 py-2 font-body text-sm font-medium text-rani-navy transition-all hover:border-rani-gold hover:bg-rani-navy hover:text-white"
                  >
                    <Icon size={14} className="text-rani-gold-accessible group-hover:text-rani-gold" />
                    {cat}
                    <span className="rounded-full bg-rani-navy/10 px-2 py-0.5 text-xs group-hover:bg-white/20">
                      {count}
                    </span>
                  </a>
                );
              })}
            </div>
          </FadeInOnScroll>
        </div>
      </section>

      {/* FAQ Sections */}
      {categoryOrder.map((category) => {
        const faqs = categorizedFaqs[category] || [];
        if (faqs.length === 0) return null;
        const Icon = categoryIcons[category] || HelpCircle;
        const anchorId = category.toLowerCase().replace(/[^a-z0-9]+/g, "-");

        return (
          <section
            key={category}
            id={anchorId}
            className="scroll-mt-24 border-b border-rani-border bg-white py-16 even:bg-rani-cream md:py-20"
          >
            <div className="mx-auto max-w-4xl px-6">
              <FadeInOnScroll>
                <div className="mb-10 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rani-navy">
                    <Icon size={18} className="text-rani-gold" />
                  </div>
                  <div>
                    <h2 className="font-heading text-2xl font-bold text-rani-navy md:text-3xl">
                      {category}
                    </h2>
                    <p className="font-body text-sm text-rani-muted">
                      {faqs.length} question{faqs.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </FadeInOnScroll>

              <div className="space-y-4">
                {faqs.map((faq, idx) => (
                  <FadeInOnScroll key={`${category}-${idx}`} delay={Math.min(idx * 0.03, 0.3)}>
                    <details className="group rounded-xl border border-rani-border bg-white transition-all hover:border-rani-gold/40 open:border-rani-gold/60 open:shadow-sm">
                      <summary className="flex cursor-pointer items-start gap-3 px-6 py-5 font-body text-base font-semibold text-rani-navy [&::-webkit-details-marker]:hidden">
                        <ChevronDown
                          size={18}
                          className="mt-0.5 shrink-0 text-rani-gold-accessible transition-transform group-open:rotate-180"
                        />
                        <span>{faq.question}</span>
                      </summary>
                      <div className="px-6 pb-6 pl-12">
                        <p className="font-body text-sm leading-relaxed text-rani-muted">
                          {faq.answer}
                        </p>
                      </div>
                    </details>
                  </FadeInOnScroll>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {/* Still Have Questions */}
      <section className="bg-rani-cream py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <FadeInOnScroll>
            <SectionLabel label="STILL HAVE QUESTIONS?" />
            <h2 className="mt-6 font-heading text-3xl font-bold text-rani-navy md:text-4xl">
              We Are Here to Help
            </h2>
            <p className="mx-auto mt-4 max-w-xl font-body text-base leading-relaxed text-rani-muted">
              Our team is happy to answer any questions not covered here. Reach out by phone, fill
              out our consultation form, or visit us at our Renton clinic.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href={clinicInfo.consultation.url}
                className="rounded-lg bg-rani-gold px-6 py-3 font-body text-sm font-semibold text-white transition-colors hover:bg-rani-navy"
              >
                Book Consultation
              </Link>
              <Link
                href={clinicInfo.phoneTel}
                className="rounded-lg border border-rani-navy px-6 py-3 font-body text-sm font-semibold text-rani-navy transition-colors hover:bg-rani-navy hover:text-white"
              >
                Call {clinicInfo.phone}
              </Link>
              <Link
                href="/contact"
                className="rounded-lg border border-rani-border px-6 py-3 font-body text-sm font-semibold text-rani-muted transition-colors hover:border-rani-gold hover:text-rani-navy"
              >
                Contact Us
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Badge icon="shield">Physician Supervised</Badge>
              <Badge icon="check">FDA-Approved Devices</Badge>
              <Badge icon="clock">Open 7 Days</Badge>
            </div>
          </FadeInOnScroll>
        </div>
      </section>

      <CTABanner
        label="EXPERT ANSWERS"
        title="Ready to Take the Next Step?"
        subtitle={`Schedule your consultation at Rani Beauty Clinic. Call ${clinicInfo.phone} or book online.`}
      />
    </>
  );
}
