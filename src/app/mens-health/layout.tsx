import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Men's Health | TRT & Weight Loss Programs",
  description:
    "Physician-supervised men's health programs at Rani Beauty Clinic. Testosterone replacement therapy (TRT), GLP-1 weight loss, and combined optimization plans in Renton, WA.",
  alternates: {
    canonical: "https://www.ranibeautyclinic.com/mens-health",
  },
  openGraph: {
    title: "Men's Health Programs | Rani Beauty Clinic",
    description:
      "Physician-supervised TRT, GLP-1 weight loss, and combined optimization plans for men in Renton, WA.",
    url: "https://www.ranibeautyclinic.com/mens-health",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Rani Beauty Clinic - Men's Health" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Men's Health Programs | Rani Beauty Clinic",
    description:
      "Physician-supervised TRT, GLP-1 weight loss, and combined optimization plans for men in Renton, WA.",
  },
};

export default function MensHealthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
