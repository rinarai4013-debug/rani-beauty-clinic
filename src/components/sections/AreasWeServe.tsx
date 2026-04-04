import Link from "next/link";
import { MapPin } from "lucide-react";
import SectionLabel from "@/components/ui/SectionLabel";

/** Top cities to feature on the homepage — hand-curated for search volume + proximity */
const FEATURED_CITIES = [
  { name: "Bellevue", slug: "bellevue" },
  { name: "Seattle", slug: "seattle" },
  { name: "Kent", slug: "kent" },
  { name: "Kirkland", slug: "kirkland" },
  { name: "Auburn", slug: "auburn" },
  { name: "Federal Way", slug: "federal-way" },
  { name: "Tacoma", slug: "tacoma" },
  { name: "Redmond", slug: "redmond" },
  { name: "Tukwila", slug: "tukwila" },
  { name: "Burien", slug: "burien" },
  { name: "Mercer Island", slug: "mercer-island" },
  { name: "Issaquah", slug: "issaquah" },
  { name: "Covington", slug: "covington" },
  { name: "Maple Valley", slug: "maple-valley" },
  { name: "Newcastle", slug: "newcastle" },
  { name: "SeaTac", slug: "seatac" },
];

/** Top service + city combos — highest search volume near-service pages */
const FEATURED_NEAR_SERVICES = [
  { label: "Botox Near Bellevue", href: "/near/bellevue/botox" },
  { label: "Laser Hair Removal Near Seattle", href: "/near/seattle/laser-hair-removal" },
  { label: "HydraFacial Near Kirkland", href: "/near/kirkland/hydrafacial" },
  { label: "GLP-1 Weight Loss Near Kent", href: "/near/kent/glp1-weight-management" },
  { label: "Botox Near Redmond", href: "/near/redmond/botox" },
  { label: "RF Microneedling Near Bellevue", href: "/near/bellevue/rf-microneedling" },
  { label: "Laser Hair Removal Near Federal Way", href: "/near/federal-way/laser-hair-removal" },
  { label: "HydraFacial Near Auburn", href: "/near/auburn/hydrafacial" },
];

export default function AreasWeServe() {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <SectionLabel label="AREAS WE SERVE" />
          <h2 className="mt-4 font-heading text-3xl md:text-4xl text-rani-navy">
            Proudly Serving the Greater Puget Sound
          </h2>
          <p className="mx-auto mt-4 max-w-2xl font-body text-base text-rani-muted">
            Physician-supervised aesthetic and wellness treatments for communities
            across the Pacific Northwest. Free parking at our Renton clinic.
          </p>
        </div>

        {/* City Grid */}
        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
          {FEATURED_CITIES.map((city) => (
            <Link
              key={city.slug}
              href={`/near/${city.slug}`}
              className="group flex items-center gap-2 rounded-lg border border-rani-border bg-rani-cream/40 px-4 py-3 transition-all hover:border-rani-gold/30 hover:bg-rani-cream hover:shadow-sm"
            >
              <MapPin className="h-3.5 w-3.5 shrink-0 text-rani-gold" />
              <span className="font-body text-sm font-medium text-rani-navy group-hover:text-rani-navy/80">
                {city.name}
              </span>
            </Link>
          ))}
        </div>

        {/* Popular Service + Location Combos */}
        <div className="mt-10">
          <h3 className="text-center font-body text-sm font-semibold uppercase tracking-wider text-rani-muted">
            Popular Searches
          </h3>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {FEATURED_NEAR_SERVICES.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-rani-border bg-white px-4 py-2 font-body text-xs font-medium text-rani-navy transition-all hover:border-rani-gold hover:shadow-sm"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* View All Link */}
        <div className="mt-8 text-center">
          <Link
            href="/locations"
            className="inline-flex items-center gap-1.5 font-body text-sm font-semibold text-rani-navy hover:text-rani-gold transition-colors"
          >
            View all locations we serve →
          </Link>
        </div>
      </div>
    </section>
  );
}
