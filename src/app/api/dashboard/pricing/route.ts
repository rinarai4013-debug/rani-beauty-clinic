import { NextResponse } from 'next/server';
import { analyzePricing, type PricingInput } from '@/lib/pricing/dynamic-engine';

export async function GET() {
  try {
    // In production, this would pull from Airtable transactions + services
    // For now, return a sample analysis with the pricing engine
    const sampleInput: PricingInput = {
      services: [
        { service: 'HydraFacial', category: 'Facial', basePrice: 225, cost: 56, duration: 60, popularity: 45 },
        { service: 'VI Peel', category: 'Peel', basePrice: 325, cost: 65, duration: 30, popularity: 28 },
        { service: 'RF Microneedling', category: 'Laser', basePrice: 495, cost: 99, duration: 60, popularity: 22 },
        { service: 'Botox', category: 'Injectable', basePrice: 400, cost: 120, duration: 30, popularity: 55 },
        { service: 'Laser Hair Removal', category: 'Hair Removal', basePrice: 225, cost: 34, duration: 25, popularity: 38 },
        { service: 'Sofwave', category: 'Laser', basePrice: 2750, cost: 413, duration: 45, popularity: 8 },
        { service: 'GLP-1', category: 'Wellness', basePrice: 499, cost: 200, duration: 15, popularity: 18 },
        { service: 'NAD+ Injection', category: 'Wellness', basePrice: 150, cost: 30, duration: 10, popularity: 12 },
        { service: 'B12 Injection', category: 'Wellness', basePrice: 35, cost: 5, duration: 5, popularity: 25 },
      ],
      utilization: {
        byDayOfWeek: [
          { day: 'Monday', rate: 65 },
          { day: 'Tuesday', rate: 55 },
          { day: 'Wednesday', rate: 72 },
          { day: 'Thursday', rate: 80 },
          { day: 'Friday', rate: 85 },
          { day: 'Saturday', rate: 90 },
          { day: 'Sunday', rate: 40 },
        ],
        byTimeSlot: [
          { slot: '10-11', rate: 85 },
          { slot: '11-12', rate: 80 },
          { slot: '12-13', rate: 45 },
          { slot: '13-14', rate: 50 },
          { slot: '14-15', rate: 75 },
          { slot: '15-16', rate: 82 },
          { slot: '16-17', rate: 78 },
          { slot: '17-18', rate: 35 },
        ],
        overall: 68,
      },
      transactions: [],
      memberships: {
        totalMembers: 42,
        avgMemberSpend: 680,
        avgNonMemberSpend: 385,
        churnRate: 8,
      },
      seasonality: {
        currentMonth: new Date().getMonth() + 1,
        isHolidaySeason: false,
        upcomingEvents: [],
      },
    };

    const result = analyzePricing(sampleInput);

    return NextResponse.json({
      success: true,
      data: result,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Pricing analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate pricing analysis' },
      { status: 500 }
    );
  }
}
