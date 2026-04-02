import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const title = params.slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return {
    title: `${title} Results`,
    description: `See real ${title.toLowerCase()} results at Rani Beauty Clinic in Renton, WA. Before-and-after outcomes from physician-supervised treatments.`,
    alternates: {
      canonical: `https://ranibeautyclinic.com/results/${params.slug}`,
    },
    openGraph: {
      title: `${title} Results | Rani Beauty Clinic`,
      description: `Real ${title.toLowerCase()} results from physician-supervised treatments at Rani Beauty Clinic in Renton, WA.`,
      url: `https://ranibeautyclinic.com/results/${params.slug}`,
    },
  };
}

export default function Page() { return null; }
