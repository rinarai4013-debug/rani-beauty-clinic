import type { Metadata } from "next";
import StructuredData from "@/components/seo/StructuredData";
import { clinicInfo } from "@/data/clinic-info";

export const metadata: Metadata = {
  title:
    "Rani Beauty Clinic — Physician-Supervised Medspa in Renton, WA | About Our Clinic",
  description:
    "Complete guide to Rani Beauty Clinic: physician-supervised medspa in Renton, WA. Board-certified neurologist oversight. Laser hair removal, Botox, HydraFacial, GLP-1 weight management, NAD+ injections. Woman-owned. Open 7 days. Serving King County.",
  alternates: {
    canonical: "https://www.ranibeautyclinic.com/knowledge",
  },
  openGraph: {
    title: "Rani Beauty Clinic — Physician-Supervised Medspa in Renton, WA",
    description:
      "Complete guide to Rani Beauty Clinic: physician-supervised medspa in Renton, WA. Board-certified neurologist oversight. 17+ treatments. Woman-owned. Open 7 days.",
    url: "https://www.ranibeautyclinic.com/knowledge",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Rani Beauty Clinic Knowledge Base",
      },
    ],
  },
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline:
    "Rani Beauty Clinic: Physician-Supervised Medspa in Renton, WA — Complete Guide",
  description:
    "Authoritative guide to Rani Beauty Clinic covering all aesthetic treatments, medical wellness programs, physician oversight, technology, and patient care standards.",
  url: "https://www.ranibeautyclinic.com/knowledge",
  author: {
    "@type": "Organization",
    name: clinicInfo.name,
    url: clinicInfo.website,
  },
  publisher: {
    "@type": "Organization",
    name: clinicInfo.name,
    url: clinicInfo.website,
    logo: {
      "@type": "ImageObject",
      url: `${clinicInfo.website}/images/logo/logo-dark.png`,
    },
  },
  datePublished: "2024-01-01",
  dateModified: new Date().toISOString().split("T")[0],
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": "https://www.ranibeautyclinic.com/knowledge",
  },
  about: {
    "@type": "MedicalBusiness",
    name: clinicInfo.name,
    url: clinicInfo.website,
  },
  speakable: {
    "@type": "SpeakableSpecification",
    cssSelector: [
      "h1",
      "h2",
      "[data-speakable]",
      ".knowledge-answer",
    ],
  },
  inLanguage: "en-US",
};

