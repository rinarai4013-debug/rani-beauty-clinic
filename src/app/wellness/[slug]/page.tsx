import { Metadata } from "next";
import { notFound } from "next/navigation";
import { aestheticServices } from "@/data/services/aesthetic-services";
import { wellnessServices } from "@/data/services/wellness-services";
import ServicePageTemplate from "@/components/services/ServicePageTemplate";
import RelatedBlogArticles from "@/components/seo/RelatedBlogArticles";
import { clinicInfo } from "@/data/clinic-info";

const allServices = [
  ...aestheticServices.map((s) => ({ ...s, isWellness: false as const })),
  ...wellnessServices,
];

export function generateStaticParams() {
  return wellnessServices.map((service) => ({
    slug: service.slug,
  }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const service = wellnessServices.find((s) => s.slug === params.slug);
  if (!service) return { title: "Service Not Found" };
  return {
    title: { absolute: service.metaTitle },
    description: service.metaDescription,
    alternates: {
      canonical: `${clinicInfo.website}/wellness/${service.slug}`,
    },
    openGraph: {
      title: service.metaTitle,
      description: service.metaDescription,
      type: "website",
      url: `${clinicInfo.website}/wellness/${service.slug}`,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${service.metaTitle} - Rani Beauty Clinic` }],
    },
  };
}

export default function WellnessServicePage({
  params,
}: {
  params: { slug: string };
}) {
  const service = wellnessServices.find((s) => s.slug === params.slug);

  if (!service) {
    notFound();
  }

  return (
    <>
      <ServicePageTemplate service={service} allServices={allServices} />
      <RelatedBlogArticles serviceSlug={service.slug} serviceTitle={service.title} />
    </>
  );
}
