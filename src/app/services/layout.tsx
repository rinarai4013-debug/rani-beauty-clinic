import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aesthetic Services | Advanced Skin & Beauty Treatments",
  description:
    "Explore physician-supervised aesthetic treatments at Rani Beauty Clinic in Renton, WA. Laser hair removal, HydraFacial, RF microneedling, Botox, fillers, Sofwave, chemical peels & more.",
  alternates: {
    canonical: "https://www.ranibeautyclinic.com/services",
  },
  openGraph: {
    title: "Aesthetic Services | Advanced Skin & Beauty Treatments",
    description:
      "Physician-supervised laser hair removal, HydraFacial, RF microneedling, Botox, fillers, Sofwave, and chemical peels in Renton, WA.",
    url: "https://www.ranibeautyclinic.com/services",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Rani Beauty Clinic — Aesthetic Services",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aesthetic Services | Advanced Skin & Beauty Treatments",
    description:
      "Physician-supervised laser hair removal, HydraFacial, RF microneedling, Botox, fillers, Sofwave, and chemical peels in Renton, WA.",
  },
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
