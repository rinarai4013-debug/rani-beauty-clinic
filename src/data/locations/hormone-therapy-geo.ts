/**
 * Hormone Therapy Geo Pages
 * 20 PNW cities within 45 minutes of Renton, WA
 * Service focus: Hormone optimization, testosterone, thyroid, bioidentical hormones
 */

export interface ServiceGeoPage {
  city: string;
  state: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  heroHeading: string;
  heroSubheading: string;
  content: string;
  nearbyAreas: string[];
  services: string[];
}

const hormoneCities = [
  { city: 'Renton', slug: 'hormone-therapy-renton-wa', drive: 'our home clinic', nearby: ['bellevue-wa','kent-wa','tukwila-wa','newcastle-wa','mercer-island-wa'] },
  { city: 'Bellevue', slug: 'hormone-therapy-bellevue-wa', drive: 'just 15 minutes via I-405', nearby: ['kirkland-wa','redmond-wa','newcastle-wa','mercer-island-wa','issaquah-wa'] },
  { city: 'Kirkland', slug: 'hormone-therapy-kirkland-wa', drive: 'about 20 minutes via I-405', nearby: ['bellevue-wa','redmond-wa','bothell-wa','woodinville-wa','kenmore-wa'] },
  { city: 'Redmond', slug: 'hormone-therapy-redmond-wa', drive: 'approximately 25 minutes via I-405', nearby: ['kirkland-wa','bellevue-wa','sammamish-wa','woodinville-wa','bothell-wa'] },
  { city: 'Kent', slug: 'hormone-therapy-kent-wa', drive: 'just 10 minutes via WA-167', nearby: ['auburn-wa','covington-wa','renton-wa','tukwila-wa','federal-way-wa'] },
  { city: 'Auburn', slug: 'hormone-therapy-auburn-wa', drive: 'about 20 minutes via WA-167', nearby: ['kent-wa','federal-way-wa','covington-wa','maple-valley-wa','enumclaw-wa'] },
  { city: 'Federal Way', slug: 'hormone-therapy-federal-way-wa', drive: 'approximately 25 minutes via I-5', nearby: ['kent-wa','auburn-wa','des-moines-wa','tukwila-wa','normandy-park-wa'] },
  { city: 'Tukwila', slug: 'hormone-therapy-tukwila-wa', drive: 'just 8 minutes away', nearby: ['renton-wa','seatac-wa','burien-wa','kent-wa','newcastle-wa'] },
  { city: 'Mercer Island', slug: 'hormone-therapy-mercer-island-wa', drive: 'about 15 minutes via I-90', nearby: ['bellevue-wa','renton-wa','newcastle-wa','issaquah-wa','kirkland-wa'] },
  { city: 'Issaquah', slug: 'hormone-therapy-issaquah-wa', drive: 'approximately 20 minutes via I-90', nearby: ['sammamish-wa','bellevue-wa','snoqualmie-wa','north-bend-wa','mercer-island-wa'] },
  { city: 'Sammamish', slug: 'hormone-therapy-sammamish-wa', drive: 'about 25 minutes via I-90', nearby: ['issaquah-wa','redmond-wa','bellevue-wa','snoqualmie-wa','fall-city-wa'] },
  { city: 'Woodinville', slug: 'hormone-therapy-woodinville-wa', drive: 'about 30 minutes via I-405', nearby: ['bothell-wa','kirkland-wa','redmond-wa','kenmore-wa','sammamish-wa'] },
  { city: 'Bothell', slug: 'hormone-therapy-bothell-wa', drive: 'about 30 minutes via I-405', nearby: ['kenmore-wa','kirkland-wa','woodinville-wa','shoreline-wa','redmond-wa'] },
  { city: 'Newcastle', slug: 'hormone-therapy-newcastle-wa', drive: 'just 10 minutes via Coal Creek Parkway', nearby: ['bellevue-wa','renton-wa','mercer-island-wa','issaquah-wa','tukwila-wa'] },
  { city: 'Covington', slug: 'hormone-therapy-covington-wa', drive: 'about 20 minutes northwest', nearby: ['kent-wa','maple-valley-wa','auburn-wa','black-diamond-wa','renton-wa'] },
  { city: 'Maple Valley', slug: 'hormone-therapy-maple-valley-wa', drive: 'about 25 minutes northwest', nearby: ['covington-wa','black-diamond-wa','kent-wa','renton-wa','issaquah-wa'] },
  { city: 'Des Moines', slug: 'hormone-therapy-des-moines-wa', drive: 'about 15 minutes via WA-516', nearby: ['seatac-wa','burien-wa','federal-way-wa','normandy-park-wa','kent-wa'] },
  { city: 'Burien', slug: 'hormone-therapy-burien-wa', drive: 'about 15 minutes via WA-518', nearby: ['seatac-wa','tukwila-wa','normandy-park-wa','des-moines-wa','renton-wa'] },
  { city: 'SeaTac', slug: 'hormone-therapy-seatac-wa', drive: 'about 12 minutes via WA-518', nearby: ['tukwila-wa','burien-wa','des-moines-wa','renton-wa','normandy-park-wa'] },
  { city: 'Shoreline', slug: 'hormone-therapy-shoreline-wa', drive: 'about 30 minutes via I-5', nearby: ['lake-forest-park-wa','kenmore-wa','bothell-wa','renton-wa','tukwila-wa'] },
];

