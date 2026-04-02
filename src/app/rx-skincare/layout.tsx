import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prescription Skincare | Medical-Grade Rx Products",
  description:
    "Physician-prescribed skincare at Rani Beauty Clinic. GHK-Cu peptide creams, tretinoin, hydroquinone, and custom compounded formulas for skin tightening, anti-aging, and hyperpigmentation in Renton, WA.",
  alternates: {
    canonical: "https://ranibeautyclinic.com/rx-skincare",
  },
  openGraph: {
    title: "Prescription Skincare | Rani Beauty Clinic",
    description:
      "Medical-grade Rx skincare including GHK-Cu peptide creams, tretinoin, and custom compounded formulas in Renton, WA.",
    url: "https://ranibeautyclinic.com/rx-skincare",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Rani Beauty Clinic - Rx Skincare" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prescription Skincare | Rani Beauty Clinic",
    description:
      "Medical-grade Rx skincare including GHK-Cu peptide creams, tretinoin, and custom compounded formulas in Renton, WA.",
  },
};

export default function RxSkincareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
