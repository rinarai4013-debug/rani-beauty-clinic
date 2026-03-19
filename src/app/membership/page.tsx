import type { Metadata } from "next";
import MembershipPageClient from "./MembershipPageClient";

export const metadata: Metadata = {
  title: "The Glow Membership | Monthly Medspa Plans",
  description:
    "Join The Glow Membership at Rani Beauty Clinic. Monthly HydraFacial, chemical peels, and exclusive discounts starting at $149/month. No contracts, cancel anytime.",
  openGraph: {
    title: "The Glow Membership | Monthly Medspa Plans",
    description:
      "Monthly HydraFacial, chemical peels, and exclusive discounts starting at $149/month. No contracts, cancel anytime.",
    url: "https://www.ranibeautyclinic.com/membership",
  },
};

export default function MembershipPage() {
  return <MembershipPageClient />;
}
