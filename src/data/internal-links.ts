/**
 * Internal Linking Mesh
 * Reverse-lookup maps that connect services ↔ concerns ↔ comparisons ↔ cost pages.
 * Used by ServicePageTemplate, CostPage, and ConcernPage for cross-linking.
 */

import { skinConcerns } from "@/data/skin-concerns";
import { comparisonPages } from "@/data/comparisons";

/** Maps a service slug → concern slugs that recommend it */
export function getConcernsForService(serviceSlug: string): { slug: string; title: string }[] {
  return skinConcerns
    .filter((c) => c.treatments.some((t) => t.slug === serviceSlug))
    .map((c) => ({ slug: c.slug, title: c.title }));
}

/** Maps a service slug → comparison page slugs that feature it */
export function getComparisonsForService(serviceSlug: string): { slug: string; treatmentA: string; treatmentB: string }[] {
  return comparisonPages
    .filter((cp) => {
      const a = cp.relatedServiceA || "";
      const b = cp.relatedServiceB || "";
      return a.endsWith(`/${serviceSlug}`) || b.endsWith(`/${serviceSlug}`);
    })
    .map((cp) => ({ slug: cp.slug, treatmentA: cp.treatmentA, treatmentB: cp.treatmentB }));
}

/** Reverse map: cost page slug → service slug */
const COST_TO_SERVICE: Record<string, { slug: string; basePath: string }> = {
  "laser-hair-removal-cost": { slug: "laser-hair-removal", basePath: "/services" },
  "hydrafacial-cost": { slug: "hydrafacial", basePath: "/services" },
  "rf-microneedling-cost": { slug: "rf-microneedling", basePath: "/services" },
  "botox-cost": { slug: "botox-dysport", basePath: "/services" },
  "dermal-fillers-cost": { slug: "dermal-fillers", basePath: "/services" },
  "chemical-peels-cost": { slug: "chemical-peels", basePath: "/services" },
  "biorepeel-cost": { slug: "biorepeel", basePath: "/services" },
  "sofwave-cost": { slug: "sofwave", basePath: "/services" },
  "scar-reduction-cost": { slug: "scar-reduction", basePath: "/services" },
  "glp1-cost": { slug: "glp1-weight-management", basePath: "/wellness" },
  "peptide-therapy-cost": { slug: "nad-injections", basePath: "/wellness" },
  "nad-injections-cost": { slug: "nad-injections", basePath: "/wellness" },
  "hormone-therapy-cost": { slug: "hormone-therapy", basePath: "/wellness" },
  "vitamin-injections-cost": { slug: "vitamin-injections", basePath: "/wellness" },
  "blood-work-cost": { slug: "blood-work", basePath: "/wellness" },
};

export function getServiceForCostPage(costSlug: string): { slug: string; basePath: string } | null {
  return COST_TO_SERVICE[costSlug] || null;
}

/** Maps a service slug → cost page slug */
const SERVICE_TO_COST: Record<string, string> = {};
for (const [costSlug, { slug }] of Object.entries(COST_TO_SERVICE)) {
  SERVICE_TO_COST[slug] = costSlug;
}

export function getCostSlugForService(serviceSlug: string): string | null {
  return SERVICE_TO_COST[serviceSlug] || null;
}
