import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const title = params.slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return {
    title: `${title} Seasonal Treatments`,
    description: `Discover the best ${title.toLowerCase()} treatments at Rani Beauty Clinic in Renton, WA. Seasonal aesthetic and wellness protocols curated by our physicians.`,
    alternates: {
      canonical: `https://ranibeautyclinic.com/seasonal/${params.slug}`,
    },
    openGraph: {
      title: `${title} Seasonal Treatments | Rani Beauty Clinic`,
      description: `Seasonal ${title.toLowerCase()} treatment recommendations at Rani Beauty Clinic in Renton, WA.`,
      url: `https://ranibeautyclinic.com/seasonal/${params.slug}`,
    },
  };
}

export default function Page() { return null; }
