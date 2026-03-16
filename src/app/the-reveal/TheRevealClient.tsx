"use client";

import { useState } from "react";
import {
  Layers,
  Zap,
  Timer,
  ChevronDown,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Shield,
  Target,
  Users,
  Calendar,
  Star,
} from "lucide-react";
import Hero from "@/components/sections/Hero";
import CTABanner from "@/components/sections/CTABanner";
import SectionLabel from "@/components/ui/SectionLabel";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import StaggerChildren from "@/components/animations/StaggerChildren";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

/* ──────────────────────────── Data ──────────────────────────── */

const whoIsItFor = [
  "You've lost 30+ lbs on Ozempic, Wegovy, Mounjaro, or Zepbound",
  "Your skin feels loose, saggy, or \"deflated\" after weight loss",
  "You notice jowling, neck laxity, or volume loss in your face",
  "Your body contour doesn't match how far you've come",
  "You want results without surgery or extended downtime",
];

const sciencePillars = [
  {
    icon: Zap,
    title: "Sofwave — Deep Tightening",
    description:
      "SUPERB ultrasound energy penetrates 1.5mm below the surface to stimulate collagen and elastin at the foundational layer. FDA-cleared for lifting the brow, submentum, and neck.",
  },
  {
    icon: Layers,
    title: "Secret RF — Surface Renewal",
    description:
      "Fractional radiofrequency microneedling delivers targeted energy through gold-plated needles to remodel texture, tighten pores, and rebuild the superficial dermis from within.",
  },
  {
    icon: Target,
    title: "Dual-Layer Protocol",
    description:
      "By combining both technologies, The Reveal addresses loose skin at two depths — something no single device can achieve alone. The result is comprehensive restoration, not just surface improvement.",
  },
];

const tiers = [
  {
    name: "Essential",
    subtitle: "Targeted Restoration",
    price: "$1,490",
    description: "Ideal for mild laxity or focused treatment areas.",
    popular: false,
    includes: [
      "2 Secret RF sessions (face or body zone)",
      "Personalized treatment mapping",
      "Post-treatment skincare protocol",
      "Follow-up assessment at 6 weeks",
    ],
  },
  {
    name: "Signature",
    subtitle: "The Full Reveal",
    price: "$3,990",
    description:
      "Our most popular protocol for comprehensive facial and neck restoration.",
    popular: true,
    includes: [
      "1 Sofwave full-face & neck session",
      "2 Secret RF sessions (face + neck)",
      "Reveal Assessment with custom mapping",
      "Medical-grade skincare starter kit",
      "90-day progress tracking",
      "Priority scheduling",
    ],
  },
  {
    name: "Complete",
    subtitle: "Total Transformation",
    price: "$5,990",
    description:
      "The definitive protocol for patients seeking maximum restoration across face and body.",
    popular: false,
    includes: [
      "1 Sofwave full-face & neck session",
      "4 Secret RF sessions (face + body zones)",
      "Reveal Assessment with full-body mapping",
      "Complete medical-grade skincare system",
      "6-month progress tracking with photos",
      "Inner Circle membership (3 months)",
      "Priority scheduling & direct provider access",
    ],
  },
];

const timeline = [
  {
    week: "Week 1",
    title: "Reveal Assessment",
    description:
      "Comprehensive skin analysis, treatment mapping, and personalized protocol design based on your weight loss journey and goals.",
  },
  {
    week: "Weeks 2–4",
    title: "Foundation Phase",
    description:
      "First treatment sessions begin. Sofwave initiates deep collagen remodeling while Secret RF starts surface-level renewal.",
  },
  {
    week: "Weeks 6–10",
    title: "Restoration Phase",
    description:
      "Follow-up sessions build on initial results. You'll begin noticing visible improvements in skin firmness and texture.",
  },
  {
    week: "Months 3–6",
    title: "The Reveal",
    description:
      "Collagen continues remodeling for months after treatment. Full results emerge — tighter, firmer skin that matches your transformation.",
  },
];

