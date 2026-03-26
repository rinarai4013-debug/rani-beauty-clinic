import type { Metadata } from "next";
import AboutPageClient from "./AboutPageClient";

export const metadata: Metadata = {
  title: "About Us - Woman-Owned Medspa in Renton",
  description:
    "Rani Beauty Clinic is a woman-owned, physician-supervised medspa in Renton, WA. Meet our board-certified Medical Director and expert team.",
  alternates: {
    canonical: "https://www.ranibeautyclinic.com/about",
  },
  openGraph: {
    title: "About Us | Rani Beauty Clinic",
    description:
      "Woman-owned, physician-supervised medspa in Renton, WA. Meet our board-certified Medical Director and expert team.",
    url: "https://www.ranibeautyclinic.com/about",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "About Rani Beauty Clinic" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Us | Rani Beauty Clinic",
    description:
      "Woman-owned, physician-supervised medspa in Renton, WA. Meet our board-certified Medical Director and expert team.",
  },
};

export default function AboutPage() {
  return <AboutPageClient />;
}
