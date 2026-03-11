import Link from "next/link";
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
  { name: "Peptide Therapy", href: "/wellness/peptide-therapy" },
  { name: "NAD+ Injections", href: "/wellness/nad-injections" },
  { name: "Vitamin Injections", href: "/wellness/vitamin-injections" },
  { name: "Hormone Therapy", href: "/wellness/hormone-therapy" },
  { name: "Blood Work", href: "/wellness/blood-work" },
];

export default function Footer() {
  return (
    <footer className="bg-rani-navy border-t border-rani-gold/20">
      {/* Lotus mark */}
      <div className="flex justify-center pt-12 pb-8">
        <div className="h-12 w-12 rounded-full bg-rani-gold/10 flex items-center justify-center animate-glow-pulse">
          <span className="font-heading text-2xl text-rani-gold">R</span>
        </div>
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
