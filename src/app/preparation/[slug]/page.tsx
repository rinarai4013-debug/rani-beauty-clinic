import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const title = params.slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return {
    title: `How to Prepare for ${title}`,
    description: `Preparation guide for ${title.toLowerCase()} at Rani Beauty Clinic in Renton, WA. What to do before your appointment for the best results.`,
    alternates: {
      canonical: `https://ranibeautyclinic.com/preparation/${params.slug}`,
    },
    openGraph: {
      title: `How to Prepare for ${title} | Rani Beauty Clinic`,
      description: `Pre-treatment preparation guide for ${title.toLowerCase()} at Rani Beauty Clinic in Renton, WA.`,
      url: `https://ranibeautyclinic.com/preparation/${params.slug}`,
    },
  };
}

export default function Page() { return null; }
