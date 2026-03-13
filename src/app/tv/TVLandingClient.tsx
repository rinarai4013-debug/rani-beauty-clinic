"use client";

import { useEffect, useState, useRef } from "react";
import { clinicInfo } from "@/data/clinic-info";

/* ─── UTM capture ─── */
function getUTMParams(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach((key) => {
    const val = params.get(key);
    if (val) utm[key] = val;
  });
  return utm;
}

/* ─── Intersection Observer fade-in ─── */
function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("tv-visible");
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function FadeSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useFadeIn();
  return (
    <div ref={ref} className={`tv-fade ${className}`}>
      {children}
    </div>
  );
}

/* ─── Star icon ─── */
function Star() {
  return (
    <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

/* ─── Icons ─── */
function PhoneIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-5 w-5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <circle cx={12} cy={12} r={10} />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

/* ─── Main Component ─── */
export default function TVLandingClient() {
  const [utmParams, setUtmParams] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", service: "Brazilian Laser Hair Removal" });
  const [submitted, setSubmitted] = useState(false);

  /* Hide parent layout chrome */
  useEffect(() => {
    const selectors = ["nav", "footer", '[class*="MobileCTA"]', '[class*="ScrollProgress"]', '[class*="ScrollToTop"]'];
    const hidden: HTMLElement[] = [];
    selectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (htmlEl.closest("[data-tv-landing]")) return; // don't hide our own elements
        htmlEl.style.display = "none";
        hidden.push(htmlEl);
      });
    });
    // Also hide the main site's mobile CTA bar
    const mobileCTA = document.querySelector('[class*="fixed"][class*="bottom"]');
    if (mobileCTA && !(mobileCTA as HTMLElement).closest("[data-tv-landing]")) {
      (mobileCTA as HTMLElement).style.display = "none";
      hidden.push(mobileCTA as HTMLElement);
    }
    setUtmParams(getUTMParams());
    return () => {
      hidden.forEach((el) => (el.style.display = ""));
    };
  }, []);

  /* Smooth scroll */
  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // In production this would POST to an API
    console.log("Form submitted:", { ...formData, ...utmParams });
    setSubmitted(true);
  }

  const bookingUrl = "https://ranibeautyclinic.com/contact";

  return (
    <div data-tv-landing className="bg-white">
      {/* ─── CSS ─── */}
      <style jsx global>{`
        .tv-fade {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s ease-out, transform 0.7s ease-out;
        }
        .tv-visible {
          opacity: 1;
          transform: translateY(0);
        }
        @keyframes tv-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      {/* ─── Sticky Header ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-heading text-lg tracking-wide text-[#0F1D2C]">RANI BEAUTY CLINIC</span>
          <div className="flex items-center gap-3">
            <a
              href={clinicInfo.phoneTel}
              className="md:hidden flex items-center gap-1.5 text-sm font-semibold text-[#8B6F4E]"
            >
              <PhoneIcon className="h-4 w-4" />
              Call
            </a>
            <a
              href={clinicInfo.phoneTel}
              className="hidden md:flex items-center gap-1.5 text-sm text-[#8B6F4E] font-medium"
            >
              <PhoneIcon className="h-4 w-4" />
              {clinicInfo.phone}
            </a>
            <button
              onClick={() => scrollTo("book")}
              className="bg-[#8B6F4E] text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-[#7A5F3E] transition-colors"
            >
              Book Now
            </button>
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="relative min-h-[90vh] flex items-center pt-14 overflow-hidden bg-gradient-to-br from-[#0F1D2C] via-[#1A2A3C] to-[#0F1D2C]">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-[-100px] w-[400px] h-[400px] rounded-full bg-[#8B6F4E]/10 blur-3xl" />
          <div className="absolute bottom-[-50px] left-[-100px] w-[300px] h-[300px] rounded-full bg-[#F3D6BE]/10 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-16 md:py-24 text-center">
          {/* Hulu badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
            <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white/90 text-sm font-medium tracking-wide">AS SEEN ON HULU</span>
          </div>

          <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl text-white leading-tight mb-4">
            <span className="text-[#F3D6BE]">$99</span> Brazilian Laser
            <br />
            Hair Removal
          </h1>
          <p className="text-xl md:text-2xl text-[#F3D6BE] font-medium mb-2">
            + FREE Underarm Treatment
          </p>
          <p className="text-white/60 text-base md:text-lg mb-8 max-w-xl mx-auto">
            Pain-free, physician-supervised treatments with the Candela GentleMax Pro Plus. Safe for all skin types.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <button
              onClick={() => scrollTo("book")}
              className="bg-[#8B6F4E] hover:bg-[#7A5F3E] text-white font-semibold text-lg px-8 py-4 rounded-full transition-all hover:scale-105 shadow-lg shadow-[#8B6F4E]/30"
            >
              Book Your $99 Appointment
            </button>
            <a
              href={clinicInfo.phoneTel}
              className="flex items-center justify-center gap-2 border border-white/30 text-white font-medium text-lg px-8 py-4 rounded-full hover:bg-white/10 transition-colors"
            >
              <PhoneIcon />
              {clinicInfo.phone}
            </a>
          </div>

          {/* Trust bar - visible on hero for mobile */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-white/80 text-sm">
            <div className="flex items-center gap-1.5">
              <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} />)}</div>
              <span className="font-medium">200+ Five-Star Reviews</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckIcon />
              <span>Licensed Medical Professionals</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckIcon />
              <span>Open 7 Days a Week</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Trust Bar (desktop) ─── */}
      <section className="bg-[#FAF8F5] border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-5">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-sm font-medium text-[#0F1D2C]">
            <div className="flex items-center gap-2">
              <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} />)}</div>
              <span>200+ Five-Star Google Reviews</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-[#8B6F4E]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Licensed Medical Professionals</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-[#8B6F4E]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>Personalized Treatment Plans</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── About the Offer ─── */}
      <FadeSection>
        <section className="py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-10">
              <p className="text-[#8B6F4E] font-semibold text-sm tracking-widest uppercase mb-3">Exclusive Hulu Offer</p>
              <h2 className="font-heading text-3xl md:text-4xl text-[#0F1D2C] mb-4">
                Smooth Skin Starts at $99
              </h2>
              <p className="text-[#6B7280] text-lg max-w-2xl mx-auto">
                For a limited time, Hulu viewers get our most popular laser hair removal package at an unbeatable price.
              </p>
            </div>

            <div className="bg-gradient-to-br from-[#FAF8F5] to-white border border-[#F3D6BE]/50 rounded-2xl p-8 md:p-10 shadow-sm">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-heading text-2xl text-[#0F1D2C] mb-4">What&apos;s Included</h3>
                  <ul className="space-y-3">
                    {[
                      "Full Brazilian laser hair removal session",
                      "FREE underarm laser treatment (valued at $79)",
                      "Complimentary consultation & skin assessment",
                      "Candela GentleMax Pro Plus technology",
                      "Safe for all skin types & tones",
                      "Physician-supervised treatment",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <CheckIcon />
                        <span className="text-[#2A2A2A]">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col justify-between">
                  <div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="font-heading text-5xl text-[#8B6F4E]">$99</span>
                      <span className="text-[#6B7280] line-through text-lg">$278</span>
                    </div>
                    <p className="text-emerald-600 font-semibold text-sm mb-4">Save $179 with this offer</p>
                    <p className="text-[#6B7280] text-sm mb-6">
                      Limited-time offer for Hulu viewers. Mention code <strong className="text-[#0F1D2C]">HULU99</strong> when booking.
                    </p>
                  </div>
                  <button
                    onClick={() => scrollTo("book")}
                    className="w-full bg-[#8B6F4E] hover:bg-[#7A5F3E] text-white font-semibold py-4 rounded-full transition-all hover:scale-[1.02] text-lg shadow-lg shadow-[#8B6F4E]/20"
                  >
                    Claim This Offer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </FadeSection>

      {/* ─── Services Teaser ─── */}
      <FadeSection>
        <section className="py-16 md:py-24 bg-[#FAF8F5]">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <p className="text-[#8B6F4E] font-semibold text-sm tracking-widest uppercase mb-3">Our Services</p>
              <h2 className="font-heading text-3xl md:text-4xl text-[#0F1D2C] mb-4">
                More Than Just Laser
              </h2>
              <p className="text-[#6B7280] text-lg max-w-xl mx-auto">
                Explore our full range of physician-supervised aesthetic treatments.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[
                { title: "Botox & Dysport", desc: "Neurologist-supervised wrinkle relaxers for natural results", icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" },
                { title: "Dermal Fillers", desc: "Lips, cheeks, and jawline contouring with premium fillers", icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" },
                { title: "HydraFacial MD", desc: "Deep cleanse, extract, and hydrate in one glow-giving session", icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" },
                { title: "RF Microneedling", desc: "Collagen-stimulating skin tightening for firmer, smoother skin", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
              ].map((service) => (
                <div
                  key={service.title}
                  className="bg-white rounded-xl p-5 md:p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-[#F3D6BE] transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] flex items-center justify-center mb-3 group-hover:bg-[#F3D6BE]/30 transition-colors">
                    <svg className="h-5 w-5 text-[#8B6F4E]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d={service.icon} />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-[#0F1D2C] mb-1.5 text-sm md:text-base">{service.title}</h3>
                  <p className="text-[#6B7280] text-xs md:text-sm leading-relaxed">{service.desc}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <a
                href="/services"
                className="inline-flex items-center gap-1.5 text-[#8B6F4E] font-semibold hover:underline"
              >
                View All Services
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </section>
      </FadeSection>

      {/* ─── About ─── */}
      <FadeSection>
        <section className="py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <p className="text-[#8B6F4E] font-semibold text-sm tracking-widest uppercase mb-3">About Us</p>
            <h2 className="font-heading text-3xl md:text-4xl text-[#0F1D2C] mb-6">
              Where Confidence Meets Beauty
            </h2>
            <p className="text-[#6B7280] text-lg leading-relaxed max-w-2xl mx-auto mb-6">
              Rani Beauty Clinic is a physician-supervised medspa in Renton, WA, where advanced technology meets personalized care.
              Every treatment is overseen by Dr. Alexander Landfield, a board-certified neurologist, ensuring clinical precision
              with natural-looking results.
            </p>
            <p className="text-[#6B7280] text-lg leading-relaxed max-w-2xl mx-auto mb-8">
              We believe you deserve expert care in a warm, welcoming environment &mdash; open 7 days a week, with HSA/FSA accepted and
              flexible payment options available.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-[#0F1D2C]">
              {[
                "Neurologist-Led",
                "Woman-Owned",
                "Open 7 Days",
                "All Skin Types Welcome",
              ].map((badge) => (
                <span key={badge} className="bg-[#FAF8F5] border border-[#F3D6BE]/50 rounded-full px-4 py-2 font-medium">
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </section>
      </FadeSection>

      {/* ─── Booking / Contact ─── */}
      <FadeSection>
        <section id="book" className="py-16 md:py-24 bg-gradient-to-br from-[#0F1D2C] via-[#1A2A3C] to-[#0F1D2C] scroll-mt-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <p className="text-[#F3D6BE] font-semibold text-sm tracking-widest uppercase mb-3">Book Now</p>
              <h2 className="font-heading text-3xl md:text-4xl text-white mb-4">
                Ready for Smooth, Beautiful Skin?
              </h2>
              <p className="text-white/60 text-lg max-w-xl mx-auto">
                Claim your $99 Brazilian Laser Hair Removal + FREE underarms. Mention code <strong className="text-[#F3D6BE]">HULU99</strong>.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
              {/* Contact info */}
              <div className="space-y-6">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-5">
                  <a href={clinicInfo.phoneTel} className="flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-full bg-[#8B6F4E]/20 flex items-center justify-center flex-shrink-0 group-hover:bg-[#8B6F4E]/30 transition-colors">
                      <PhoneIcon className="h-5 w-5 text-[#F3D6BE]" />
                    </div>
                    <div>
                      <p className="text-white/50 text-xs uppercase tracking-wider mb-0.5">Call or Text</p>
                      <p className="text-white text-lg font-semibold">{clinicInfo.phone}</p>
                    </div>
                  </a>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#8B6F4E]/20 flex items-center justify-center flex-shrink-0">
                      <MapPinIcon />
                    </div>
                    <div>
                      <p className="text-white/50 text-xs uppercase tracking-wider mb-0.5">Visit Us</p>
                      <p className="text-white font-medium">{clinicInfo.address.street}</p>
                      <p className="text-white/70 text-sm">{clinicInfo.address.city}, {clinicInfo.address.state} {clinicInfo.address.zip}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#8B6F4E]/20 flex items-center justify-center flex-shrink-0">
                      <ClockIcon />
                    </div>
                    <div>
                      <p className="text-white/50 text-xs uppercase tracking-wider mb-0.5">Hours</p>
                      <p className="text-white font-medium">{clinicInfo.hours.formatted}</p>
                    </div>
                  </div>
                </div>

                <a
                  href={clinicInfo.phoneTel}
                  className="flex items-center justify-center gap-2 w-full bg-[#8B6F4E] hover:bg-[#7A5F3E] text-white font-semibold py-4 rounded-full transition-all text-lg md:hidden"
                >
                  <PhoneIcon />
                  Call to Book Now
                </a>
              </div>

              {/* Form */}
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xl">
                {submitted ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="h-8 w-8 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="font-heading text-2xl text-[#0F1D2C] mb-2">You&apos;re All Set!</h3>
                    <p className="text-[#6B7280]">We&apos;ll be in touch within 24 hours to confirm your appointment.</p>
                  </div>
                ) : (
                  <>
                    <h3 className="font-heading text-xl text-[#0F1D2C] mb-1">Request Your Appointment</h3>
                    <p className="text-[#6B7280] text-sm mb-5">We&apos;ll call you back within 24 hours.</p>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-[#2A2A2A] mb-1">Full Name</label>
                        <input
                          id="name"
                          required
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8B6F4E]/50 focus:border-[#8B6F4E] text-[#2A2A2A]"
                          placeholder="Your name"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-[#2A2A2A] mb-1">Email</label>
                          <input
                            id="email"
                            required
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8B6F4E]/50 focus:border-[#8B6F4E] text-[#2A2A2A]"
                            placeholder="you@email.com"
                          />
                        </div>
                        <div>
                          <label htmlFor="phone" className="block text-sm font-medium text-[#2A2A2A] mb-1">Phone</label>
                          <input
                            id="phone"
                            required
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8B6F4E]/50 focus:border-[#8B6F4E] text-[#2A2A2A]"
                            placeholder="(555) 123-4567"
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="service" className="block text-sm font-medium text-[#2A2A2A] mb-1">Preferred Service</label>
                        <select
                          id="service"
                          value={formData.service}
                          onChange={(e) => setFormData((p) => ({ ...p, service: e.target.value }))}
                          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8B6F4E]/50 focus:border-[#8B6F4E] text-[#2A2A2A] bg-white"
                        >
                          <option>Brazilian Laser Hair Removal ($99 Hulu Special)</option>
                          <option>Botox & Dysport</option>
                          <option>Dermal Fillers</option>
                          <option>HydraFacial MD</option>
                          <option>RF Microneedling</option>
                          <option>Other Service</option>
                        </select>
                      </div>

                      {/* Hidden UTM fields */}
                      {Object.entries(utmParams).map(([key, val]) => (
                        <input key={key} type="hidden" name={key} value={val} />
                      ))}

                      <button
                        type="submit"
                        className="w-full bg-[#8B6F4E] hover:bg-[#7A5F3E] text-white font-semibold py-4 rounded-full transition-all hover:scale-[1.02] text-lg shadow-lg shadow-[#8B6F4E]/20"
                      >
                        Book My Appointment
                      </button>

                      <p className="text-xs text-center text-[#6B7280]">
                        By submitting, you agree to our{" "}
                        <a href="/privacy-policy" className="underline">Privacy Policy</a>.
                        We&apos;ll never spam you.
                      </p>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </FadeSection>

      {/* ─── Footer ─── */}
      <footer data-tv-landing className="bg-[#0A1520] border-t border-white/10 py-10">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="font-heading text-lg text-white/90 mb-2">RANI BEAUTY CLINIC</p>
          <p className="text-[#F3D6BE]/80 italic text-sm mb-4">&ldquo;Where confidence meets beauty.&rdquo;</p>
          <p className="text-white/40 text-sm mb-2">
            {clinicInfo.address.full} &bull; {clinicInfo.phone}
          </p>
          <div className="flex justify-center gap-4 mb-4">
            <a href="/privacy-policy" className="text-white/40 text-sm hover:text-white/70 transition-colors">Privacy Policy</a>
            <span className="text-white/20">|</span>
            <a href="/terms" className="text-white/40 text-sm hover:text-white/70 transition-colors">Terms</a>
          </div>

          {/* Social icons */}
          <div className="flex justify-center gap-4 mb-6">
            {[
              { href: clinicInfo.social.instagram, label: "Instagram", d: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" },
              { href: clinicInfo.social.facebook, label: "Facebook", d: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" },
              { href: clinicInfo.social.tiktok, label: "TikTok", d: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" },
            ].map((social) => (
              <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.label} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <svg className="h-4 w-4 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                  <path d={social.d} />
                </svg>
              </a>
            ))}
          </div>

          <p className="text-white/30 text-xs">
            &copy; {new Date().getFullYear()} Rani Beauty Clinic. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
