"use client";

import { useState, useMemo } from "react";
import Hero from "@/components/sections/Hero";
import CTABanner from "@/components/sections/CTABanner";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import SectionLabel from "@/components/ui/SectionLabel";
import BlogCard from "@/components/blog/BlogCard";
import { blogPosts } from "@/data/blog/posts";

const categories = [
  "All",
  "Aesthetic Treatments",
  "Medical Wellness",
  "Skincare Science",
  "News",
];

const POSTS_PER_PAGE = 12;

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Count posts per category (independent of current filters)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: blogPosts.length };
    for (const post of blogPosts) {
      counts[post.category] = (counts[post.category] || 0) + 1;
    }
    return counts;
  }, []);

  // Filter by category then search
  const filteredPosts = useMemo(() => {
    let posts = activeCategory === "All"
      ? blogPosts
      : blogPosts.filter((post) => post.category === activeCategory);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      posts = posts.filter(
        (post) =>
          post.title.toLowerCase().includes(q) ||
          post.excerpt.toLowerCase().includes(q) ||
          post.category.toLowerCase().includes(q)
      );
    }

    return posts;
  }, [activeCategory, searchQuery]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * POSTS_PER_PAGE;
  const endIndex = Math.min(startIndex + POSTS_PER_PAGE, filteredPosts.length);
  const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // Generate page numbers: first, last, and 2 around current
  const getPageNumbers = (): (number | "ellipsis")[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = new Set<number>();
    pages.add(1);
    pages.add(totalPages);
    for (let i = Math.max(2, safePage - 2); i <= Math.min(totalPages - 1, safePage + 2); i++) {
      pages.add(i);
    }

    const sorted = Array.from(pages).sort((a, b) => a - b);
    const result: (number | "ellipsis")[] = [];

    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
        result.push("ellipsis");
      }
      result.push(sorted[i]);
    }

    return result;
  };

  return (
    <>
      <Hero
        label="OUR BLOG"
        title="Expert Insights & Skincare Tips"
        subtitle="Stay informed with the latest in aesthetic treatments, medical wellness, and skincare science from our physician-led team."
      />

      <section className="bg-rani-cream py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="BROWSE ARTICLES" />
          </FadeInOnScroll>

          {/* Search bar */}
          <FadeInOnScroll delay={0.1}>
            <div className="mt-8 mx-auto max-w-xl">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <svg
                    className="h-5 w-5 text-rani-muted"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search articles by title, topic, or category..."
                  className="w-full rounded-full border border-rani-border bg-white py-3 pl-12 pr-4 font-body text-sm text-rani-navy placeholder-rani-muted shadow-sm transition-all duration-300 focus:border-rani-gold focus:outline-none focus:ring-2 focus:ring-rani-gold/20"
                />
                {searchQuery && (
                  <button
                    onClick={() => handleSearchChange("")}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-rani-muted hover:text-rani-navy transition-colors"
                  >
                    <svg
                      className="h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </FadeInOnScroll>

          {/* Category filter tabs with counts */}
          <FadeInOnScroll delay={0.2}>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`rounded-full px-5 py-2 font-body text-sm font-semibold transition-all duration-300 ${
                    activeCategory === category
                      ? "bg-rani-navy text-white shadow-sm"
                      : "bg-white text-rani-muted hover:bg-rani-navy/5 hover:text-rani-navy border border-rani-border"
                  }`}
                >
                  {category}
                  <span
                    className={`ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-medium ${
                      activeCategory === category
                        ? "bg-white/20 text-white"
                        : "bg-rani-navy/5 text-rani-muted"
                    }`}
                  >
                    {categoryCounts[category] || 0}
                  </span>
                </button>
              ))}
            </div>
          </FadeInOnScroll>

          {/* Results count */}
          {filteredPosts.length > 0 && (
            <FadeInOnScroll delay={0.3}>
              <p className="mt-8 text-center font-body text-sm text-rani-muted">
                Showing {startIndex + 1}&ndash;{endIndex} of {filteredPosts.length} post{filteredPosts.length !== 1 ? "s" : ""}
                {searchQuery && (
                  <span> matching &ldquo;{searchQuery}&rdquo;</span>
                )}
              </p>
            </FadeInOnScroll>
          )}

          {/* Blog post grid */}
          <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {paginatedPosts.map((post, i) => (
              <FadeInOnScroll key={post.slug} delay={i * 0.05}>
                <BlogCard
                  slug={post.slug}
                  title={post.title}
                  excerpt={post.excerpt}
                  date={post.date}
                  author={post.author}
                  category={post.category}
                />
              </FadeInOnScroll>
            ))}
          </div>

          {/* Empty state */}
          {filteredPosts.length === 0 && (
            <FadeInOnScroll>
              <div className="mt-12 text-center">
                <p className="font-body text-lg text-rani-muted">
                  {searchQuery
                    ? `No articles found matching "${searchQuery}". Try a different search term.`
                    : "No articles found in this category yet. Check back soon!"}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => handleSearchChange("")}
                    className="mt-4 font-body text-sm font-semibold text-rani-gold hover:text-rani-navy transition-colors"
                  >
                    Clear search
                  </button>
                )}
              </div>
            </FadeInOnScroll>
          )}

          {/* Pagination controls */}
          {totalPages > 1 && (
            <FadeInOnScroll delay={0.2}>
              <nav
                aria-label="Blog pagination"
                className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
              >
                {/* Previous button */}
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="flex items-center gap-1.5 rounded-full border border-rani-border bg-white px-5 py-2.5 font-body text-sm font-semibold text-rani-navy shadow-sm transition-all duration-300 hover:bg-rani-navy hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-rani-navy"
                >
                  <svg
                    className="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                  </svg>
                  Previous
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {getPageNumbers().map((page, idx) =>
                    page === "ellipsis" ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className="flex h-10 w-10 items-center justify-center font-body text-sm text-rani-muted"
                      >
                        &hellip;
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`flex h-10 w-10 items-center justify-center rounded-full font-body text-sm font-semibold transition-all duration-300 ${
                          safePage === page
                            ? "bg-rani-navy text-white shadow-sm"
                            : "text-rani-muted hover:bg-rani-navy/5 hover:text-rani-navy"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                </div>

                {/* Next button */}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="flex items-center gap-1.5 rounded-full border border-rani-border bg-white px-5 py-2.5 font-body text-sm font-semibold text-rani-navy shadow-sm transition-all duration-300 hover:bg-rani-navy hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-rani-navy"
                >
                  Next
                  <svg
                    className="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </nav>
            </FadeInOnScroll>
          )}
        </div>
      </section>

      <CTABanner
        label="HAVE QUESTIONS?"
        title="Book a Consultation Today"
        subtitle="Our expert team is ready to help you achieve your aesthetic and wellness goals."
      />
    </>
  );
}
