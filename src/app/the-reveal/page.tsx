import type { Metadata } from "next";
import TheRevealClient from "./TheRevealClient";
import StructuredData from "@/components/seo/StructuredData";

export const metadata: Metadata = {
  title: "The Reveal — Post-GLP-1 Skin Restoration",
  description:
    "The Reveal is Rani Beauty Clinic's signature skin restoration protocol for GLP-1 patients. Combining Sofwave + Secret RF to address skin laxity after weight loss. Book your Reveal Assessment today.",
  openGraph: {
    title: "The Reveal | Post-GLP-1 Skin Restoration | Rani Beauty Clinic",
    description:
      "Our signature protocol for restoring skin firmness and quality after GLP-1 weight loss. Sofwave + Secret RF combination treatment in Renton, WA.",
    url: "https://www.ranibeautyclinic.com/the-reveal",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "The Reveal — Post-GLP-1 Skin Restoration" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Reveal | Post-GLP-1 Skin Restoration | Rani Beauty Clinic",
    description:
      "Signature Sofwave + Secret RF protocol for restoring skin firmness after GLP-1 weight loss in Renton, WA.",
  },
  alternates: {
    canonical: "https://www.ranibeautyclinic.com/the-reveal",
  },
};

const revealSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "MedicalProcedure",
      name: "The Reveal — Post-GLP-1 Skin Restoration Protocol",
      description:
        "A physician-supervised skin restoration protocol combining Sofwave ultrasound and Secret RF microneedling for patients experiencing skin laxity after GLP-1 weight loss.",
      procedureType: "https://schema.org/NoninvasiveProcedure",
      bodyLocation: "Face, Neck, Body",
      howPerformed:
        "Dual-technology protocol: Sofwave SUPERB ultrasound for deep collagen stimulation at 1.5mm depth, combined with Secret RF fractional radiofrequency microneedling for surface dermal remodeling.",
      preparation:
        "Complimentary Reveal Assessment including skin laxity evaluation, treatment mapping, and personalized protocol design.",
      status: "https://schema.org/EventScheduled",
    },
    {
      "@type": "MedicalBusiness",
      name: "Rani Beauty Clinic",
      url: "https://www.ranibeautyclinic.com",
      telephone: "+14255394440",
      address: {
        "@type": "PostalAddress",
        streetAddress: "401 Olympia Ave NE #101",
        addressLocality: "Renton",
        addressRegion: "WA",
        postalCode: "98056",
        addressCountry: "US",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: 47.4918,
        longitude: -122.2015,
      },
      openingHoursSpecification: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "10:00",
        closes: "19:00",
      },
      priceRange: "$$$",
      medicalSpecialty: "https://schema.org/Dermatology",
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is The Reveal protocol?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The Reveal is Rani Beauty Clinic's signature skin restoration protocol designed specifically for patients who have experienced skin changes after GLP-1 weight loss. It combines two FDA-cleared technologies — Sofwave ultrasound and Secret RF microneedling — to address loose skin at multiple depths for comprehensive results.",
          },
        },
        {
          "@type": "Question",
          name: "How much does The Reveal cost?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The Reveal is available in three tiers: Essential ($1,490) for targeted restoration, Signature ($3,990) for comprehensive facial and neck restoration, and Complete ($5,990) for full face and body treatment. HSA/FSA accepted, financing available.",
          },
        },
        {
          "@type": "Question",
          name: "Can I get The Reveal while still taking GLP-1 medication?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. There is no contraindication between Sofwave, Secret RF, and GLP-1 medications. Many providers recommend beginning skin tightening treatments before completing your weight loss journey to give collagen a head start on remodeling.",
          },
        },
        {
          "@type": "Question",
          name: "How long until I see results from The Reveal?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Most patients notice initial skin tightening within 4-6 weeks. Full results continue developing over 3-6 months as collagen remodels. Progress tracking is included in every Reveal protocol.",
          },
        },
        {
          "@type": "Question",
          name: "Is The Reveal safe for all skin types?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Both Sofwave and Secret RF are safe for all skin types (Fitzpatrick I-VI). This is an advantage over laser-based treatments which carry higher risk for darker skin tones.",
          },
        },
      ],
    },
  ],
};

export default function TheRevealPage() {
  return (
    <>
      <StructuredData data={revealSchema} />
      <TheRevealClient />
    </>
  );
}
