import { clinicInfo } from '@/data/clinic-info';

export type CityServiceContentStatus = 'planned' | 'draft' | 'published';
export type CityServiceCategory = 'injectables' | 'laser' | 'skin' | 'wellness';
export type CityServiceBatch = 'pr2-top5' | 'pr3-remaining26' | 'future-expansion';

export interface ProgrammaticSeoCity {
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

export interface ProgrammaticSeoService {
  slug: string;
  name: string;
  schemaName: string;
  category: CityServiceCategory;
  canonicalServicePath: string;
  costPath?: string;
  priceRange: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  treatmentSummary: string;
  defaultFaqs: CityServiceFaq[];
}

export interface CityServiceTarget {
  citySlug: ProgrammaticSeoCity['slug'];
  serviceSlug: ProgrammaticSeoService['slug'];
  batch: CityServiceBatch;
  priority: 1 | 2 | 3;
}

export interface CityServiceFaq {
  question: string;
  answer: string;
}

export interface CityServiceSection {
  heading: string;
  body: string[];
}

export interface CityServiceContentBrief {
  citySlug: ProgrammaticSeoCity['slug'];
  serviceSlug: ProgrammaticSeoService['slug'];
  status: CityServiceContentStatus;
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
  sections: CityServiceSection[];
  citySpecifics: {
    driveTimeNote: string;
    parkingNote: string;
    neighborhoodNote: string;
  };
  faqs: CityServiceFaq[];
  internalLinks?: ProgrammaticInternalLink[];
}

export interface PublishedCityServicePage extends CityServiceContentBrief {
  status: 'published';
  city: ProgrammaticSeoCity;
  service: ProgrammaticSeoService;
  canonicalPath: string;
  canonicalUrl: string;
}

export interface ProgrammaticInternalLink {
  label: string;
  href: string;
  reason: string;
}

export const programmaticSeoCities = [
  {
    slug: 'renton',
    name: 'Renton',
    state: 'WA',
    county: 'King County',
    distanceFromClinic: 'local clinic',
    driveTime: '0-10 minutes',
    driveRoute: 'Rani Beauty Clinic is in Renton near I-405 and NE 4th Street.',
    parkingNote: 'Free on-site parking is available at 401 Olympia Ave NE, Suite 101.',
    neighborhoodCallouts: [
      'Downtown Renton',
      'The Landing',
      'Renton Highlands',
      'Kennydale',
      'Benson Hill',
    ],
    localProofPoints: ['Open seven days a week', 'Free clinic parking', 'Easy access from I-405'],
  },
  {
    slug: 'bellevue',
    name: 'Bellevue',
    state: 'WA',
    county: 'King County',
    distanceFromClinic: 'about 12 miles',
    driveTime: '20-30 minutes',
    driveRoute: 'Most Bellevue patients reach the clinic by taking I-405 South toward Renton.',
    parkingNote: 'Free on-site parking avoids downtown Bellevue garage congestion.',
    neighborhoodCallouts: ['Downtown Bellevue', 'Factoria', 'Newport', 'Somerset', 'Lake Hills'],
    localProofPoints: [
      'Convenient from I-405',
      'Free parking',
      'Evening appointment window until 7 PM',
    ],
  },
  {
    slug: 'seattle',
    name: 'Seattle',
    state: 'WA',
    county: 'King County',
    distanceFromClinic: 'about 14-18 miles',
    driveTime: '25-40 minutes',
    driveRoute:
      'Seattle patients typically use I-5, Rainier Avenue South, or I-90 to I-405 depending on neighborhood.',
    parkingNote:
      'The Renton clinic offers free parking, a simpler arrival than many Seattle medical-spa visits.',
    neighborhoodCallouts: [
      'Capitol Hill',
      'South Lake Union',
      'Queen Anne',
      'West Seattle',
      'Beacon Hill',
      'Columbia City',
    ],
    localProofPoints: [
      'Free parking',
      'Physician-supervised care',
      'Accessible from South Seattle and I-90',
    ],
  },
  {
    slug: 'kent',
    name: 'Kent',
    state: 'WA',
    county: 'King County',
    distanceFromClinic: 'about 9 miles',
    driveTime: '15-25 minutes',
    driveRoute:
      'Kent patients usually take WA-167 North or local routes through Benson and East Hill.',
    parkingNote: 'Free on-site parking supports quick in-and-out treatment visits.',
    neighborhoodCallouts: [
      'Kent Station',
      'East Hill',
      'Lake Meridian',
      'Panther Lake',
      'The Lakes',
    ],
    localProofPoints: ['Short drive from Kent', 'Free parking', 'Open daily'],
  },
  {
    slug: 'newcastle',
    name: 'Newcastle',
    state: 'WA',
    county: 'King County',
    distanceFromClinic: 'about 7 miles',
    driveTime: '10-15 minutes',
    driveRoute:
      'Newcastle patients can reach the clinic quickly via Coal Creek Parkway and I-405 South.',
    parkingNote: 'Free on-site parking makes the visit simpler than a downtown appointment.',
    neighborhoodCallouts: ['Coal Creek', 'Olympus', 'Hazelwood', 'Newport Hills', 'Lake Boren'],
    localProofPoints: ['Very short Eastside drive', 'Free parking', 'Weekend availability'],
  },
  {
    slug: 'mercer-island',
    name: 'Mercer Island',
    state: 'WA',
    county: 'King County',
    distanceFromClinic: 'about 11 miles',
    driveTime: '15-25 minutes',
    driveRoute: 'Mercer Island patients typically take I-90 East to I-405 South toward Renton.',
    parkingNote: 'Free clinic parking is available on arrival at the Renton location.',
    neighborhoodCallouts: ['Town Center', 'First Hill', 'North End', 'South End', 'East Seattle'],
    localProofPoints: [
      'Easy I-90 to I-405 route',
      'Free parking',
      'Physician-supervised medspa care',
    ],
  },
] as const satisfies readonly ProgrammaticSeoCity[];

export const programmaticSeoServices = [
  {
    slug: 'botox',
    name: 'Botox',
    schemaName: 'Botox and Dysport injections',
    category: 'injectables',
    canonicalServicePath: '/services/botox-dysport',
    costPath: '/cost/botox-cost',
    priceRange: 'Starting at $12/unit',
    primaryKeyword: 'botox',
    secondaryKeywords: ['dysport', 'wrinkle relaxer', 'neurotoxin injections'],
    treatmentSummary:
      "Neurologist-supervised wrinkle relaxer treatment for forehead lines, frown lines, crow's feet, and expression lines.",
    defaultFaqs: [
      {
        question: 'How long does Botox last?',
        answer:
          'Botox and Dysport results typically last 3 to 4 months, depending on dose, treatment area, and metabolism.',
      },
      {
        question: 'Why does physician supervision matter for Botox?',
        answer:
          'Botox works on facial muscle activity, so precise anatomy and dosing matter. Rani Beauty Clinic treatments are supervised by Dr. Alexander Landfield, a board-certified neurologist.',
      },
    ],
  },
  {
    slug: 'lip-filler',
    name: 'Lip Filler',
    schemaName: 'Lip filler injections',
    category: 'injectables',
    canonicalServicePath: '/services/dermal-fillers',
    costPath: '/cost/dermal-fillers-cost',
    priceRange: 'Starting at $650/syringe',
    primaryKeyword: 'lip filler',
    secondaryKeywords: ['lip injections', 'hyaluronic acid filler', 'natural lip enhancement'],
    treatmentSummary:
      'Hyaluronic acid filler for lip volume, border definition, hydration, symmetry, and natural-looking shape refinement.',
    defaultFaqs: [
      {
        question: 'How long does lip filler last?',
        answer:
          'Lip filler commonly lasts 6 to 12 months, depending on the product used, your metabolism, and how much movement the area has.',
      },
      {
        question: 'Can lip filler look natural?',
        answer:
          'Yes. The Rani approach starts conservatively and prioritizes proportion, definition, and balance rather than overfilling.',
      },
    ],
  },
  {
    slug: 'laser-hair-removal',
    name: 'Laser Hair Removal',
    schemaName: 'Laser hair removal',
    category: 'laser',
    canonicalServicePath: '/services/laser-hair-removal',
    costPath: '/cost/laser-hair-removal-cost',
    priceRange: 'From $79/session',
    primaryKeyword: 'laser hair removal',
    secondaryKeywords: [
      'permanent hair reduction',
      'Candela GentleMax Pro Plus',
      'laser hair removal for all skin types',
    ],
    treatmentSummary:
      'Permanent hair reduction using Candela GentleMax Pro Plus dual-wavelength laser technology for a wide range of skin tones.',
    defaultFaqs: [
      {
        question: 'How many laser hair removal sessions do I need?',
        answer:
          'Most patients need 6 to 8 sessions spaced several weeks apart because hair grows in cycles.',
      },
      {
        question: 'Is laser hair removal safe for darker skin tones?',
        answer:
          'The Candela GentleMax Pro Plus includes Nd:YAG technology, which supports safe treatment planning for darker skin tones when used by trained providers.',
      },
    ],
  },
  {
    slug: 'hydrafacial',
    name: 'HydraFacial',
    schemaName: 'HydraFacial MD',
    category: 'skin',
    canonicalServicePath: '/services/hydrafacial',
    costPath: '/cost/hydrafacial-cost',
    priceRange: '$249 signature treatment',
    primaryKeyword: 'hydrafacial',
    secondaryKeywords: ['facial', 'hydrating facial', 'Vortex-Fusion treatment'],
    treatmentSummary:
      'A zero-downtime facial that cleanses, exfoliates, extracts, and hydrates using HydraFacial Vortex-Fusion technology.',
    defaultFaqs: [
      {
        question: 'Is there downtime after HydraFacial?',
        answer: 'No. HydraFacial is designed for an immediate glow with no required downtime.',
      },
      {
        question: 'How often should I get a HydraFacial?',
        answer:
          'Many patients choose monthly HydraFacial treatments for maintenance, hydration, and congestion control.',
      },
    ],
  },
  {
    slug: 'rf-microneedling',
    name: 'RF Microneedling',
    schemaName: 'RF microneedling',
    category: 'skin',
    canonicalServicePath: '/services/rf-microneedling',
    costPath: '/cost/rf-microneedling-cost',
    priceRange: 'From $495/session',
    primaryKeyword: 'rf microneedling',
    secondaryKeywords: [
      'radiofrequency microneedling',
      'acne scar treatment',
      'collagen induction',
    ],
    treatmentSummary:
      'Radiofrequency microneedling for collagen remodeling, texture, acne scars, pore size, fine lines, and skin firmness.',
    defaultFaqs: [
      {
        question: 'What does RF microneedling treat?',
        answer:
          'RF microneedling can improve acne scarring, texture, fine lines, enlarged pores, stretch marks, and mild laxity.',
      },
      {
        question: 'How much downtime should I expect?',
        answer:
          'Most patients have redness and sensitivity for 1 to 3 days, with collagen results building over several weeks.',
      },
    ],
  },
  {
    slug: 'semaglutide',
    name: 'Semaglutide',
    schemaName: 'Semaglutide medical weight loss',
    category: 'wellness',
    canonicalServicePath: '/wellness/glp1-weight-management',
    costPath: '/cost/semaglutide-cost',
    priceRange: 'From $349/month',
    primaryKeyword: 'semaglutide',
    secondaryKeywords: ['medical weight loss', 'GLP-1', 'physician-supervised weight loss'],
    treatmentSummary:
      'Physician-supervised GLP-1 weight management with lab review, dose planning, and ongoing clinical monitoring.',
    defaultFaqs: [
      {
        question: 'Is blood work required before semaglutide?',
        answer:
          'Baseline labs are part of responsible GLP-1 care so the medical team can review metabolic markers and safety considerations.',
      },
      {
        question: 'How quickly does semaglutide work?',
        answer:
          'Many patients notice appetite changes early, while weight-loss progress typically builds over several months with dose titration and lifestyle support.',
      },
    ],
  },
  {
    slug: 'cosmelan',
    name: 'Cosmelan',
    schemaName: 'Cosmelan depigmentation peel',
    category: 'skin',
    canonicalServicePath: '/services/cosmelan-peel',
    costPath: '/cost/chemical-peels-cost',
    priceRange: 'Consultation required',
    primaryKeyword: 'cosmelan',
    secondaryKeywords: ['melasma treatment', 'hyperpigmentation peel', 'dark spot treatment'],
    treatmentSummary:
      'Professional depigmentation peel protocol for melasma, stubborn pigmentation, sun spots, and uneven tone.',
    defaultFaqs: [
      {
        question: 'What does Cosmelan treat?',
        answer:
          'Cosmelan is commonly used for melasma, stubborn hyperpigmentation, sun spots, and uneven pigment patterns.',
      },
      {
        question: 'Does Cosmelan require home care?',
        answer:
          'Yes. Cosmelan outcomes depend on a structured in-clinic treatment plus a prescribed home-care phase and strict sun protection.',
      },
    ],
  },
  {
    slug: 'sofwave',
    name: 'Sofwave',
    schemaName: 'Sofwave skin tightening',
    category: 'skin',
    canonicalServicePath: '/services/sofwave',
    costPath: '/cost/sofwave-cost',
    priceRange: 'From $1,150',
    primaryKeyword: 'sofwave',
    secondaryKeywords: ['skin tightening', 'ultrasound lifting', 'non-surgical facelift'],
    treatmentSummary:
      'Non-invasive ultrasound skin tightening using Sofwave SUPERB technology to stimulate collagen for lift and firmness.',
    defaultFaqs: [
      {
        question: 'When do Sofwave results appear?',
        answer:
          'Some tightening can appear early, with more visible lifting and firmness developing over 3 to 6 months as collagen remodels.',
      },
      {
        question: 'Is Sofwave surgical?',
        answer:
          'No. Sofwave is a non-surgical ultrasound treatment with little to no downtime for many patients.',
      },
    ],
  },
] as const satisfies readonly ProgrammaticSeoService[];

const phaseOneServices = new Set([
  'botox',
  'lip-filler',
  'laser-hair-removal',
  'hydrafacial',
  'semaglutide',
]);
const fullBuildCities = new Set(['renton', 'bellevue']);

export const programmaticCityServiceTargets = programmaticSeoCities.flatMap((city) =>
  programmaticSeoServices.map((service): CityServiceTarget => {
    if (fullBuildCities.has(city.slug) && phaseOneServices.has(service.slug)) {
      return { citySlug: city.slug, serviceSlug: service.slug, batch: 'pr2-top5', priority: 1 };
    }

    if (fullBuildCities.has(city.slug)) {
      return {
        citySlug: city.slug,
        serviceSlug: service.slug,
        batch: 'pr3-remaining26',
        priority: 2,
      };
    }

    if (phaseOneServices.has(service.slug)) {
      return {
        citySlug: city.slug,
        serviceSlug: service.slug,
        batch: 'pr3-remaining26',
        priority: 2,
      };
    }

    return {
      citySlug: city.slug,
      serviceSlug: service.slug,
      batch: 'future-expansion',
      priority: 3,
    };
  }),
);

export const primaryProgrammaticTargets = programmaticCityServiceTargets.filter(
  (target) => target.batch !== 'future-expansion',
);

export const futureExpansionTargets = programmaticCityServiceTargets.filter(
  (target) => target.batch === 'future-expansion',
);

// PR 1 intentionally publishes no city-service pages. PRs 2 and 3 will add
// content briefs here and flip each ready page to `status: "published"`.
export const cityServiceContentBriefs: readonly CityServiceContentBrief[] = [];

export function getProgrammaticSeoCity(slug: string): ProgrammaticSeoCity | undefined {
  return programmaticSeoCities.find((city) => city.slug === slug);
}

export function getProgrammaticSeoService(slug: string): ProgrammaticSeoService | undefined {
  return programmaticSeoServices.find((service) => service.slug === slug);
}

export function getCityServicePath(citySlug: string, serviceSlug: string): string {
  return `/${citySlug}/${serviceSlug}`;
}

export function getCityServiceUrl(citySlug: string, serviceSlug: string): string {
  return `${clinicInfo.website}${getCityServicePath(citySlug, serviceSlug)}`;
}

export function hydrateCityServicePage(
  brief: CityServiceContentBrief,
): PublishedCityServicePage | null {
  if (brief.status !== 'published') return null;

  const city = getProgrammaticSeoCity(brief.citySlug);
  const service = getProgrammaticSeoService(brief.serviceSlug);
  if (!city || !service) return null;

  return {
    ...brief,
    status: 'published',
    city,
    service,
    canonicalPath: getCityServicePath(city.slug, service.slug),
    canonicalUrl: getCityServiceUrl(city.slug, service.slug),
  };
}

export const publishedCityServicePages = cityServiceContentBriefs
  .map(hydrateCityServicePage)
  .filter((page): page is PublishedCityServicePage => Boolean(page));

export function getPublishedCityServicePage(
  citySlug: string,
  serviceSlug: string,
): PublishedCityServicePage | undefined {
  return publishedCityServicePages.find(
    (page) => page.city.slug === citySlug && page.service.slug === serviceSlug,
  );
}

export function getRelatedCityServiceLinks(
  page: PublishedCityServicePage,
  limit = 5,
): ProgrammaticInternalLink[] {
  const sameCity = publishedCityServicePages
    .filter(
      (candidate) =>
        candidate.city.slug === page.city.slug && candidate.service.slug !== page.service.slug,
    )
    .slice(0, 3)
    .map((candidate) => ({
      label: `${candidate.service.name} in ${page.city.name}`,
      href: candidate.canonicalPath,
      reason: `Related ${candidate.service.category} service for ${page.city.name} patients`,
    }));

  const sameService = publishedCityServicePages
    .filter(
      (candidate) =>
        candidate.service.slug === page.service.slug && candidate.city.slug !== page.city.slug,
    )
    .slice(0, 2)
    .map((candidate) => ({
      label: `${page.service.name} near ${candidate.city.name}`,
      href: candidate.canonicalPath,
      reason: `Same treatment in a nearby service-area page`,
    }));

  const evergreen: ProgrammaticInternalLink[] = [
    {
      label: page.service.name,
      href: page.service.canonicalServicePath,
      reason: 'Core service page',
    },
    ...(page.service.costPath
      ? [
          {
            label: `${page.service.name} cost`,
            href: page.service.costPath,
            reason: 'Pricing support page',
          },
        ]
      : []),
    {
      label: 'All service areas',
      href: '/locations',
      reason: 'Location hub',
    },
  ];

  const unique = new Map<string, ProgrammaticInternalLink>();
  for (const link of [...(page.internalLinks ?? []), ...sameCity, ...sameService, ...evergreen]) {
    if (!unique.has(link.href) && link.href !== page.canonicalPath) {
      unique.set(link.href, link);
    }
  }

  return Array.from(unique.values()).slice(0, limit);
}
