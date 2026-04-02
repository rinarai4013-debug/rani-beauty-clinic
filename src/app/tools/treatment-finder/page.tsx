import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Treatment Finder | Find Your Perfect Treatment",
  description:
    "Take our treatment finder quiz at Rani Beauty Clinic to discover the ideal aesthetic or wellness treatment for your goals. Personalized recommendations in under 2 minutes.",
  alternates: {
    canonical: "https://ranibeautyclinic.com/tools/treatment-finder",
  },
  openGraph: {
    title: "Treatment Finder | Rani Beauty Clinic",
    description:
      "Discover your ideal treatment with our personalized treatment finder quiz. Recommendations in under 2 minutes.",
    url: "https://ranibeautyclinic.com/tools/treatment-finder",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Rani Beauty Clinic - Treatment Finder" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Treatment Finder | Rani Beauty Clinic",
    description:
      "Discover your ideal treatment with our personalized treatment finder quiz. Recommendations in under 2 minutes.",
  },
};

export default function Page() { return null; }
