import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { fontVariables } from "@/lib/fonts";
import SkipNav from "@/components/ui/SkipNav";
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
  alternates: {
    canonical: "https://www.ranibeautyclinic.com",
    languages: {
      "en-US": "https://www.ranibeautyclinic.com",
    },
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
    <html lang="en" className={fontVariables}>
      <head>
        {/* Preconnect to critical third-party origins */}
        <link rel="preconnect" href="https://booking.mangomint.com" />
        {/* Google Fonts preconnects removed — fonts are now self-hosted via next/font */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
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
        <SkipNav />
        <ConditionalPublicLayout>
          <GTMNoScript />
          <ScrollProgress />
          <Navbar />
        </ConditionalPublicLayout>
        <main id="main-content" className="min-h-screen">{children}</main>
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
