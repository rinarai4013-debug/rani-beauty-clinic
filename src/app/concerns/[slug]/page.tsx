import { Metadata } from "next";
import { notFound } from "next/navigation";
import { clinicInfo } from "@/data/clinic-info";
import { skinConcerns } from "@/data/skin-concerns";
import ConcernPageClient from "./ConcernPageClient";

interface PageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return skinConcerns.map((concern) => ({
    slug: concern.slug,
  }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const concern = skinConcerns.find((c) => c.slug === params.slug);

  if (!concern) {
    return { title: "Concern Not Found" };
  }

  return {
    title: { absolute: concern.metaTitle },
    description: concern.metaDescription,
    alternates: {
      canonical: `${clinicInfo.website}/concerns/${concern.slug}`,
    },
    openGraph: {
      title: concern.metaTitle,
      description: concern.metaDescription,
      type: "website",
      url: `${clinicInfo.website}/concerns/${concern.slug}`,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${concern.metaTitle} — Rani Beauty Clinic` }],
    },
  };
}

export default function ConcernPage({ params }: PageProps) {
  const concern = skinConcerns.find((c) => c.slug === params.slug);

  if (!concern) {
    notFound();
  }

  return <ConcernPageClient concern={concern} allConcerns={skinConcerns} />;
}