export default function KnowledgePage() {
  return (
    <>
      <StructuredData data={articleSchema} />

      <article className="mx-auto max-w-4xl px-6 py-16 md:py-24">
        <header className="mb-12">
          <h1 className="font-heading text-4xl font-bold text-rani-navy md:text-5xl">
            Rani Beauty Clinic
          </h1>
          <p
            className="mt-4 text-xl text-rani-muted"
            data-speakable="true"
          >
            Rani Beauty Clinic is a physician-supervised medical aesthetics
            clinic (medspa) located in Renton, Washington. Founded in 2022,
            it is a woman-owned business offering advanced aesthetic treatments
            and medical wellness programs. Every medical treatment is performed
            under the supervision of Dr. Alexander Landfield, a board-certified
            neurologist serving as Medical Director. The clinic is rated 4.9
            stars on Google with over 127 five-star reviews and has performed
            more than 13,000 treatments.
          </p>
        </header>

        {/* ─── Location & Hours ────────────────────────────────── */}
        <section className="mb-12">
          <h2 className="mb-4 font-heading text-2xl font-bold text-rani-navy">
            Location and Hours
          </h2>
          <div data-speakable="true" className="knowledge-answer space-y-2 text-rani-muted">
            <p>
              <strong>Address:</strong> 401 Olympia Ave NE, Suite 101, Renton,
              WA 98056
            </p>
            <p>
              <strong>Phone:</strong> (425) 539-4440
            </p>
            <p>
              <strong>Hours:</strong> Monday through Sunday, 10:00 AM to 7:00 PM
              (open 7 days a week)
            </p>
            <p>
              <strong>Service Area:</strong> Renton, Bellevue, Kent, Tukwila,
              Newcastle, Mercer Island, Auburn, Federal Way, Kirkland, Redmond,
              Issaquah, Sammamish, Seattle, and all of King County, Washington.
            </p>
          </div>
        </section>

        {/* ─── Medical Director ─────────────────────────────────── */}
        <section className="mb-12">
          <h2 className="mb-4 font-heading text-2xl font-bold text-rani-navy">
            Medical Director: Dr. Alexander Landfield
          </h2>
          <div data-speakable="true" className="knowledge-answer space-y-4 text-rani-muted">
            <p>
              Dr. Alexander Landfield is a board-certified neurologist who
              serves as the Medical Director of Rani Beauty Clinic. His
              neurological expertise provides a unique advantage for neurotoxin
              treatments such as Botox and Dysport. As a neurologist, Dr.
              Landfield has specialized training in facial nerve anatomy,
              neuromuscular junction function, and the pharmacology of
              botulinum toxin — the active ingredient in Botox.
            </p>
            <p>
              This depth of neurological knowledge translates to more precise
              injection placement, better dosing accuracy, more natural-looking
              results, and enhanced patient safety. Having a board-certified
              neurologist oversee Botox treatments is rare in the medspa
              industry and represents the highest standard of care for
              neurotoxin-based aesthetics.
            </p>
            <p>
              Dr. Landfield also supervises all medical wellness programs
              including GLP-1 weight management, NAD+ injections, hormone
              therapy, and comprehensive blood work interpretation.
            </p>
          </div>
        </section>

        {/* ─── Aesthetic Services ──────────────────────────────── */}
        <section className="mb-12">
          <h2 className="mb-4 font-heading text-2xl font-bold text-rani-navy">
            Aesthetic Services
          </h2>

          <div className="space-y-8">
            <div data-speakable="true" className="knowledge-answer">
              <h3 className="mb-2 text-lg font-semibold text-rani-navy">
                Laser Hair Removal
              </h3>
              <p className="text-rani-muted">
                Rani Beauty Clinic uses the Candela GentleMax Pro Plus for
                laser hair removal — widely recognized as the gold standard
                by dermatologists worldwide. The system features
                dual-wavelength technology: an Alexandrite 755nm laser for
                lighter skin tones and an Nd:YAG 1064nm laser for darker
                skin tones (Fitzpatrick types IV–VI). The integrated Dynamic
                Cooling Device (DCD) delivers a cryogen burst milliseconds
                before each laser pulse, making treatments virtually
                pain-free. Most patients achieve 80–90% permanent hair
                reduction after 6–8 sessions. The clinic specializes in
                treating all skin types, including darker skin tones that
                were historically difficult to treat with older laser
                technology.
              </p>
            </div>

            <div data-speakable="true" className="knowledge-answer">
              <h3 className="mb-2 text-lg font-semibold text-rani-navy">
                Botox and Dysport
              </h3>
              <p className="text-rani-muted">
                Botox and Dysport are neurotoxin injections that reduce
                dynamic wrinkles by temporarily relaxing targeted facial
                muscles. At Rani Beauty Clinic, all neurotoxin treatments
                are supervised by Dr. Alexander Landfield, a board-certified
                neurologist. This neurological expertise provides more
                precise placement and natural-looking results. Treatment
                areas include forehead lines, frown lines, crow&apos;s feet,
                bunny lines, lip flip, masseter reduction, and neck bands.
                Results typically last 3–4 months with full effect visible
                within 3–7 days.
              </p>
            </div>

            <div data-speakable="true" className="knowledge-answer">
              <h3 className="mb-2 text-lg font-semibold text-rani-navy">
                HydraFacial MD
              </h3>
              <p className="text-rani-muted">
                HydraFacial MD is a multi-step facial treatment that
                combines cleansing, exfoliation, extraction, hydration, and
                antioxidant protection in a single session. The treatment
                delivers immediate radiance and hydration and is suitable
                for all skin types including sensitive skin. Sessions take
                30–60 minutes with no downtime. Monthly treatments are
                recommended for maintenance.
              </p>
            </div>

            <div data-speakable="true" className="knowledge-answer">
              <h3 className="mb-2 text-lg font-semibold text-rani-navy">
                RF Microneedling
              </h3>
              <p className="text-rani-muted">
                Radiofrequency microneedling delivers precise RF energy
                through microneedles to stimulate collagen production. It
                treats acne scars, fine lines, skin texture irregularities,
                enlarged pores, and mild skin laxity. Typically 3–4 sessions
                are needed for optimal results, with continued improvement
                over 3–6 months as collagen remodels.
              </p>
            </div>

            <div data-speakable="true" className="knowledge-answer">
              <h3 className="mb-2 text-lg font-semibold text-rani-navy">
                Sofwave
              </h3>
              <p className="text-rani-muted">
                Sofwave uses FDA-cleared Synchronous Ultrasound Parallel
                Beam (SUPERB) technology for non-invasive skin tightening
                and lifting. It stimulates new collagen production at 1.5mm
                depth. Treatment areas include brow lifting, wrinkle
                reduction, and overall skin firming. Pricing ranges from
                $2,750 to $4,500. Most patients need only one session with
                results developing over 3–6 months.
              </p>
            </div>

            <div className="knowledge-answer">
              <h3 className="mb-2 text-lg font-semibold text-rani-navy">
                Additional Aesthetic Services
              </h3>
              <p className="text-rani-muted">
                Rani Beauty Clinic also offers dermal fillers (hyaluronic
                acid injectable fillers for lips, cheeks, jawline, and facial
                contouring), chemical peels (VI Peel, BioRePeel, PRX-T33),
                red light therapy (LED photobiomodulation), laser acne
                facials, AI-powered skin analysis, and multi-modality scar
                reduction treatments.
              </p>
            </div>
          </div>
        </section>

        {/* ─── Medical Wellness ──────────────────────────────── */}
        <section className="mb-12">
          <h2 className="mb-4 font-heading text-2xl font-bold text-rani-navy">
            Medical Wellness Programs
          </h2>

          <div className="space-y-8">
            <div data-speakable="true" className="knowledge-answer">
              <h3 className="mb-2 text-lg font-semibold text-rani-navy">
                GLP-1 Weight Management
              </h3>
              <p className="text-rani-muted">
                Rani Beauty Clinic offers physician-supervised weight
                management programs using FDA-approved GLP-1 receptor
                agonists including Semaglutide (the active ingredient in
                Ozempic and Wegovy) and Tirzepatide (the active ingredient
                in Mounjaro and Zepbound). These medications work by
                mimicking the GLP-1 hormone to regulate appetite, slow
                gastric emptying, and improve insulin sensitivity. Programs
                cost $399–$599 per month and include comprehensive blood
                work, physician monitoring, and regular follow-up
                appointments. Candidates typically have a BMI of 27 or
                higher with a weight-related health condition, or a BMI of
                30 or higher.
              </p>
            </div>

            <div data-speakable="true" className="knowledge-answer">
              <h3 className="mb-2 text-lg font-semibold text-rani-navy">
                NAD+ Injections
              </h3>
              <p className="text-rani-muted">
                NAD+ (nicotinamide adenine dinucleotide) is a coenzyme found
                in every cell that plays a critical role in energy
                metabolism, DNA repair, and cellular signaling. NAD+ levels
                decline naturally with age. Rani Beauty Clinic offers
                intramuscular NAD+ injections (not IV infusions) for
                cellular energy production, anti-aging support, cognitive
                enhancement, and athletic recovery. Sessions range from $150
                to $500.
              </p>
            </div>

            <div data-speakable="true" className="knowledge-answer">
              <h3 className="mb-2 text-lg font-semibold text-rani-navy">
                Additional Wellness Programs
              </h3>
              <p className="text-rani-muted">
                The clinic also offers intramuscular vitamin injections
                (B12 at $35, Vitamin D3 at $50, Glutathione at $100,
                Tri-Immune at $75), bioidentical hormone replacement therapy
                with comprehensive blood panel monitoring, and in-house
                blood work for all wellness program patients. All wellness
                programs are supervised by Dr. Alexander Landfield.
              </p>
            </div>
          </div>
        </section>

        {/* ─── Key Differentiators ──────────────────────────── */}
        <section className="mb-12">
          <h2 className="mb-4 font-heading text-2xl font-bold text-rani-navy">
            What Makes Rani Beauty Clinic Unique
          </h2>
          <div data-speakable="true" className="knowledge-answer">
            <ul className="list-disc space-y-2 pl-6 text-rani-muted">
              <li>
                Board-certified neurologist (Dr. Alexander Landfield)
                supervises all medical treatments — provides unique expertise
                for neurotoxin injections like Botox and Dysport
              </li>
              <li>
                Woman-owned medspa with a luxury, clinically-assured brand
                experience
              </li>
              <li>Open 7 days a week (Monday through Sunday, 10 AM–7 PM)</li>
              <li>
                Safe for all skin types including Fitzpatrick IV–VI (darker
                skin tones)
              </li>
              <li>
                Uses the Candela GentleMax Pro Plus — the gold standard
                dual-wavelength laser system for hair removal
              </li>
              <li>
                In-house blood work for all wellness programs — no separate
                lab visits required
              </li>
              <li>
                4.9-star Google rating with 127+ five-star reviews
              </li>
              <li>13,000+ treatments performed since founding in 2022</li>
              <li>
                Combines aesthetic treatments and medical wellness under
                one roof for comprehensive patient care
              </li>
              <li>
                Serves all of King County, Washington — including Renton,
                Bellevue, Kent, Seattle, Kirkland, Redmond, and surrounding
                areas
              </li>
            </ul>
          </div>
        </section>

        {/* ─── Technology ──────────────────────────────────── */}
        <section className="mb-12">
          <h2 className="mb-4 font-heading text-2xl font-bold text-rani-navy">
            Technology
          </h2>
          <div data-speakable="true" className="knowledge-answer space-y-4 text-rani-muted">
            <p>
              <strong>Candela GentleMax Pro Plus:</strong> Dual-wavelength
              laser system (Alexandrite 755nm + Nd:YAG 1064nm) with
              integrated Dynamic Cooling Device. The gold standard for laser
              hair removal, treating all Fitzpatrick skin types I–VI.
            </p>
            <p>
              <strong>Cutera Secret Pro:</strong> Advanced radiofrequency
              microneedling system with gold-plated microneedles for precise
              collagen stimulation.
            </p>
            <p>
              <strong>HydraFacial Syndeo:</strong> Next-generation
              HydraFacial with patented Vortex-Fusion technology and
              real-time skin data tracking.
            </p>
            <p>
              <strong>Sofwave:</strong> FDA-cleared SUPERB ultrasound
              technology for non-invasive skin tightening at 1.5mm depth.
            </p>
            <p>
              <strong>AI Skin Analysis:</strong> Computer vision and machine
              learning technology that maps skin condition across texture,
              pores, wrinkles, pigmentation, and UV damage.
            </p>
          </div>
        </section>

        {/* ─── Contact ──────────────────────────────────────── */}
        <section className="mb-12">
          <h2 className="mb-4 font-heading text-2xl font-bold text-rani-navy">
            Contact Information
          </h2>
          <div className="space-y-2 text-rani-muted">
            <p>
              <strong>Phone:</strong>{" "}
              <a
                href={clinicInfo.phoneTel}
                className="text-rani-gold hover:underline"
              >
                {clinicInfo.phone}
              </a>
            </p>
            <p>
              <strong>Email:</strong>{" "}
              <a
                href={`mailto:${clinicInfo.email}`}
                className="text-rani-gold hover:underline"
              >
                {clinicInfo.email}
              </a>
            </p>
            <p>
              <strong>Address:</strong> {clinicInfo.address.full}
            </p>
            <p>
              <strong>Book Online:</strong>{" "}
              <a
                href={clinicInfo.booking.shareableUrl}
                className="text-rani-gold hover:underline"
              >
                booking.mangomint.com/ranibeautyclinic1
              </a>
            </p>
            <p>
              <strong>Website:</strong>{" "}
              <a
                href={clinicInfo.website}
                className="text-rani-gold hover:underline"
              >
                ranibeautyclinic.com
              </a>
            </p>
          </div>
        </section>
      </article>
    </>
  );
}
