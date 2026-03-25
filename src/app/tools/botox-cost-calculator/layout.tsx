import { Metadata } from "next";
import { clinicInfo } from "@/data/clinic-info";

export const metadata: Metadata = {
  title: {
    absolute:
      "Botox Cost Calculator | Estimate Your Treatment | Rani Beauty Clinic",
  },
  description:
    "Use our interactive Botox cost calculator to estimate treatment pricing by area. See unit ranges for forehead, frown lines, crow's feet, and more at Rani Beauty Clinic in Renton, WA.",
  alternates: {
    canonical: `${clinicInfo.website}/tools/botox-cost-calculator`,
  },
  openGraph: {
    title:
      "Botox Cost Calculator | Estimate Your Treatment | Rani Beauty Clinic",
    description:
      "Use our interactive Botox cost calculator to estimate treatment pricing by area. See unit ranges for forehead, frown lines, crow's feet, and more.",
    type: "website",
    url: `${clinicInfo.website}/tools/botox-cost-calculator`,
  },
};

export default function BotoxCostCalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
