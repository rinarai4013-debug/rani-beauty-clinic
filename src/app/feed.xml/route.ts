import { NextResponse } from "next/server";
import { blogPosts } from "@/data/blog/posts";
import { aestheticServices } from "@/data/services/aesthetic-services";
import { wellnessServices } from "@/data/services/wellness-services";
import { costPages } from "@/data/cost-pages";
import { comparisonPages } from "@/data/comparisons";
import { skinConcerns } from "@/data/skin-concerns";
import { pillarGuides } from "@/data/guides/pillar-pages";
import { geoPages } from "@/data/locations/geo-pages";
import { pnwCities } from "@/data/locations/pnw-cities";
import { galleryPages } from "@/data/results/gallery";
import { serviceVariations } from "@/data/services/service-variations";

const baseUrl = "https://www.ranibeautyclinic.com";
const now = new Date().toISOString();

function escapeXml(str: string): string {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function entry(url: string, title: string, updated?: string): string {
  const id = url.replace(/https?:\/\//, "tag:").replace(/\//g, ":");
  return `  <entry>
    <id>${escapeXml(id)}</id>
    <title>${escapeXml(title)}</title>
    <link href="${escapeXml(url)}" rel="alternate" />
    <updated>${updated || now}</updated>
  </entry>`;
}

export async function GET() {
  const entries: string[] = [];

  // Static pages (high priority)
  entries.push(entry(`${baseUrl}`, "Rani Beauty Clinic - Premier Medspa & Wellness in Renton, WA"));
  entries.push(entry(`${baseUrl}/services`, "Aesthetic Services"));
  entries.push(entry(`${baseUrl}/wellness`, "Medical Wellness Services"));
  entries.push(entry(`${baseUrl}/about`, "About Rani Beauty Clinic"));
  entries.push(entry(`${baseUrl}/pricing`, "Treatment Pricing"));
  entries.push(entry(`${baseUrl}/contact`, "Contact Us"));
  entries.push(entry(`${baseUrl}/locations`, "Locations We Serve"));
  entries.push(entry(`${baseUrl}/blog`, "Blog"));
  entries.push(entry(`${baseUrl}/results`, "Before & After Results"));
  entries.push(entry(`${baseUrl}/team`, "Our Team"));
  entries.push(entry(`${baseUrl}/team/dr-landfield`, "Dr. Alexander Landfield"));
  entries.push(entry(`${baseUrl}/concerns`, "Skin Concerns We Treat"));
  entries.push(entry(`${baseUrl}/compare`, "Treatment Comparisons"));
  entries.push(entry(`${baseUrl}/technology`, "Our Technology"));
  entries.push(entry(`${baseUrl}/safety`, "Safety Standards"));

  // Aesthetic services
  for (const svc of aestheticServices) {
    entries.push(entry(`${baseUrl}/services/${svc.slug}`, svc.title));
  }

  // Wellness services
  for (const svc of wellnessServices) {
    entries.push(entry(`${baseUrl}/wellness/${svc.slug}`, svc.title));
  }

  // Blog posts
  for (const post of blogPosts) {
    entries.push(entry(`${baseUrl}/blog/${post.slug}`, post.title, post.date ? new Date(post.date).toISOString() : undefined));
  }

  // Cost pages — RESTORED: template built 2026-03-31
  for (const page of costPages) {
    entries.push(entry(`${baseUrl}/cost/${page.slug}`, page.metaTitle || page.service || page.slug));
  }

  // Comparison pages — RESTORED: template built 2026-03-31
  for (const page of comparisonPages) {
    entries.push(entry(`${baseUrl}/vs/${page.slug}`, `${page.treatmentA} vs ${page.treatmentB}`));
  }

  // Skin concerns
  for (const concern of skinConcerns) {
    entries.push(entry(`${baseUrl}/concerns/${concern.slug}`, concern.title));
  }

  // Pillar guides
  for (const guide of pillarGuides) {
    entries.push(entry(`${baseUrl}/guides/${guide.slug}`, guide.title));
  }

  // Gallery pages
  for (const page of galleryPages) {
    entries.push(entry(`${baseUrl}/results/${page.slug}`, page.title));
  }

  // Service variations
  for (const v of serviceVariations) {
    const basePath = v.category === "wellness" ? "wellness" : "services";
    entries.push(entry(`${baseUrl}/${basePath}/${v.parentSlug}/${v.slug}`, v.title));
  }

  // Geo location pages
  for (const geo of geoPages) {
    entries.push(entry(`${baseUrl}/locations/${geo.slug}`, `Medspa Serving ${geo.city}, ${geo.state}`));
  }

  // Near city pages (top 50 PNW cities — feed shouldn't be too large, extended cities stay sitemap-only)
  for (const city of pnwCities) {
    entries.push(entry(`${baseUrl}/near/${city.slug}`, `Medspa Near ${city.name} | Rani Beauty Clinic`));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>${baseUrl}</id>
  <title>Rani Beauty Clinic</title>
  <subtitle>Premier Medspa &amp; Wellness in Renton, WA</subtitle>
  <link href="${baseUrl}" rel="alternate" />
  <link href="${baseUrl}/feed.xml" rel="self" />
  <link href="https://pubsubhubbub.appspot.com/" rel="hub" />
  <updated>${now}</updated>
  <author>
    <name>Rani Beauty Clinic</name>
    <uri>${baseUrl}</uri>
  </author>
${entries.join("\n")}
</feed>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
