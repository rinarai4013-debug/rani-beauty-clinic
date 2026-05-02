import { Metadata } from "next";
import { clinicInfo } from "@/data/clinic-info";
import CompareLanding from "../compare/page";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Treatment Comparisons | Rani Beauty Clinic",
  description:
    "Explore treatment comparison pages to help you choose between popular aesthetic and medical wellness options with confidence.",
  alternates: {
    canonical: `${clinicInfo.website}/compare`,
  },
  openGraph: {
    title: "Treatment Comparisons | Rani Beauty Clinic",
    description:
      "Explore treatment comparison pages to help you choose between popular aesthetic and medical wellness options with confidence.",
    url: `${clinicInfo.website}/compare`,
    siteName: "Rani Beauty Clinic",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Treatment Comparisons - Rani Beauty Clinic",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Treatment Comparisons | Rani Beauty Clinic",
    description:
      "Explore treatment comparison pages to help you choose between popular aesthetic and medical wellness options with confidence.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function VsIndexPage() {
  return <CompareLanding />;
}
