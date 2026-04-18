import type { Metadata } from "next";
import Link from "next/link";
import { aestheticServices } from "@/data/services/aesthetic-services";
import { wellnessServices } from "@/data/services/wellness-services";
import { blogPosts } from "@/data/blog/posts";
import { clinicInfo } from "@/data/clinic-info";

type SearchResult = {
  href: string;
  title: string;
  description: string;
  type: "Aesthetic Service" | "Wellness Service" | "Blog";
};

export const metadata: Metadata = {
  title: "Site Search",
  description: "Search services, wellness programs, and blog content at Rani Beauty Clinic.",
  alternates: {
    canonical: `${clinicInfo.website}/search`,
  },
  robots: {
    index: false,
    follow: true,
  },
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function searchServices(query: string): SearchResult[] {
  const normalized = normalize(query);
  if (!normalized) return [];

  const aestheticMatches = aestheticServices
    .filter((service) =>
      `${service.title} ${service.shortDescription} ${service.metaDescription}`
        .toLowerCase()
        .includes(normalized)
    )
    .map((service) => ({
      href: `/services/${service.slug}`,
      title: service.title,
      description: service.shortDescription,
      type: "Aesthetic Service" as const,
    }));

  const wellnessMatches = wellnessServices
    .filter((service) =>
      `${service.title} ${service.shortDescription} ${service.metaDescription}`
        .toLowerCase()
        .includes(normalized)
    )
    .map((service) => ({
      href: `/wellness/${service.slug}`,
      title: service.title,
      description: service.shortDescription,
      type: "Wellness Service" as const,
    }));

  return [...aestheticMatches, ...wellnessMatches];
}

function searchBlog(query: string): SearchResult[] {
  const normalized = normalize(query);
  if (!normalized) return [];

  return blogPosts
    .filter((post) =>
      `${post.title} ${post.excerpt} ${post.metaDescription} ${post.category}`
        .toLowerCase()
        .includes(normalized)
    )
    .map((post) => ({
      href: `/blog/${post.slug}`,
      title: post.title,
      description: post.excerpt,
      type: "Blog" as const,
    }));
}

export default function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string | string[] };
}) {
  const rawQuery = Array.isArray(searchParams.q)
    ? searchParams.q[0] || ""
    : searchParams.q || "";
  const query = rawQuery.trim();

  const results = query
    ? [...searchServices(query), ...searchBlog(query)]
    : [];

  return (
    <main className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-4xl px-6">
        <h1 className="font-body text-3xl font-bold text-rani-navy md:text-4xl">
          Search Results
        </h1>
        <p className="mt-4 font-body text-sm text-rani-muted">
          {query
            ? `Showing results for "${query}".`
            : "Add a search query using ?q= to search services and blog content."}
        </p>

        {query && (
          <div className="mt-8 space-y-4">
            {results.length === 0 ? (
              <div className="rounded-lg border border-rani-border bg-rani-cream p-5">
                <p className="font-body text-sm text-rani-navy">
                  No matches found. Try a treatment name like &quot;cosmelan&quot;,
                  &quot;botox&quot;, or &quot;glp-1&quot;.
                </p>
              </div>
            ) : (
              results.map((result) => (
                <article
                  key={`${result.type}-${result.href}`}
                  className="rounded-lg border border-rani-border bg-white p-5"
                >
                  <p className="font-body text-xs font-semibold uppercase tracking-wide text-rani-navy">
                    {result.type}
                  </p>
                  <h2 className="mt-2 font-body text-lg font-bold text-rani-navy">
                    <Link href={result.href} className="hover:text-rani-navy-light">
                      {result.title}
                    </Link>
                  </h2>
                  <p className="mt-2 font-body text-sm leading-relaxed text-rani-text">
                    {result.description}
                  </p>
                </article>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}
