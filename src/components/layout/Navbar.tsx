"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Menu, X, ChevronDown } from "lucide-react";
import { clinicInfo } from "@/data/clinic-info";
import { trackCTAClick, trackPhoneClick, trackBookingOpen } from "@/lib/analytics/events";

// ── Mega Menu Data (4-column layout) ─────────────────────────────────────────

const megaMenuColumns = [
  {
    title: "Face & Skin",
    links: [
      { name: "HydraFacial MD", href: "/services/hydrafacial" },
      { name: "Chemical Peels", href: "/services/chemical-peels" },
      { name: "RF Microneedling", href: "/services/rf-microneedling" },
      { name: "Laser Facials", href: "/services/laser-acne-facial" },
      { name: "BioRePeel", href: "/services/biorepeel" },
    ],
  },
  {
    title: "Peptides Rx",
    links: [
      { name: "Peptide Quiz", href: "/peptides/quiz" },
      { name: "GLP-1 Accelerator", href: "/peptides/protocol/glp1-accelerator" },
      { name: "Men's TRT", href: "/peptides/protocol/mens-trt-foundation" },
      { name: "Women's HRT", href: "/peptides/protocol/womens-hrt-reset" },
      { name: "BPC-157 Recovery", href: "/peptides/bpc-157" },
      { name: "NAD+ Longevity", href: "/peptides/nad-injection" },
      { name: "Full Formulary", href: "/peptides" },
    ],
  },
  {
    title: "Body & Laser",
    links: [
      { name: "Laser Hair Removal", href: "/services/laser-hair-removal" },
      { name: "Sofwave", href: "/services/sofwave" },
      { name: "Red Light Therapy", href: "/services/red-light-therapy" },
      { name: "Botox & Dysport", href: "/services/botox-dysport" },
      { name: "Dermal Fillers", href: "/services/dermal-fillers" },
    ],
  },
  {
    title: "Medical Wellness",
    links: [
      { name: "GLP-1 Weight Loss", href: "/wellness/glp1-weight-management" },
      { name: "NAD+ Injections", href: "/wellness/nad-injections" },
      { name: "Hormone Therapy", href: "/wellness/hormone-therapy" },
      { name: "Vitamin Injections", href: "/wellness/vitamin-injections" },
      { name: "Blood Work", href: "/wellness/blood-work" },
    ],
  },
];

// ── Nav Links (6 items, Peptides Rx promoted to top-level) ──────────────────

const navLinks = [
  { name: "Services", href: "/services", megaMenu: true },
  { name: "Peptides Rx", href: "/peptides", highlight: true },
  { name: "Gifts", href: "/gifts" },
  { name: "Results", href: "/results" },
  { name: "About", href: "/about" },
  { name: "Pricing", href: "/pricing" },
  { name: "Contact", href: "/contact" },
];

