import type { BuilderState, GeneratedPackage, PlanPhase } from './types';
import type { PlanData, TreatmentPackage, LineItem } from '@/lib/treatment-plan/parser';

/**
 * Serialize builder state into a PlanData object compatible with TreatmentPlanClient.
 * This allows the plan preview modal to render exactly what the client will see.
 */
export function serializeToPlanData(state: BuilderState): PlanData {
  const allServices = [
    ...state.phases[0].services,
    ...state.phases[1].services,
    ...state.phases[2].services,
  ];

  const totalValue = allServices.reduce(
    (sum, s) => sum + s.service.price * s.quantity * s.service.sessions,
    0
  );

  // Build program plan text (structured format the parser can re-parse)
  const programPlanLines: string[] = [];
  for (const phase of state.phases) {
    if (phase.services.length === 0) continue;
    programPlanLines.push(`## Phase ${phase.id}: ${phase.label}`);
    programPlanLines.push(`Weeks ${(phase.id - 1) * 4 + 1}-${phase.id * 4}`);
    for (const svc of phase.services) {
      const line = `- ${svc.service.name}${svc.quantity > 1 ? ` (${svc.quantity}x)` : ''}`;
      programPlanLines.push(line);
      if (svc.notes) programPlanLines.push(`  Note: ${svc.notes}`);
    }
    programPlanLines.push('');
  }

  // Build cost breakdown text
  const costLines: string[] = [];
  for (const svc of allServices) {
    const sessions = svc.quantity * svc.service.sessions;
    const total = svc.service.price * sessions;
    costLines.push(
      `${svc.service.name} - ${sessions} session${sessions > 1 ? 's' : ''} × $${svc.service.price} = $${total.toLocaleString()}`
    );
  }
  costLines.push('');
  costLines.push(`Total Investment: $${totalValue.toLocaleString()}`);

  // Build timeline text
  const timelineLines: string[] = [];
  let weekCounter = 1;
  for (const phase of state.phases) {
    for (const svc of phase.services) {
      for (let i = 0; i < svc.quantity; i++) {
        timelineLines.push(`Week ${weekCounter}: ${svc.service.name}`);
        weekCounter += 2;
      }
    }
  }

  return {
    id: state.savedPlanId || 'preview',
    clientName: state.client?.name || 'Client',
    firstName: state.client?.name?.split(' ')[0] || 'Client',
    email: state.client?.email || '',
    phone: state.client?.phone || '',
    skinConcerns: state.client?.skinConcerns || [],
    targetAreas: [],
    treatmentInterests: state.client?.treatmentInterests || [],
    skinType: '',
    treatmentHistory: '',
    processingStatus: 'Processed',
    intakeSummary: `Personalized treatment plan created for ${state.client?.name || 'Client'} featuring ${allServices.length} services across ${state.phases.filter((p) => p.services.length > 0).length} phases.`,
    programPlan: programPlanLines.join('\n'),
    costBreakdown: costLines.join('\n'),
    timeline: timelineLines.join('\n'),
    suggestedNextStep: 'Book your first appointment to begin your transformation journey.',
    treatmentValue: `$${totalValue.toLocaleString()}`,
    skinHealthScore: 62,
    projectedScore: 89,
    intelligenceReady: true,
  };
}

/**
 * Convert GeneratedPackage to TreatmentPackage (parser.ts format)
 * for rendering in TreatmentPlanClient
 */
export function convertToTreatmentPackages(packages: GeneratedPackage[]): TreatmentPackage[] {
  return packages.map((pkg) => ({
    tier: pkg.tier,
    name: pkg.name,
    price: pkg.price,
    sessions: pkg.sessions,
    lineItems: pkg.lineItems.map(
      (li): LineItem => ({
        service: li.service,
        qty: li.qty,
        unitPrice: li.unitPrice,
        total: li.total,
      })
    ),
    extras: pkg.extras,
    highlight: pkg.highlighted,
    savings: pkg.discount > 0 ? `Save ${pkg.discount}%` : undefined,
    monthlyPayment: pkg.monthlyPayment12,
  }));
}

/**
 * Serialize builder state for saving to Airtable
 */
export function serializeForAirtable(state: BuilderState, packages: GeneratedPackage[]) {
  const allServices = [
    ...state.phases[0].services,
    ...state.phases[1].services,
    ...state.phases[2].services,
  ];

  const recommendedPkg = packages.find((p) => p.highlighted) || packages[0];

  return {
    'Client': state.client?.id ? [state.client.id] : undefined,
    'Client Name': state.client?.name || '',
    'Plan Name': state.planName || 'Custom Treatment Plan',
    'Plan Tier': recommendedPkg?.tier || 'Custom',
    'Plan Value': recommendedPkg?.price || 0,
    'Services Included': JSON.stringify({
      phases: state.phases.map((p) => ({
        id: p.id,
        label: p.label,
        services: p.services.map((s) => ({
          serviceId: s.serviceId,
          name: s.service.name,
          price: s.service.price,
          quantity: s.quantity,
          sessions: s.service.sessions,
          notes: s.notes,
        })),
      })),
      packages: packages.map((pkg) => ({
        tier: pkg.tier,
        name: pkg.name,
        price: pkg.price,
        originalPrice: pkg.originalPrice,
        discount: pkg.discount,
        sessions: pkg.sessions,
      })),
    }),
    'Status': 'Draft',
    'Created Date': new Date().toISOString().split('T')[0],
    ...(state.client?.intakeId && { 'Intake Record ID': state.client.intakeId }),
  };
}
