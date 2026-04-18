import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, MapPin, BookOpen } from "lucide-react";
import { aestheticServices } from "@/data/services/aesthetic-services";
import { wellnessServices } from "@/data/services/wellness-services";
import { blogPosts } from "@/data/blog/posts";
import { geoPages } from "@/data/locations/geo-pages";
import { serviceImages, getServiceImage } from "@/data/service-images";

/* ─── Types ───────────────────────────────────────────────── */

type ContentType = "blog" | "service" | "location";

interface RelatedItem {
  href: string;
  title: string;
  description: string;
  image?: string;
  type: ContentType;
}

interface InternalLinksProps {
  currentSlug: string;
  type: ContentType;
  /** Override the heading text */
  heading?: string;
  /** Maximum links to show (default: 6) */
  limit?: number;
}

/* ─── Helpers: build the full service list once ───────────── */

const allServices = [
  ...aestheticServices.map((s) => ({
    slug: s.slug,
    title: s.title,
    description: s.shortDescription,
    basePath: "services",
    relatedSlugs: s.relatedSlugs,
  })),
  ...wellnessServices.map((s) => ({
    slug: s.slug,
    title: s.title,
    description: s.shortDescription,
    basePath: "wellness",
    relatedSlugs: s.relatedSlugs,
  })),
];

/* ─── Resolve related items by type ───────────────────────── */

function getRelatedServices(currentSlug: string, limit: number): RelatedItem[] {
  const current = allServices.find((s) => s.slug === currentSlug);
  const relatedSlugs = current?.relatedSlugs ?? [];

  // Start with explicitly related, then pad with others in same category
  const related = relatedSlugs
    .map((slug) => allServices.find((s) => s.slug === slug))
    .filter(Boolean) as typeof allServices;

  // If not enough, pad with other services
  if (related.length < limit) {
    const existing = new Set([currentSlug, ...relatedSlugs]);
    const extras = allServices.filter((s) => !existing.has(s.slug));
    related.push(...extras.slice(0, limit - related.length));
  }

  return related.slice(0, limit).map((s) => {
    const img = getServiceImage(s.slug);
    return {
      href: `/${s.basePath}/${s.slug}`,
      title: s.title,
      description: s.description.slice(0, 120) + (s.description.length > 120 ? "..." : ""),
      image: img?.image,
      type: "service" as const,
    };
  });
}

function getRelatedBlogPosts(currentSlug: string, limit: number): RelatedItem[] {
  const current = blogPosts.find((p) => p.slug === currentSlug);
  const relatedSlugs = current?.relatedSlugs ?? [];

  const related = relatedSlugs
    .map((slug) => blogPosts.find((p) => p.slug === slug))
    .filter(Boolean) as typeof blogPosts;

  // Pad with posts from the same category
  if (related.length < limit && current) {
    const existing = new Set([currentSlug, ...relatedSlugs]);
    const sameCategory = blogPosts.filter(
      (p) => p.category === current.category && !existing.has(p.slug)
    );
    related.push(...sameCategory.slice(0, limit - related.length));
  }

  // Still not enough? grab any post
  if (related.length < limit) {
    const existing = new Set([currentSlug, ...related.map((p) => p.slug)]);
    const others = blogPosts.filter((p) => !existing.has(p.slug));
    related.push(...others.slice(0, limit - related.length));
  }

  return related.slice(0, limit).map((p) => ({
    href: `/blog/${p.slug}`,
    title: p.title,
    description: p.excerpt.slice(0, 120) + (p.excerpt.length > 120 ? "..." : ""),
    type: "blog" as const,
  }));
}

function getRelatedLocations(currentSlug: string, limit: number): RelatedItem[] {
  const current = geoPages.find((l) => l.slug === currentSlug);
  const nearbySlugs = current?.nearbyLocations ?? [];

  const related = nearbySlugs
    .map((slug) => geoPages.find((l) => l.slug === slug))
    .filter(Boolean) as typeof geoPages;

  // Pad with other locations from same region
  if (related.length < limit && current) {
    const existing = new Set([currentSlug, ...nearbySlugs]);
    const sameRegion = geoPages.filter(
      (l) => l.region === current.region && !existing.has(l.slug)
    );
    related.push(...sameRegion.slice(0, limit - related.length));
  }

  if (related.length < limit) {
    const existing = new Set([currentSlug, ...related.map((l) => l.slug)]);
    const others = geoPages.filter((l) => !existing.has(l.slug));
    related.push(...others.slice(0, limit - related.length));
  }

  return related.slice(0, limit).map((l) => ({
    href: `/locations/${l.slug}`,
    title: `${l.city}, ${l.state}`,
    description: `${l.driveTime} from ${l.city} to Rani Beauty Clinic in Renton, WA.`,
    type: "location" as const,
  }));
}

/* ─── Icon per type ───────────────────────────────────────── */

function TypeIcon({ type }: { type: ContentType }) {
  const className = "h-5 w-5 text-rani-gold-accessible";
  switch (type) {
    case "service":
      return <Sparkles className={className} />;
    case "blog":
      return <BookOpen className={className} />;
    case "location":
      return <MapPin className={className} />;
  }
}

/* ─── Component ───────────────────────────────────────────── */

export default function InternalLinks({
  currentSlug,
  type,
  heading,
  limit = 6,
}: InternalLinksProps) {
  let items: RelatedItem[];

  switch (type) {
    case "service":
      items = getRelatedServices(currentSlug, limit);
      break;
    case "blog":
      items = getRelatedBlogPosts(currentSlug, limit);
      break;
    case "location":
      items = getRelatedLocations(currentSlug, limit);
      break;
  }

  if (items.length === 0) return null;

  const defaultHeading =
    type === "service"
      ? "Related Treatments"
      : type === "blog"
        ? "Related Articles"
        : "Nearby Locations";

  return (
    <section className="bg-rani-cream py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="font-heading text-2xl md:text-3xl text-rani-navy mb-8 text-center">
          {heading ?? defaultHeading}
        </h2>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-rani-border transition-all duration-200 hover:shadow-md hover:ring-rani-gold"
            >
              {/* Thumbnail */}
              {item.image ? (
                <div className="relative h-40 w-full overflow-hidden bg-rani-cream">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
              ) : (
                <div className="flex h-28 items-center justify-center bg-rani-cream/60">
                  <TypeIcon type={item.type} />
                </div>
              )}

              {/* Content */}
              <div className="flex flex-1 flex-col p-4">
                <h3 className="text-sm font-semibold text-rani-navy group-hover:text-rani-navy/80 transition-colors line-clamp-2">
                  {item.title}
                </h3>
                <p className="mt-1.5 flex-1 text-xs text-rani-muted line-clamp-2">
                  {item.description}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-rani-navy">
                  Read more
                  <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
