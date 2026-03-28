import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { getPatientByName } from '@/lib/medical/glp1-pipeline';
import { getCrossSellOpportunities, getCrossSellMatrix } from '@/lib/medical/crosssell-matrix';
import { generateMessage } from '@/lib/medical/voice-engine';
import type {
  CrossSellOpportunity,
  CrossSellResult,
  PipelinePatient,
} from '@/lib/medical/types';

/**
 * POST /api/ops/crosssell
 *
 * The /crosssell command: accepts patient name, looks at current services,
 * references the medical cross-sell matrix, generates natural upsell text
 * in Rina's voice, and calculates revenue uplift.
 */

// Service catalog for cross-sell matrix
const SERVICE_CATALOG: Record<string, {
  price: number;
  type: 'one_time' | 'monthly' | 'series';
  seriesCount?: number;
  category: string;
  description: string;
}> = {
  // Wellness Injections
  vitamin_d3: { price: 50, type: 'monthly', category: 'wellness_injection', description: 'Vitamin D3 Injection - immune support + mood boost' },
  tri_immune: { price: 75, type: 'monthly', category: 'wellness_injection', description: 'Tri-Immune Injection - vitamin C, zinc, glutathione' },
  glutathione: { price: 100, type: 'monthly', category: 'wellness_injection', description: 'Glutathione Injection - master antioxidant + detox' },
  b12: { price: 35, type: 'monthly', category: 'wellness_injection', description: 'B12 Injection - energy + metabolism' },
  nad_plus: { price: 150, type: 'monthly', category: 'wellness_injection', description: 'NAD+ Injection - cellular energy + anti-aging' },
  // Aesthetic Services
  hydrafacial: { price: 275, type: 'one_time', category: 'facial', description: 'HydraFacial - deep cleansing + hydration' },
  rf_microneedling: { price: 495, type: 'series', seriesCount: 3, category: 'skin_tightening', description: 'RF Microneedling - skin renewal + tightening' },
  prx_t33: { price: 495, type: 'one_time', category: 'biorevitalization', description: 'PRX-T33 - no-needle biorevitalization' },
  vi_peel: { price: 395, type: 'one_time', category: 'peel', description: 'VI Peel - medical-grade chemical peel' },
  sofwave: { price: 2750, type: 'one_time', category: 'skin_tightening', description: 'Sofwave - non-invasive skin tightening' },
  picoway: { price: 350, type: 'series', seriesCount: 4, category: 'laser', description: 'PicoWay - laser pigment removal' },
  rx_skincare: { price: 99, type: 'monthly', category: 'skincare', description: 'Rx Skincare (Tretinoin) - prescription-strength skin renewal' },
  folix: { price: 500, type: 'series', seriesCount: 6, category: 'hair', description: 'Folix Hair Restoration - targeted hair regrowth' },
};

// Cross-sell rules: which services pair well
const CROSS_SELL_RULES: Record<string, {
  services: string[];
  reason: string;
  priority: 'high' | 'medium' | 'low';
}[]> = {
  glp1: [
    { services: ['b12'], reason: 'Energy support during weight loss - natural complement', priority: 'high' },
    { services: ['glutathione'], reason: 'Detox support during rapid fat metabolism', priority: 'high' },
    { services: ['vitamin_d3'], reason: 'Immune + mood support during body transformation', priority: 'medium' },
    { services: ['tri_immune'], reason: 'Full immune support with zinc + vitamin C + glutathione', priority: 'medium' },
    { services: ['rx_skincare'], reason: 'Skin elasticity support during weight loss', priority: 'medium' },
    { services: ['hydrafacial'], reason: 'Glow-up to match the new body - reward milestone', priority: 'low' },
    { services: ['rf_microneedling'], reason: 'Skin tightening for loose skin from weight loss', priority: 'medium' },
    { services: ['sofwave'], reason: 'Non-invasive tightening for significant weight loss', priority: 'low' },
    { services: ['nad_plus'], reason: 'Cellular energy + anti-aging during transformation', priority: 'low' },
  ],
  hydrafacial: [
    { services: ['rx_skincare'], reason: 'Maintain results between facials', priority: 'high' },
    { services: ['vi_peel'], reason: 'Deeper treatment for stubborn concerns', priority: 'medium' },
    { services: ['prx_t33'], reason: 'No-downtime biorevitalization add-on', priority: 'medium' },
  ],
  rf_microneedling: [
    { services: ['prx_t33'], reason: 'Pairs well between sessions for enhanced results', priority: 'high' },
    { services: ['rx_skincare'], reason: 'Support healing and maximize results', priority: 'high' },
  ],
};

function getAnnualValue(serviceId: string): number {
  const service = SERVICE_CATALOG[serviceId];
  if (!service) return 0;
  if (service.type === 'monthly') return service.price * 12;
  if (service.type === 'series') return service.price * (service.seriesCount || 1);
  return service.price * 4; // Quarterly for one-time services
}

