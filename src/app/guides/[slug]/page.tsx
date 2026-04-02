import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const title = params.slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return {
    title: `${title} Guide`,
    description: `Your complete guide to ${title.toLowerCase()} at Rani Beauty Clinic in Renton, WA. Everything you need to know before, during, and after treatment.`,
    alternates: {
      canonical: `https://ranibeautyclinic.com/guides/${params.slug}`,
    },
    openGraph: {
      title: `${title} Guide | Rani Beauty Clinic`,
      description: `Complete guide to ${title.toLowerCase()} at Rani Beauty Clinic in Renton, WA.`,
      url: `https://ranibeautyclinic.com/guides/${params.slug}`,
    },
  };
}

export default function Page() { return null; }
