import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, MapPin, Phone, Clock, Mail, ChevronDown } from "lucide-react";
import { clinicInfo } from "@/data/clinic-info";
import EmailCapture from "@/components/conversion/EmailCapture";

const navigateLinks = [
  { name: "Services", href: "/services" },
  { name: "Results", href: "/results" },
  { name: "About", href: "/about" },
  { name: "Pricing", href: "/pricing" },
  { name: "Blog", href: "/blog" },
  { name: "Contact", href: "/contact" },
  { name: "Quiz", href: "/quiz" },
  { name: "FAQ", href: "/faq" },
];

const serviceLinks = [
  { name: "Face & Skin", href: "/services" },
  { name: "Injectables", href: "/services/botox-dysport" },
  { name: "Body & Laser", href: "/services/laser-hair-removal" },
  { name: "Medical Wellness", href: "/wellness" },
];

export default function Footer() {
  return (
    <footer className="bg-rani-navy border-t border-rani-gold/10">
      {/* Email Capture */}
      <EmailCapture variant="compact" />

      <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        {/* Logo + Social — always visible */}
        <div className="mb-10 md:mb-0">
          <Image
            src="/images/logo/logo-light.png"
            alt="Rani Beauty Clinic"
            width={200}
            height={25}
            className="h-6 w-auto opacity-90"
          />
          <p className="mt-4 font-body text-sm text-gray-400 leading-relaxed">
            Physician-supervised beauty. Personally designed.
          </p>
          <div className="mt-6 flex items-center gap-5">
            <a
              href={clinicInfo.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 transition-all duration-200 hover:text-rani-gold hover:scale-110 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Instagram"
            >
              <Instagram size={22} />
            </a>
            <a
              href={clinicInfo.social.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 transition-all duration-200 hover:text-rani-gold hover:scale-110 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Facebook"
            >
              <Facebook size={22} />
            </a>
          </div>
        </div>

        {/* Mobile: tap-to-call + directions (always visible on mobile) */}
        <div className="flex flex-col gap-3 mb-8 md:hidden">
          <a
            href={clinicInfo.phoneTel}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#C9A96E] min-h-[48px] font-body text-sm font-semibold text-[#0F1D2C]"
          >
            <Phone size={16} />
            Call {clinicInfo.phone}
          </a>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinicInfo.address.full)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-lg border border-white/20 min-h-[48px] font-body text-sm font-semibold text-white"
          >
            <MapPin size={16} />
            Get Directions
          </a>
        </div>

        {/* Desktop: 3-column grid | Mobile: accordion sections */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          <nav aria-label="Footer navigation">
            <h3 className="font-body text-sm font-semibold uppercase tracking-[0.1em] text-rani-gold mb-4">Navigate</h3>
            <ul className="space-y-2.5">
              {navigateLinks.map((link) => (
                <li key={link.name}><Link href={link.href} className="font-body text-sm text-gray-300 transition-colors hover:text-rani-gold">{link.name}</Link></li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Services">
            <h3 className="font-body text-sm font-semibold uppercase tracking-[0.1em] text-rani-gold mb-4">Services</h3>
            <ul className="space-y-2.5">
              {serviceLinks.map((link) => (
                <li key={link.name}><Link href={link.href} className="font-body text-sm text-gray-300 transition-colors hover:text-rani-gold">{link.name}</Link></li>
              ))}
            </ul>
          </nav>
          <div>
            <h3 className="font-body text-sm font-semibold uppercase tracking-[0.1em] text-rani-gold mb-4">Visit Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="mt-0.5 shrink-0 text-rani-gold" aria-hidden="true" />
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinicInfo.address.full)}`} target="_blank" rel="noopener noreferrer" className="font-body text-sm text-gray-300 leading-relaxed transition-colors hover:text-rani-gold">{clinicInfo.address.street}<br />{clinicInfo.address.city}, {clinicInfo.address.state} {clinicInfo.address.zip}</a>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={16} className="shrink-0 text-rani-gold" aria-hidden="true" />
                <a href={clinicInfo.phoneTel} className="font-body text-sm text-gray-300 transition-colors hover:text-rani-gold">{clinicInfo.phone}</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="shrink-0 text-rani-gold" aria-hidden="true" />
                <a href="mailto:info@ranibeautyclinic.com" className="font-body text-sm text-gray-300 transition-colors hover:text-rani-gold">info@ranibeautyclinic.com</a>
              </li>
              <li className="flex items-center gap-3">
                <Clock size={16} className="shrink-0 text-rani-gold" aria-hidden="true" />
                <span className="font-body text-sm text-gray-300">Mon-Sun, 10am-7pm</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Mobile accordion sections */}
        <div className="space-y-0 divide-y divide-rani-gold/10 md:hidden">
          <details className="group">
            <summary className="flex cursor-pointer items-center justify-between py-4 font-body text-sm font-semibold uppercase tracking-[0.1em] text-rani-gold min-h-[48px]">
              Navigate
              <ChevronDown size={16} className="text-rani-gold/60 transition-transform group-open:rotate-180" />
            </summary>
            <ul className="pb-4 space-y-1">
              {navigateLinks.map((link) => (
                <li key={link.name}><Link href={link.href} className="block py-2 font-body text-sm text-gray-300 transition-colors hover:text-rani-gold min-h-[44px] flex items-center">{link.name}</Link></li>
              ))}
            </ul>
          </details>
          <details className="group">
            <summary className="flex cursor-pointer items-center justify-between py-4 font-body text-sm font-semibold uppercase tracking-[0.1em] text-rani-gold min-h-[48px]">
              Services
              <ChevronDown size={16} className="text-rani-gold/60 transition-transform group-open:rotate-180" />
            </summary>
            <ul className="pb-4 space-y-1">
              {serviceLinks.map((link) => (
                <li key={link.name}><Link href={link.href} className="block py-2 font-body text-sm text-gray-300 transition-colors hover:text-rani-gold min-h-[44px] flex items-center">{link.name}</Link></li>
              ))}
            </ul>
          </details>
          <details className="group">
            <summary className="flex cursor-pointer items-center justify-between py-4 font-body text-sm font-semibold uppercase tracking-[0.1em] text-rani-gold min-h-[48px]">
              Visit Us
              <ChevronDown size={16} className="text-rani-gold/60 transition-transform group-open:rotate-180" />
            </summary>
            <ul className="pb-4 space-y-3">
              <li className="flex items-center gap-3 min-h-[44px]">
                <Clock size={16} className="shrink-0 text-rani-gold" />
                <span className="font-body text-sm text-gray-300">Mon-Sun, 10am-7pm</span>
              </li>
              <li className="flex items-center gap-3 min-h-[44px]">
                <Mail size={16} className="shrink-0 text-rani-gold" />
                <a href="mailto:info@ranibeautyclinic.com" className="font-body text-sm text-gray-300 transition-colors hover:text-rani-gold">info@ranibeautyclinic.com</a>
              </li>
              <li className="flex items-start gap-3 min-h-[44px]">
                <MapPin size={16} className="mt-0.5 shrink-0 text-rani-gold" />
                <span className="font-body text-sm text-gray-300">{clinicInfo.address.street}, {clinicInfo.address.city}, {clinicInfo.address.state} {clinicInfo.address.zip}</span>
              </li>
            </ul>
          </details>
        </div>

        {/* Distance framing */}
        <div className="mt-12 border-t border-rani-gold/10 pt-6 text-center">
          <p className="font-body text-[13px] text-gray-400">
            10 min from Bellevue &middot; 20 min from Seattle &middot; Serving
            all of King County
          </p>
        </div>
      </div>

      {/* SEO Link Network — hidden on mobile, visible md+ */}
      <div className="border-t border-rani-gold/10 hidden md:block">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Aesthetic Services */}
            <div>
              <h3 className="font-body text-xs font-semibold uppercase tracking-[0.1em] text-rani-gold/80 mb-3">Aesthetic Services</h3>
              <ul className="space-y-1">
                {[
                  { name: "Laser Hair Removal", href: "/services/laser-hair-removal" },
                  { name: "HydraFacial MD", href: "/services/hydrafacial" },
                  { name: "RF Microneedling", href: "/services/rf-microneedling" },
                  { name: "Botox & Dysport", href: "/services/botox-dysport" },
                  { name: "Dermal Fillers", href: "/services/dermal-fillers" },
                  { name: "Chemical Peels", href: "/services/chemical-peels" },
                  { name: "BioRePeel", href: "/services/biorepeel" },
                  { name: "AI Skin Analysis", href: "/services/ai-skin-analysis" },
                  { name: "Sofwave", href: "/services/sofwave" },
                  { name: "Scar Reduction", href: "/services/scar-reduction" },
                ].map((l) => (<li key={l.href}><Link href={l.href} className="font-body text-xs text-gray-500 transition-colors hover:text-rani-gold">{l.name}</Link></li>))}
              </ul>
            </div>
            {/* Medical Wellness */}
            <div>
              <h3 className="font-body text-xs font-semibold uppercase tracking-[0.1em] text-rani-gold/80 mb-3">Medical Wellness</h3>
              <ul className="space-y-1">
                {[
                  { name: "GLP-1 Weight Management", href: "/wellness/glp1-weight-management" },
                  { name: "NAD+ Injections", href: "/wellness/nad-injections" },
                  { name: "Vitamin Injections", href: "/wellness/vitamin-injections" },
                  { name: "Hormone Therapy", href: "/wellness/hormone-therapy" },
                  { name: "Blood Work", href: "/wellness/blood-work" },
                ].map((l) => (<li key={l.href}><Link href={l.href} className="font-body text-xs text-gray-500 transition-colors hover:text-rani-gold">{l.name}</Link></li>))}
              </ul>
            </div>
            {/* Quick Links */}
            <div>
              <h3 className="font-body text-xs font-semibold uppercase tracking-[0.1em] text-rani-gold/80 mb-3">Resources</h3>
              <ul className="space-y-1">
                {[
                  { name: "Get Started", href: "/get-started" },
                  { name: "Skin Quiz", href: "/quiz" },
                  { name: "Membership", href: "/membership" },
                  { name: "The Reveal", href: "/the-reveal" },
                  { name: "Safety Standards", href: "/safety" },
                  { name: "Our Technology", href: "/technology" },
                  { name: "Meet Dr. Landfield", href: "/team/dr-landfield" },
                  { name: "Our Providers", href: "/team/providers" },
                  { name: "Knowledge Base", href: "/knowledge" },
                  { name: "Results Gallery", href: "/results" },
                  { name: "Botox Cost Calculator", href: "/tools/botox-cost-calculator" },
                  { name: "Treatment Finder Quiz", href: "/tools/treatment-finder" },
                  { name: "Press & Media", href: "/press" },
                ].map((l) => (<li key={l.href}><Link href={l.href} className="font-body text-xs text-gray-500 transition-colors hover:text-rani-gold">{l.name}</Link></li>))}
              </ul>
            </div>
            {/* Guides */}
            <div>
              <h3 className="font-body text-xs font-semibold uppercase tracking-[0.1em] text-rani-gold/80 mb-3">Guides</h3>
              <ul className="space-y-1">
                {[
                  { name: "Laser Hair Removal Guide", href: "/guides/laser-hair-removal" },
                  { name: "Botox & Injectables", href: "/guides/botox-injectables" },
                  { name: "Skin Rejuvenation", href: "/guides/skin-rejuvenation" },
                  { name: "GLP-1 Weight Management", href: "/guides/glp1-weight-management" },
                  { name: "Wellness Optimization", href: "/guides/wellness-optimization" },
                  { name: "Hormone Therapy", href: "/guides/hormone-therapy" },
                ].map((l) => (<li key={l.href}><Link href={l.href} className="font-body text-xs text-gray-500 transition-colors hover:text-rani-gold">{l.name}</Link></li>))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing & Comparisons — hidden on mobile */}
      <div className="border-t border-rani-gold/10 hidden md:block">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <h3 className="font-body text-xs font-semibold uppercase tracking-[0.1em] text-rani-gold/80 mb-3">Pricing</h3>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {[
                  { name: "Laser Hair Removal", href: "/cost/laser-hair-removal-cost" },
                  { name: "Botox", href: "/cost/botox-cost" },
                  { name: "HydraFacial", href: "/cost/hydrafacial-cost" },
                  { name: "Semaglutide", href: "/cost/semaglutide-cost" },
                  { name: "Fillers", href: "/cost/dermal-fillers-cost" },
                  { name: "RF Microneedling", href: "/cost/rf-microneedling-cost" },
                  { name: "Chemical Peels", href: "/cost/chemical-peels-cost" },
                  { name: "BioRePeel", href: "/cost/biorepeel-cost" },
                  { name: "Sofwave", href: "/cost/sofwave-cost" },
                  { name: "Scar Reduction", href: "/cost/scar-reduction-cost" },
                  { name: "GLP-1", href: "/cost/glp1-cost" },
                  { name: "Tirzepatide", href: "/cost/tirzepatide-cost" },
                  { name: "Peptide Therapy", href: "/cost/peptide-therapy-cost" },
                  { name: "NAD+", href: "/cost/nad-injections-cost" },
                  { name: "Hormones", href: "/cost/hormone-therapy-cost" },
                  { name: "Testosterone", href: "/cost/testosterone-cost" },
                  { name: "Vitamins", href: "/cost/vitamin-injections-cost" },
                  { name: "Blood Work", href: "/cost/blood-work-cost" },
                  { name: "All Pricing", href: "/pricing" },
                ].map((l) => (<Link key={l.href} href={l.href} className="font-body text-xs text-gray-500 transition-colors hover:text-rani-gold">{l.name}</Link>))}
              </div>
            </div>
            <div>
              <h3 className="font-body text-xs font-semibold uppercase tracking-[0.1em] text-rani-gold/80 mb-3">Compare Treatments</h3>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {[
                  { name: "Botox vs Dysport", href: "/compare/botox-vs-dysport" },
                  { name: "Semaglutide vs Tirzepatide", href: "/compare/semaglutide-vs-tirzepatide" },
                  { name: "HydraFacial vs Chemical Peel", href: "/compare/hydrafacial-vs-chemical-peel" },
                  { name: "RF vs Sofwave", href: "/compare/rf-microneedling-vs-sofwave" },
                  { name: "Laser vs Electrolysis", href: "/compare/laser-hair-removal-vs-electrolysis" },
                  { name: "BioRePeel vs VI Peel", href: "/compare/biorepeel-vs-vi-peel" },
                  { name: "Laser vs Waxing", href: "/compare/laser-hair-removal-vs-waxing" },
                  { name: "Botox vs Fillers", href: "/compare/botox-vs-dermal-fillers" },
                  { name: "NAD+ vs B12", href: "/compare/nad-vs-vitamin-b12" },
                  { name: "Semaglutide vs Liraglutide", href: "/compare/semaglutide-vs-liraglutide" },
                  { name: "RF vs Traditional", href: "/compare/rf-microneedling-vs-traditional-microneedling" },
                  { name: "BioRePeel vs PRX-T33", href: "/compare/biorepeel-vs-prx-t33" },
                  { name: "HydraFacial vs Facial", href: "/compare/hydrafacial-vs-regular-facial" },
                  { name: "Sofwave vs Ultherapy", href: "/compare/sofwave-vs-ultherapy" },
                  { name: "Peptides vs HGH", href: "/compare/peptide-therapy-vs-hgh" },
                  { name: "All Comparisons", href: "/compare" },
                ].map((l) => (<Link key={l.href} href={l.href} className="font-body text-xs text-gray-500 transition-colors hover:text-rani-gold">{l.name}</Link>))}
              </div>
            </div>
            <div>
              <h3 className="font-body text-xs font-semibold uppercase tracking-[0.1em] text-rani-gold/80 mb-3">Skin Concerns</h3>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {[
                  { name: "Acne", href: "/concerns/acne" },
                  { name: "Aging Skin", href: "/concerns/aging-skin" },
                  { name: "Hyperpigmentation", href: "/concerns/hyperpigmentation" },
                  { name: "Skin Tightening", href: "/concerns/skin-laxity" },
                  { name: "Unwanted Hair", href: "/concerns/unwanted-hair" },
                  { name: "Dull Skin", href: "/concerns/dull-skin" },
                  { name: "Sun Damage", href: "/concerns/sun-damage" },
                  { name: "Large Pores", href: "/concerns/large-pores" },
                  { name: "Body Contouring", href: "/concerns/body-contouring" },
                  { name: "All Concerns", href: "/concerns" },
                ].map((l) => (<Link key={l.href} href={l.href} className="font-body text-xs text-gray-500 transition-colors hover:text-rani-gold">{l.name}</Link>))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Treatment Areas & Specialties — hidden on mobile */}
      <div className="border-t border-rani-gold/10 hidden md:block">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <h3 className="font-body text-xs font-semibold uppercase tracking-[0.1em] text-rani-gold/80 mb-3">Botox & Filler Areas</h3>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {[
                  { name: "Forehead Lines", href: "/treatment-areas/botox-forehead-lines" },
                  { name: "Crow's Feet", href: "/treatment-areas/botox-crows-feet" },
                  { name: "Frown Lines", href: "/treatment-areas/botox-frown-lines" },
                  { name: "Lip Flip", href: "/treatment-areas/botox-lip-flip" },
                  { name: "Lip Filler", href: "/treatment-areas/fillers-lips" },
                  { name: "Cheek Filler", href: "/treatment-areas/fillers-cheeks" },
                  { name: "Jawline", href: "/treatment-areas/fillers-jawline" },
                  { name: "Under-Eye", href: "/treatment-areas/fillers-under-eyes" },
                  { name: "Nasolabial Folds", href: "/treatment-areas/fillers-nasolabial-folds" },
                  { name: "RF Face & Neck", href: "/treatment-areas/rf-microneedling-face-neck" },
                ].map((l) => (<Link key={l.href} href={l.href} className="font-body text-xs text-gray-500 transition-colors hover:text-rani-gold">{l.name}</Link>))}
              </div>
            </div>
            <div>
              <h3 className="font-body text-xs font-semibold uppercase tracking-[0.1em] text-rani-gold/80 mb-3">Laser Hair Removal Areas</h3>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {[
                  { name: "Full Body", href: "/services/laser-hair-removal/full-body" },
                  { name: "Brazilian", href: "/services/laser-hair-removal/full-brazilian" },
                  { name: "Underarms", href: "/services/laser-hair-removal/underarms" },
                  { name: "Legs", href: "/services/laser-hair-removal/full-legs" },
                  { name: "Back", href: "/services/laser-hair-removal/back" },
                  { name: "Face", href: "/services/laser-hair-removal/full-face" },
                  { name: "Bikini Line", href: "/services/laser-hair-removal/bikini-line" },
                  { name: "Arms", href: "/services/laser-hair-removal/arms" },
                  { name: "Chest", href: "/services/laser-hair-removal/chest" },
                  { name: "Shoulders", href: "/services/laser-hair-removal/shoulders" },
                  { name: "Stomach", href: "/services/laser-hair-removal/stomach" },
                  { name: "Neck", href: "/services/laser-hair-removal/neck" },
                  { name: "Upper Lip", href: "/services/laser-hair-removal/upper-lip" },
                  { name: "Chin", href: "/services/laser-hair-removal/chin" },
                  { name: "Feet & Toes", href: "/services/laser-hair-removal/feet-and-toes" },
                  { name: "Brazilian (Area)", href: "/treatment-areas/laser-hair-removal-brazilian" },
                  { name: "Underarms (Area)", href: "/treatment-areas/laser-hair-removal-underarms" },
                  { name: "Full Legs (Area)", href: "/treatment-areas/laser-hair-removal-full-legs" },
                  { name: "Back & Chest (Area)", href: "/treatment-areas/laser-hair-removal-back-chest" },
                  { name: "Face (Area)", href: "/treatment-areas/laser-hair-removal-face" },
                ].map((l) => (<Link key={l.href} href={l.href} className="font-body text-xs text-gray-500 transition-colors hover:text-rani-gold">{l.name}</Link>))}
              </div>
            </div>
            <div>
              <h3 className="font-body text-xs font-semibold uppercase tracking-[0.1em] text-rani-gold/80 mb-3">Treatments For</h3>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {[
                  { name: "Men", href: "/treatments-for/medspa-treatments-for-men" },
                  { name: "Dark Skin Tones", href: "/treatments-for/treatments-for-dark-skin-tones" },
                  { name: "Over 40", href: "/treatments-for/anti-aging-treatments-over-40" },
                  { name: "Pre-Wedding", href: "/treatments-for/pre-wedding-beauty-treatments" },
                  { name: "Athletes", href: "/treatments-for/treatments-for-athletes" },
                  { name: "Summer Skincare", href: "/treatments-for/summer-skincare-treatments" },
                  { name: "Postpartum", href: "/treatments-for/postpartum-beauty-wellness" },
                ].map((l) => (<Link key={l.href} href={l.href} className="font-body text-xs text-gray-500 transition-colors hover:text-rani-gold">{l.name}</Link>))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seasonal, Aftercare, Financing & Locations — hidden on mobile */}
      <div className="border-t border-rani-gold/10 hidden md:block">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div>
              <h3 className="font-body text-xs font-semibold uppercase tracking-[0.1em] text-rani-gold/80 mb-3">Seasonal</h3>
              <ul className="space-y-1">
                {[
                  { name: "Summer Skincare", href: "/seasonal/best-summer-skincare-treatments" },
                  { name: "Winter Skincare", href: "/seasonal/best-winter-skincare-treatments" },
                  { name: "Spring Refresh", href: "/seasonal/spring-skin-refresh-treatments" },
                  { name: "Fall Prep", href: "/seasonal/fall-skincare-prep" },
                  { name: "Holiday Glow", href: "/seasonal/holiday-glow-treatments" },
                  { name: "New Year", href: "/seasonal/new-year-new-skin" },
                  { name: "Pre-Wedding", href: "/seasonal/pre-wedding-beauty-timeline" },
                  { name: "Back-to-School", href: "/seasonal/back-to-school-skincare" },
                ].map((l) => (<li key={l.href}><Link href={l.href} className="font-body text-xs text-gray-500 transition-colors hover:text-rani-gold">{l.name}</Link></li>))}
              </ul>
            </div>
            <div>
              <h3 className="font-body text-xs font-semibold uppercase tracking-[0.1em] text-rani-gold/80 mb-3">Aftercare</h3>
              <ul className="space-y-1">
                {[
                  { name: "Laser Hair Removal", href: "/aftercare/laser-hair-removal-aftercare" },
                  { name: "Botox", href: "/aftercare/botox-aftercare" },
                  { name: "HydraFacial", href: "/aftercare/hydrafacial-aftercare" },
                  { name: "RF Microneedling", href: "/aftercare/rf-microneedling-aftercare" },
                  { name: "Dermal Fillers", href: "/aftercare/dermal-fillers-aftercare" },
                  { name: "Chemical Peels", href: "/aftercare/chemical-peels-aftercare" },
                  { name: "NAD+ Injections", href: "/aftercare/nad-injections-aftercare" },
                  { name: "GLP-1", href: "/aftercare/glp1-aftercare" },
                  { name: "Sofwave", href: "/aftercare/sofwave-aftercare" },
                ].map((l) => (<li key={l.href}><Link href={l.href} className="font-body text-xs text-gray-500 transition-colors hover:text-rani-gold">{l.name}</Link></li>))}
              </ul>
            </div>
            <div>
              <h3 className="font-body text-xs font-semibold uppercase tracking-[0.1em] text-rani-gold/80 mb-3">Financing</h3>
              <ul className="space-y-1">
                {[
                  { name: "Payment Options", href: "/financing/how-to-finance-medspa-treatments" },
                  { name: "Cherry Financing", href: "/financing/cherry-financing-guide" },
                  { name: "Payment Plans", href: "/financing/medspa-payment-plans-renton" },
                  { name: "Tax Deductible?", href: "/financing/are-medspa-treatments-tax-deductible" },
                  { name: "Membership vs Pay", href: "/financing/medspa-membership-vs-pay-per-visit" },
                  { name: "Botox & Filler Costs", href: "/financing/cost-of-botox-fillers-seattle-area" },
                ].map((l) => (<li key={l.href}><Link href={l.href} className="font-body text-xs text-gray-500 transition-colors hover:text-rani-gold">{l.name}</Link></li>))}
              </ul>
            </div>
            <div>
              <h3 className="font-body text-xs font-semibold uppercase tracking-[0.1em] text-rani-gold/80 mb-3">Areas We Serve</h3>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {[
                  { name: "Bellevue", href: "/locations/bellevue-wa" },
                  { name: "Kent", href: "/locations/kent-wa" },
                  { name: "Tukwila", href: "/locations/tukwila-wa" },
                  { name: "Newcastle", href: "/locations/newcastle-wa" },
                  { name: "Mercer Island", href: "/locations/mercer-island-wa" },
                  { name: "Auburn", href: "/locations/auburn-wa" },
                  { name: "Federal Way", href: "/locations/federal-way-wa" },
                  { name: "Kirkland", href: "/near/kirkland" },
                  { name: "Redmond", href: "/near/redmond" },
                  { name: "Issaquah", href: "/near/issaquah" },
                  { name: "Sammamish", href: "/near/sammamish" },
                  { name: "SeaTac", href: "/locations/seatac-wa" },
                  { name: "Burien", href: "/locations/burien-wa" },
                  { name: "Covington", href: "/locations/covington-wa" },
                  { name: "Maple Valley", href: "/locations/maple-valley-wa" },
                  { name: "Des Moines", href: "/locations/des-moines-wa" },
                  { name: "Seattle", href: "/near/capitol-hill" },
                  { name: "Tacoma", href: "/near/tacoma" },
                  { name: "Shoreline", href: "/near/shoreline" },
                  { name: "Lynnwood", href: "/near/lynnwood" },
                  { name: "Bothell", href: "/near/bothell" },
                  { name: "Woodinville", href: "/near/woodinville" },
                  { name: "Puyallup", href: "/near/puyallup" },
                  { name: "Everett", href: "/near/everett" },
                  { name: "South Seattle", href: "/locations/south-seattle-wa" },
                  { name: "King County", href: "/locations/king-county-wa" },
                  { name: "All Locations", href: "/locations" },
                ].map((l) => (<Link key={l.href} href={l.href} className="font-body text-xs text-gray-500 transition-colors hover:text-rani-gold">{l.name}</Link>))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
            <p className="font-body text-xs text-gray-500 text-center">
              Medical Director: {clinicInfo.medicalDirector.name},{" "}
              {clinicInfo.medicalDirector.specialty}
            </p>
            <div className="flex items-center gap-6">
              <p className="font-body text-xs text-gray-500">
                &copy; {new Date().getFullYear()} {clinicInfo.name}
              </p>
              <Link
                href="/privacy-policy"
                className="font-body text-xs text-gray-500 transition-colors hover:text-rani-gold"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="font-body text-xs text-gray-500 transition-colors hover:text-rani-gold"
              >
                Terms
              </Link>
              <Link
                href="/sitemap-html"
                className="font-body text-xs text-gray-500 transition-colors hover:text-rani-gold"
              >
                Site index
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
