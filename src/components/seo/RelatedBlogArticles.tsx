import Link from "next/link";
import { blogPosts } from "@/data/blog/posts";

interface RelatedBlogArticlesProps {
  serviceSlug: string;
  serviceTitle: string;
  limit?: number;
}

/** Server component that matches blog posts to a service by keyword relevance.
 *  Used on service detail pages to create internal links for SEO. */
export default function RelatedBlogArticles({
  serviceSlug,
  serviceTitle,
  limit = 3,
}: RelatedBlogArticlesProps) {
  const terms = [
    serviceSlug.replace(/-/g, " "),
    ...serviceTitle.toLowerCase().split(/\s+/).filter((w) => w.length > 3),
  ];

  const relatedArticles = blogPosts
    .map((post) => {
      const titleLower = post.title.toLowerCase();
      const excerptLower = post.excerpt.toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (titleLower.includes(term)) score += 3;
        if (excerptLower.includes(term)) score += 1;
      }
      return { post, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.post);

  if (relatedArticles.length === 0) return null;

  return (
    <section className="bg-rani-cream py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-center font-body text-[11px] font-bold uppercase tracking-[0.2em] text-rani-gold">
          LEARN MORE
        </p>
        <h2 className="mt-4 text-center font-heading text-2xl md:text-3xl text-rani-navy">
          Related Articles
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {relatedArticles.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col rounded-xl bg-white shadow-sm ring-1 ring-rani-border transition-all hover:shadow-md hover:ring-rani-gold overflow-hidden"
            >
              <div className="flex-1 p-5">
                <span className="inline-block rounded-full bg-rani-navy/5 px-3 py-1 font-body text-[10px] font-semibold uppercase tracking-wider text-rani-navy">
                  {post.category}
                </span>
                <h3 className="mt-3 font-body text-sm font-semibold text-rani-navy line-clamp-2 group-hover:text-rani-navy/80 transition-colors">
                  {post.title}
                </h3>
                <p className="mt-2 font-body text-xs text-rani-muted line-clamp-2">
                  {post.excerpt}
                </p>
              </div>
              <div className="border-t border-rani-border px-5 py-3">
                <span className="font-body text-xs font-semibold text-rani-navy group-hover:text-rani-gold transition-colors">
                  Read article →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
