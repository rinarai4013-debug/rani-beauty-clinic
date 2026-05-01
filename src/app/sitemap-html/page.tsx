import type { Metadata } from "next";
import Link from "next/link";
import { aftercarePages } from "@/data/seo/aftercare-pages";
import { preparationPages } from "@/data/seo/preparation-pages";
import { demographicPages } from "@/data/seo/demographic-pages";
import { sideEffectsPages } from "@/data/seo/side-effects-pages";
import { worthItPages } from "@/data/seo/worth-it-pages";
import { firstTimePages } from "@/data/seo/first-time-pages";
import { resultsTimelinePages } from "@/data/seo/results-timeline-pages";
import { seasonalPages } from "@/data/seo/seasonal-pages";
import { financingPages } from "@/data/seo/financing-pages";
import { bodyAreaPages } from "@/data/seo/body-area-pages";
import { menPages } from "@/data/seo/men-pages";
import { agePages } from "@/data/seo/age-pages";
import { combinationPages } from "@/data/seo/combination-pages";
import { vsPages } from "@/data/seo/vs-pages";
import { comparisonPages } from "@/data/comparisons";
import { skinConcerns } from "@/data/skin-concerns";
import { pillarGuides } from "@/data/guides/pillar-pages";
import { galleryPages } from "@/data/results/gallery";
import { geoPages } from "@/data/locations/geo-pages";
import { pnwCities } from "@/data/locations/pnw-cities";
import { waCitiesExtended } from "@/data/locations/wa-cities-extended";
import { blogPosts } from "@/data/blog/posts";

export const metadata: Metadata = {
  title: "Site Index | Rani Beauty Clinic",
  description:
    "Browse every guide, treatment, location, and article on ranibeautyclinic.com. Complete HTML site index for visitors and search engines.",
  alternates: { canonical: "https://www.ranibeautyclinic.com/sitemap-html" },
  robots: { index: true, follow: true },
};

interface IndexEntry {
  href: string;
  label: string;
}

