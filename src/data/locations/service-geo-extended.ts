import { pnwCities } from "./pnw-cities";
import { waCitiesExtended } from "./wa-cities-extended";
import { ServiceGeoEntry, ServiceTemplate } from "./service-geo";

/**
 * 5 additional service templates for the extended geo SEO matrix.
 * These complement the 10 existing services in service-geo.ts.
 */
export const extendedServiceTemplates: ServiceTemplate[] = [
  {
    slug: "lip-filler-geo",
    name: "Lip Filler",
    priceRange: "From $650",
    category: "aesthetic",
    faqs: [
      { question: "How long do lip fillers last?", answer: "Lip fillers typically last 6 to 12 months depending on the product used, your metabolism, and the volume injected. Hyaluronic acid fillers gradually break down naturally, so maintenance treatments are recommended to sustain your results." },
      { question: "Will lip filler look natural?", answer: "At Rani Beauty Clinic, we specialize in natural-looking lip enhancement. Your provider will assess your facial proportions, lip anatomy, and aesthetic goals to create results that enhance your natural beauty rather than overpower it." },
      { question: "What is the recovery like after lip filler?", answer: "Expect mild swelling and potential bruising for 2 to 5 days following lip filler treatment. Most clients return to normal activities the same day. Final results are visible once swelling fully resolves at approximately 2 weeks." },
    ],
    generateContent: (cityName, county, drivingTime, distance) =>
      `${cityName} residents looking for expert lip augmentation will find natural, beautiful results at Rani Beauty Clinic in Renton, just ${distance} away. Our trained clinicians use premium hyaluronic acid dermal fillers to add volume, enhance definition, improve symmetry, and sculpt the lip shape you have always wanted. Every lip filler treatment at Rani is physician-supervised by Dr. Alexander Landfield, our board-certified Medical Director, ensuring the highest level of safety and artistry.

Lip filler at Rani Beauty Clinic is a personalized art form. During your consultation, your provider will evaluate your facial proportions, existing lip anatomy, the lip-to-face ratio, and your personal aesthetic vision. We believe in a conservative, build-as-you-go philosophy that ensures results look proportionate and natural at every stage. Whether you want subtle volume restoration after age-related thinning, a sharper vermilion border, improved symmetry between the upper and lower lip, correction of a gummy smile, or more dramatic augmentation for a fuller pout, your Rani provider will design a treatment plan specific to your face and your goals.

We use only premium hyaluronic acid fillers that deliver smooth, soft, natural-feeling results. Hyaluronic acid is a substance your body produces naturally, making these fillers biocompatible and fully reversible. If you ever want to adjust or dissolve your filler, we can do so safely and predictably. The injection process takes approximately 20 to 30 minutes. We apply topical anesthetic and use ice to keep you comfortable throughout the treatment, and many of our clients report that the process is far more comfortable than they expected.

Following your lip filler appointment, ${cityName} clients can expect mild swelling for 2 to 5 days, with possible bruising at the injection points. We recommend avoiding strenuous exercise, alcohol, and blood-thinning supplements for 24 to 48 hours after treatment to minimize bruising. Your lips will look and feel natural once the initial swelling resolves, typically within 10 to 14 days. Lip filler results generally last 6 to 12 months, and many of our clients prefer to schedule maintenance appointments every 8 to 10 months to preserve their results.

Lip filler at Rani Beauty Clinic starts at $650 per syringe, with most clients achieving their desired outcome with 1 to 2 syringes. Flexible payment options available for qualified applicants. ${cityName} residents in ${county} can reach our clinic at 401 Olympia Ave NE, Suite 101, Renton, WA 98056 in approximately ${drivingTime}. Free parking is available, and we are open seven days a week from 10 AM to 7 PM. Call (425) 539-4440 or book your lip filler consultation online today.`,
  },
  {
    slug: "scar-treatment",
    name: "Scar Treatment",
    priceRange: "From $350",
    technology: "Cutera Secret Pro + PicoWay",
    category: "aesthetic",
    faqs: [
      { question: "What types of scars can Rani treat?", answer: "We treat acne scars, surgical scars, traumatic scars, stretch marks, and keloid or hypertrophic scars using a combination of RF microneedling, laser therapy, chemical peels, and advanced topical protocols. Your provider will assess your scar type and recommend the most effective approach." },
      { question: "How many scar treatment sessions are needed?", answer: "Most clients see meaningful improvement in 3 to 6 sessions, depending on the scar type, depth, and treatment modality. Acne scars typically respond well to a series of RF microneedling treatments, while hyperpigmented scars may improve with fewer sessions of laser or peel therapy." },
      { question: "Is scar treatment painful?", answer: "We apply medical-grade topical numbing cream 30 minutes before treatment to ensure your comfort. Most clients describe the sensation as a mild prickling or warmth. Downtime varies by treatment type, from zero days for chemical peels to 2 to 3 days for RF microneedling." },
    ],
    generateContent: (cityName, county, drivingTime, distance) =>
      `${cityName} residents seeking effective scar reduction and skin renewal can access advanced scar treatments at Rani Beauty Clinic in Renton, just ${distance} away. We treat acne scars, surgical scars, traumatic scars, stretch marks, and keloid or hypertrophic scarring using a multi-modality approach that combines the most effective technologies available. Every scar treatment protocol at Rani is designed and supervised by Dr. Alexander Landfield, our board-certified Medical Director, ensuring a medically sound, results-driven approach to your scar concerns.

Scars form when the skin's natural healing process produces collagen in an irregular pattern, leaving behind raised, depressed, or discolored tissue that differs from the surrounding skin. At Rani Beauty Clinic, we address scars at the source by stimulating controlled collagen remodeling using advanced technologies. Our primary scar treatment tool is the Cutera Secret Pro RF microneedling system, which delivers radiofrequency energy through gold-plated needles into the dermis, triggering your body to replace damaged scar tissue with fresh, organized collagen. This process gradually fills in depressed acne scars, smooths raised scars, and improves overall skin texture.

For pigmented scars and post-inflammatory hyperpigmentation, we use targeted laser therapy and medical-grade chemical peels including the VI Peel and BioRePeel (PRX-T33). These treatments address the discoloration component of scarring while simultaneously improving skin texture and clarity. ${cityName} clients with a combination of textural and pigmentary scarring benefit from our layered treatment approach, where we sequence different modalities to address each aspect of the scar in the most effective order.

Your scar treatment journey at Rani begins with a thorough consultation where your provider evaluates your scar type, depth, color, location, and skin type. We create a customized treatment plan that outlines the recommended modalities, expected timeline, and realistic outcomes. Most clients see significant improvement over a series of 3 to 6 treatments spaced 4 to 6 weeks apart. Results continue to improve for months after your final treatment as collagen remodeling progresses.

Scar treatment at Rani Beauty Clinic starts at $350 per session, with pricing varying based on the treatment modality and area treated. Flexible payment options available. ${cityName} residents in ${county} can reach our clinic at 401 Olympia Ave NE, Suite 101, Renton, WA 98056 in approximately ${drivingTime}. Free parking, open seven days a week from 10 AM to 7 PM. Call (425) 539-4440 or book your scar treatment consultation online.`,
  },
  {
    slug: "skin-tightening",
    name: "Skin Tightening (Sofwave)",
    priceRange: "From $2,750",
    technology: "Sofwave SUPERB",
    category: "aesthetic",
    faqs: [
      { question: "How does Sofwave skin tightening work?", answer: "Sofwave uses SUPERB (Synchronous Ultrasound Parallel Beam) technology to deliver focused ultrasound energy at a precise depth of 1.5mm in the mid-dermis. This stimulates new collagen and elastin production, resulting in visible lifting, firming, and smoothing of the skin." },
      { question: "Is Sofwave different from Ultherapy?", answer: "Yes. Sofwave targets the mid-dermis at 1.5mm depth using parallel beam technology, while Ultherapy targets deeper tissue layers. Sofwave is generally more comfortable, has minimal downtime, and delivers consistent results for skin tightening and lifting." },
      { question: "How long do Sofwave results last?", answer: "Sofwave results develop gradually over 3 to 6 months as new collagen forms. Many clients notice initial tightening within the first few weeks. Results typically last 12 months or longer with proper skincare and sun protection." },
    ],
    generateContent: (cityName, county, drivingTime, distance) =>
      `${cityName} residents seeking non-invasive skin tightening without surgery or significant downtime can experience Sofwave at Rani Beauty Clinic in Renton, just ${distance} away. Sofwave represents the latest generation of ultrasound-based skin tightening technology, using SUPERB (Synchronous Ultrasound Parallel Beam) technology to stimulate deep collagen and elastin production for visible lifting and firming of the face, neck, and body. Every Sofwave treatment at Rani is physician-supervised by Dr. Alexander Landfield, our board-certified Medical Director.

The science behind Sofwave is precise and well-validated. The SUPERB technology delivers focused ultrasound energy at a controlled depth of 1.5mm in the mid-dermis, the exact layer where collagen remodeling produces the greatest improvement in skin firmness and elasticity. Unlike older ultrasound platforms that target deeper tissue layers and can cause significant discomfort, Sofwave's precision allows for effective treatment with minimal pain. The integrated Sofcool cooling technology protects your skin surface throughout the procedure, keeping you comfortable from start to finish.

Sofwave at Rani Beauty Clinic is ideal for ${cityName} clients who want to lift the brow area, tighten the jawline and reduce jowling, smooth neck bands and horizontal neck lines, reduce submental fullness under the chin, and improve overall skin firmness across the face and decolletage. The treatment is also FDA-cleared for reducing the appearance of cellulite and lifting the skin on the arms and above the knees. A typical Sofwave session takes 30 to 45 minutes for the full face and neck, and clients can return to their normal activities immediately afterward. Some mild redness may appear but typically resolves within a few hours.

The beauty of Sofwave is that results build naturally over time. As new collagen forms in the weeks and months following treatment, your skin progressively tightens, lifts, and firms. Many clients notice an initial improvement within the first 2 to 4 weeks, with full results visible at 3 to 6 months. The natural, gradual improvement means friends and colleagues simply notice that you look refreshed and rested, without the telltale signs of a procedure.

Sofwave skin tightening at Rani Beauty Clinic starts at $2,750 for the full face, with full face and neck treatments available at $4,500. Flexible payment options available for qualified applicants. ${cityName} residents in ${county} can reach our clinic at 401 Olympia Ave NE, Suite 101, Renton, WA 98056 in approximately ${drivingTime}. Free parking, open seven days a week from 10 AM to 7 PM. Call (425) 539-4440 or book your Sofwave consultation online.`,
  },
  {
    slug: "weight-loss-glp1",
    name: "Weight Loss (GLP-1)",
    priceRange: "From $399",
    category: "wellness",
    faqs: [
      { question: "What GLP-1 medications does Rani offer?", answer: "We prescribe both Semaglutide (the active ingredient in Wegovy and Ozempic) and Tirzepatide (the active ingredient in Mounjaro and Zepbound). Your provider will recommend the best option based on your health history, goals, and response to treatment." },
      { question: "How much weight can I expect to lose?", answer: "Clinical studies show average weight loss of 15 to 20 percent of body weight with Semaglutide and up to 22 percent with Tirzepatide when combined with lifestyle modifications. Individual results vary based on adherence, metabolism, and starting weight." },
      { question: "What is included in The Rani Protocol?", answer: "The Rani Protocol includes in-house blood work, medical screening, custom medication dosing, regular follow-up appointments, side effect management, and ongoing physician supervision. Everything is managed under one roof at our Renton clinic." },
    ],
    generateContent: (cityName, county, drivingTime, distance) =>
      `${cityName} residents ready for a physician-supervised approach to sustainable weight loss can join The Rani Protocol at Rani Beauty Clinic in Renton, just ${distance} away. The Rani Protocol is our comprehensive GLP-1 weight management program using Semaglutide and Tirzepatide, two FDA-approved medications that have helped millions of people achieve meaningful, lasting weight loss. Every aspect of your weight management journey is overseen by Dr. Alexander Landfield, our board-certified Medical Director, ensuring the highest level of medical safety and personalized care.

GLP-1 receptor agonists work by mimicking your body's natural GLP-1 hormone, which plays a critical role in appetite regulation, satiety signaling, and blood sugar control. Semaglutide (the active ingredient in Wegovy and Ozempic) and Tirzepatide (the active ingredient in Mounjaro and Zepbound) have been extensively studied in large-scale clinical trials. Semaglutide demonstrates average weight loss of 15 to 20 percent of body weight, while Tirzepatide shows even greater efficacy with average losses up to 22 percent when combined with lifestyle modifications.

What distinguishes The Rani Protocol from online prescribers and telehealth weight loss programs is our commitment to hands-on, in-person medical oversight. Your journey begins with comprehensive in-house blood work at our Renton clinic to establish your baseline metabolic markers, liver function, kidney function, thyroid levels, and other critical health indicators. Your provider then conducts a thorough medical evaluation to determine the right medication and starting dose for your body. We begin with conservative dosing and titrate gradually based on your response, tolerance, and progress, making adjustments at regular in-person follow-up appointments.

${cityName} residents appreciate having blood work, consultations, medication management, dosing adjustments, and side effect management all in one location. There is no need to coordinate with separate labs, pharmacies, or providers. The Rani Protocol is a complete, self-contained program designed for your success. Our team monitors your progress closely and provides the ongoing support and medical guidance that makes the difference between short-term weight loss and lasting transformation.

The Rani Protocol starts at $399 for Semaglutide and $599 for Tirzepatide, which includes medication, in-house blood work, custom dosing, and ongoing medical support. Flexible payment options available. ${cityName} residents in ${county} can reach our clinic at 401 Olympia Ave NE, Suite 101, Renton, WA 98056 in approximately ${drivingTime}. Free parking, open seven days a week from 10 AM to 7 PM. Call (425) 539-4440 or book your GLP-1 consultation online.`,
  },
  {
    slug: "hormone-therapy-hrt",
    name: "Hormone Therapy (HRT)",
    priceRange: "Consultation required",
    category: "wellness",
    faqs: [
      { question: "What is hormone replacement therapy?", answer: "Hormone replacement therapy (HRT) involves restoring hormones that your body no longer produces at optimal levels due to aging, menopause, or other factors. At Rani, we offer bioidentical hormone therapy that uses hormones structurally identical to those your body naturally produces." },
      { question: "Who is a candidate for hormone therapy?", answer: "Men and women experiencing symptoms of hormone imbalance including fatigue, weight gain, low libido, mood changes, hot flashes, night sweats, brain fog, and muscle loss may be candidates. Comprehensive blood work determines your hormone levels and guides treatment." },
      { question: "How is hormone therapy monitored at Rani?", answer: "Every HRT protocol at Rani includes baseline and follow-up blood work, regular physician consultations, dosage adjustments based on lab results and symptoms, and ongoing monitoring under Dr. Landfield's supervision to ensure safety and efficacy." },
    ],
    generateContent: (cityName, county, drivingTime, distance) =>
      `${cityName} residents experiencing the effects of hormonal imbalance can access physician-supervised hormone replacement therapy (HRT) at Rani Beauty Clinic in Renton, just ${distance} away. Our bioidentical hormone therapy programs address the root causes of fatigue, weight gain, low libido, mood disturbances, hot flashes, night sweats, brain fog, and muscle loss that affect both men and women as hormone levels decline with age. Every HRT protocol at Rani is prescribed, managed, and monitored under the supervision of Dr. Alexander Landfield, our board-certified Medical Director.

Hormones regulate nearly every system in the body, from metabolism and energy production to mood, sleep quality, sexual function, and cognitive clarity. As men and women age, the production of key hormones including estrogen, progesterone, testosterone, DHEA, and thyroid hormones gradually declines. This decline can produce symptoms that significantly impact quality of life, from persistent fatigue and unexplained weight gain to decreased motivation, poor sleep, and changes in body composition. Bioidentical hormone replacement therapy restores these hormones to optimal levels using compounds that are structurally identical to the hormones your body naturally produces.

Your hormone therapy journey at Rani begins with comprehensive blood work to establish a detailed picture of your current hormone levels. We test for estrogen, progesterone, testosterone (total and free), DHEA-S, thyroid panel (TSH, Free T3, Free T4), cortisol, insulin, and other markers that influence hormonal health. Your provider reviews these results alongside your symptoms, medical history, and wellness goals to create a personalized HRT protocol tailored to your body's specific needs.

At Rani Beauty Clinic, we take a measured, evidence-based approach to hormone optimization. We start conservatively and adjust dosing based on how you feel and what your follow-up blood work shows. Regular monitoring appointments ensure that your hormone levels remain in the optimal range and that any adjustments are made promptly. ${cityName} clients appreciate the thoroughness of our approach and the fact that all testing, consultations, and management happen in one clinic under one medical team.

Hormone therapy at Rani Beauty Clinic requires an initial consultation and blood work to determine your protocol. ${cityName} residents in ${county} can reach our clinic at 401 Olympia Ave NE, Suite 101, Renton, WA 98056 in approximately ${drivingTime}. Free parking, open seven days a week from 10 AM to 7 PM. Call (425) 539-4440 to schedule your hormone therapy consultation today.`,
  },
];

