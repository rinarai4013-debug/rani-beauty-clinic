# Programmatic SEO City-Service Schema

This is the content-brief shape for root city-service pages at `/:city/:service`.

## Target Matrix

- Primary launch target: 36 pages.
- PR 2 target: Renton + Bellevue x top 5 services = 10 pages.
- PR 3 target: remaining 26 primary pages.
- Future expansion: 12 additional city-service combinations already modeled.

## Cities

City records live in `programmaticSeoCities` and provide reusable local details:

```ts
interface ProgrammaticSeoCity {
  slug: string;
  name: string;
  state: 'WA';
  county: string;
  distanceFromClinic: string;
  driveTime: string;
  driveRoute: string;
  parkingNote: string;
  neighborhoodCallouts: string[];
  localProofPoints: string[];
}
```

## Services

Service records live in `programmaticSeoServices` and provide reusable treatment details:

```ts
interface ProgrammaticSeoService {
  slug: string;
  name: string;
  schemaName: string;
  category: 'injectables' | 'laser' | 'skin' | 'wellness';
  canonicalServicePath: string;
  costPath?: string;
  priceRange: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  treatmentSummary: string;
  defaultFaqs: CityServiceFaq[];
}
```

## Content Briefs

Add finished page copy to `cityServiceContentBriefs`. Only records with `status: "published"` generate static params, metadata, schemas, sitemap entries, and live pages.

```ts
interface CityServiceContentBrief {
  citySlug: string;
  serviceSlug: string;
  status: 'planned' | 'draft' | 'published';
  lastReviewed: string;
  meta: {
    title: string;
    description: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    callout: string;
  };
  intro: string[];
  sections: {
    heading: string;
    body: string[];
  }[];
  citySpecifics: {
    driveTimeNote: string;
    parkingNote: string;
    neighborhoodNote: string;
  };
  faqs: {
    question: string;
    answer: string;
  }[];
  internalLinks?: {
    label: string;
    href: string;
    reason: string;
  }[];
}
```

## Required Page Behavior

Each published page receives:

- Canonical URL at `https://www.ranibeautyclinic.com/:city/:service`.
- `en-US` hreflang through Next metadata alternates.
- Breadcrumb schema.
- LocalBusiness schema.
- Service schema.
- FAQ schema.
- Five related internal links assembled from explicit brief links, same-city services, same-service city pages, core service page, cost page, and the location hub.