function Section({ title, entries }: { title: string; entries: IndexEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="font-heading text-lg font-semibold text-rani-navy md:text-xl">
        {title}
        <span className="ml-2 font-body text-sm font-normal text-rani-muted">
          ({entries.length})
        </span>
      </h2>
      <ul className="mt-3 grid grid-cols-1 gap-x-8 gap-y-1.5 md:grid-cols-2 lg:grid-cols-3">
        {entries.map((e) => (
          <li key={e.href}>
            <Link
              href={e.href}
              prefetch={false}
              className="font-body text-sm text-rani-muted underline-offset-2 hover:text-rani-navy hover:underline"
            >
              {e.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function SitemapHtmlPage() {
  const coreEntries: IndexEntry[] = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About Rani" },
    { href: "/team", label: "Our Team" },
    { href: "/services", label: "Services" },
    { href: "/wellness", label: "Wellness" },
    { href: "/pricing", label: "Pricing" },
    { href: "/membership", label: "Membership" },
    { href: "/results", label: "Results" },
    { href: "/locations", label: "Locations" },
    { href: "/contact", label: "Contact" },
    { href: "/book", label: "Book a consultation" },
    { href: "/quiz", label: "Treatment quiz" },
    { href: "/faq", label: "FAQ" },
    { href: "/knowledge", label: "Knowledge base" },
    { href: "/blog", label: "Blog" },
    { href: "/guides", label: "Guides" },
    { href: "/gifts", label: "Gift cards" },
    { href: "/safety", label: "Safety standards" },
    { href: "/technology", label: "Technology" },
    { href: "/privacy-policy", label: "Privacy policy" },
    { href: "/terms", label: "Terms of service" },
  ];

  const guideEntries: IndexEntry[] = pillarGuides.map((g) => ({
    href: `/guides/${g.slug}`,
    label: g.title ?? g.slug,
  }));

  const concernEntries: IndexEntry[] = skinConcerns.map((c) => ({
    href: `/concerns/${c.slug}`,
    label: c.title ?? c.slug,
  }));

  const aftercareEntries: IndexEntry[] = aftercarePages.map((p) => ({
    href: `/aftercare/${p.slug}`,
    label: `${p.treatment} aftercare`,
  }));

  const preparationEntries: IndexEntry[] = preparationPages.map((p) => ({
    href: `/preparation/${p.slug}`,
    label: `${p.treatment} preparation`,
  }));

  const sideEffectsEntries: IndexEntry[] = sideEffectsPages.map((p) => ({
    href: `/side-effects/${p.slug}`,
    label: `${p.treatment} side effects`,
  }));

  const worthItEntries: IndexEntry[] = worthItPages.map((p) => ({
    href: `/worth-it/${p.slug}`,
    label: p.slug.replace(/-/g, " "),
  }));

  const firstTimeEntries: IndexEntry[] = firstTimePages.map((p) => ({
    href: `/first-time/${p.slug}`,
    label: p.slug.replace(/-/g, " "),
  }));

  const resultsTimelineEntries: IndexEntry[] = resultsTimelinePages.map((p) => ({
    href: `/results-timeline/${p.slug}`,
    label: p.slug.replace(/-/g, " "),
  }));

  const seasonalEntries: IndexEntry[] = seasonalPages.map((p) => ({
    href: `/seasonal/${p.slug}`,
    label: p.slug.replace(/-/g, " "),
  }));

  const financingEntries: IndexEntry[] = financingPages.map((p) => ({
    href: `/financing/${p.slug}`,
    label: p.slug.replace(/-/g, " "),
  }));

  const bodyAreaEntries: IndexEntry[] = bodyAreaPages.map((p) => ({
    href: `/treatment-areas/${p.slug}`,
    label: p.slug.replace(/-/g, " "),
  }));

  const menEntries: IndexEntry[] = menPages.map((p) => ({
    href: `/men/${p.slug}`,
    label: p.slug.replace(/-/g, " "),
  }));

  const ageEntries: IndexEntry[] = agePages.map((p) => ({
    href: `/age/${p.slug}`,
    label: p.ageRange ?? p.slug,
  }));

  const demographicEntries: IndexEntry[] = demographicPages.map((p) => ({
    href: `/treatments-for/${p.slug}`,
    label: p.title ?? p.slug,
  }));

  const combinationEntries: IndexEntry[] = combinationPages.map((p) => ({
    href: `/combinations/${p.slug}`,
    label: p.slug.replace(/-/g, " "),
  }));

  const vsSlugSet = new Set<string>([
    ...vsPages.map((p) => p.slug),
    ...comparisonPages.map((p) => p.slug),
  ]);
  const vsEntries: IndexEntry[] = Array.from(vsSlugSet).map((slug) => ({
    href: `/vs/${slug}`,
    label: slug.replace(/-/g, " "),
  }));

  const galleryEntries: IndexEntry[] = galleryPages.map((p) => ({
    href: `/results/${p.slug}`,
    label: p.title ?? p.slug,
  }));

  const locationEntries: IndexEntry[] = geoPages.map((p) => ({
    href: `/locations/${p.slug}`,
    label: p.city ?? p.slug,
  }));

  const allCities = [...pnwCities, ...waCitiesExtended];
  const cityEntries: IndexEntry[] = allCities.map((c) => ({
    href: `/near/${c.slug}`,
    label: c.name ?? c.slug,
  }));

  const blogEntries: IndexEntry[] = [...blogPosts]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((p) => ({ href: `/blog/${p.slug}`, label: p.title }));

  return (
    <main className="bg-white py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <header className="border-b border-rani-border pb-8">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-rani-muted">
            Site index
          </p>
          <h1 className="mt-3 font-heading text-3xl font-semibold text-rani-navy md:text-4xl">
            Every page on Rani Beauty Clinic
          </h1>
          <p className="mt-3 max-w-3xl font-body text-sm text-rani-muted md:text-base">
            A complete HTML index of guides, treatments, locations, and articles. Use this
            page to browse the full catalog or jump to a specific topic.
          </p>
        </header>

        <div className="mt-10">
          <Section title="Core pages" entries={coreEntries} />
          <Section title="Pillar guides" entries={guideEntries} />
          <Section title="Skin concerns" entries={concernEntries} />
          <Section title="Treatment comparisons" entries={vsEntries} />
          <Section title="Treatment combinations" entries={combinationEntries} />
          <Section title="Aftercare guides" entries={aftercareEntries} />
          <Section title="Preparation guides" entries={preparationEntries} />
          <Section title="Side effects guides" entries={sideEffectsEntries} />
          <Section title="Is it worth it?" entries={worthItEntries} />
          <Section title="First time guides" entries={firstTimeEntries} />
          <Section title="Results timelines" entries={resultsTimelineEntries} />
          <Section title="Seasonal guides" entries={seasonalEntries} />
          <Section title="Financing guides" entries={financingEntries} />
          <Section title="Treatment by body area" entries={bodyAreaEntries} />
          <Section title="Treatments by age" entries={ageEntries} />
          <Section title="Treatments for…" entries={demographicEntries} />
          <Section title="Treatments for men" entries={menEntries} />
          <Section title="Before & after gallery" entries={galleryEntries} />
          <Section title="Locations near you" entries={locationEntries} />
          <Section title="Service areas" entries={cityEntries} />
          <Section title="All articles" entries={blogEntries} />
        </div>
      </div>
    </main>
  );
}
