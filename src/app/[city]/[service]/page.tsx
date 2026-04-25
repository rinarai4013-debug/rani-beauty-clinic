import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CityServicePageTemplate from '@/components/programmatic-seo/CityServicePageTemplate';
import {
  getPublishedCityServicePage,
  getRelatedCityServiceLinks,
  publishedCityServicePages,
} from '@/data/programmatic-seo/city-service-pages';

interface PageProps {
  params: {
    city: string;
    service: string;
  };
}

export const dynamicParams = false;

export function generateStaticParams() {
  return publishedCityServicePages.map((page) => ({
    city: page.city.slug,
    service: page.service.slug,
  }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const page = getPublishedCityServicePage(params.city, params.service);

  if (!page) {
    return {
      title: 'City Service Page Not Found | Rani Beauty Clinic',
      robots: { index: false, follow: false },
    };
  }

  return {
    title: { absolute: page.meta.title },
    description: page.meta.description,
    alternates: {
      canonical: page.canonicalUrl,
      languages: {
        'en-US': page.canonicalUrl,
      },
    },
    openGraph: {
      title: page.meta.title,
      description: page.meta.description,
      type: 'website',
      url: page.canonicalUrl,
      images: [
        {
          url: '/opengraph-image',
          width: 1200,
          height: 630,
          alt: `${page.service.name} near ${page.city.name} | Rani Beauty Clinic`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: page.meta.title,
      description: page.meta.description,
      images: ['/opengraph-image'],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function CityServicePage({ params }: PageProps) {
  const page = getPublishedCityServicePage(params.city, params.service);

  if (!page) {
    notFound();
  }

  return <CityServicePageTemplate page={page} relatedLinks={getRelatedCityServiceLinks(page, 5)} />;
}
