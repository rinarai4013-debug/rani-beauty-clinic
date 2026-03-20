import type { Metadata } from "next";
import ContactPageClient from "./ContactPageClient";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Contact Rani Beauty Clinic in Renton, WA. Book a consultation, ask about our treatments, or visit us at 401 Olympia Ave NE, Suite 101. Open 7 days a week.",
  alternates: {
    canonical: "https://www.ranibeautyclinic.com/contact",
  },
  openGraph: {
    title: "Contact Us | Rani Beauty Clinic",
    description:
      "Book a consultation or visit us at 401 Olympia Ave NE, Suite 101, Renton, WA. Open 7 days a week.",
    url: "https://www.ranibeautyclinic.com/contact",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Contact Rani Beauty Clinic" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us | Rani Beauty Clinic",
    description:
      "Book a consultation or visit us at 401 Olympia Ave NE, Suite 101, Renton, WA. Open 7 days a week.",
  },
};

export default function ContactPage() {
  return <ContactPageClient />;
}
