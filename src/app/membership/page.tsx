import type { Metadata } from "next";
import MembershipPageClient from "./MembershipPageClient";

export const metadata: Metadata = {
  title: "The Glow Membership | Monthly Medspa Plans",
  description:
    "Join The Glow Membership at Rani Beauty Clinic. Monthly HydraFacial, chemical peels, and exclusive discounts starting at $149/month. No contracts, cancel anytime.",
  alternates: {
    canonical: "https://www.ranibeautyclinic.com/membership",
  },
  openGraph: {
    title: "The Glow Membership | Monthly Medspa Plans",
    description:
      "Monthly HydraFacial, chemical peels, and exclusive discounts starting at $149/month. No contracts, cancel anytime.",
    url: "https://www.ranibeautyclinic.com/membership",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Rani Beauty Clinic — The Glow Membership",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Glow Membership | Monthly Medspa Plans",
    description:
      "Monthly HydraFacial, chemical peels, and exclusive discounts starting at $149/month. No contracts, cancel anytime.",
  },
};

export default function MembershipPage() {
  return <MembershipPageClient />;
}
