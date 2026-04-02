import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Botox Cost Calculator | Estimate Your Treatment",
  description:
    "Calculate your Botox cost at Rani Beauty Clinic in Renton, WA. Select treatment areas, see unit ranges, and get an instant price estimate. $12-$14 per unit with physician injectors.",
  alternates: {
    canonical: "https://www.ranibeautyclinic.com/tools/botox-cost-calculator",
  },
  openGraph: {
    title: "Botox Cost Calculator | Rani Beauty Clinic",
    description:
      "Estimate your Botox treatment cost. Select areas, see unit ranges, and get an instant price estimate.",
    url: "https://www.ranibeautyclinic.com/tools/botox-cost-calculator",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Rani Beauty Clinic - Botox Cost Calculator" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Botox Cost Calculator | Rani Beauty Clinic",
    description:
      "Estimate your Botox treatment cost. Select areas, see unit ranges, and get an instant price estimate.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
