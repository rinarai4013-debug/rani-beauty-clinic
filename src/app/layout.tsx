import type { Metadata, Viewport } from "next";
import dynamic from "next/dynamic";
import "./globals.css";
import Script from "next/script";
import { fontVariables } from "@/lib/fonts";
import SkipNav from "@/components/ui/SkipNav";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ScrollProgress from "@/components/layout/ScrollProgress";
import Analytics, { GTMNoScript } from "@/components/analytics/Analytics";
import ConditionalPublicLayout from "@/components/layout/ConditionalPublicLayout";
import PWAProvider from "@/components/pwa/PWAProvider";

// Dynamic imports - these are non-critical, below-fold or interaction-triggered components.
// Loading them lazily reduces the initial JS bundle by ~60KB+ (framer-motion chunks, chat widget, etc.)
const MobileCTA = dynamic(() => import("@/components/layout/MobileCTA"), { ssr: false });
const ScrollToTop = dynamic(() => import("@/components/layout/ScrollToTop"), { ssr: false });
const ExitIntentPopup = dynamic(() => import("@/components/sections/ExitIntentPopup"), { ssr: false });
const AIChatWidget = dynamic(() => import("@/components/AIChatWidget"), { ssr: false });
const SocialProofToast = dynamic(() => import("@/components/sections/SocialProofToast"), { ssr: false });
const BehavioralTracker = dynamic(() => import("@/components/analytics/BehavioralTracker"), { ssr: false });
const AnalyticsTracker = dynamic(() => import("@/components/analytics/AnalyticsTracker"), { ssr: false });

export const viewport: Viewport = {
  themeColor: "#0F1D2C",
};

export const metadata: Metadata = {
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Rani Beauty",
  },
  formatDetection: {
    telephone: true,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
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
        alt: "Rani Beauty Clinic - Premier Medspa & Wellness in Renton, WA",
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
        {/* PWA - Apple touch icon */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* AI Citation - llms.txt discovery for AI crawlers */}
        <link rel="alternate" type="text/plain" href="/llms.txt" title="LLM-readable site information" />
        <link rel="alternate" type="text/plain" href="/llms-full.txt" title="LLM-readable full site knowledge base" />
        {/* Preconnect to booking (critical path - user clicks "Book") */}
        <link rel="preconnect" href="https://booking.mangomint.com" />
        {/* DNS-prefetch for analytics origins (loaded afterInteractive, not blocking) */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.clarity.ms" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
        <link rel="dns-prefetch" href="https://static.hotjar.com" />
        {/* Hotjar - loaded after page is interactive to avoid render-blocking */}
        <Script
          id="hotjar"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(h,o,t,j,a,r){h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};h._hjSettings={hjid:5241962,hjsv:6};a=o.getElementsByTagName('head')[0];r=o.createElement('script');r.async=1;r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;a.appendChild(r);})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');`,
          }}
        />
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
        <PWAProvider />
      </body>
    </html>
  );
}