const innerCircleBenefits = [
  "Priority booking for all appointments",
  "10% off all maintenance treatments",
  "Exclusive access to new protocols and technologies",
  "Quarterly skin assessments with progress photography",
  "Direct provider messaging",
  "Members-only events and educational workshops",
];

const faqs = [
  {
    q: "What exactly is The Reveal?",
    a: "The Reveal is Rani Beauty Clinic's signature skin restoration protocol designed specifically for patients who have experienced skin changes after GLP-1 weight loss. It combines two FDA-cleared technologies — Sofwave ultrasound and Secret RF microneedling — to address loose skin at multiple depths for comprehensive results.",
  },
  {
    q: "Am I a candidate for The Reveal?",
    a: "The Reveal is ideal for patients who have lost 30+ pounds (through GLP-1 medications or other methods) and are experiencing skin laxity, volume loss, textural changes, or loss of firmness. During your Reveal Assessment, we evaluate your skin quality, areas of concern, and goals to determine the best protocol tier for you.",
  },
  {
    q: "How is this different from getting Sofwave or Secret RF separately?",
    a: "When combined strategically, these technologies produce results that neither achieves alone. Sofwave targets deep collagen at 1.5mm depth, while Secret RF remodels the superficial dermis. The Reveal protocol sequences and maps these treatments to your specific areas of laxity for comprehensive dual-layer restoration.",
  },
  {
    q: "How long until I see results?",
    a: "Most patients notice initial skin tightening within 4–6 weeks. However, collagen remodeling is a gradual biological process — full results continue developing over 3–6 months. This is why we include progress tracking in every Reveal protocol.",
  },
  {
    q: "Is there any downtime?",
    a: "Downtime is minimal. After Sofwave, you can resume normal activities immediately. After Secret RF, expect 24–48 hours of mild redness similar to a sunburn. Most patients return to daily activities the next day. We provide detailed aftercare instructions at each session.",
  },
  {
    q: "Does it hurt?",
    a: "Comfort is a priority. Sofwave uses the SofCool cooling system to keep the treatment comfortable. For Secret RF, we apply topical numbing cream 30–45 minutes before your session. Most patients describe the sensation as a warm, prickling feeling that is very tolerable.",
  },
  {
    q: "Which tier should I choose?",
    a: "During your Reveal Assessment, we'll recommend the best tier based on your degree of skin laxity, treatment areas, and goals. Essential works well for mild concerns in one zone, Signature is our most popular for comprehensive facial restoration, and Complete is designed for patients wanting full face and body treatment.",
  },
  {
    q: "Can I treat body areas too?",
    a: "Yes. Secret RF is effective on body areas including the abdomen, arms, and thighs — common concerns after significant weight loss. The Complete tier includes body zone treatments, or body sessions can be added to any tier.",
  },
  {
    q: "Is The Reveal safe for all skin types?",
    a: "Yes. Both Sofwave and Secret RF are safe for all skin types (Fitzpatrick I–VI). This is one of the advantages over laser-based treatments, which carry higher risk for darker skin tones.",
  },
  {
    q: "Do I need to be done with my GLP-1 medication first?",
    a: "Not necessarily. Many patients begin The Reveal while still on their GLP-1 program. In fact, starting skin restoration before all weight is lost can give your skin a head start on collagen rebuilding. We'll coordinate timing recommendations during your Assessment.",
  },
  {
    q: "How much does a Reveal Assessment cost?",
    a: "The Reveal Assessment is a complimentary consultation. We believe every patient deserves to understand their options without financial pressure. If you choose to proceed, your protocol investment applies entirely to treatment.",
  },
  {
    q: "What is the Inner Circle?",
    a: "The Inner Circle is our exclusive membership for Reveal patients who want ongoing skin maintenance and VIP access. Members receive priority booking, treatment discounts, quarterly progress assessments, and early access to new technologies and protocols.",
  },
];

/* ──────────────────────────── FAQ Item ──────────────────────────── */

function FAQItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-rani-border bg-white">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-6 py-5 text-left"
      >
        <h3 className="pr-4 font-body text-sm font-bold text-rani-navy">
          {question}
        </h3>
        <ChevronDown
          size={18}
          className={`shrink-0 text-rani-gold transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div className="border-t border-rani-border px-6 pb-5 pt-4">
          <p className="font-body text-sm leading-relaxed text-rani-text">
            {answer}
          </p>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────── Component ──────────────────────────── */

export default function TheRevealClient() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      {/* ── Hero ── */}
      <Hero
        label="SIGNATURE PROTOCOL"
        title="The Reveal"
        subtitle="A physician-supervised skin restoration protocol for patients who've transformed their body through GLP-1 weight loss — and are ready for their skin to match."
        dark
        primaryCTA={{ text: "Book Your Reveal Assessment", href: "https://app.mangomint.com/m/ranibeautyclinic" }}
        secondaryCTA={{ text: "Learn How It Works", href: "#how-it-works" }}
        badges={["Post-GLP-1 Skin Restoration", "Sofwave + Secret RF", "Physician-Supervised"]}
        stats={[
          { value: "2", label: "FDA-Cleared Technologies" },
          { value: "Dual-Layer", label: "Treatment Approach" },
          { value: "3–6 mo", label: "Full Results Timeline" },
        ]}
      />

      {/* ── The Problem ── */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <FadeInOnScroll direction="left">
              <div>
                <SectionLabel label="THE PROBLEM" className="!items-start" />
                <h2 className="mt-4 font-body text-2xl font-bold text-rani-navy md:text-3xl">
                  You Lost the Weight. Your Skin Didn&apos;t Get the Memo.
                </h2>
                <p className="mt-4 font-body text-sm leading-relaxed text-rani-text">
                  GLP-1 medications like Ozempic, Wegovy, Mounjaro, and Zepbound
                  have helped millions achieve life-changing weight loss. But rapid
                  fat reduction often outpaces your skin&apos;s ability to adapt — leaving
                  behind laxity, volume loss, and textural changes that can feel
                  just as frustrating as the weight itself.
                </p>
                <p className="mt-4 font-body text-sm leading-relaxed text-rani-text">
                  This isn&apos;t a flaw. It&apos;s biology. And it requires a protocol
                  designed specifically for post-weight-loss skin — not a single
                  treatment applied generically.
                </p>
              </div>
            </FadeInOnScroll>

            <FadeInOnScroll direction="right" delay={0.2}>
              <div className="flex h-full flex-col justify-center rounded-xl border border-rani-border bg-rani-cream p-8">
                <h3 className="font-body text-lg font-bold text-rani-navy">
                  Is This You?
                </h3>
                <ul className="mt-4 space-y-3">
                  {whoIsItFor.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2
                        size={18}
                        className="mt-0.5 shrink-0 text-rani-gold"
                      />
                      <span className="font-body text-sm text-rani-text">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <Button href="https://app.mangomint.com/m/ranibeautyclinic" icon>
                    Book Your Assessment
                  </Button>
                </div>
              </div>
            </FadeInOnScroll>
          </div>
        </div>
      </section>

      {/* ── How It Works / The Science ── */}
      <section id="how-it-works" className="bg-rani-cream py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="THE SCIENCE" />
            <h2 className="mt-4 text-center font-body text-2xl font-bold text-rani-navy md:text-3xl">
              Two Technologies. One Comprehensive Protocol.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center font-body text-sm leading-relaxed text-rani-muted">
              Post-weight-loss skin laxity is a dual-layer problem — loose
              collagen in the deep dermis and damaged texture at the surface. The
              Reveal addresses both simultaneously.
            </p>
          </FadeInOnScroll>

          <StaggerChildren className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {sciencePillars.map((pillar) => (
              <Card key={pillar.title} goldTop>
                <div className="flex flex-col items-center text-center">
                  <pillar.icon size={32} className="text-rani-gold" />
                  <h3 className="mt-4 font-body text-lg font-bold text-rani-navy">
                    {pillar.title}
                  </h3>
                  <p className="mt-3 font-body text-sm leading-relaxed text-rani-text">
                    {pillar.description}
                  </p>
                </div>
              </Card>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* ── Protocol Tiers ── */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="YOUR PROTOCOL" />
            <h2 className="mt-4 text-center font-body text-2xl font-bold text-rani-navy md:text-3xl">
              Three Tiers. One Goal: Your Reveal.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center font-body text-sm text-rani-muted">
              Every journey is different. Choose the protocol that matches your
              degree of laxity, treatment areas, and goals — or let us recommend
              the right fit during your Reveal Assessment.
            </p>
          </FadeInOnScroll>

          <StaggerChildren className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {tiers.map((tier) => (
              <Card
                key={tier.name}
                goldTop={tier.popular}
                className={
                  tier.popular ? "ring-2 ring-rani-gold relative" : ""
                }
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-rani-gold px-4 py-1 font-body text-xs font-bold uppercase tracking-wider text-rani-navy">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="flex flex-col items-center text-center">
                  <h3 className="mt-2 font-body text-xl font-bold text-rani-navy">
                    {tier.name}
                  </h3>
                  <p className="mt-1 font-body text-xs uppercase tracking-wider text-rani-gold">
                    {tier.subtitle}
                  </p>
                  <div className="mt-4">
                    <span className="font-body text-3xl font-bold text-rani-navy">
                      {tier.price}
                    </span>
                  </div>
                  <p className="mt-2 font-body text-xs text-rani-muted">
                    {tier.description}
                  </p>

                  <ul className="mt-6 w-full space-y-3 text-left">
                    {tier.includes.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="mt-0.5 shrink-0 text-rani-gold">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                          >
                            <path
                              d="M13.3 4.3L6 11.6L2.7 8.3"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        <span className="font-body text-sm text-rani-text">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 w-full">
                    <Button
                      href="https://app.mangomint.com/m/ranibeautyclinic"
                      className={
                        tier.popular
                          ? "!w-full !bg-rani-gold !text-rani-navy hover:!bg-rani-gold-light"
                          : "!w-full"
                      }
                    >
                      Book Your Assessment
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </StaggerChildren>

          <FadeInOnScroll delay={0.3}>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Badge icon="check">HSA/FSA Accepted</Badge>
              <Badge icon="check">Financing Available</Badge>
              <Badge icon="shield">Physician-Supervised</Badge>
            </div>
          </FadeInOnScroll>
        </div>
      </section>

      {/* ── Your Journey / Timeline ── */}
      <section className="bg-rani-cream py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="YOUR JOURNEY" />
            <h2 className="mt-4 text-center font-body text-2xl font-bold text-rani-navy md:text-3xl">
              From Assessment to Reveal
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center font-body text-sm text-rani-muted">
              Every Reveal protocol follows a structured timeline designed to
              maximize collagen remodeling and deliver progressive, lasting
              results.
            </p>
          </FadeInOnScroll>

          <div className="mx-auto mt-12 max-w-3xl">
            {timeline.map((step, index) => (
              <FadeInOnScroll key={step.week} delay={index * 0.1}>
                <div className="relative flex gap-6 pb-10 last:pb-0">
                  {/* Vertical line */}
                  {index < timeline.length - 1 && (
                    <div className="absolute left-[19px] top-10 h-full w-px bg-rani-gold/30" />
                  )}
                  {/* Dot */}
                  <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rani-gold/20">
                    <div className="h-3 w-3 rounded-full bg-rani-gold" />
                  </div>
                  {/* Content */}
                  <div className="pt-1">
                    <span className="font-body text-xs font-bold uppercase tracking-wider text-rani-gold">
                      {step.week}
                    </span>
                    <h3 className="mt-1 font-body text-lg font-bold text-rani-navy">
                      {step.title}
                    </h3>
                    <p className="mt-2 font-body text-sm leading-relaxed text-rani-text">
                      {step.description}
                    </p>
                  </div>
                </div>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ── Inner Circle ── */}
      <section className="bg-rani-navy py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <FadeInOnScroll direction="left">
              <div>
                <SectionLabel label="EXCLUSIVE ACCESS" dark />
                <h2 className="mt-4 font-body text-2xl font-bold text-white md:text-3xl">
                  The Inner Circle
                </h2>
                <p className="mt-4 font-body text-sm leading-relaxed text-white/70">
                  For patients who view skin restoration as an ongoing commitment
                  — not a one-time event. The Inner Circle provides exclusive
                  benefits, priority access, and continued guidance as your results
                  evolve.
                </p>
                <p className="mt-4 font-body text-sm leading-relaxed text-white/70">
                  Inner Circle membership is included with the Complete tier, or
                  available as an add-on to any Reveal protocol.
                </p>
                <div className="mt-6">
                  <Button href="https://app.mangomint.com/m/ranibeautyclinic" icon>
                    Learn More at Your Assessment
                  </Button>
                </div>
              </div>
            </FadeInOnScroll>

            <FadeInOnScroll direction="right" delay={0.2}>
              <div className="rounded-xl border border-white/10 bg-white/5 p-8">
                <div className="flex items-center gap-3">
                  <Star size={24} className="text-rani-gold" />
                  <h3 className="font-body text-lg font-bold text-white">
                    Member Benefits
                  </h3>
                </div>
                <ul className="mt-6 space-y-4">
                  {innerCircleBenefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2
                        size={16}
                        className="mt-0.5 shrink-0 text-rani-gold"
                      />
                      <span className="font-body text-sm text-white/80">
                        {benefit}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeInOnScroll>
          </div>
        </div>
      </section>

      {/* ── Why Rani ── */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="WHY RANI" />
            <h2 className="mt-4 text-center font-body text-2xl font-bold text-rani-navy md:text-3xl">
              Your Transformation Deserves Specialized Care
            </h2>
          </FadeInOnScroll>

          <StaggerChildren className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Shield,
                title: "Physician-Supervised",
                description:
                  "Every protocol is overseen by our medical director. Your safety and outcomes are medically managed.",
              },
              {
                icon: Sparkles,
                title: "GLP-1 Specialists",
                description:
                  "We understand post-weight-loss skin at a clinical level — because we treat GLP-1 patients every day.",
              },
              {
                icon: Users,
                title: "Personalized Protocols",
                description:
                  "No cookie-cutter treatments. Your Reveal protocol is mapped to your specific areas, skin type, and goals.",
              },
              {
                icon: Calendar,
                title: "Long-Term Partnership",
                description:
                  "From your first Assessment through full results and beyond, we track and support your skin journey.",
              },
            ].map((item) => (
              <Card key={item.title} hover={false}>
                <div className="flex flex-col items-center text-center">
                  <item.icon size={28} className="text-rani-gold" />
                  <h3 className="mt-4 font-body text-sm font-bold text-rani-navy">
                    {item.title}
                  </h3>
                  <p className="mt-2 font-body text-xs leading-relaxed text-rani-muted">
                    {item.description}
                  </p>
                </div>
              </Card>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-rani-cream py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="FAQ" />
            <h2 className="mt-4 text-center font-body text-2xl font-bold text-rani-navy md:text-3xl">
              Frequently Asked Questions
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center font-body text-sm text-rani-muted">
              Everything you need to know about The Reveal protocol. Have a
              question we haven&apos;t answered? Reach out — we&apos;re here to help.
            </p>
          </FadeInOnScroll>

          <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-2">
            {faqs.map((faq, index) => (
              <FadeInOnScroll
                key={index}
                delay={index < 6 ? index * 0.05 : (index - 6) * 0.05}
              >
                <FAQItem
                  question={faq.q}
                  answer={faq.a}
                  isOpen={openFaq === index}
                  onToggle={() =>
                    setOpenFaq(openFaq === index ? null : index)
                  }
                />
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <CTABanner
        label="YOUR REVEAL STARTS HERE"
        title="Ready to See What's Possible?"
        subtitle="Your Reveal Assessment is complimentary. No pressure, no obligation — just a personalized evaluation of your skin and a clear path forward."
      />
    </>
  );
}
