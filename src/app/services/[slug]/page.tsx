import { Metadata } from "next";
import { notFound } from "next/navigation";
import { aestheticServices } from "@/data/services/aesthetic-services";
import { wellnessServices } from "@/data/services/wellness-services";
import ServicePageTemplate from "@/components/services/ServicePageTemplate";

const allServices = [
  ...aestheticServices.map((s) => ({ ...s, isWellness: false as const })),
  ...wellnessServices,
];

export function generateStaticParams() {
  return aestheticServices.map((service) => ({
    slug: service.slug,
  }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const service = aestheticServices.find((s) => s.slug === params.slug);
  if (!service) return { title: "Service Not Found" };
  return {
    title: service.metaTitle,
    description: service.metaDescription,
    openGraph: {
      title: service.metaTitle,
      description: service.metaDescription,
    },
  };
}

export default function ServicePage({
  params,
}: {
  params: { slug: string };
}) {
  const service = aestheticServices.find((s) => s.slug === params.slug);

  if (!service) {
    notFound();
  }

  return (
    <ServicePageTemplate
      service={{ ...service, isWellness: false }}
      allServices={allServices}
    />
  );
}
