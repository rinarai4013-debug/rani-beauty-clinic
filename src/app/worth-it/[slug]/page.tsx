import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const title = params.slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return {
    title: `Is ${title} Worth It?`,
    description: `Is ${title.toLowerCase()} worth it? Read honest reviews, real results, and cost breakdowns at Rani Beauty Clinic in Renton, WA. Make an informed decision.`,
    alternates: {
      canonical: `https://ranibeautyclinic.com/worth-it/${params.slug}`,
    },
    openGraph: {
      title: `Is ${title} Worth It? | Rani Beauty Clinic`,
      description: `Honest reviews and real results for ${title.toLowerCase()} at Rani Beauty Clinic in Renton, WA.`,
      url: `https://ranibeautyclinic.com/worth-it/${params.slug}`,
    },
  };
}

export default function Page() { return null; }
