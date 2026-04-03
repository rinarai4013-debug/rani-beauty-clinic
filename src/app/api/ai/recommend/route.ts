import { NextResponse } from 'next/server';
import { z } from 'zod';
import { recommendTreatmentPlan } from '@/lib/plan-builder/ai-recommender';
import type { ClientProfile } from '@/lib/plan-builder/ai-recommender';
import { generatePackages } from '@/lib/plan-builder/package-generator';
import type { PlanPhase, SelectedService } from '@/lib/plan-builder/types';
import { PHASE_LABELS } from '@/lib/plan-builder/types';
import { rateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';

// ─── Zod schema for request validation ───────────────────────────────

const ClientProfileSchema = z.object({
  skinConcerns: z.array(z.string()).min(1, 'At least one skin concern is required'),
  treatmentInterests: z.array(z.string()).default([]),
  fitzpatrickType: z.union([
    z.literal(1), z.literal(2), z.literal(3),
    z.literal(4), z.literal(5), z.literal(6),
  ]).optional(),
  downtimeTolerance: z.enum(['none', 'minimal', 'moderate', 'flexible']).optional(),
  budgetBand: z.enum(['value', 'mid', 'premium']).optional(),
  urgency: z.enum(['relaxed', 'moderate', 'event-driven']).optional(),
  painTolerance: z.enum(['low', 'medium', 'high']).optional(),
  maintenanceWillingness: z.enum(['low', 'medium', 'high']).optional(),
  previousTreatments: z.array(z.string()).optional(),
  seasonality: z.enum(['summer', 'fall', 'winter', 'spring']).optional(),
  contraindications: z.array(z.string()).optional(),
});

// ─── POST handler ────────────────────────────────────────────────────

export async function POST(request: Request) {
  // Rate limit: 10 requests per minute per IP
  const ip = getClientIP(request);
  const { allowed, resetIn } = rateLimit('ai-recommend', ip, RATE_LIMITS.AI);
  if (!allowed) {
    return rateLimitResponse(resetIn);
  }

  try {
    const body = await request.json();
    const parsed = ClientProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const profile: ClientProfile = parsed.data;

    // 1. Run recommendation engine
    const recommendations = recommendTreatmentPlan(profile);

    if (recommendations.length === 0) {
      return NextResponse.json({
        recommendations: [],
        packages: [],
        providerNotes: 'No matching treatments found for the given concerns. A consultation is recommended.',
        contraindications: profile.contraindications ?? [],
      });
    }

    // 2. Convert RecommendedService[] → PlanPhase tuple for the package generator
    const phases: [PlanPhase, PlanPhase, PlanPhase] = [
      { id: 1, label: PHASE_LABELS[1].label, description: PHASE_LABELS[1].description, services: [] },
      { id: 2, label: PHASE_LABELS[2].label, description: PHASE_LABELS[2].description, services: [] },
      { id: 3, label: PHASE_LABELS[3].label, description: PHASE_LABELS[3].description, services: [] },
    ];

    for (const rec of recommendations) {
      const selected: SelectedService = {
        id: `rec-${rec.service.id}-p${rec.phase}`,
        serviceId: rec.service.id,
        service: rec.service,
        quantity: 1,
        notes: rec.reason,
        phase: rec.phase,
      };
      phases[rec.phase - 1].services.push(selected);
    }

    // 3. Generate tiered packages (Start / Transform / Elite)
    const packages = generatePackages(phases);

    // 4. Build provider notes
    const quickWin = recommendations.find((r) => r.quickWin);
    const anchor = recommendations.find((r) => r.anchorTreatment);
    const providerNotes = buildProviderNotes(profile, quickWin, anchor);

    // 5. Build contraindication warnings
    const contraindictionWarnings = buildContraindicationWarnings(profile.contraindications);

    return NextResponse.json({
      recommendations: recommendations.map((rec) => ({
        serviceId: rec.service.id,
        serviceName: rec.service.name,
        category: rec.service.category,
        price: rec.service.price,
        sessions: rec.service.sessions,
        phase: rec.phase,
        reason: rec.reason,
        fitScore: rec.fitScore,
        quickWin: rec.quickWin ?? false,
        anchorTreatment: rec.anchorTreatment ?? false,
        whyThisPhase: rec.whyThisPhase,
      })),
      packages: packages.map((pkg) => ({
        tier: pkg.tier,
        name: pkg.name,
        subtitle: pkg.subtitle,
        price: pkg.price,
        originalPrice: pkg.originalPrice,
        discount: pkg.discount,
        sessions: pkg.sessions,
        lineItems: pkg.lineItems,
        monthlyPayment12: pkg.monthlyPayment12,
        monthlyPayment24: pkg.monthlyPayment24,
        highlighted: pkg.highlighted,
        extras: pkg.extras,
        bestFor: pkg.bestFor,
        resultIntensity: pkg.resultIntensity,
        whyBest: pkg.whyBest,
        savingsVsStandalone: pkg.savingsVsStandalone,
        concernsAddressed: pkg.concernsAddressed,
      })),
      providerNotes,
      contraindications: contraindictionWarnings,
    });
  } catch (err) {
    // Handle malformed JSON
    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 },
      );
    }

    console.error('[ai/recommend] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// ─── Provider notes builder ──────────────────────────────────────────

function buildProviderNotes(
  profile: ClientProfile,
  quickWin: ReturnType<typeof recommendTreatmentPlan>[number] | undefined,
  anchor: ReturnType<typeof recommendTreatmentPlan>[number] | undefined,
): string {
  const notes: string[] = [];

  if (quickWin) {
    notes.push(`Quick win: Start with ${quickWin.service.name} for immediate visible results.`);
  }

  if (anchor) {
    notes.push(`Anchor treatment: ${anchor.service.name} is the structural centerpiece of this plan.`);
  }

  if (profile.fitzpatrickType && profile.fitzpatrickType >= 4) {
    notes.push('Fitzpatrick IV-VI: Favor RF and chemical peels over aggressive laser. Perform test patches.');
  }

  if (profile.downtimeTolerance === 'none') {
    notes.push('Client prefers zero downtime — prioritize non-invasive options and set expectations accordingly.');
  }

  if (profile.urgency === 'event-driven') {
    notes.push('Event-driven timeline — focus on treatments with fastest visible results.');
  }

  if (profile.painTolerance === 'low') {
    notes.push('Low pain tolerance — discuss numbing options and start with gentler treatments.');
  }

  if (profile.budgetBand === 'value') {
    notes.push('Budget-conscious — emphasize the Start package and financing options.');
  } else if (profile.budgetBand === 'premium') {
    notes.push('Premium budget — lead with the Transform or Elite package for best results.');
  }

  if (profile.seasonality === 'summer') {
    notes.push('Summer season — avoid aggressive lasers and deep peels. Prioritize hydration and RF.');
  }

  if (notes.length === 0) {
    notes.push('Standard consultation approach. Review the recommended phases with the client and adjust based on their feedback.');
  }

  return notes.join(' ');
}

// ─── Contraindication warnings ───────────────────────────────────────

function buildContraindicationWarnings(contraindications?: string[]): string[] {
  if (!contraindications || contraindications.length === 0) return [];

  const warnings: Record<string, string> = {
    'pregnancy': 'Pregnant clients: Injectables, retinoids, and certain chemical peels are excluded from this plan.',
    'blood-thinners': 'On blood thinners: Injectables and RF microneedling excluded. Verify with prescribing physician before proceeding.',
    'retinoid-use': 'Active retinoid use: VI Peel and certain laser treatments excluded. Pause retinoids per protocol before reconsidering.',
    'active-infection': 'Active infection noted: RF microneedling and injectables excluded until resolved.',
    'keloid-prone': 'Keloid-prone skin: RF microneedling and scar combination treatments excluded.',
    'autoimmune': 'Autoimmune condition: Injectables excluded. Medical clearance recommended before energy-based devices.',
  };

  return contraindications
    .map((c) => warnings[c.toLowerCase().trim()])
    .filter((w): w is string => !!w);
}
