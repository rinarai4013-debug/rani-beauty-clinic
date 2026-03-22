import Link from "next/link";

interface RelatedLink {
  title: string;
  href: string;
  description: string;
}

const treatmentLinkMap: Record<string, RelatedLink[]> = {
  "botox-dysport": [
    { title: "Botox Aftercare Guide", href: "/aftercare/botox-aftercare", description: "Post-treatment care instructions" },
    { title: "How to Prepare for Botox", href: "/preparation/botox-preparation", description: "Pre-treatment preparation guide" },
    { title: "Botox Side Effects", href: "/side-effects/botox-side-effects", description: "What to expect after treatment" },
    { title: "Is Botox Worth It?", href: "/worth-it/is-botox-worth-it", description: "Honest assessment and cost breakdown" },
    { title: "First Time Botox", href: "/first-time/first-time-botox-what-to-expect", description: "Complete first-timer guide" },
    { title: "How Long Does Botox Last?", href: "/results-timeline/how-long-does-botox-last", description: "Results timeline and maintenance" },
    { title: "Botox Cost Guide", href: "/cost/botox-cost", description: "Pricing and value breakdown" },
  ],
  "laser-hair-removal": [
    { title: "Laser Hair Removal Aftercare", href: "/aftercare/laser-hair-removal-aftercare", description: "Post-treatment care instructions" },
    { title: "How to Prepare for Laser", href: "/preparation/laser-hair-removal-preparation", description: "Pre-treatment preparation guide" },
    { title: "Laser Side Effects", href: "/side-effects/laser-hair-removal-side-effects", description: "What to expect after treatment" },
    { title: "Is Laser Hair Removal Worth It?", href: "/worth-it/is-laser-hair-removal-worth-it", description: "Honest assessment and cost breakdown" },
    { title: "First Time Laser Hair Removal", href: "/first-time/first-time-laser-hair-removal-what-to-expect", description: "Complete first-timer guide" },
    { title: "How Long Does Laser Last?", href: "/results-timeline/how-long-does-laser-hair-removal-last", description: "Results timeline and maintenance" },
    { title: "Laser Hair Removal Cost", href: "/cost/laser-hair-removal-cost", description: "Pricing and package info" },
  ],
  "hydrafacial": [
    { title: "HydraFacial Aftercare", href: "/aftercare/hydrafacial-aftercare", description: "Post-treatment care instructions" },
    { title: "How to Prepare for HydraFacial", href: "/preparation/hydrafacial-preparation", description: "Pre-treatment preparation guide" },
    { title: "HydraFacial Side Effects", href: "/side-effects/hydrafacial-side-effects", description: "What to expect after treatment" },
    { title: "Is HydraFacial Worth It?", href: "/worth-it/is-hydrafacial-worth-it", description: "Honest assessment and cost breakdown" },
    { title: "First Time HydraFacial", href: "/first-time/first-time-hydrafacial-what-to-expect", description: "Complete first-timer guide" },
    { title: "How Long Does HydraFacial Last?", href: "/results-timeline/how-long-does-hydrafacial-last", description: "Results timeline and maintenance" },
  ],
  "rf-microneedling": [
    { title: "RF Microneedling Aftercare", href: "/aftercare/rf-microneedling-aftercare", description: "Post-treatment care instructions" },
    { title: "How to Prepare for RF Microneedling", href: "/preparation/rf-microneedling-preparation", description: "Pre-treatment preparation guide" },
    { title: "RF Microneedling Side Effects", href: "/side-effects/rf-microneedling-side-effects", description: "What to expect after treatment" },
    { title: "Is RF Microneedling Worth It?", href: "/worth-it/is-rf-microneedling-worth-it", description: "Honest assessment and cost breakdown" },
    { title: "First Time RF Microneedling", href: "/first-time/first-time-rf-microneedling-what-to-expect", description: "Complete first-timer guide" },
    { title: "How Long Does RF Microneedling Last?", href: "/results-timeline/how-long-does-rf-microneedling-last", description: "Results timeline and maintenance" },
  ],
  "dermal-fillers": [
    { title: "Dermal Fillers Aftercare", href: "/aftercare/dermal-fillers-aftercare", description: "Post-treatment care instructions" },
    { title: "How to Prepare for Fillers", href: "/preparation/dermal-fillers-preparation", description: "Pre-treatment preparation guide" },
    { title: "Filler Side Effects", href: "/side-effects/dermal-fillers-side-effects", description: "What to expect after treatment" },
    { title: "Are Fillers Worth It?", href: "/worth-it/is-dermal-fillers-worth-it", description: "Honest assessment and cost breakdown" },
    { title: "First Time Dermal Fillers", href: "/first-time/first-time-dermal-fillers-what-to-expect", description: "Complete first-timer guide" },
    { title: "How Long Do Fillers Last?", href: "/results-timeline/how-long-do-dermal-fillers-last", description: "Results timeline and maintenance" },
  ],
  "chemical-peels": [
    { title: "Chemical Peel Aftercare", href: "/aftercare/chemical-peels-aftercare", description: "Post-treatment care instructions" },
    { title: "How to Prepare for Chemical Peel", href: "/preparation/chemical-peels-preparation", description: "Pre-treatment preparation guide" },
    { title: "Chemical Peel Side Effects", href: "/side-effects/chemical-peels-side-effects", description: "What to expect after treatment" },
    { title: "Is a Chemical Peel Worth It?", href: "/worth-it/is-chemical-peel-worth-it", description: "Honest assessment and cost breakdown" },
    { title: "First Time Chemical Peel", href: "/first-time/first-time-chemical-peel-what-to-expect", description: "Complete first-timer guide" },
    { title: "How Long Does a Chemical Peel Last?", href: "/results-timeline/how-long-does-chemical-peel-last", description: "Results timeline and maintenance" },
  ],
  "glp1-weight-management": [
    { title: "GLP-1 Aftercare Guide", href: "/aftercare/glp1-aftercare", description: "Post-injection care instructions" },
    { title: "How to Prepare for GLP-1", href: "/preparation/glp1-preparation", description: "Pre-treatment preparation guide" },
    { title: "GLP-1 Side Effects", href: "/side-effects/glp1-side-effects", description: "What to expect during treatment" },
    { title: "Is GLP-1 Worth It?", href: "/worth-it/is-glp1-worth-it", description: "Honest assessment and cost breakdown" },
    { title: "First Time GLP-1", href: "/first-time/first-time-glp1-what-to-expect", description: "Complete first-timer guide" },
    { title: "How Long Does GLP-1 Take to Work?", href: "/results-timeline/how-long-does-glp1-take-to-work", description: "Results timeline and expectations" },
  ],
  "sofwave": [
    { title: "Sofwave Aftercare", href: "/aftercare/sofwave-aftercare", description: "Post-treatment care instructions" },
    { title: "How to Prepare for Sofwave", href: "/preparation/sofwave-preparation", description: "Pre-treatment preparation guide" },
    { title: "Sofwave Side Effects", href: "/side-effects/sofwave-side-effects", description: "What to expect after treatment" },
    { title: "Is Sofwave Worth It?", href: "/worth-it/is-sofwave-worth-it", description: "Honest assessment and cost breakdown" },
    { title: "First Time Sofwave", href: "/first-time/first-time-sofwave-what-to-expect", description: "Complete first-timer guide" },
    { title: "How Long Does Sofwave Last?", href: "/results-timeline/how-long-does-sofwave-last", description: "Results timeline and maintenance" },
  ],
  "biorepeel": [
    { title: "BioRePeel Side Effects", href: "/side-effects/biorepeel-side-effects", description: "What to expect after treatment" },
    { title: "Is BioRePeel Worth It?", href: "/worth-it/is-biorepeel-worth-it", description: "Honest assessment and cost breakdown" },
    { title: "First Time BioRePeel", href: "/first-time/first-time-biorepeel-what-to-expect", description: "Complete first-timer guide" },
    { title: "How Long Does BioRePeel Last?", href: "/results-timeline/how-long-does-biorepeel-last", description: "Results timeline and maintenance" },
  ],
  "nad-injections": [
    { title: "NAD+ Injection Aftercare", href: "/aftercare/nad-injections-aftercare", description: "Post-injection care instructions" },
    { title: "NAD+ Injection Side Effects", href: "/side-effects/nad-injection-side-effects", description: "What to expect after treatment" },
    { title: "First Time NAD+ Injections", href: "/first-time/first-time-biorepeel-what-to-expect", description: "Complete first-timer guide" },
  ],
  "red-light-therapy": [
    { title: "Is Red Light Therapy Worth It?", href: "/worth-it/is-red-light-therapy-worth-it", description: "Honest assessment and benefits" },
    { title: "First Time Red Light Therapy", href: "/first-time/first-time-red-light-therapy-what-to-expect", description: "Complete first-timer guide" },
    { title: "How Long Does Red Light Therapy Take?", href: "/results-timeline/how-long-does-red-light-therapy-take", description: "Results timeline and expectations" },
  ],
};

interface RelatedPagesProps {
  serviceSlug: string;
  currentPath?: string;
  maxLinks?: number;
}

export default function RelatedPages({ serviceSlug, currentPath, maxLinks = 5 }: RelatedPagesProps) {
  const links = treatmentLinkMap[serviceSlug];
  if (!links || links.length === 0) return null;

  const filtered = currentPath
    ? links.filter((link) => link.href !== currentPath)
    : links;

  const displayed = filtered.slice(0, maxLinks);

  return (
    <section className="mt-12 rounded-xl border border-rani-border bg-rani-cream/20 p-6">
      <h2 className="mb-4 font-heading text-xl font-bold text-rani-navy">
        Related Guides
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {displayed.map((link, i) => (
          <Link
            key={i}
            href={link.href}
            className="group rounded-lg border border-rani-border bg-white p-4 transition-shadow hover:shadow-md"
          >
            <p className="font-semibold text-rani-navy group-hover:text-rani-gold">
              {link.title}
            </p>
            <p className="mt-1 text-xs text-rani-muted">{link.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
