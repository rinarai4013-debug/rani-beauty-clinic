import { NextRequest, NextResponse } from 'next/server';
import { generateUpsellRecommendations, analyzeBatchUpsells } from '@/lib/revenue/upsell-engine';
import type { UpsellInput, AddOnService, MembershipPlanInfo, RetailProduct } from '@/lib/revenue/upsell-engine';

/**
 * GET /api/dashboard/revenue-optimizer/upsells?clientId=xxx
 *
 * Smart upsell/cross-sell recommendations.
 * Without clientId: batch analysis across recent clients.
 * With clientId: specific recommendations for that client.
 */

const ADD_ONS: AddOnService[] = [
  { name: 'LED Light Therapy', category: 'Add-On', price: 75, duration: 15, compatibleWith: ['HydraFacial', 'PRX-T33'], description: 'Accelerates healing and collagen production' },
  { name: 'Lip Perk', category: 'Add-On', price: 50, duration: 10, compatibleWith: ['HydraFacial'], description: 'Hydrating lip treatment' },
  { name: 'Eye Perk', category: 'Add-On', price: 50, duration: 10, compatibleWith: ['HydraFacial'], description: 'Brightening eye treatment' },
  { name: 'PRP Enhancement', category: 'Add-On', price: 200, duration: 15, compatibleWith: ['RF Microneedling'], description: 'Platelet-rich plasma for enhanced results' },
  { name: 'Growth Factor Serum', category: 'Add-On', price: 150, duration: 5, compatibleWith: ['RF Microneedling'], description: 'Professional growth factor application' },
];

const MEMBERSHIP_PLANS: MembershipPlanInfo[] = [
  { tier: 'Halo', monthlyPrice: 149, annualSavings: 298, benefits: ['Monthly credits', '10% off services'] },
  { tier: 'Glow', monthlyPrice: 249, annualSavings: 498, benefits: ['Larger credits', '15% off', 'Priority booking'] },
  { tier: 'Elite', monthlyPrice: 449, annualSavings: 898, benefits: ['Premium credits', '20% off', 'Concierge', 'Guest passes'] },
];

const PRODUCTS: RetailProduct[] = [
  { name: 'SPF 50', category: 'Sun Protection', price: 45, margin: 0.65, complementsServices: ['HydraFacial', 'VI Peel', 'PicoWay'], description: 'Medical-grade sunscreen' },
  { name: 'Vitamin C Serum', category: 'Serum', price: 85, margin: 0.60, complementsServices: ['HydraFacial', 'PRX-T33'], description: 'Brightening antioxidant serum' },
  { name: 'Retinol Serum', category: 'Serum', price: 95, margin: 0.60, complementsServices: ['Botox', 'RF Microneedling'], description: 'Anti-aging retinol formula' },
  { name: 'Hyaluronic Acid Serum', category: 'Serum', price: 65, margin: 0.65, complementsServices: ['HydraFacial'], description: 'Deep hydration booster' },
];

export async function GET(request: NextRequest) {
  try {
    const clientId = request.nextUrl.searchParams.get('clientId');

    if (clientId) {
      // Single-client analysis (would fetch from Airtable in production)
      const input: UpsellInput = {
        client: {
          id: clientId,
          name: 'Sample Client',
          totalSpend: 2500,
          visitCount: 6,
          avgTicket: 416,
          membershipStatus: undefined,
          purchaseHistory: [],
          servicesUsed: ['HydraFacial', 'Botox'],
          productsOwned: [],
          lastVisitDate: new Date(Date.now() - 30 * 86400000).toISOString(),
          preferredCategories: ['Facial', 'Injectable'],
          priceSegment: 'premium',
        },
        currentService: 'HydraFacial',
        visitContext: 'check-in',
        availableAddOns: ADD_ONS,
        membershipPlans: MEMBERSHIP_PLANS,
        productCatalog: PRODUCTS,
      };

      const result = generateUpsellRecommendations(input);
      return NextResponse.json(result);
    }

    // Batch analysis
    const result = analyzeBatchUpsells(
      [], // Would populate from Airtable clients
      ADD_ONS,
      MEMBERSHIP_PLANS,
      PRODUCTS,
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Upsell analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze upsell opportunities' }, { status: 500 });
  }
}
