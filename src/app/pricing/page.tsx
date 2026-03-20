import type { Metadata } from "next";
import PricingPageClient from "./PricingPageClient";

export const metadata: Metadata = {
  title: "Pricing & Packages",
  description:
    "View pricing for aesthetic treatments, medical wellness programs, and membership packages at Rani Beauty Clinic in Renton, WA. HSA/FSA accepted. Financing available through Cherry and PatientFi.",
  alternates: {
    canonical: "https://www.ranibeautyclinic.com/pricing",
  },
  openGraph: {
    title: "Pricing & Packages | Rani Beauty Clinic",
    description:
      "Transparent pricing for aesthetic treatments and medical wellness programs. HSA/FSA accepted. Financing available.",
    url: "https://www.ranibeautyclinic.com/pricing",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Rani Beauty Clinic Pricing" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing & Packages | Rani Beauty Clinic",
    description:
      "Transparent pricing for aesthetic treatments and medical wellness programs. HSA/FSA accepted. Financing available.",
  },
};

export default function PricingPage() {
  return <PricingPageClient />;
}
