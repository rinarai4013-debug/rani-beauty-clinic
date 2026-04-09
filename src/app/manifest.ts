import { MetadataRoute } from "next";

const ICON_192_SVG = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192"><rect width="192" height="192" rx="24" fill="#0F1D2C"/><text x="96" y="110" font-family="serif" font-size="72" font-weight="bold" fill="#C9A96E" text-anchor="middle">R</text><text x="96" y="150" font-family="sans-serif" font-size="18" fill="#F8F6F1" text-anchor="middle">RANI</text></svg>`)}`;

const ICON_512_SVG = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="64" fill="#0F1D2C"/><text x="256" y="280" font-family="serif" font-size="192" font-weight="bold" fill="#C9A96E" text-anchor="middle">R</text><text x="256" y="380" font-family="sans-serif" font-size="48" fill="#F8F6F1" text-anchor="middle">RANI BEAUTY</text></svg>`)}`;

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rani Beauty Clinic - Premier Medspa & Wellness",
    short_name: "Rani Beauty",
    description:
      "Physician-supervised medspa in Renton, WA offering laser hair removal, Botox, HydraFacial, GLP-1 weight management, NAD+, hormone therapy & more. Book today.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F8F6F1",
    theme_color: "#0F1D2C",
    categories: ["health", "beauty", "medical", "lifestyle"],
    icons: [
      {
        src: ICON_192_SVG,
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: ICON_512_SVG,
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: ICON_192_SVG,
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720"><rect width="1280" height="720" fill="#0F1D2C"/><text x="640" y="320" font-family="serif" font-size="64" font-weight="bold" fill="#C9A96E" text-anchor="middle">Rani Beauty Clinic</text><text x="640" y="400" font-family="sans-serif" font-size="28" fill="#F8F6F1" text-anchor="middle">Premier Medspa &amp; Wellness in Renton, WA</text></svg>`)}`,
        sizes: "1280x720",
        type: "image/svg+xml",
        // form_factor is a valid PWA manifest property not yet typed by Next.js
        ...({ form_factor: "wide" } as Record<string, string>),
        label: "Rani Beauty Clinic homepage",
      },
      {
        src: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="0 0 390 844"><rect width="390" height="844" fill="#0F1D2C"/><text x="195" y="380" font-family="serif" font-size="40" font-weight="bold" fill="#C9A96E" text-anchor="middle">Rani Beauty</text><text x="195" y="430" font-family="sans-serif" font-size="18" fill="#F8F6F1" text-anchor="middle">Medspa &amp; Wellness</text></svg>`)}`,
        sizes: "390x844",
        type: "image/svg+xml",
        // form_factor is a valid PWA manifest property not yet typed by Next.js
        ...({ form_factor: "narrow" } as Record<string, string>),
        label: "Rani Beauty Clinic mobile view",
      },
    ] as any,
    shortcuts: [
      {
        name: "Book Appointment",
        short_name: "Book",
        url: "/get-started",
        description: "Schedule your next treatment at Rani Beauty Clinic",
      },
      {
        name: "Our Services",
        short_name: "Services",
        url: "/services",
        description: "Browse our full menu of medspa treatments",
      },
      {
        name: "Weight Loss",
        short_name: "GLP-1",
        url: "/weight-loss",
        description: "GLP-1 physician-supervised weight management",
      },
      {
        name: "Wellness",
        short_name: "Wellness",
        url: "/wellness",
        description: "NAD+, vitamin injections, and wellness treatments",
      },
    ],
  };
}
