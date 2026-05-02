import { stringifyJsonLd } from '@/lib/seo/schema-org';

interface StructuredDataProps {
  data: Record<string, unknown>;
}

export interface FAQSpeakableItem {
  question: string;
  answer: string;
  answerId?: string;
}

interface FAQSpeakableProps {
  faqs: FAQSpeakableItem[];
  pageUrl?: string;
  pageName?: string;
}

export default function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: stringifyJsonLd(data) }}
    />
  );
}

export function FAQSpeakable({ faqs, pageUrl, pageName }: FAQSpeakableProps) {
  if (faqs.length === 0) return null;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  const selectors = Array.from(
    new Set(
      faqs.flatMap((faq, index) => {
        const fallbackId = `faq-answer-${index + 1}`;
        const id = faq.answerId ?? fallbackId;
        return [`#${id}`, ".faq-answer", "[data-faq-answer]"];
      }),
    ),
  );

  const speakableSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    ...(pageUrl ? { "@id": pageUrl } : {}),
    ...(pageName ? { name: pageName } : {}),
    ...(pageUrl ? { url: pageUrl } : {}),
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: selectors,
    },
  };

  return (
    <>
      <StructuredData data={faqSchema} />
      <StructuredData data={speakableSchema} />
    </>
  );
}
