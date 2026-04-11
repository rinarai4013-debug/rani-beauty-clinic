import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | Expert Insights & Skincare Tips",
  description:
    "Explore expert articles on aesthetic treatments, medical wellness, and skincare science from the physician-led team at Rani Beauty Clinic in Renton, WA.",
  alternates: {
    canonical: "https://www.ranibeautyclinic.com/blog",
  },
  openGraph: {
    title: "Blog | Expert Insights & Skincare Tips",
    description:
      "Expert articles on aesthetic treatments, medical wellness, and skincare science from Rani Beauty Clinic in Renton, WA.",
    url: "https://www.ranibeautyclinic.com/blog",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Rani Beauty Clinic - Blog",
      },
    ],
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
