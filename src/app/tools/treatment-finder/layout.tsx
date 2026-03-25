import { Metadata } from "next";
import { clinicInfo } from "@/data/clinic-info";

export const metadata: Metadata = {
  title: {
    absolute: "Treatment Finder Quiz | Rani Beauty Clinic",
  },
  description:
    "Answer 3 quick questions to discover which treatments are right for your goals, budget, and lifestyle. Personalized recommendations from Rani Beauty Clinic.",
  alternates: {
    canonical: `${clinicInfo.website}/tools/treatment-finder`,
  },
  openGraph: {
    title: "Treatment Finder Quiz | Rani Beauty Clinic",
    description:
      "Answer 3 quick questions to discover which treatments are right for your goals, budget, and lifestyle.",
    type: "website",
    url: `${clinicInfo.website}/tools/treatment-finder`,
    images: [
      {
        url: `${clinicInfo.website}/og/treatment-finder.jpg`,
        width: 1200,
        height: 630,
        alt: "Treatment Finder Quiz — Rani Beauty Clinic",
      },
    ],
  },
};

export default function TreatmentFinderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