// Mobile nav gets a few more items
const mobileNavLinks = [
  { name: "Services", href: "/services" },
  { name: "Peptides Rx", href: "/peptides" },
  { name: "Wellness", href: "/wellness" },
  { name: "Gifts", href: "/gifts" },
  { name: "Neurotoxin", href: "/neurotoxin" },
  { name: "Corporate", href: "/corporate" },
  { name: "Results", href: "/results" },
  { name: "About", href: "/about" },
  { name: "Pricing", href: "/pricing" },
  { name: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [announcementVisible, setAnnouncementVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [mobileOpen]);

  const showAnnouncement = announcementVisible && !scrolled;

  return (
    <>
      {/* ── Announcement Bar (Navy, minimal) ─────────────────────────────── */}
      {/* Audit 2026-04-19 P0 NAV-01: cap at 100vw so fixed positioning
          doesn't stretch to the full scrollable area when any descendant
          overflows. This prevents the dismiss button from rendering
          off-screen on mobile viewports. */}
      <div
        className={`fixed top-0 left-0 right-0 z-[60] w-screen max-w-[100vw] transition-all duration-200 ${
          showAnnouncement
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="relative bg-rani-navy border-b border-white/5 px-10 py-2 text-center">
          <span className="font-body text-[12px] sm:text-[13px] text-white/70">
            Complimentary phone consultations available
          </span>
          {/* Audit 2026-04-19 P2 NAV-02: raise hit area to WCAG touch-target
              minimum (24x24 AAA, 44x44 AA) and ensure it's above the absolute
              parent's padding so it doesn't overlap the text. */}
          <button
            onClick={() => setAnnouncementVisible(false)}
            className="absolute right-1 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded text-white/50 transition-colors hover:bg-white/10 hover:text-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rani-gold"
            aria-label="Dismiss announcement"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── Main Nav ─────────────────────────────────────────────────────── */}
      <nav
        aria-label="Main navigation"
        className={`fixed left-0 right-0 z-50 w-screen max-w-[100vw] transition-all duration-300 ${
          showAnnouncement ? "top-[36px]" : "top-0"
        } ${
          scrolled
            ? "bg-rani-navy/98 border-b border-rani-gold/10 h-16"
            : "bg-transparent h-20"
        }`}
      >
        <div className="mx-auto flex h-full items-center justify-between px-4 md:px-6 2xl:max-w-[1400px]">
          {/* Logo — right-margin is lg-only; on mobile the hamburger + Book pill
              were getting pushed off the 390–414px viewport edge (Audit 2026-04-19
              P0: NAV-01, horizontal overflow). Also cap logo width on narrow
              screens so the right-side controls always fit. */}
          <Link
            href="/"
            className="flex items-center gap-3 shrink min-w-0 lg:mr-12 lg:shrink-0"
          >
            <Image
              src="/images/logo/logo-light.png"
              alt="Rani Beauty Clinic"
              width={260}
              height={32}
              className="h-6 w-auto max-w-[180px] sm:h-7 sm:max-w-none md:h-8"
              priority
            />
          </Link>

          {/* Desktop Nav (5 items, title case) */}
          <ul className="hidden items-center gap-6 lg:flex flex-1 justify-center list-none" role="menubar">
            {navLinks.map((link) => (
              <li
                key={link.name}
                className="relative"
                role="none"
                onMouseEnter={() =>
                  link.megaMenu ? setMegaOpen(true) : setMegaOpen(false)
                }
                onMouseLeave={() => setMegaOpen(false)}
              >
                <Link
                  href={link.href}
                  role="menuitem"
                  aria-haspopup={link.megaMenu ? "true" : undefined}
                  aria-expanded={link.megaMenu ? megaOpen : undefined}
                  className="group relative flex items-center gap-1 font-body text-sm font-medium text-white/90 transition-colors hover:text-white whitespace-nowrap"
                >
                  {link.name}
                  {link.megaMenu && (
                    <ChevronDown size={14} className="opacity-60" aria-hidden="true" />
                  )}
                  <span className="absolute -bottom-1 left-0 h-[1.5px] w-0 bg-rani-gold transition-all duration-300 group-hover:w-full" aria-hidden="true" />
                </Link>

                {/* ── Mega Menu (720px, 4-column) ──────────────────────── */}
                {link.megaMenu && (
                  <AnimatePresence>
                    {megaOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.25 }}
                        className="absolute left-1/2 top-full pt-4 -translate-x-1/2"
                      >
                        <div className="w-[720px] rounded-xl border-t-[3px] border-t-rani-gold bg-rani-navy p-8 shadow-2xl" role="menu" aria-label="Services menu">
                          <div className="grid grid-cols-4 gap-6">
                            {megaMenuColumns.map((col) => (
                              <div key={col.title} role="group" aria-labelledby={`mega-${col.title.replace(/\s+/g, '-').toLowerCase()}`}>
                                <h4 id={`mega-${col.title.replace(/\s+/g, '-').toLowerCase()}`} className="mb-3 font-body text-xs font-bold uppercase tracking-wider text-rani-gold/80">
                                  {col.title}
                                </h4>
                                <ul className="space-y-1 list-none">
                                  {col.links.map((item) => (
                                    <li key={item.href} role="none">
                                      <Link
                                        href={item.href}
                                        role="menuitem"
                                        className="block rounded-lg px-3 py-2 font-body text-[13px] font-medium text-white/80 transition-colors hover:bg-white/5 hover:text-rani-gold"
                                      >
                                        {item.name}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>

                          {/* Quiz links */}
                          <div className="mt-6 flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                            <Link
                              href="/quiz"
                              className="flex items-center gap-2 font-body text-sm font-semibold text-rani-gold transition-colors hover:text-rani-gold-light"
                            >
                              Treatment quiz (60s) &rarr;
                            </Link>
                            <Link
                              href="/peptides/quiz"
                              className="flex items-center gap-2 font-body text-sm font-semibold text-rani-gold transition-colors hover:text-rani-gold-light"
                            >
                              Peptide & Rx quiz (2 min) &rarr;
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </li>
            ))}
          </ul>

          {/* Right side - Phone + Book Now (desktop) */}
          <div className="hidden items-center gap-6 lg:flex shrink-0 ml-10">
            <a
              href={clinicInfo.phoneTel}
              onClick={() => trackPhoneClick('navbar_desktop')}
              className="flex items-center gap-2 font-body text-sm font-medium text-white/80 transition-colors hover:text-rani-gold whitespace-nowrap"
            >
              <Phone size={15} aria-hidden="true" />
              {clinicInfo.phone}
            </a>
            <a
              href={clinicInfo.booking.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => { trackCTAClick('Book Now', 'navbar_desktop', clinicInfo.booking.url); trackBookingOpen('navbar_desktop'); }}
              className="rounded-full bg-rani-gold px-8 py-2.5 font-body text-sm font-semibold text-rani-navy transition-all duration-200 hover:bg-rani-gold-light hover:shadow-lg whitespace-nowrap"
            >
              Book Now
            </a>
          </div>

          {/* Mobile: Book pill + hamburger
              Audit 2026-04-19 P0 NAV-01 fix: tighten padding + reduce gap so
              controls fit inside 390–414px viewports. shrink-0 prevents the
              logo from squashing them out. */}
          <div className="flex items-center gap-2 lg:hidden shrink-0">
            <a
              href={clinicInfo.booking.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => { trackCTAClick('Book', 'navbar_mobile', clinicInfo.booking.url); trackBookingOpen('navbar_mobile'); }}
              className="rounded-full bg-rani-gold px-4 py-2 min-h-[44px] flex items-center font-body text-xs font-bold text-rani-navy transition-colors hover:bg-rani-gold-light"
            >
              Book
            </a>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rani-gold"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-panel"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile Menu Overlay ───────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-nav-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-rani-navy flex flex-col items-center justify-center"
          >
            <div className="mb-8">
              <Image
                src="/images/logo/logo-light.png"
                alt="Rani Beauty Clinic"
                width={250}
                height={31}
                className="h-8 w-auto"
              />
            </div>

            <nav aria-label="Mobile navigation">
              <ul className="flex flex-col items-center gap-1 list-none">
                {mobileNavLinks.map((link, i) => (
                  <motion.li
                    key={link.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.2 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="block px-8 py-4 font-body text-xl font-semibold text-white transition-colors hover:text-rani-gold"
                    >
                      {link.name}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </nav>

            <div className="mt-8 flex flex-col items-center gap-4 w-full max-w-xs mx-auto px-6">
              <a
                href={clinicInfo.phoneTel}
                onClick={() => trackPhoneClick('mobile_menu')}
                className="flex items-center justify-center gap-2 font-body text-base font-semibold text-rani-gold min-h-[48px] w-full rounded-full border border-rani-gold/30 transition-colors hover:bg-rani-gold/10"
              >
                <Phone size={18} aria-hidden="true" />
                {clinicInfo.phone}
              </a>
              <a
                href={clinicInfo.booking.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => { setMobileOpen(false); trackCTAClick('Book Your Consultation', 'mobile_menu', clinicInfo.booking.url); trackBookingOpen('mobile_menu'); }}
                className="rounded-full bg-rani-gold min-h-[48px] w-full flex items-center justify-center font-body text-sm font-bold uppercase tracking-wider text-rani-navy transition-colors hover:bg-rani-gold-light"
              >
                Book Your Consultation
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
