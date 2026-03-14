"use client";

import { useState } from "react";
import { CreditCard, Shield, Star, Crown, Sparkles, Gift, ChevronDown } from "lucide-react";
import Hero from "@/components/sections/Hero";
import CTABanner from "@/components/sections/CTABanner";
import SectionLabel from "@/components/ui/SectionLabel";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import StaggerChildren from "@/components/animations/StaggerChildren";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { pricingData } from "@/data/pricing";
import { clinicInfo } from "@/data/clinic-info";

type PriceItem = { name: string; price: string; note?: string; time?: string };

function PriceGrid({ items, columns = 3 }: { items: PriceItem[]; columns?: 2 | 3 }) {
  const colClass = columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <StaggerChildren className={`mt-8 grid grid-cols-1 gap-3 ${colClass}`}>
      {items.map((item) => (
        <Card key={item.name} hover={false} className="!p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-body text-sm font-bold text-rani-navy">{item.name}</h3>
              {item.note && (
                <p className="mt-0.5 font-body text-xs text-rani-muted">{item.note}</p>
              )}
            </div>
            <div className="shrink-0 text-right">
              <p className="font-body text-sm font-bold text-rani-gold">{item.price}</p>
              {item.time && (
                <p className="font-body text-[10px] text-rani-muted">{item.time}</p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </StaggerChildren>
  );
}

function CategorySection({
  label,
  title,
  subtitle,
  children,
  bg = "white",
}: {
  label: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  bg?: "white" | "cream";
}) {
  return (
    <section className={`${bg === "cream" ? "bg-rani-cream" : "bg-white"} py-16 md:py-20`}>
      <div className="mx-auto max-w-7xl px-6">
        <FadeInOnScroll>
          <SectionLabel label={label} />
          <h2 className="mt-4 text-center font-body text-2xl font-bold text-rani-navy md:text-3xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mx-auto mt-3 max-w-2xl text-center font-body text-sm text-rani-muted">
              {subtitle}
            </p>
          )}
        </FadeInOnScroll>
        {children}
      </div>
    </section>
  );
}

function CollapsibleSection({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mt-6 rounded-xl border border-rani-border bg-white overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-6 py-4 text-left"
      >
        <h3 className="font-body text-lg font-bold text-rani-navy">{title}</h3>
        <ChevronDown
          size={20}
          className={`text-rani-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="px-6 pb-6">{children}</div>}
    </div>
  );
}

export default function PricingPageClient() {
  return (
    <>
      <Hero
        label="TRANSPARENT PRICING"
        title="Pricing & Packages"
        subtitle="Quality physician-supervised treatments at transparent prices. All consultations include a personalized treatment plan."
        dark={false}
        badges={["HSA/FSA Accepted", "Financing Available", "No Hidden Fees"]}
      />

      {/* Laser Hair Removal */}
      <CategorySection
        label="LASER HAIR REMOVAL"
        title="Laser Hair Removal"
        subtitle="Candela GentleMax Pro Plus — all skin types, all body areas. Prices per session."
      >
        <PriceGrid items={pricingData.laserHairRemoval} />
        <FadeInOnScroll delay={0.2}>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Badge icon="check">6-Pack Packages Available</Badge>
            <Badge icon="check">All Skin Types</Badge>
            <Badge icon="check">Pain-Free Technology</Badge>
          </div>
        </FadeInOnScroll>
      </CategorySection>

      {/* Hydrafacial */}
      <CategorySection label="HYDRAFACIAL" title="HydraFacial Treatments" bg="cream">
        <PriceGrid items={pricingData.hydrafacial} columns={2} />
      </CategorySection>

      {/* Laser Facials + Chemical Peels */}
      <CategorySection
        label="SKIN TREATMENTS"
        title="Laser Facials, Peels & Resurfacing"
        subtitle="Advanced skin rejuvenation treatments for acne, rosacea, sun damage, fine lines, and scarring."
      >
        <CollapsibleSection title="Laser Facials (ND:Yag)" defaultOpen>
          <PriceGrid items={pricingData.laserFacials} columns={2} />
        </CollapsibleSection>
        <CollapsibleSection title="Chemical Peels & BioRePeel" defaultOpen>
          <PriceGrid items={pricingData.chemicalPeels} />
        </CollapsibleSection>
        <CollapsibleSection title="Scar Reduction">
          <PriceGrid items={pricingData.scarReduction} columns={2} />
        </CollapsibleSection>
      </CategorySection>

      {/* RF Microneedling + Sofwave */}
      <CategorySection
        label="SKIN TIGHTENING"
        title="RF Microneedling & Sofwave"
        subtitle="Advanced collagen remodeling and skin tightening for face and body."
        bg="cream"
      >
        <CollapsibleSection title="RF Microneedling (Cutera Secret)" defaultOpen>
          <PriceGrid items={pricingData.rfMicroneedling} columns={2} />
        </CollapsibleSection>
        <CollapsibleSection title="Sofwave" defaultOpen>
          <PriceGrid items={pricingData.sofwave} columns={2} />
        </CollapsibleSection>
      </CategorySection>

      {/* GLP-1 Weight Loss */}
      <CategorySection
        label="WEIGHT MANAGEMENT"
        title="GLP-1 Weight Loss Programs"
        subtitle="Physician-supervised Semaglutide, Tirzepatide, and Liraglutide programs with full medical monitoring."
      >
        <CollapsibleSection title="Semaglutide Program" defaultOpen>
          <StaggerChildren className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pricingData.glp1.semaglutide.map((item) => (
              <Card key={item.phase} hover={false} className="!p-4">
                <p className="font-body text-xs text-rani-muted">{item.phase}</p>
                <p className="mt-1 font-body text-lg font-bold text-rani-navy">{item.price}</p>
              </Card>
            ))}
          </StaggerChildren>
        </CollapsibleSection>
        <CollapsibleSection title="Tirzepatide Program">
          <StaggerChildren className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pricingData.glp1.tirzepatide.map((item) => (
              <Card key={item.phase} hover={false} className="!p-4">
                <p className="font-body text-xs text-rani-muted">{item.phase}</p>
                <p className="mt-1 font-body text-lg font-bold text-rani-navy">{item.price}</p>
              </Card>
            ))}
          </StaggerChildren>
        </CollapsibleSection>
        <CollapsibleSection title="Liraglutide Program">
          <StaggerChildren className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {pricingData.glp1.liraglutide.map((item) => (
              <Card key={item.phase} hover={false} className="!p-4">
                <p className="font-body text-xs text-rani-muted">{item.phase}</p>
                <p className="mt-1 font-body text-lg font-bold text-rani-navy">{item.price}</p>
                {item.note && <p className="mt-0.5 font-body text-xs text-rani-muted">{item.note}</p>}
              </Card>
            ))}
          </StaggerChildren>
        </CollapsibleSection>
        <CollapsibleSection title="Weight Loss Packages" defaultOpen>
          <StaggerChildren className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {pricingData.glp1.packages.map((pkg) => (
              <Card key={pkg.name} goldTop className="!p-5">
                <h4 className="font-body text-base font-bold text-rani-navy">{pkg.name}</h4>
                {pkg.note && (
                  <span className="mt-1 inline-block rounded-full bg-rani-gold/20 px-2 py-0.5 font-body text-[10px] font-semibold text-rani-navy">
                    {pkg.note}
                  </span>
                )}
                <p className="mt-2 font-body text-xl font-bold text-rani-gold">{pkg.price}</p>
                <p className="mt-0.5 font-body text-xs text-rani-muted">{pkg.duration}</p>
                <p className="mt-2 font-body text-xs text-rani-text">{pkg.includes}</p>
              </Card>
            ))}
          </StaggerChildren>
        </CollapsibleSection>
      </CategorySection>

      {/* Hormones & Peptides */}
      <CategorySection
        label="HORMONES & PEPTIDES"
        title="Hormone Therapy, Peptides & Injections"
        subtitle="Physician-supervised hormone optimization and peptide therapies via Olympia Pharmacy."
        bg="cream"
      >
        <CollapsibleSection title="Hormone Replacement Therapy" defaultOpen>
          <PriceGrid items={pricingData.hormones} columns={2} />
        </CollapsibleSection>
        <CollapsibleSection title="Peptides & Injections" defaultOpen>
          <PriceGrid items={pricingData.peptides} />
        </CollapsibleSection>
      </CategorySection>

      {/* Labs */}
      <CategorySection
        label="LABS & DIAGNOSTICS"
        title="Labs & Blood Work"
        subtitle="In-house blood draws and comprehensive lab panels. Required for GLP-1 and HRT programs."
      >
        <PriceGrid items={pricingData.labs} />
      </CategorySection>

      {/* Service Packages */}
      <CategorySection
        label="SAVE MORE"
        title="Packages & Bundles"
        subtitle="Pre-paid packages for the best value. Multi-session bundles provide better results and better savings."
        bg="cream"
      >
        <StaggerChildren className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pricingData.servicePackages.map((pkg) => (
            <Card key={pkg.name} goldTop className="!p-5">
              <h3 className="font-body text-sm font-bold text-rani-navy">{pkg.name}</h3>
              {pkg.note && (
                <p className="mt-1 font-body text-xs text-rani-muted">{pkg.note}</p>
              )}
              <p className="mt-3 font-body text-xl font-bold text-rani-gold">{pkg.price}</p>
              {pkg.savings && (
                <p className="mt-0.5 font-body text-xs text-rani-success font-semibold">
                  Save {pkg.savings}
                </p>
              )}
              {pkg.retailValue && (
                <p className="font-body text-[10px] text-rani-muted">
                  Retail value: {pkg.retailValue}
                </p>
              )}
            </Card>
          ))}
        </StaggerChildren>
      </CategorySection>

      {/* Membership */}
      <section id="membership" className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="MEMBERSHIP" />
            <h2 className="mt-4 text-center font-body text-2xl font-bold text-rani-navy md:text-3xl">
              {pricingData.membership.name}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center font-body text-sm text-rani-muted">
              Join today and get {pricingData.membership.signupBonus}. Exclusive monthly
              memberships with VIP perks and the best value on your aesthetic journey.
            </p>
          </FadeInOnScroll>

          <StaggerChildren className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {pricingData.membership.tiers.map((tier) => (
              <Card
                key={tier.name}
                goldTop={tier.popular}
                className={tier.popular ? "ring-2 ring-rani-gold relative" : ""}
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
                  <div className="mt-2">
                    <span className="font-body text-3xl font-bold text-rani-navy">
                      {tier.price.replace("/mo", "")}
                    </span>
                    <span className="font-body text-sm text-rani-muted">/mo</span>
                  </div>
                  <p className="mt-1 font-body text-xs text-rani-success font-semibold">
                    {tier.savings} saved
                  </p>

                  <ul className="mt-6 space-y-3 text-left w-full">
                    {tier.features.map((feature, index) => (
                      <li
                        key={index}
                        className={`flex items-start gap-3 font-body text-sm ${
                          feature.startsWith("Everything")
                            ? "text-rani-gold font-semibold"
                            : "text-rani-text"
                        }`}
                      >
                        <span className="mt-0.5 shrink-0 text-rani-gold">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path
                              d="M13.3 4.3L6 11.6L2.7 8.3"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 w-full">
                    {pricingData.membership.comingSoon ? (
                      <Button
                        href="/contact"
                        className="!w-full"
                      >
                        Contact Us
                      </Button>
                    ) : (
                      <Button
                        href="/contact"
                        className={
                          tier.popular
                            ? "!w-full !bg-rani-gold !text-rani-navy hover:!bg-rani-gold-light"
                            : "!w-full"
                        }
                      >
                        Join {tier.name}
                      </Button>
                    )}
                  </div>
                  <p className="mt-3 text-center font-body text-[11px] text-rani-muted">
                    Memberships are activated during your consultation
                  </p>
                </div>
              </Card>
            ))}
          </StaggerChildren>

          {/* Membership FAQ */}
          <FadeInOnScroll delay={0.3}>
            <div className="mt-16 mx-auto max-w-2xl">
              <h3 className="text-center font-body text-lg font-bold text-rani-navy mb-6">
                Membership FAQ
              </h3>
              <div className="space-y-4">
                {[
                  { q: "Can I upgrade my tier?", a: "Yes, anytime. Billing is prorated to your new tier." },
                  { q: "Is there a contract?", a: "No contracts. Cancel anytime with 30 days notice." },
                  { q: "When do my monthly services reset?", a: "On your billing date each month. Unused services roll over for up to 2 months (3 months for Elite Aura)." },
                  { q: "Can I share my membership?", a: "Memberships are non-transferable and tied to your account." },
                ].map((faq) => (
                  <div key={faq.q} className="rounded-lg border border-rani-border bg-rani-cream p-4">
                    <p className="font-body text-sm font-bold text-rani-navy">{faq.q}</p>
                    <p className="mt-1 font-body text-sm text-rani-muted">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeInOnScroll>
        </div>
      </section>

      {/* Loyalty Program */}
      <section className="bg-rani-cream py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="REWARDS" />
            <h2 className="mt-4 text-center font-body text-2xl font-bold text-rani-navy md:text-3xl">
              {pricingData.loyaltyProgram.name}
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-center font-body text-sm text-rani-muted">
              Earn points on every visit. {pricingData.loyaltyProgram.baseRate} on all purchases
              ({pricingData.loyaltyProgram.memberRate}).
            </p>
          </FadeInOnScroll>

          <StaggerChildren className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pricingData.loyaltyProgram.rewards.map((r) => (
              <Card key={r.tier} hover={false} className="!p-4 text-center">
                <Gift size={20} className="mx-auto text-rani-gold" />
                <h3 className="mt-2 font-body text-sm font-bold text-rani-navy">{r.tier}</h3>
                <p className="mt-1 font-body text-xs text-rani-muted">{r.requirement}</p>
                <p className="mt-2 font-body text-sm font-semibold text-rani-gold">{r.reward}</p>
              </Card>
            ))}
          </StaggerChildren>

          <FadeInOnScroll delay={0.2}>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Badge icon="check">Referral: {pricingData.loyaltyProgram.referralBonus}</Badge>
              <Badge icon="check">Reviews: {pricingData.loyaltyProgram.reviewBonus}</Badge>
            </div>
          </FadeInOnScroll>
        </div>
      </section>

      {/* Financing */}
      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <FadeInOnScroll direction="left">
              <div>
                <SectionLabel label="FLEXIBLE PAYMENT" className="!items-start" />
                <h2 className="mt-4 font-body text-2xl font-bold text-rani-navy md:text-3xl">
                  Financing Options
                </h2>
                <p className="mt-4 font-body text-sm leading-relaxed text-rani-text">
                  {pricingData.paymentInfo.financingNote}
                </p>
                <div className="mt-6 flex flex-wrap gap-4">
                  {pricingData.paymentInfo.financingProviders.map((provider) => (
                    <div
                      key={provider}
                      className="flex items-center gap-3 rounded-xl border border-rani-border bg-rani-cream px-6 py-4"
                    >
                      <CreditCard size={20} className="text-rani-gold" />
                      <span className="font-body text-base font-bold text-rani-navy">
                        {provider}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <Button href="/contact" icon>
                    Ask About Financing
                  </Button>
                </div>
              </div>
            </FadeInOnScroll>

            <FadeInOnScroll direction="right">
              <div className="flex h-full flex-col justify-center rounded-xl border border-rani-border bg-rani-cream p-8">
                <Shield size={32} className="text-rani-gold" />
                <h3 className="mt-4 font-body text-xl font-bold text-rani-navy">
                  HSA & FSA Accepted
                </h3>
                <p className="mt-3 font-body text-sm leading-relaxed text-rani-text">
                  Many of our treatments are eligible for payment with your Health Savings
                  Account (HSA) or Flexible Spending Account (FSA). Use your pre-tax
                  healthcare dollars for qualifying treatments.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Badge icon="check">HSA Cards</Badge>
                  <Badge icon="check">FSA Cards</Badge>
                  <Badge icon="shield">Eligible Treatments</Badge>
                </div>
              </div>
            </FadeInOnScroll>
          </div>
        </div>
      </section>

      <CTABanner
        title="Questions About Pricing?"
        subtitle="Schedule a consultation and we'll create a personalized treatment plan with transparent pricing. Your $150 deposit applies toward any treatment."
      />
    </>
  );
}
