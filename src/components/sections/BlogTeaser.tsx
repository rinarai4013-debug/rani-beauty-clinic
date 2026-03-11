import Link from "next/link";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import SectionLabel from "@/components/ui/SectionLabel";
import { ArrowRight, Calendar } from "lucide-react";

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  category: string;
}

interface BlogTeaserProps {
  posts: BlogPost[];
}

export default function BlogTeaser({ posts }: BlogTeaserProps) {
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <FadeInOnScroll>
          <SectionLabel label="EXPERT INSIGHTS" />
          <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
            From Our Blog
          </h2>
        </FadeInOnScroll>

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.slice(0, 3).map((post, i) => (
            <FadeInOnScroll key={post.slug} delay={i * 0.15}>
              <Link href={`/blog/${post.slug}`} className="group block">
                <div className="overflow-hidden rounded-xl border border-rani-border bg-white transition-all duration-300 hover:shadow-[0_10px_40px_rgba(15,29,44,0.08)] hover:-translate-y-1">
                  {/* Placeholder image */}
                  <div className="h-48 bg-gradient-to-br from-rani-navy to-rani-navy-light flex items-center justify-center">
                    <span className="font-heading text-4xl text-rani-gold/20">
                      R
                    </span>
                  </div>
                  <div className="p-6">
                    <span className="font-body text-xs font-semibold uppercase tracking-wider text-rani-gold">
                      {post.category}
                    </span>
                    <h3 className="mt-2 font-body text-lg font-bold text-rani-navy transition-colors group-hover:text-rani-gold line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="mt-2 font-body text-sm text-rani-muted line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-rani-muted">
                        <Calendar size={14} />
                        <span className="font-body text-xs">{post.date}</span>
                      </div>
                      <span className="flex items-center gap-1 font-body text-sm font-semibold text-rani-navy transition-colors group-hover:text-rani-gold">
                        Read More
                        <ArrowRight
                          size={14}
                          className="transition-transform group-hover:translate-x-1"
                        />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </FadeInOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
