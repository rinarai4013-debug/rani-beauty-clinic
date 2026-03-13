import type { Metadata } from "next";
import TVLandingClient from "./TVLandingClient";

export const metadata: Metadata = {
  title: "$99 Brazilian Laser Hair Removal | Rani Beauty Clinic",
  description:
    "As seen on Hulu — Get a full Brazilian laser hair removal session + FREE underarm treatment for just $99. Limited-time offer at Rani Beauty Clinic in Renton, WA.",
  openGraph: {
    title: "$99 Brazilian Laser Hair Removal + FREE Underarms | Rani Beauty Clinic",
    description:
      "As seen on Hulu — Full Brazilian laser hair removal + FREE underarm treatment for $99. Licensed medical professionals. Book now!",
    url: "https://ranibeautyclinic.com/tv",
    siteName: "Rani Beauty Clinic",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "$99 Brazilian Laser Hair Removal | Rani Beauty Clinic",
    description:
      "As seen on Hulu — Full Brazilian laser hair removal + FREE underarm treatment for $99. Book now!",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function TVLandingPage() {
  return <TVLandingClient />;
}
