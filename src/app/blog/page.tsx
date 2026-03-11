"use client";

import { useState } from "react";
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

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredPosts =
    activeCategory === "All"
      ? blogPosts
      : blogPosts.filter((post) => post.category === activeCategory);

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

          {/* Category filter tabs */}
          <FadeInOnScroll delay={0.2}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`rounded-full px-5 py-2 font-body text-sm font-semibold transition-all duration-300 ${
                    activeCategory === category
                      ? "bg-rani-navy text-white shadow-sm"
                      : "bg-white text-rani-muted hover:bg-rani-navy/5 hover:text-rani-navy border border-rani-border"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </FadeInOnScroll>

          {/* Blog post grid */}
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post, i) => (
              <FadeInOnScroll key={post.slug} delay={i * 0.1}>
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
                  No articles found in this category yet. Check back soon!
                </p>
              </div>
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
