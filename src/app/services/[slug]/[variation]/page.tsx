import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { slug: string; variation: string } }): Promise<Metadata> {
  const serviceName = params.slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const variationName = params.variation.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const title = `${variationName} - ${serviceName}`;
  return {
    title,
    description: `Learn about ${variationName.toLowerCase()} for ${serviceName.toLowerCase()} at Rani Beauty Clinic in Renton, WA. Physician-supervised treatments tailored to your goals.`,
    alternates: {
      canonical: `https://ranibeautyclinic.com/services/${params.slug}/${params.variation}`,
    },
    openGraph: {
      title: `${title} | Rani Beauty Clinic`,
      description: `${variationName} for ${serviceName.toLowerCase()} — physician-supervised aesthetic treatments in Renton, WA.`,
      url: `https://ranibeautyclinic.com/services/${params.slug}/${params.variation}`,
    },
  };
}

export default function Page() { return null; }
