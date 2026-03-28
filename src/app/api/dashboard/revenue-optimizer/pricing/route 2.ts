import { NextResponse } from 'next/server';
import { optimizePricing } from '@/lib/revenue/pricing-optimizer';
import type { PricingOptimizerInput } from '@/lib/revenue/pricing-optimizer';

/**
 * GET /api/dashboard/revenue-optimizer/pricing
 *
 * Dynamic pricing optimization: time-of-day tiers, margin analysis,
 * competitive positioning, bundle optimization, and pricing health.
 */

export async function GET() {
  try {
    const input: PricingOptimizerInput = {
      services: [
        { name: 'Sofwave', category: 'Skin Tightening', currentPrice: 3500, costPerSession: 400, duration: 60, bookingsLast30: 4, bookingsLast60: 7, avgDiscount: 0, cancelRate: 0.05 },
        { name: 'RF Microneedling', category: 'Skin Renewal', currentPrice: 650, costPerSession: 80, duration: 60, bookingsLast30: 12, bookingsLast60: 14, avgDiscount: 0.02, cancelRate: 0.08 },
        { name: 'Botox', category: 'Injectable', currentPrice: 350, costPerSession: 60, duration: 30, bookingsLast30: 25, bookingsLast60: 28, avgDiscount: 0, cancelRate: 0.06 },
        { name: 'Fillers', category: 'Injectable', currentPrice: 650, costPerSession: 120, duration: 45, bookingsLast30: 10, bookingsLast60: 12, avgDiscount: 0, cancelRate: 0.04 },
        { name: 'HydraFacial', category: 'Facial', currentPrice: 275, costPerSession: 45, duration: 60, bookingsLast30: 30, bookingsLast60: 38, avgDiscount: 0.05, cancelRate: 0.10 },
        { name: 'VI Peel', category: 'Facial', currentPrice: 395, costPerSession: 55, duration: 45, bookingsLast30: 8, bookingsLast60: 10, avgDiscount: 0.03, cancelRate: 0.07 },
        { name: 'PRX-T33', category: 'Facial', currentPrice: 495, costPerSession: 70, duration: 30, bookingsLast30: 6, bookingsLast60: 8, avgDiscount: 0, cancelRate: 0.05 },
        { name: 'PicoWay', category: 'Laser', currentPrice: 475, costPerSession: 60, duration: 30, bookingsLast30: 7, bookingsLast60: 9, avgDiscount: 0.02, cancelRate: 0.06 },
        { name: 'Laser Hair Removal', category: 'Laser', currentPrice: 200, costPerSession: 25, duration: 30, bookingsLast30: 15, bookingsLast60: 18, avgDiscount: 0.08, cancelRate: 0.12 },
        { name: 'GLP-1', category: 'Wellness', currentPrice: 499, costPerSession: 200, duration: 15, bookingsLast30: 8, bookingsLast60: 5, avgDiscount: 0, cancelRate: 0.03 },
      ],
      demandPatterns: generateDemandPatterns(),
      transactions: [],
      competitorData: [
        { competitor: 'Skincare MedSpa', service: 'Botox', price: 320, lastUpdated: '2026-03-20' },
        { competitor: 'Glow Aesthetics', service: 'Botox', price: 375, lastUpdated: '2026-03-20' },
        { competitor: 'Skincare MedSpa', service: 'HydraFacial', price: 250, lastUpdated: '2026-03-20' },
        { competitor: 'Glow Aesthetics', service: 'HydraFacial', price: 295, lastUpdated: '2026-03-20' },
        { competitor: 'Skincare MedSpa', service: 'Fillers', price: 600, lastUpdated: '2026-03-20' },
        { competitor: 'Glow Aesthetics', service: 'Fillers', price: 700, lastUpdated: '2026-03-20' },
      ],
      membershipStats: {
        totalMembers: 45,
        avgMemberSpend: 420,
        avgNonMemberSpend: 310,
        memberRetention12Mo: 0.82,
      },
      costStructure: {
        avgOverheadPerHour: 85,
        targetMargin: 0.55,
        avgProviderCostPerHour: 75,
      },
      currentDate: new Date().toISOString().split('T')[0],
    };

    const result = optimizePricing(input);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Pricing optimizer error:', error);
    return NextResponse.json({ error: 'Failed to optimize pricing' }, { status: 500 });
  }
}

function generateDemandPatterns() {
  const patterns = [];
  for (let dow = 1; dow <= 6; dow++) {
    for (let hour = 9; hour <= 17; hour++) {
      const isPeak = hour >= 10 && hour <= 14;
      const isWeekday = dow <= 5;
      patterns.push({
        dayOfWeek: dow,
        hour,
        avgBookings: isPeak && isWeekday ? 3 : isWeekday ? 1.5 : 1,
        maxCapacity: 4,
        avgRevenue: (isPeak && isWeekday ? 3 : isWeekday ? 1.5 : 1) * 380,
      });
    }
  }
  return patterns;
}
