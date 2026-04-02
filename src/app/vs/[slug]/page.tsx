import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const title = params.slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const readable = title.replace(/ Vs /i, " vs. ");
  return {
    title: readable,
    description: `Compare ${readable.toLowerCase()} at Rani Beauty Clinic in Renton, WA. See which treatment is right for your goals with our physician-guided comparison.`,
    alternates: {
      canonical: `https://ranibeautyclinic.com/vs/${params.slug}`,
    },
    openGraph: {
      title: `${readable} | Rani Beauty Clinic`,
      description: `Compare ${readable.toLowerCase()} — physician-guided treatment comparison at Rani Beauty Clinic in Renton, WA.`,
      url: `https://ranibeautyclinic.com/vs/${params.slug}`,
    },
  };
}

export default function Page() { return null; }
