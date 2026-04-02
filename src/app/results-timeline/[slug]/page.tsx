import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const title = params.slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return {
    title: `${title} Results Timeline`,
    description: `What to expect from ${title.toLowerCase()} week by week at Rani Beauty Clinic in Renton, WA. See the full recovery and results timeline from your treatment.`,
    alternates: {
      canonical: `https://www.ranibeautyclinic.com/results-timeline/${params.slug}`,
    },
    openGraph: {
      title: `${title} Results Timeline | Rani Beauty Clinic`,
      description: `Week-by-week ${title.toLowerCase()} results timeline at Rani Beauty Clinic in Renton, WA.`,
      url: `https://www.ranibeautyclinic.com/results-timeline/${params.slug}`,
    },
  };
}

export default function Page() { return null; }
