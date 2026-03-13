import type { Metadata } from "next";
import ResultsPageClient from "./ResultsPageClient";

export const metadata: Metadata = {
  title: "Before & After Results",
  description:
    "View real before and after results from Rani Beauty Clinic patients. See transformations from laser hair removal, HydraFacial, RF microneedling, Botox, fillers, and more.",
  alternates: {
    canonical: "https://ranibeautyclinic.com/results",
  },
};

export default function ResultsPage() {
  return <ResultsPageClient />;
}
