import type { Metadata } from 'next';
import WelcomeClient from './WelcomeClient';

const canonicalUrl = 'https://www.ranibeautyclinic.com/welcome';

export const metadata: Metadata = {
  title: 'welcome to rani | first visit guide',
  description:
    'welcome to the rani family. here is your warm first visit guide so you know exactly what to expect when you come in.',
  alternates: {
    canonical: canonicalUrl,
  },
  openGraph: {
    title: 'welcome to rani | first visit guide',
    description:
      'welcome to the rani family. here is your warm first visit guide so you know exactly what to expect when you come in.',
    url: canonicalUrl,
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'welcome to rani beauty clinic',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'welcome to rani | first visit guide',
    description:
      'welcome to the rani family. here is your warm first visit guide so you know exactly what to expect when you come in.',
  },
};

export default function WelcomePage() {
  return <WelcomeClient />;
}
