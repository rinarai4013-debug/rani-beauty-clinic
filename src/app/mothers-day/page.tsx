import type { Metadata } from 'next';
import MothersDayClient from './MothersDayClient';

const canonicalUrl = 'https://www.ranibeautyclinic.com/mothers-day';

export const metadata: Metadata = {
  title: "mother's day gift cards | rani beauty clinic",
  description:
    "give her the gift of her most radiant year. choose a rani beauty clinic gift card and let her pick the experience she loves most.",
  alternates: {
    canonical: canonicalUrl,
  },
  openGraph: {
    title: "mother's day gift cards | rani beauty clinic",
    description:
      "give her the gift of her most radiant year. choose a rani beauty clinic gift card and let her pick the experience she loves most.",
    url: canonicalUrl,
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: "rani beauty clinic mother's day gift cards",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "mother's day gift cards | rani beauty clinic",
    description:
      "give her the gift of her most radiant year. choose a rani beauty clinic gift card and let her pick the experience she loves most.",
  },
};

export default function MothersDayPage() {
  const giftCardUrl =
    process.env.MANGOMINT_GIFT_CARD_URL ||
    process.env.NEXT_PUBLIC_MANGOMINT_GIFT_CARD_URL ||
    '{MANGOMINT_GIFT_CARD_URL}';

  return <MothersDayClient giftCardUrl={giftCardUrl} />;
}
