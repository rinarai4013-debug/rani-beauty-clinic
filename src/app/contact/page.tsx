import type { Metadata } from "next";
import ContactPageClient from "./ContactPageClient";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Contact Rani Beauty Clinic in Renton, WA. Book a consultation, ask about our treatments, or visit us at 401 Olympia Ave NE, Suite 101. Open 7 days a week.",
  alternates: {
    canonical: "https://ranibeautyclinic.com/contact",
  },
};

export default function ContactPage() {
  return <ContactPageClient />;
}
