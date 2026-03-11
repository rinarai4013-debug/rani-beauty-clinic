import type { Metadata } from "next";
import PricingPageClient from "./PricingPageClient";

export const metadata: Metadata = {
  title: "Pricing & Packages",
  description:
    "View pricing for aesthetic treatments, medical wellness programs, and membership packages at Rani Beauty Clinic in Renton, WA. HSA/FSA accepted. Financing available through Cherry and PatientFi.",
};

export default function PricingPage() {
  return <PricingPageClient />;
}
