import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import StructuredData from "@/components/seo/StructuredData";
import { clinicInfo } from "@/data/clinic-info";

/* ─── Types ───────────────────────────────────────────────── */

export interface BreadcrumbItem {
  /** Display label */
  label: string;
  /** URL path (absolute path starting with /) */
  href: string;
}

interface BreadcrumbsProps {
  /**
   * Ordered list of breadcrumb items from root to current page.
   * "Home" is always prepended automatically.
   * The last item is rendered as plain text (current page).
   */
  items: BreadcrumbItem[];
}

/* ─── Component ───────────────────────────────────────────── */

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  // Build the full chain: Home + user items
  const chain: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    ...items,
  ];

  // JSON-LD BreadcrumbList schema
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: chain.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item:
        index < chain.length - 1
          ? `${clinicInfo.website}${item.href}`
          : undefined,
    })),
  };

  return (
    <>
      <StructuredData data={schemaData} />

      <nav
        aria-label="Breadcrumb"
        className="w-full bg-white/80 backdrop-blur-sm border-b border-rani-border/50"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <ol className="flex flex-wrap items-center gap-1 py-3 text-sm">
            {chain.map((item, index) => {
              const isLast = index === chain.length - 1;
              const isHome = index === 0;

              return (
                <li key={item.href} className="flex items-center gap-1">
                  {/* Separator (except before the first item) */}
                  {index > 0 && (
                    <ChevronRight
                      className="h-3.5 w-3.5 flex-shrink-0 text-rani-muted/50"
                      aria-hidden="true"
                    />
                  )}

                  {isLast ? (
                    /* Current page — not a link */
                    <span
                      className="text-rani-muted font-medium truncate max-w-[200px] sm:max-w-none"
                      aria-current="page"
                    >
                      {item.label}
                    </span>
                  ) : (
                    /* Navigable link */
                    <Link
                      href={item.href}
                      className="inline-flex items-center gap-1 text-rani-muted hover:text-rani-navy transition-colors duration-150"
                    >
                      {isHome && (
                        <Home className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                      )}
                      <span className="truncate max-w-[140px] sm:max-w-none">
                        {item.label}
                      </span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </nav>
    </>
  );
}
