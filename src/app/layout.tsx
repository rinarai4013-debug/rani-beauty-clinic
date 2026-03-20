import type { Metadata } from "next";
import dynamic from "next/dynamic";
import "./globals.css";
/* Script import removed — all third-party scripts are now loaded via the Analytics component */
import { fontVariables } from "@/lib/fonts";
import SkipNav from "@/components/ui/SkipNav";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ScrollProgress from "@/components/layout/ScrollProgress";
import Analytics, { GTMNoScript } from "@/components/analytics/Analytics";
import ConditionalPublicLayout from "@/components/layout/ConditionalPublicLayout";

// Dynamic imports — these are non-critical, below-fold or interaction-triggered components.
// Loading them lazily reduces the initial JS bundle by ~60KB+ (framer-motion chunks, chat widget, etc.)
const MobileCTA = dynamic(() => import("@/components/layout/MobileCTA"), { ssr: false });
const ScrollToTop = dynamic(() => import("@/components/layout/ScrollToTop"), { ssr: false });
const ExitIntentPopup = dynamic(() => import("@/components/sections/ExitIntentPopup"), { ssr: false });
const AIChatWidget = dynamic(() => import("@/components/AIChatWidget"), { ssr: false });
const SocialProofToast = dynamic(() => import("@/components/sections/SocialProofToast"), { ssr: false });
const BehavioralTracker = dynamic(() => import("@/components/analytics/BehavioralTracker"), { ssr: false });
const AnalyticsTracker = dynamic(() => import("@/components/analytics/AnalyticsTracker"), { ssr: false });

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
        {/* Preconnect to booking (critical path — user clicks "Book") */}
        <link rel="preconnect" href="https://booking.mangomint.com" />
        {/* DNS-prefetch for analytics origins (loaded afterInteractive, not blocking) */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.clarity.ms" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
        <Analytics />
        {/* Mangomint booking scripts are loaded via Analytics component */}
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
          <BehavioralTracker />
          <AnalyticsTracker />
        </ConditionalPublicLayout>
      </body>
    </html>
  );
}
