import type { Metadata } from "next";
import { Montserrat, Playfair_Display } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MobileCTA from "@/components/layout/MobileCTA";
import ScrollProgress from "@/components/layout/ScrollProgress";
import ScrollToTop from "@/components/layout/ScrollToTop";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "600", "700"],
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["700"],
});

export const metadata: Metadata = {
  title: {
    default: "Rani Beauty Clinic | Premier Medspa & Wellness in Renton, WA",
    template: "%s | Rani Beauty Clinic",
  },
  description:
    "Physician-supervised medspa in Renton, WA offering laser hair removal, Botox, HydraFacial, GLP-1 weight management, peptides, NAD+ & more. Book today.",
  keywords: [
    "medspa Renton WA",
    "medical spa",
    "laser hair removal",
    "Botox",
    "HydraFacial",
    "GLP-1 weight loss",
    "physician supervised",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://ranibeautyclinic.com",
    siteName: "Rani Beauty Clinic",
    title: "Rani Beauty Clinic | Premier Medspa & Wellness in Renton, WA",
    description:
      "Physician-supervised medspa in Renton, WA offering laser hair removal, Botox, HydraFacial, GLP-1 weight management, peptides, NAD+ & more.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rani Beauty Clinic | Premier Medspa & Wellness in Renton, WA",
    description:
      "Physician-supervised medspa in Renton, WA offering laser hair removal, Botox, HydraFacial, GLP-1 weight management, peptides, NAD+ & more.",
  },
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL("https://ranibeautyclinic.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${montserrat.variable} ${playfairDisplay.variable}`}>
      <body className="font-body text-rani-text antialiased">
        <ScrollProgress />
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <MobileCTA />
        <ScrollToTop />
      </body>
    </html>
  );
}
