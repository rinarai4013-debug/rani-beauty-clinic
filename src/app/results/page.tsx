import type { Metadata } from "next";
import ResultsPageClient from "./ResultsPageClient";

export const metadata: Metadata = {
  title: "Before & After Results - Real Patient Photos",
  description:
    "View real before and after results from Rani Beauty Clinic patients. See transformations from laser hair removal, HydraFacial, RF microneedling, Botox, fillers, and more.",
  alternates: {
    canonical: "https://www.ranibeautyclinic.com/results",
  },
  openGraph: {
    title: "Before & After Results | Rani Beauty Clinic",
    description:
      "View real before and after transformations from laser hair removal, HydraFacial, RF microneedling, Botox, fillers, and more.",
    url: "https://www.ranibeautyclinic.com/results",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Rani Beauty Clinic - Before & After Results",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Before & After Results | Rani Beauty Clinic",
    description:
      "View real before and after transformations from laser hair removal, HydraFacial, RF microneedling, Botox, fillers, and more.",
  },
};

export default function ResultsPage() {
  return <ResultsPageClient />;
}
