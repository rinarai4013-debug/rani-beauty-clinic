import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { generatePricingIntelligence, type PricingInput, type ServicePricing, type CompetitorData, type MembershipData, type AcquisitionMetrics, type ProviderUtilization } from '@/lib/finance/pricing-intelligence';

/**
 * GET /api/dashboard/finance/pricing-intel
 * Pricing intelligence with competitor comparison, elasticity, and bundle recs.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.role, 'view_finance')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Rani's service catalog with costs
    const services: ServicePricing[] = [
      { service: 'Sofwave', category: 'Skin Tightening', currentPrice: 2750, cost: 400, avgBookingsPerMonth: 12, avgBookingsLastThreeMonths: [10, 12, 14], duration: 60, providerTime: 60 },
      { service: 'HydraFacial', category: 'Facial', currentPrice: 275, cost: 45, avgBookingsPerMonth: 40, avgBookingsLastThreeMonths: [38, 42, 40], duration: 60, providerTime: 50 },
      { service: 'PRX-T33', category: 'Peel', currentPrice: 495, cost: 80, avgBookingsPerMonth: 15, avgBookingsLastThreeMonths: [12, 15, 18], duration: 30, providerTime: 25 },
      { service: 'VI Peel', category: 'Peel', currentPrice: 395, cost: 65, avgBookingsPerMonth: 20, avgBookingsLastThreeMonths: [18, 20, 22], duration: 30, providerTime: 25 },
      { service: 'PicoWay', category: 'Laser', currentPrice: 450, cost: 60, avgBookingsPerMonth: 18, avgBookingsLastThreeMonths: [16, 18, 20], duration: 30, providerTime: 30 },
      { service: 'RF Microneedling', category: 'Laser', currentPrice: 650, cost: 120, avgBookingsPerMonth: 15, avgBookingsLastThreeMonths: [13, 15, 17], duration: 45, providerTime: 40 },
      { service: 'Botox', category: 'Injectable', currentPrice: 450, cost: 120, avgBookingsPerMonth: 35, avgBookingsLastThreeMonths: [32, 35, 38], duration: 30, providerTime: 20 },
      { service: 'Dermal Fillers', category: 'Injectable', currentPrice: 700, cost: 180, avgBookingsPerMonth: 20, avgBookingsLastThreeMonths: [18, 20, 22], duration: 45, providerTime: 35 },
      { service: 'GLP-1 Weight Loss', category: 'Wellness', currentPrice: 499, cost: 200, avgBookingsPerMonth: 25, avgBookingsLastThreeMonths: [20, 25, 30], duration: 15, providerTime: 10 },
    ];

    // Competitor data (Renton/Seattle area med spas)
    const competitors: CompetitorData[] = [
      {
        name: 'Vain Aesthetics',
        location: 'Bellevue, WA',
        distanceMiles: 12,
        services: [
          { service: 'HydraFacial', category: 'Facial', price: 299 },
          { service: 'Botox', category: 'Injectable', price: 480 },
          { service: 'RF Microneedling', category: 'Laser', price: 700 },
        ],
        rating: 4.7,
        reviewCount: 340,
        positioning: 'premium',
        lastUpdated: new Date().toISOString(),
      },
      {
        name: 'Allure Med Spa',
        location: 'Renton, WA',
        distanceMiles: 2,
        services: [
          { service: 'HydraFacial', category: 'Facial', price: 250 },
          { service: 'Botox', category: 'Injectable', price: 400 },
          { service: 'VI Peel', category: 'Peel', price: 350 },
          { service: 'PicoWay', category: 'Laser', price: 400 },
        ],
        rating: 4.5,
        reviewCount: 180,
        positioning: 'mid_range',
        lastUpdated: new Date().toISOString(),
      },
      {
        name: 'Skin by Dr. Lee',
        location: 'Seattle, WA',
        distanceMiles: 15,
        services: [
          { service: 'Sofwave', category: 'Skin Tightening', price: 3200 },
          { service: 'Botox', category: 'Injectable', price: 520 },
          { service: 'Dermal Fillers', category: 'Injectable', price: 800 },
        ],
        rating: 4.9,
        reviewCount: 520,
        positioning: 'luxury',
        lastUpdated: new Date().toISOString(),
      },
    ];

    const memberships: MembershipData[] = [
      {
        tier: 'Glow Member',
        monthlyPrice: 199,
        memberCount: 35,
        avgMonthsRetained: 8,
        perks: ['Monthly HydraFacial', '15% off all services', 'Priority booking'],
        includedServices: [{ service: 'HydraFacial', quantity: 1 }],
        avgAdditionalSpend: 150,
      },
      {
        tier: 'VIP Elite',
        monthlyPrice: 399,
        memberCount: 12,
        avgMonthsRetained: 14,
        perks: ['Monthly facial + peel', '20% off injectables', 'Complimentary consultations', 'Early access to new treatments'],
        includedServices: [{ service: 'HydraFacial', quantity: 1 }, { service: 'VI Peel', quantity: 1 }],
        avgAdditionalSpend: 350,
      },
    ];

    const clientAcquisition: AcquisitionMetrics = {
      avgCostPerLead: 35,
      avgCostPerBooking: 85,
      avgCostPerClient: 120,
      conversionRate: 0.18,
      channelCosts: [
        { channel: 'Meta Ads', spend: 3000, clients: 9, revenue: 4500 },
        { channel: 'Google Ads', spend: 2000, clients: 8, revenue: 4800 },
        { channel: 'Referrals', spend: 200, clients: 5, revenue: 3500 },
        { channel: 'Instagram Organic', spend: 500, clients: 3, revenue: 1200 },
      ],
    };

    const providerUtilization: ProviderUtilization[] = [
      { provider: 'Dr. Rina', availableHours: 140, bookedHours: 112, utilizationRate: 0.80, avgRevenuePerHour: 320 },
      { provider: 'Mom', availableHours: 120, bookedHours: 90, utilizationRate: 0.75, avgRevenuePerHour: 280 },
    ];

    const input: PricingInput = {
      services,
      competitors,
      memberships,
      clientAcquisition,
      providerUtilization,
    };

    const result = generatePricingIntelligence(input);

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error('Pricing intelligence API error:', err);
    return NextResponse.json({ error: 'Failed to generate pricing intelligence' }, { status: 500 });
  }
}
