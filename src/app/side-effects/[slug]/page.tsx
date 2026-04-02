import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const title = params.slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return {
    title: `${title} Side Effects & Safety`,
    description: `Learn about ${title.toLowerCase()} side effects, safety profile, and what to expect at Rani Beauty Clinic in Renton, WA. Physician-supervised care for your peace of mind.`,
    alternates: {
      canonical: `https://www.ranibeautyclinic.com/side-effects/${params.slug}`,
    },
    openGraph: {
      title: `${title} Side Effects & Safety | Rani Beauty Clinic`,
      description: `${title} side effects, safety profile, and recovery expectations at Rani Beauty Clinic in Renton, WA.`,
      url: `https://www.ranibeautyclinic.com/side-effects/${params.slug}`,
    },
  };
}

export default function Page() { return null; }