function findOpportunities(
  patient: PipelinePatient,
  currentServices: string[]
): CrossSellOpportunity[] {
  const opportunities: CrossSellOpportunity[] = [];
  const currentSet = new Set(currentServices.map((s) => s.toLowerCase()));

  // Check each current service for cross-sell rules
  for (const currentService of currentServices) {
    const rules = CROSS_SELL_RULES[currentService.toLowerCase()];
    if (!rules) continue;

    for (const rule of rules) {
      for (const suggestedId of rule.services) {
        // Skip if patient already has this service
        if (currentSet.has(suggestedId)) continue;

        const service = SERVICE_CATALOG[suggestedId];
        if (!service) continue;

        // Confidence scoring
        let confidence: 'high' | 'medium' | 'low' = rule.priority;

        // Boost confidence for wellness injections with GLP-1 patients
        if (service.category === 'wellness_injection' && currentSet.has('glp1')) {
          confidence = confidence === 'low' ? 'medium' : confidence;
        }

        // Boost confidence for skin services with BMI 35+ patients (loose skin concern)
        if (
          service.category === 'skin_tightening' &&
          patient.bmi &&
          patient.bmi >= 35
        ) {
          confidence = confidence === 'low' ? 'medium' : 'high';
        }

        // Gender-based confidence adjustments
        if (
          patient.gender === 'female' &&
          ['facial', 'peel', 'skincare'].includes(service.category)
        ) {
          confidence = confidence === 'low' ? 'medium' : confidence;
        }

        opportunities.push({
          serviceId: suggestedId,
          serviceName: service.description.split(' - ')[0],
          fullDescription: service.description,
          price: service.price,
          priceType: service.type,
          annualValue: getAnnualValue(suggestedId),
          reason: rule.reason,
          confidence,
          category: service.category,
          fromService: currentService,
        });
      }
    }
  }

  // Deduplicate (same service suggested from multiple current services)
  const seen = new Set<string>();
  const deduped = opportunities.filter((op) => {
    if (seen.has(op.serviceId)) return false;
    seen.add(op.serviceId);
    return true;
  });

  // Sort: high confidence first, then by annual value
  return deduped.sort((a, b) => {
    const confOrder = { high: 0, medium: 1, low: 2 };
    if (confOrder[a.confidence] !== confOrder[b.confidence]) {
      return confOrder[a.confidence] - confOrder[b.confidence];
    }
    return b.annualValue - a.annualValue;
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!hasPermission(session.role, 'view_clients')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { patientName } = body as { patientName: string };

    if (!patientName) {
      return NextResponse.json(
        { error: 'Missing required field: patientName' },
        { status: 400 }
      );
    }

    const patient = await getPatientByName(patientName);
    if (!patient) {
      return NextResponse.json(
        { error: `Patient not found: ${patientName}` },
        { status: 404 }
      );
    }

    const currentServices = patient.services || ['glp1'];
    const opportunities = findOpportunities(patient, currentServices);

    // Generate personalized upsell messages in Rina's voice
    const messagesWithText: (CrossSellOpportunity & { upsellText: string; upsellEmail: string })[] = [];

    for (const op of opportunities.slice(0, 5)) {
      const firstName = patientName.split(' ')[0];

      const upsellText = await generateMessage('crosssell_sms', {
        patientName: firstName,
        currentService: op.fromService,
        suggestedService: op.serviceName,
        reason: op.reason,
        price: op.price,
        confidence: op.confidence,
      });

      const upsellEmail = await generateMessage('crosssell_email', {
        patientName: firstName,
        fullName: patientName,
        currentService: op.fromService,
        suggestedService: op.serviceName,
        fullDescription: op.fullDescription,
        reason: op.reason,
        price: op.price,
        confidence: op.confidence,
      });

      messagesWithText.push({
        ...op,
        upsellText,
        upsellEmail,
      });
    }

    // Calculate total revenue uplift
    const totalMonthlyUplift = messagesWithText
      .filter((m) => m.priceType === 'monthly')
      .reduce((s, m) => s + m.price, 0);

    const totalOneTimeValue = messagesWithText
      .filter((m) => m.priceType !== 'monthly')
      .reduce((s, m) => s + m.price, 0);

    const totalAnnualUplift = messagesWithText.reduce((s, m) => s + m.annualValue, 0);

    const result: CrossSellResult = {
      patient: {
        name: patientName,
        currentServices,
        stage: patient.stage,
        monthsActive: patient.monthsActive || 0,
        currentMonthlySpend: patient.monthlyValue || 499,
      },
      opportunities: messagesWithText,
      revenueUplift: {
        monthlyRecurring: totalMonthlyUplift,
        oneTimeServices: totalOneTimeValue,
        annualProjected: totalAnnualUplift,
        newMonthlyTotal: (patient.monthlyValue || 499) + totalMonthlyUplift,
      },
      topRecommendation: messagesWithText[0] || null,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('[/api/ops/crosssell] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate cross-sell recommendations', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
