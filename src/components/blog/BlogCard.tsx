import Link from "next/link";
import { ArrowRight, Calendar, User } from "lucide-react";

interface BlogCardProps {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  category: string;
}

export default function BlogCard({
  slug,
  title,
  excerpt,
  date,
  author,
  category,
}: BlogCardProps) {
  return (
    <Link href={`/blog/${slug}`} className="group block h-full">
      <article className="flex h-full flex-col overflow-hidden rounded-xl border border-rani-border bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(15,29,44,0.08)]">
        {/* Image placeholder */}
        <div className="relative h-52 overflow-hidden bg-gradient-to-br from-rani-navy to-rani-navy-light">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-heading text-5xl text-rani-gold/20 select-none">
              R
            </span>
          </div>
          {/* Category badge */}
          <div className="absolute left-4 top-4">
            <span className="inline-block rounded-full bg-rani-gold/90 px-3 py-1 font-body text-[10px] font-semibold uppercase tracking-wider text-rani-navy backdrop-blur-sm">
              {category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-6">
          <h3 className="font-body text-lg font-bold leading-snug text-rani-navy transition-colors duration-300 group-hover:text-rani-gold line-clamp-2">
            {title}
          </h3>

          <p className="mt-3 flex-1 font-body text-sm leading-relaxed text-rani-muted line-clamp-3">
            {excerpt}
          </p>

          {/* Meta info */}
          <div className="mt-5 flex items-center gap-4 border-t border-rani-border pt-4">
            <div className="flex items-center gap-1.5 text-rani-muted">
              <Calendar size={13} className="shrink-0" />
              <span className="font-body text-xs">{date}</span>
            </div>
            <div className="flex items-center gap-1.5 text-rani-muted">
              <User size={13} className="shrink-0" />
              <span className="font-body text-xs truncate">{author}</span>
            </div>
          </div>

          {/* Read More link */}
          <div className="mt-4">
            <span className="inline-flex items-center gap-1.5 font-body text-sm font-semibold text-rani-navy transition-colors duration-300 group-hover:text-rani-gold">
              Read More
              <ArrowRight
                size={14}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
