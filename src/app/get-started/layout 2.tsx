import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get Started - Free AI Skin Assessment",
  description:
    "Start your transformation with a complimentary AI-powered skin analysis and personalized treatment plan. Physician-supervised medspa in Renton, WA. No obligation.",
  alternates: {
    canonical: "https://www.ranibeautyclinic.com/get-started",
  },
  openGraph: {
    title: "Get Started - Free AI Skin Assessment",
    description:
      "Complimentary AI-powered skin analysis and personalized treatment plan. Physician-supervised medspa in Renton, WA.",
    url: "https://www.ranibeautyclinic.com/get-started",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Rani Beauty Clinic - Start Your Transformation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Get Started - Free AI Skin Assessment",
    description:
      "Complimentary AI-powered skin analysis and personalized treatment plan. Physician-supervised medspa in Renton, WA.",
  },
};

export default function GetStartedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
