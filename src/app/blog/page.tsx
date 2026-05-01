import Link from "next/link";
import { blogPosts } from "@/data/blog/posts";
import BlogPageClient from "./BlogPageClient";

export default function BlogPage() {
  // Server-rendered archive of every post — gives crawlers a flat list of
  // internal links so client-side pagination doesn't strand 180+ posts as orphans.
  const archive = [...blogPosts].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <>
      <BlogPageClient />

      <section
        aria-label="All articles archive"
        className="border-t border-rani-border bg-white py-12 md:py-16"
      >
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="font-heading text-xl font-semibold text-rani-navy md:text-2xl">
            Full article archive
          </h2>
          <p className="mt-2 font-body text-sm text-rani-muted">
            Every article we&rsquo;ve published, organized by date. Use the search above to filter, or browse all {archive.length} below.
          </p>
          <ul className="mt-6 grid grid-cols-1 gap-x-8 gap-y-1.5 md:grid-cols-2 lg:grid-cols-3">
            {archive.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  prefetch={false}
                  className="font-body text-sm text-rani-muted underline-offset-2 hover:text-rani-navy hover:underline"
                >
                  {post.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
