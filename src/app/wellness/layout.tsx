import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Medical Wellness Programs | GLP-1, NAD+, Hormone Therapy",
  description:
    "Physician-supervised medical wellness programs at Rani Beauty Clinic in Renton, WA. GLP-1 weight management, NAD+ injections, hormone therapy, vitamin injections & in-house blood work.",
  alternates: {
    canonical: "https://www.ranibeautyclinic.com/wellness",
  },
  openGraph: {
    title: "Medical Wellness Programs | GLP-1, NAD+, Hormone Therapy",
    description:
      "Physician-supervised GLP-1 weight management, NAD+ injections, hormone therapy, vitamin injections & in-house blood work in Renton, WA.",
    url: "https://www.ranibeautyclinic.com/wellness",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Rani Beauty Clinic — Medical Wellness Programs",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Medical Wellness Programs | GLP-1, NAD+, Hormone Therapy",
    description:
      "Physician-supervised GLP-1 weight management, NAD+ injections, hormone therapy, vitamin injections & in-house blood work in Renton, WA.",
  },
};

export default function WellnessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
