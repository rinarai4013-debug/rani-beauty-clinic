import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Providers | Meet the Team",
  description:
    "Meet the physician-supervised team at Rani Beauty Clinic in Renton, WA. Board-certified providers specializing in aesthetic treatments, medical wellness, and advanced skincare.",
  alternates: {
    canonical: "https://www.ranibeautyclinic.com/team/providers",
  },
  openGraph: {
    title: "Our Providers | Rani Beauty Clinic",
    description:
      "Meet our board-certified providers specializing in aesthetic treatments, medical wellness, and advanced skincare in Renton, WA.",
    url: "https://www.ranibeautyclinic.com/team/providers",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Rani Beauty Clinic - Our Providers" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Our Providers | Rani Beauty Clinic",
    description:
      "Meet our board-certified providers specializing in aesthetic treatments, medical wellness, and advanced skincare in Renton, WA.",
  },
};

export default function Page() { return null; }
