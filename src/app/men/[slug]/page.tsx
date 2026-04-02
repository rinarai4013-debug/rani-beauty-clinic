import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const title = params.slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return {
    title: `${title} for Men`,
    description: `${title} treatments designed for men at Rani Beauty Clinic in Renton, WA. Physician-supervised aesthetic and wellness solutions in a private, comfortable setting.`,
    alternates: {
      canonical: `https://www.ranibeautyclinic.com/men/${params.slug}`,
    },
    openGraph: {
      title: `${title} for Men | Rani Beauty Clinic`,
      description: `${title} treatments for men — physician-supervised care at Rani Beauty Clinic in Renton, WA.`,
      url: `https://www.ranibeautyclinic.com/men/${params.slug}`,
    },
  };
}

export default function Page() { return null; }
