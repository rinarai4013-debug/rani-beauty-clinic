import type { Metadata } from "next";
import { Montserrat, Playfair_Display } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MobileCTA from "@/components/layout/MobileCTA";
import ScrollProgress from "@/components/layout/ScrollProgress";
import ScrollToTop from "@/components/layout/ScrollToTop";
import ExitIntentPopup from "@/components/sections/ExitIntentPopup";
import Analytics, { GTMNoScript } from "@/components/analytics/Analytics";
import ConditionalPublicLayout from "@/components/layout/ConditionalPublicLayout";
import AIChatWidget from "@/components/AIChatWidget";
import SocialProofToast from "@/components/sections/SocialProofToast";

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
    "Physician-supervised medspa in Renton, WA offering laser hair removal, Botox, HydraFacial, GLP-1 weight management, NAD+, hormone therapy & more. Book today.",
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
    url: "https://www.ranibeautyclinic.com",
    siteName: "Rani Beauty Clinic",
    title: "Rani Beauty Clinic | Premier Medspa & Wellness in Renton, WA",
    description:
      "Physician-supervised medspa in Renton, WA offering laser hair removal, Botox, HydraFacial, GLP-1 weight management, NAD+, hormone therapy & more.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Rani Beauty Clinic — Premier Medspa & Wellness in Renton, WA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rani Beauty Clinic | Premier Medspa & Wellness in Renton, WA",
    description:
      "Physician-supervised medspa in Renton, WA offering laser hair removal, Botox, HydraFacial, GLP-1 weight management, NAD+, hormone therapy & more.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL("https://www.ranibeautyclinic.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${montserrat.variable} ${playfairDisplay.variable}`}>
      <head>
        <Analytics />
        {/* Mangomint Online Booking Widget — enables overlay booking on ranibeautyclinic.com */}
        <Script id="mangomint-config" strategy="afterInteractive">
          {`window.Mangomint = window.Mangomint || {}; window.Mangomint.CompanyId = 876418;`}
        </Script>
        <Script
          src="https://booking.mangomint.com/app.js"
          strategy="afterInteractive"
        />
      </head>
      <body className="font-body text-rani-text antialiased">
        <ConditionalPublicLayout>
          <GTMNoScript />
          <ScrollProgress />
          <Navbar />
        </ConditionalPublicLayout>
        <main className="min-h-screen">{children}</main>
        <ConditionalPublicLayout>
          <Footer />
          <MobileCTA />
          <ScrollToTop />
          <ExitIntentPopup />
          <SocialProofToast />
          <AIChatWidget />
        </ConditionalPublicLayout>
      </body>
    </html>
  );
}
