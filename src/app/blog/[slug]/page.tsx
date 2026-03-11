import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, User, Tag, ArrowLeft } from "lucide-react";
import Hero from "@/components/sections/Hero";
import CTABanner from "@/components/sections/CTABanner";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import SectionLabel from "@/components/ui/SectionLabel";
import BlogCard from "@/components/blog/BlogCard";
import StructuredData from "@/components/seo/StructuredData";
import { blogPosts } from "@/data/blog/posts";
import FAQSection from "./FAQSection";

interface BlogPostPageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export function generateMetadata({ params }: BlogPostPageProps): Metadata {
  const post = blogPosts.find((p) => p.slug === params.slug);

  if (!post) {
    return { title: "Post Not Found" };
  }

  return {
    title: post.metaTitle,
    description: post.metaDescription,
    openGraph: {
      title: post.metaTitle,
      description: post.metaDescription,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
    },
  };
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const post = blogPosts.find((p) => p.slug === params.slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = blogPosts.filter((p) =>
    post.relatedSlugs.includes(p.slug)
  );

  const paragraphs = post.content.split("\n\n").filter((p) => p.trim());

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: post.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  const articleStructuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription,
    author: {
      "@type": "Person",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "Rani Beauty Clinic",
      url: "https://ranibeautyclinic.com",
    },
    datePublished: post.date,
    articleSection: post.category,
  };

  return (
    <>
      <StructuredData data={faqStructuredData} />
      <StructuredData data={articleStructuredData} />

      <Hero label={post.category.toUpperCase()} title={post.title} />

      {/* Article Content */}
      <article className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-6">
          {/* Author and Meta */}
          <FadeInOnScroll>
            <div className="mb-10 flex flex-wrap items-center gap-6 border-b border-rani-border pb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rani-navy">
                <User size={20} className="text-rani-gold" />
              </div>
              <div>
                <p className="font-body text-sm font-bold text-rani-navy">
                  {post.author}
                </p>
                <p className="font-body text-xs text-rani-muted">
                  {post.authorCredentials}
                </p>
              </div>
              <div className="flex items-center gap-4 md:ml-auto">
                <div className="flex items-center gap-1.5 text-rani-muted">
                  <Calendar size={14} />
                  <span className="font-body text-xs">{post.date}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Tag size={14} className="text-rani-gold" />
                  <span className="font-body text-xs font-semibold text-rani-navy">
                    {post.category}
                  </span>
                </div>
              </div>
            </div>
          </FadeInOnScroll>

          {/* Article paragraphs */}
          <FadeInOnScroll delay={0.2}>
            <div className="prose-rani">
              {paragraphs.map((paragraph, index) => (
                <p
                  key={index}
                  className="mb-6 font-body text-base leading-[1.85] text-rani-text"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </FadeInOnScroll>

          {/* Back to blog link */}
          <FadeInOnScroll delay={0.1}>
            <div className="mt-12 border-t border-rani-border pt-8">
              <Link
                href="/blog"
                className="group inline-flex items-center gap-2 font-body text-sm font-semibold text-rani-navy transition-colors hover:text-rani-gold"
              >
                <ArrowLeft
                  size={14}
                  className="transition-transform duration-300 group-hover:-translate-x-1"
                />
                Back to All Articles
              </Link>
            </div>
          </FadeInOnScroll>
        </div>
      </article>

      {/* FAQ Section */}
      {post.faqs.length > 0 && (
        <section className="bg-rani-cream py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-6">
            <FadeInOnScroll>
              <SectionLabel label="FREQUENTLY ASKED QUESTIONS" />
              <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
                Common Questions
              </h2>
            </FadeInOnScroll>

            <div className="mt-10">
              <FAQSection faqs={post.faqs} />
            </div>
          </div>
        </section>
      )}

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="bg-white py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-6">
            <FadeInOnScroll>
              <SectionLabel label="KEEP READING" />
              <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
                Related Articles
              </h2>
            </FadeInOnScroll>

            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {relatedPosts.map((relatedPost, i) => (
                <FadeInOnScroll key={relatedPost.slug} delay={i * 0.15}>
                  <BlogCard
                    slug={relatedPost.slug}
                    title={relatedPost.title}
                    excerpt={relatedPost.excerpt}
                    date={relatedPost.date}
                    author={relatedPost.author}
                    category={relatedPost.category}
                  />
                </FadeInOnScroll>
              ))}
            </div>
          </div>
        </section>
      )}

      <CTABanner
        label="READY TO GET STARTED?"
        title="Book a Consultation"
        subtitle="Take the next step toward your aesthetic and wellness goals with our expert, physician-supervised team."
      />
    </>
  );
}
