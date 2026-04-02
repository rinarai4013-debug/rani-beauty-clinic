import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const title = params.slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return {
    title: `Best Treatments for ${title}`,
    description: `Discover the best aesthetic and wellness treatments for ${title.toLowerCase()} at Rani Beauty Clinic in Renton, WA. Age-appropriate, physician-supervised protocols.`,
    alternates: {
      canonical: `https://www.ranibeautyclinic.com/age/${params.slug}`,
    },
    openGraph: {
      title: `Best Treatments for ${title} | Rani Beauty Clinic`,
      description: `Age-appropriate, physician-supervised treatments for ${title.toLowerCase()} at Rani Beauty Clinic in Renton, WA.`,
      url: `https://www.ranibeautyclinic.com/age/${params.slug}`,
    },
  };
}

export default function Page() { return null; }
