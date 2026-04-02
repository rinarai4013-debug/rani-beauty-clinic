import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const title = params.slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return {
    title: `${title} Treatments`,
    description: `Explore treatments for the ${title.toLowerCase()} area at Rani Beauty Clinic in Renton, WA. Physician-supervised aesthetic and wellness solutions tailored to your needs.`,
    alternates: {
      canonical: `https://ranibeautyclinic.com/treatment-areas/${params.slug}`,
    },
    openGraph: {
      title: `${title} Treatments | Rani Beauty Clinic`,
      description: `Physician-supervised treatments for the ${title.toLowerCase()} area at Rani Beauty Clinic in Renton, WA.`,
      url: `https://ranibeautyclinic.com/treatment-areas/${params.slug}`,
    },
  };
}

export default function Page() { return null; }
