import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found | Rani Beauty Clinic",
  description:
    "The page you're looking for doesn't exist. Explore our services or book a consultation.",
};

const quickLinks = [
  { label: "Our Services", href: "/services" },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
  {
    label: "Book Consultation",
    href: "https://booking.mangomint.com/876418",
    external: true,
  },
];

const popularServices = [
  { name: "Sofwave Skin Tightening", href: "/services" },
  { name: "HydraFacial", href: "/services" },
  { name: "RF Microneedling", href: "/services" },
  { name: "Botox & Fillers", href: "/services" },
  { name: "Laser Hair Removal", href: "/services" },
  { name: "GLP-1 Weight Loss", href: "/services" },
];

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="w-full max-w-lg">
        {/* 404 number */}
        <p className="font-heading text-7xl font-bold text-rani-gold sm:text-8xl">
          404
        </p>

        <h1 className="mt-4 font-heading text-2xl font-bold text-rani-navy sm:text-3xl">
          This Page Doesn&apos;t Exist
        </h1>

        <div className="mx-auto mt-3 h-0.5 w-12 bg-rani-gold" />

        <p className="mt-4 font-body text-base text-rani-muted">
          But your transformation journey does. Let&apos;s get you where you
          need to be.
        </p>

        {/* Quick links */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              {...(link.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className={`rounded-lg px-6 py-2.5 font-body text-sm font-semibold uppercase tracking-wider transition-colors ${
                link.external
                  ? "bg-rani-gold text-rani-navy hover:bg-rani-gold-light"
                  : "border-2 border-rani-navy text-rani-navy hover:bg-rani-navy hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Popular services */}
        <div className="mt-12 rounded-xl border border-rani-border bg-white p-6 text-left">
          <h2 className="font-heading text-lg font-bold text-rani-navy">
            Popular Services
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {popularServices.map((service) => (
              <Link
                key={service.name}
                href={service.href}
                className="group flex items-center gap-2 rounded-lg px-3 py-2 font-body text-sm text-rani-text transition-colors hover:bg-rani-cream"
              >
                <span className="text-rani-gold transition-transform group-hover:translate-x-1">
                  &rarr;
                </span>
                {service.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