function generateHormoneContent(city: string, drive: string): string {
  return `<p>${city} residents experiencing fatigue, mood changes, weight gain, low libido, or brain fog may be dealing with a hormone imbalance. Rani Beauty Clinic in Renton, ${drive}, offers physician-supervised hormone therapy under the medical direction of Dr. Alexander Landfield, our board-certified Medical Director.</p>

<p>Hormones are chemical messengers that regulate nearly every system in your body, from metabolism and energy to mood and sleep. As we age, hormone levels naturally decline, but the symptoms of that decline do not have to become your new normal. At Rani Beauty Clinic, we take a comprehensive, lab-driven approach to hormone optimization. We start with a full hormone panel blood draw, right in our clinic, to identify specific imbalances before recommending any treatment.</p>

<p>Our hormone therapy services include testosterone optimization for both men and women, thyroid hormone management, estrogen and progesterone balancing, DHEA supplementation, and comprehensive metabolic support. Every protocol is designed around your unique lab results, symptoms, and health goals. We do not take a one-size-fits-all approach because your hormone profile is as individual as your fingerprint.</p>

<p>${city} patients appreciate our in-house lab capabilities, which allow us to draw blood, run panels, and review results without sending you to a separate facility. This streamlined approach means faster results and more convenient care. Most initial hormone panels include testosterone (total and free), estradiol, progesterone, DHEA-S, thyroid panel (TSH, free T3, free T4), cortisol, and a comprehensive metabolic panel.</p>

<p>Living in the Pacific Northwest, many ${city} residents contend with seasonal mood changes, lower vitamin D levels, and the stress of busy professional lives. Hormone imbalances can compound these challenges, making it harder to maintain energy, focus, and overall well-being. Our hormone therapy protocols address these concerns from the inside out, restoring balance so you can feel like yourself again.</p>

<p>Ongoing monitoring is a cornerstone of our approach. We schedule follow-up labs at regular intervals to track your response and make adjustments as needed. Dr. Landfield reviews every set of results and personally guides your care throughout the process. This level of physician involvement is what sets Rani Beauty Clinic apart from clinics that offer hormone therapy without genuine medical oversight.</p>

<p>Rani Beauty Clinic is located at 401 Olympia Ave NE, Suite 101 in Renton. We are open seven days a week from 10 AM to 7 PM, with free on-site parking. Hormone therapy consultations include a comprehensive assessment and lab draw. Flexible payment options available. Call (425) 539-4440 or book online to start your hormone optimization journey.</p>`;
}

export const hormoneTherapyGeoPages: ServiceGeoPage[] = hormoneCities.map((c) => ({
  city: c.city,
  state: 'WA',
  slug: c.slug,
  metaTitle: `Hormone Therapy ${c.city === 'Renton' ? 'in' : 'Near'} ${c.city}, WA | Rani Beauty Clinic`,
  metaDescription: `Physician-supervised hormone therapy ${c.city === 'Renton' ? 'in' : 'serving'} ${c.city}, WA. Testosterone, thyroid, and hormone optimization with in-house labs at Rani Beauty Clinic.`,
  heroHeading: `Hormone Therapy ${c.city === 'Renton' ? 'in' : 'Near'} ${c.city}, WA`,
  heroSubheading: `Physician-supervised hormone optimization for ${c.city} residents`,
  content: generateHormoneContent(c.city, c.drive),
  nearbyAreas: c.nearby,
  services: ['Hormone Therapy', 'Testosterone Optimization', 'Thyroid Management', 'Blood Work', 'Hormone Panel'],
}));