/**
 * Generate service-geo entries for the extended cities using ALL service templates
 * (both the original 10 + the 5 new extended services).
 */
function generateExtendedServiceGeoEntries(): ServiceGeoEntry[] {
  const entries: ServiceGeoEntry[] = [];

  // Generate entries for extended cities with the 5 new service templates
  for (const city of waCitiesExtended) {
    for (const service of extendedServiceTemplates) {
      entries.push({
        citySlug: city.slug,
        cityName: city.name,
        serviceSlug: service.slug,
        serviceName: service.name,
        slug: `${city.slug}/${service.slug}`,
        title: `Best ${service.name} Near ${city.name} - ${service.priceRange} | Rani Beauty Clinic`,
        metaDescription: `${service.name} near ${city.name}, ${city.county}. Physician-supervised at Rani Beauty Clinic — ${service.priceRange}. Just ${city.distanceFromRenton} (${city.drivingTime}). Board-certified Medical Director. Book today!`,
        content: service.generateContent(city.name, city.county, city.drivingTime, city.distanceFromRenton),
      });
    }
  }

  // Also generate entries for the original 50 PNW cities with the 5 new services
  for (const city of pnwCities) {
    for (const service of extendedServiceTemplates) {
      entries.push({
        citySlug: city.slug,
        cityName: city.name,
        serviceSlug: service.slug,
        serviceName: service.name,
        slug: `${city.slug}/${service.slug}`,
        title: `Best ${service.name} Near ${city.name} - ${service.priceRange} | Rani Beauty Clinic`,
        metaDescription: `${service.name} near ${city.name}, ${city.county}. Physician-supervised at Rani Beauty Clinic — ${service.priceRange}. Just ${city.distanceFromRenton} (${city.drivingTime}). Board-certified Medical Director. Book today!`,
        content: service.generateContent(city.name, city.county, city.drivingTime, city.distanceFromRenton),
      });
    }
  }

  return entries;
}

export const extendedServiceGeoEntries = generateExtendedServiceGeoEntries();

// Helper to get extended service-geo entries for a city
export function getExtendedServiceGeoByCity(citySlug: string): ServiceGeoEntry[] {
  return extendedServiceGeoEntries.filter((e) => e.citySlug === citySlug);
}

// Helper to get a specific extended service-geo entry
export function getExtendedServiceGeoEntry(citySlug: string, serviceSlug: string): ServiceGeoEntry | undefined {
  return extendedServiceGeoEntries.find((e) => e.citySlug === citySlug && e.serviceSlug === serviceSlug);
}
