import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, MapPin, Phone, Clock, Mail } from "lucide-react";
import { clinicInfo } from "@/data/clinic-info";

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
      <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: Logo + Social + Tagline */}
          <div>
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
            <div className="mt-6 flex items-center gap-4">
              <a
                href={clinicInfo.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 transition-all duration-200 hover:text-rani-gold hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href={clinicInfo.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 transition-all duration-200 hover:text-rani-gold hover:scale-110"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
            </div>
          </div>

          {/* Column 2: Navigate */}
          <div>
            <h3 className="font-body text-sm font-semibold uppercase tracking-[0.1em] text-rani-gold mb-4">
              Navigate
            </h3>
            <ul className="space-y-2.5">
              {navigateLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="font-body text-sm text-gray-300 transition-colors hover:text-rani-gold"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Services */}
          <div>
            <h3 className="font-body text-sm font-semibold uppercase tracking-[0.1em] text-rani-gold mb-4">
              Services
            </h3>
            <ul className="space-y-2.5">
              {serviceLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="font-body text-sm text-gray-300 transition-colors hover:text-rani-gold"
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
              Visit Us
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="mt-0.5 shrink-0 text-rani-gold" />
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinicInfo.address.full)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-body text-sm text-gray-300 leading-relaxed transition-colors hover:text-rani-gold"
                >
                  {clinicInfo.address.street}
                  <br />
                  {clinicInfo.address.city}, {clinicInfo.address.state}{" "}
                  {clinicInfo.address.zip}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={16} className="shrink-0 text-rani-gold" />
                <a
                  href={clinicInfo.phoneTel}
                  className="font-body text-sm text-gray-300 transition-colors hover:text-rani-gold"
                >
                  {clinicInfo.phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="shrink-0 text-rani-gold" />
                <a
                  href="mailto:info@ranibeautyclinic.com"
                  className="font-body text-sm text-gray-300 transition-colors hover:text-rani-gold"
                >
                  info@ranibeautyclinic.com
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Clock size={16} className="shrink-0 text-rani-gold" />
                <span className="font-body text-sm text-gray-300">
                  Mon–Sun, 10am–7pm
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Distance framing */}
        <div className="mt-12 border-t border-rani-gold/10 pt-6 text-center">
          <p className="font-body text-[13px] text-gray-400">
            10 min from Bellevue &middot; 20 min from Seattle &middot; Serving
            all of King County
          </p>
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
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
