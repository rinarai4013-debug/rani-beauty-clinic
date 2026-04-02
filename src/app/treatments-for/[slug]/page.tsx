import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const title = params.slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return {
    title: `Treatments for ${title}`,
    description: `Explore physician-supervised treatments for ${title.toLowerCase()} at Rani Beauty Clinic in Renton, WA. Personalized solutions backed by clinical expertise.`,
    alternates: {
      canonical: `https://www.ranibeautyclinic.com/treatments-for/${params.slug}`,
    },
    openGraph: {
      title: `Treatments for ${title} | Rani Beauty Clinic`,
      description: `Physician-supervised treatments for ${title.toLowerCase()} at Rani Beauty Clinic in Renton, WA.`,
      url: `https://www.ranibeautyclinic.com/treatments-for/${params.slug}`,
    },
  };
}

export default function Page() { return null; }
