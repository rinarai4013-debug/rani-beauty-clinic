import type { Metadata } from "next";
import Link from "next/link";
import { clinicInfo } from "@/data/clinic-info";
import { aestheticServices } from "@/data/services/aesthetic-services";
import { wellnessServices } from "@/data/services/wellness-services";
import { blogPosts } from "@/data/blog/posts";

type SearchResult = {
  type: "service" | "wellness" | "blog";
  title: string;
  description: string;
  url: string;
  score: number;
};

const MAX_RESULTS = 20;

export const metadata: Metadata = {
  title: "Search",
  description: "Search services, wellness programs, and blog resources at Rani Beauty Clinic.",
  alternates: {
    canonical: `${clinicInfo.website}/search`,
  },
  robots: {
    index: false,
    follow: true,
  },
};

function normalize(input: string): string {
  return input.toLowerCase().trim();
}

function scoreText(haystack: string, query: string): number {
  const normalized = normalize(haystack);
  if (normalized === query) return 120;
  if (normalized.startsWith(query)) return 90;
  if (normalized.includes(query)) return 60;
  return 0;
}

function buildResults(rawQuery: string): SearchResult[] {
  const query = normalize(rawQuery);
  if (!query) return [];

  const serviceResults: SearchResult[] = aestheticServices.map((service) => ({
    type: "service",
    title: service.title,
    description: service.shortDescription,
    url: `/services/${service.slug}`,
    score:
      scoreText(service.title, query) +
      scoreText(service.shortDescription, query) +
      scoreText(service.whatIsIt.slice(0, 320), query),
  }));

  const wellnessResults: SearchResult[] = wellnessServices.map((service) => ({
    type: "wellness",
    title: service.title,
    description: service.shortDescription,
    url: `/wellness/${service.slug}`,
    score:
      scoreText(service.title, query) +
      scoreText(service.shortDescription, query) +
      scoreText(service.whatIsIt.slice(0, 320), query),
  }));

  const articleResults: SearchResult[] = blogPosts.map((post) => ({
    type: "blog",
    title: post.title,
    description: post.excerpt,
    url: `/blog/${post.slug}`,
    score:
      scoreText(post.title, query) +
      scoreText(post.excerpt, query) +
      scoreText(post.category, query),
  }));

  return [...serviceResults, ...wellnessResults, ...articleResults]
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS);
}

function getResultLabel(type: SearchResult["type"]) {
  if (type === "service") return "Service";
  if (type === "wellness") return "Wellness";
  return "Blog";
}

export default function SearchPage({
  searchParams,
}: {
  searchParams?: { q?: string | string[] };
}) {
  const queryValue = Array.isArray(searchParams?.q) ? searchParams?.q[0] : searchParams?.q || "";
  const query = queryValue.trim();
  const results = buildResults(query);

  return (
    <div className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-4xl px-6">
        <h1 className="font-heading text-4xl font-bold text-rani-navy md:text-5xl">
          Search
        </h1>
        <p className="mt-3 font-body text-base text-rani-muted">
          Find treatments, wellness programs, and educational guides.
        </p>

        <form action="/search" method="get" className="mt-8 flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search Botox, HydraFacial, GLP-1..."
            className="min-h-[48px] w-full rounded-lg border border-rani-border px-4 py-3 font-body text-rani-navy focus:border-rani-gold focus:outline-none focus:ring-2 focus:ring-rani-gold/20"
          />
          <button
            type="submit"
            className="min-h-[48px] rounded-lg bg-rani-navy px-6 py-3 font-body text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-rani-navy-light"
          >
            Search
          </button>
        </form>

        {query ? (
          <div className="mt-10">
            <p className="font-body text-sm text-rani-muted">
              {results.length} result{results.length === 1 ? "" : "s"} for{" "}
              <span className="font-semibold text-rani-navy">&quot;{query}&quot;</span>
            </p>

            {results.length > 0 ? (
              <ul className="mt-5 space-y-4">
                {results.map((result) => (
                  <li key={`${result.type}-${result.url}`} className="rounded-xl border border-rani-border bg-rani-cream p-5">
                    <p className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-rani-gold">
                      {getResultLabel(result.type)}
                    </p>
                    <Link
                      href={result.url}
                      className="mt-1 block font-body text-xl font-bold text-rani-navy transition-colors hover:text-rani-gold"
                    >
                      {result.title}
                    </Link>
                    <p className="mt-2 font-body text-sm leading-relaxed text-rani-text">
                      {result.description}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-5 rounded-xl border border-rani-border bg-rani-cream p-6">
                <p className="font-body text-sm text-rani-text">
                  No direct matches found. Try broader terms like{" "}
                  <span className="font-semibold text-rani-navy">laser hair removal</span>,{" "}
                  <span className="font-semibold text-rani-navy">Botox</span>, or{" "}
                  <span className="font-semibold text-rani-navy">GLP-1</span>.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-10 rounded-xl border border-rani-border bg-rani-cream p-6">
            <p className="font-body text-sm text-rani-text">
              Start with a treatment name, concern, or topic to search the site.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
