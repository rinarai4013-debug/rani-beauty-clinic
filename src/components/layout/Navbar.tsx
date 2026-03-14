"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Menu, X, ChevronDown, Sparkles } from "lucide-react";
import { clinicInfo } from "@/data/clinic-info";

const aestheticLinks = [
  { name: "Laser Hair Removal", href: "/services/laser-hair-removal", desc: "Pain-free with Candela GentleMax Pro Plus" },
  { name: "HydraFacial MD", href: "/services/hydrafacial", desc: "Deep cleanse, extract & hydrate" },
  { name: "RF Microneedling", href: "/services/rf-microneedling", desc: "Cutera Secret Pro collagen stimulation" },
  { name: "BioRePeel", href: "/services/biorepeel", desc: "Zero-downtime bi-phasic peel" },
  { name: "Botox & Dysport", href: "/services/botox-dysport", desc: "Neurologist-supervised injections" },
  { name: "Dermal Fillers", href: "/services/dermal-fillers", desc: "FDA-approved volume restoration" },
  { name: "Red Light Therapy", href: "/services/red-light-therapy", desc: "Full body cellular rejuvenation" },
  { name: "Laser Acne Facial", href: "/services/laser-acne-facial", desc: "Target acne at the source" },
  { name: "Chemical Peels", href: "/services/chemical-peels", desc: "Medical-grade skin renewal" },
  { name: "AI Skin Analysis", href: "/services/ai-skin-analysis", desc: "Personalized treatment roadmap" },
];

const wellnessLinks = [
  { name: "GLP-1 Weight Management", href: "/wellness/glp1-weight-management", desc: "Semaglutide & Tirzepatide programs" },
  { name: "Peptide Therapy", href: "/wellness/peptide-therapy", desc: "BPC-157, CJC-1295 & more" },
  { name: "NAD+ Injections", href: "/wellness/nad-injections", desc: "Anti-aging & brain health" },
  { name: "Vitamin Injections", href: "/wellness/vitamin-injections", desc: "B12, D3, Glutathione & more" },
  { name: "Hormone Therapy", href: "/wellness/hormone-therapy", desc: "HRT for men & women" },
  { name: "Blood Work", href: "/wellness/blood-work", desc: "In-house comprehensive panels" },
];

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Services", href: "/services", megaMenu: true },
  { name: "Medical Wellness", href: "/wellness", megaMenu: true },
  { name: "About", href: "/about" },
  { name: "Results", href: "/results" },
  { name: "Blog", href: "/blog" },
  { name: "Pricing", href: "/pricing" },
  { name: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMega, setActiveMega] = useState<string | null>(null);
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
      {/* Announcement Bar */}
      <div
        className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-300 ${
          showAnnouncement ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="bg-rani-gold px-4 py-2.5 text-center font-body text-sm font-medium text-rani-navy">
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-3">
            <Sparkles size={14} className="shrink-0" />
            <span>Complimentary Personalized Consultation — Meet Our Physician-Led Team</span>
            <a
              href={clinicInfo.consultation.url}
              className="inline-flex items-center gap-1 font-bold underline underline-offset-2 transition-colors hover:text-rani-navy/70"
            >
              Reserve Your Spot &rarr;
            </a>
          </div>
          <button
            onClick={() => setAnnouncementVisible(false)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 transition-colors hover:bg-rani-navy/10"
            aria-label="Dismiss announcement"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <nav
        className={`fixed left-0 right-0 z-50 transition-all duration-300 ${
          showAnnouncement ? "top-[40px]" : "top-0"
        } ${
          scrolled
            ? "bg-rani-navy/95 backdrop-blur-md h-16 shadow-lg"
            : "bg-transparent h-20"
        }`}
      >
        <div className="mx-auto flex h-full items-center justify-between px-6 2xl:max-w-[1400px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0 mr-16">
            <Image
              src="/images/logo/logo-light.png"
              alt="Rani Beauty Clinic"
              width={220}
              height={28}
              className="h-7 w-auto md:h-8"
              priority
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-5 lg:flex flex-1 justify-center">
            {navLinks.map((link) => (
              <div
                key={link.name}
                className="relative"
                onMouseEnter={() =>
                  link.megaMenu ? setActiveMega(link.name) : setActiveMega(null)
                }
                onMouseLeave={() => setActiveMega(null)}
              >
                <Link
                  href={link.href}
                  className="group relative flex items-center gap-1 font-body text-[13px] font-semibold uppercase tracking-wider text-white/90 transition-colors hover:text-white whitespace-nowrap"
                >
                  {link.name}
                  {link.megaMenu && <ChevronDown size={14} className="opacity-60" />}
                  <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-rani-gold transition-all duration-300 group-hover:w-full" />
                </Link>

                {/* Mega Menu */}
                {link.megaMenu && (
                  <AnimatePresence>
                    {activeMega === link.name && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.2 }}
                        className="absolute left-1/2 top-full pt-4 -translate-x-1/2"
                      >
                        <div className="w-[480px] rounded-xl border-t-[3px] border-t-rani-gold bg-rani-navy p-6 shadow-2xl">
                          <div className="grid grid-cols-1 gap-1">
                            {(link.name === "Services"
                              ? aestheticLinks
                              : wellnessLinks
                            ).map((item) => (
                              <Link
                                key={item.href}
                                href={item.href}
                                className="group flex flex-col rounded-lg px-4 py-2.5 transition-colors hover:bg-white/5"
                              >
                                <span className="font-body text-sm font-semibold text-white group-hover:text-rani-gold transition-colors">
                                  {item.name}
                                </span>
                                <span className="font-body text-xs text-white/50">
                                  {item.desc}
                                </span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            ))}
          </div>

          {/* Right side — Phone + Book Now */}
          <div className="hidden items-center gap-8 lg:flex shrink-0 ml-10">
            <a
              href={clinicInfo.phoneTel}
              className="flex items-center gap-2.5 font-body text-sm font-semibold text-white/90 transition-colors hover:text-rani-gold whitespace-nowrap tracking-wide"
            >
              <Phone size={16} />
              {clinicInfo.phone}
            </a>
            <a
              href={clinicInfo.booking.url}
              className="rounded-lg bg-rani-gold px-10 py-3 font-body text-sm font-semibold uppercase tracking-widest text-rani-navy transition-all duration-300 hover:bg-rani-gold-light hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(243,214,190,0.3)] whitespace-nowrap"
            >
              Book Now
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden text-white p-2"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
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

            <nav className="flex flex-col items-center gap-1">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.3 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-8 py-3 font-body text-xl font-semibold text-white transition-colors hover:text-rani-gold"
                  >
                    {link.name}
                  </Link>
                  {i < navLinks.length - 1 && (
                    <div className="mx-auto h-px w-12 bg-rani-gold/20" />
                  )}
                </motion.div>
              ))}
            </nav>

            <div className="mt-8 flex flex-col items-center gap-4">
              <a
                href={clinicInfo.phoneTel}
                className="flex items-center gap-2 font-body text-lg font-semibold text-rani-gold"
              >
                <Phone size={18} />
                {clinicInfo.phone}
              </a>
              <a
                href={clinicInfo.booking.url}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg bg-rani-gold px-8 py-3 font-body text-sm font-semibold uppercase tracking-wider text-rani-navy"
              >
                Book Now
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
