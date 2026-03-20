import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, MapPin, Phone, Clock } from "lucide-react";
import { clinicInfo } from "@/data/clinic-info";

const aestheticLinks = [
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
];

const wellnessLinks = [
  { name: "GLP-1 Weight Management", href: "/wellness/glp1-weight-management" },
  { name: "NAD+ Injections", href: "/wellness/nad-injections" },
  { name: "Vitamin Injections", href: "/wellness/vitamin-injections" },
  { name: "Hormone Therapy", href: "/wellness/hormone-therapy" },
  { name: "Blood Work", href: "/wellness/blood-work" },
];

export default function Footer() {
  return (
    <footer className="bg-rani-navy border-t border-rani-gold/20">
      {/* Logo */}
      <div className="flex justify-center pt-12 pb-8">
        <Image
          src="/images/logo/logo-light.png"
          alt="Rani Beauty Clinic"
          width={200}
          height={25}
          className="h-6 w-auto opacity-80"
        />
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: About */}
          <div>
            <h3 className="font-body text-sm font-semibold uppercase tracking-[0.1em] text-rani-gold mb-4">
              About Rani
            </h3>
            <p className="font-body text-sm text-gray-300 leading-relaxed mb-6">
              A higher-end premium medspa and medical wellness practice in Renton, WA.
              Physician-supervised treatments for your skin and overall wellness.
            </p>
            <div className="flex items-center gap-4">
              <a
                href={clinicInfo.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 transition-all duration-300 hover:text-rani-gold hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href={clinicInfo.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 transition-all duration-300 hover:text-rani-gold hover:scale-110"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
            </div>
          </div>

          {/* Column 2: Aesthetic Services */}
          <div>
            <h3 className="font-body text-sm font-semibold uppercase tracking-[0.1em] text-rani-gold mb-4">
              Aesthetic Services
            </h3>
            <ul className="space-y-2">
              {aestheticLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-body text-sm text-gray-300 transition-colors hover:text-rani-gold hover:underline"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Medical Wellness */}
          <div>
            <h3 className="font-body text-sm font-semibold uppercase tracking-[0.1em] text-rani-gold mb-4">
              Medical Wellness
            </h3>
            <ul className="space-y-2">
              {wellnessLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-body text-sm text-gray-300 transition-colors hover:text-rani-gold hover:underline"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div>
            <h3 className="font-body text-sm font-semibold uppercase tracking-[0.1em] text-rani-gold mb-4">
              Contact Us
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="mt-0.5 shrink-0 text-rani-gold" />
                <span className="font-body text-sm text-gray-300">
                  {clinicInfo.address.full}
                </span>
              </li>
              <li>
                <a
                  href={clinicInfo.phoneTel}
                  className="flex items-center gap-3 font-body text-sm text-gray-300 transition-colors hover:text-rani-gold"
                >
                  <Phone size={16} className="shrink-0 text-rani-gold" />
                  {clinicInfo.phone}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Clock size={16} className="mt-0.5 shrink-0 text-rani-gold" />
                <span className="font-body text-sm text-gray-300">
                  {clinicInfo.hours.days}
                  <br />
                  {clinicInfo.hours.time}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Resources & Guides */}
      <div className="border-t border-rani-gold/10">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <h3 className="font-body text-sm font-semibold uppercase tracking-[0.1em] text-rani-gold mb-3">
                Guides
              </h3>
              <ul className="space-y-1.5">
                {[
                  { name: "Laser Hair Removal Guide", href: "/guides/laser-hair-removal" },
                  { name: "Botox & Injectables Guide", href: "/guides/botox-injectables" },
                  { name: "Skin Rejuvenation Guide", href: "/guides/skin-rejuvenation" },
                  { name: "GLP-1 Weight Management Guide", href: "/guides/glp1-weight-management" },
                  { name: "Wellness Optimization Guide", href: "/guides/wellness-optimization" },
                  { name: "Hormone Therapy Guide", href: "/guides/hormone-therapy" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="font-body text-xs text-gray-400 transition-colors hover:text-rani-gold">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-body text-sm font-semibold uppercase tracking-[0.1em] text-rani-gold mb-3">
                Pricing
              </h3>
              <ul className="space-y-1.5">
                {[
                  { name: "Laser Hair Removal Cost", href: "/cost/laser-hair-removal-cost" },
                  { name: "Botox Cost", href: "/cost/botox-cost" },
                  { name: "HydraFacial Cost", href: "/cost/hydrafacial-cost" },
                  { name: "Semaglutide Cost", href: "/cost/semaglutide-cost" },
                  { name: "Dermal Fillers Cost", href: "/cost/dermal-fillers-cost" },
                  { name: "RF Microneedling Cost", href: "/cost/rf-microneedling-cost" },
                  { name: "Chemical Peels Cost", href: "/cost/chemical-peels-cost" },
                  { name: "BioRePeel Cost", href: "/cost/biorepeel-cost" },
                  { name: "Sofwave Cost", href: "/cost/sofwave-cost" },
                  { name: "Scar Reduction Cost", href: "/cost/scar-reduction-cost" },
                  { name: "GLP-1 Cost", href: "/cost/glp1-cost" },
                  { name: "Tirzepatide Cost", href: "/cost/tirzepatide-cost" },
                  { name: "Peptide Therapy Cost", href: "/cost/peptide-therapy-cost" },
                  { name: "NAD+ Cost", href: "/cost/nad-injections-cost" },
                  { name: "Hormone Therapy Cost", href: "/cost/hormone-therapy-cost" },
                  { name: "Testosterone Cost", href: "/cost/testosterone-cost" },
                  { name: "Vitamin Injections Cost", href: "/cost/vitamin-injections-cost" },
                  { name: "Blood Work Cost", href: "/cost/blood-work-cost" },
                  { name: "All Pricing", href: "/pricing" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="font-body text-xs text-gray-400 transition-colors hover:text-rani-gold">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-body text-sm font-semibold uppercase tracking-[0.1em] text-rani-gold mb-3">
                Compare Treatments
              </h3>
              <ul className="space-y-1.5">
                {[
                  { name: "Botox vs Dysport", href: "/compare/botox-vs-dysport" },
                  { name: "Semaglutide vs Tirzepatide", href: "/compare/semaglutide-vs-tirzepatide" },
                  { name: "HydraFacial vs Chemical Peel", href: "/compare/hydrafacial-vs-chemical-peel" },
                  { name: "RF Microneedling vs Sofwave", href: "/compare/rf-microneedling-vs-sofwave" },
                  { name: "Laser vs Electrolysis", href: "/compare/laser-hair-removal-vs-electrolysis" },
                  { name: "BioRePeel vs VI Peel", href: "/compare/biorepeel-vs-vi-peel" },
                  { name: "Laser vs Waxing", href: "/compare/laser-hair-removal-vs-waxing" },
                  { name: "Botox vs Fillers", href: "/compare/botox-vs-dermal-fillers" },
                  { name: "NAD+ vs B12", href: "/compare/nad-vs-vitamin-b12" },
                  { name: "Semaglutide vs Liraglutide", href: "/compare/semaglutide-vs-liraglutide" },
                  { name: "RF vs Traditional Microneedling", href: "/compare/rf-microneedling-vs-traditional-microneedling" },
                  { name: "BioRePeel vs PRX-T33", href: "/compare/biorepeel-vs-prx-t33" },
                  { name: "HydraFacial vs Regular Facial", href: "/compare/hydrafacial-vs-regular-facial" },
                  { name: "Sofwave vs Ultherapy", href: "/compare/sofwave-vs-ultherapy" },
                  { name: "Peptides vs HGH", href: "/compare/peptide-therapy-vs-hgh" },
                  { name: "All Comparisons", href: "/compare" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="font-body text-xs text-gray-400 transition-colors hover:text-rani-gold">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links & Laser Hair Removal Areas */}
      <div className="border-t border-rani-gold/10">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <h3 className="font-body text-sm font-semibold uppercase tracking-[0.1em] text-rani-gold mb-3">
                Quick Links
              </h3>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {[
                  { name: "Get Started", href: "/get-started" },
                  { name: "Skin Quiz", href: "/quiz" },
                  { name: "Membership", href: "/membership" },
                  { name: "The Reveal", href: "/the-reveal" },
                  { name: "Safety Standards", href: "/safety" },
                  { name: "Our Technology", href: "/technology" },
                  { name: "Meet Dr. Landfield", href: "/team/dr-landfield" },
                  { name: "Results Gallery", href: "/results" },
                  { name: "Blog", href: "/blog" },
                  { name: "Contact", href: "/contact" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="font-body text-xs text-gray-400 transition-colors hover:text-rani-gold"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-body text-sm font-semibold uppercase tracking-[0.1em] text-rani-gold mb-3">
                Laser Hair Removal Areas
              </h3>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {[
                  { name: "Full Body", href: "/services/laser-hair-removal/full-body" },
                  { name: "Brazilian", href: "/services/laser-hair-removal/brazilian" },
                  { name: "Underarms", href: "/services/laser-hair-removal/underarms" },
                  { name: "Legs", href: "/services/laser-hair-removal/legs" },
                  { name: "Back", href: "/services/laser-hair-removal/back" },
                  { name: "Face", href: "/services/laser-hair-removal/face" },
                  { name: "Bikini Line", href: "/services/laser-hair-removal/bikini-line" },
                  { name: "Arms", href: "/services/laser-hair-removal/arms" },
                  { name: "Chest", href: "/services/laser-hair-removal/chest" },
                  { name: "Shoulders", href: "/services/laser-hair-removal/shoulders" },
                  { name: "Stomach", href: "/services/laser-hair-removal/stomach" },
                  { name: "Neck", href: "/services/laser-hair-removal/neck" },
                  { name: "Upper Lip", href: "/services/laser-hair-removal/upper-lip" },
                  { name: "Chin", href: "/services/laser-hair-removal/chin" },
                  { name: "Feet & Toes", href: "/services/laser-hair-removal/feet-and-toes" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="font-body text-xs text-gray-400 transition-colors hover:text-rani-gold"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Skin Concerns */}
      <div className="border-t border-rani-gold/10">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <h3 className="font-body text-sm font-semibold uppercase tracking-[0.1em] text-rani-gold mb-3">
            Skin Concerns We Treat
          </h3>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {[
              { name: "Acne & Breakouts", href: "/concerns/acne" },
              { name: "Aging Skin", href: "/concerns/aging-skin" },
              { name: "Hyperpigmentation", href: "/concerns/hyperpigmentation" },
              { name: "Skin Tightening", href: "/concerns/skin-laxity" },
              { name: "Unwanted Hair", href: "/concerns/unwanted-hair" },
              { name: "Dull Skin", href: "/concerns/dull-skin" },
              { name: "Sun Damage", href: "/concerns/sun-damage" },
              { name: "Large Pores", href: "/concerns/large-pores" },
              { name: "Body Contouring", href: "/concerns/body-contouring" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-body text-xs text-gray-400 transition-colors hover:text-rani-gold"
              >
                {link.name}
              </Link>
            ))}
            <Link
              href="/concerns"
              className="font-body text-xs text-rani-gold transition-colors hover:text-rani-gold-light"
            >
              All concerns →
            </Link>
          </div>
        </div>
      </div>

      {/* Areas We Serve */}
      <div className="border-t border-rani-gold/10">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <h3 className="font-body text-sm font-semibold uppercase tracking-[0.1em] text-rani-gold mb-4">
            Areas We Serve
          </h3>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {[
              { name: "Bellevue", href: "/locations/bellevue-wa" },
              { name: "Kent", href: "/locations/kent-wa" },
              { name: "Tukwila", href: "/locations/tukwila-wa" },
              { name: "Newcastle", href: "/locations/newcastle-wa" },
              { name: "Mercer Island", href: "/locations/mercer-island-wa" },
              { name: "Auburn", href: "/locations/auburn-wa" },
              { name: "Federal Way", href: "/locations/federal-way-wa" },
              { name: "Kirkland", href: "/locations/kirkland-wa" },
              { name: "Redmond", href: "/locations/redmond-wa" },
              { name: "Issaquah", href: "/locations/issaquah-wa" },
              { name: "Sammamish", href: "/locations/sammamish-wa" },
              { name: "SeaTac", href: "/locations/seatac-wa" },
              { name: "Burien", href: "/locations/burien-wa" },
              { name: "Covington", href: "/locations/covington-wa" },
              { name: "Maple Valley", href: "/locations/maple-valley-wa" },
              { name: "Des Moines", href: "/locations/des-moines-wa" },
              { name: "Beacon Hill", href: "/locations/beacon-hill-seattle-wa" },
              { name: "Columbia City", href: "/locations/columbia-city-seattle-wa" },
              { name: "Rainier Beach", href: "/locations/rainier-beach-seattle-wa" },
              { name: "Capitol Hill", href: "/locations/capitol-hill-seattle-wa" },
              { name: "South Seattle", href: "/locations/south-seattle-wa" },
              { name: "King County", href: "/locations/king-county-wa" },
            ].map((loc) => (
              <Link
                key={loc.href}
                href={loc.href}
                className="font-body text-xs text-gray-400 transition-colors hover:text-rani-gold"
              >
                {loc.name}
              </Link>
            ))}
            <Link
              href="/locations"
              className="font-body text-xs text-rani-gold transition-colors hover:text-rani-gold-light"
            >
              View all locations →
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-rani-gold/10">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
            <p className="font-body text-xs text-gray-400 text-center">
              All medical treatments supervised by {clinicInfo.medicalDirector.name},{" "}
              {clinicInfo.medicalDirector.specialty}
            </p>
            <div className="flex items-center gap-6">
              <p className="font-body text-xs text-gray-400">
                &copy; {new Date().getFullYear()} {clinicInfo.name}
              </p>
              <Link
                href="/privacy-policy"
                className="font-body text-xs text-gray-400 transition-colors hover:text-rani-gold"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="font-body text-xs text-gray-400 transition-colors hover:text-rani-gold"
              >
                Terms
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
