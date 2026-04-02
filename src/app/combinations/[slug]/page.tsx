import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const title = params.slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return {
    title: `${title} Treatment Combination`,
    description: `Discover the ${title.toLowerCase()} treatment combination at Rani Beauty Clinic in Renton, WA. Physician-curated protocols designed to maximize your results.`,
    alternates: {
      canonical: `https://ranibeautyclinic.com/combinations/${params.slug}`,
    },
    openGraph: {
      title: `${title} Treatment Combination | Rani Beauty Clinic`,
      description: `Physician-curated ${title.toLowerCase()} treatment combination for enhanced results in Renton, WA.`,
      url: `https://ranibeautyclinic.com/combinations/${params.slug}`,
    },
  };
}

export default function Page() { return null; }
