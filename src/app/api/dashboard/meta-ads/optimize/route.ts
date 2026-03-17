import { NextResponse } from 'next/server';
import { analyzeMetaAds, type MetaAdsInput } from '@/lib/ads/meta-ads-manager';

export async function GET() {
  try {
    // In production, pulls from Meta Marketing API via access token
    const sampleInput: MetaAdsInput = {
      campaigns: [
        {
          id: 'camp-1',
          name: 'Botox Awareness - Seattle Metro',
          status: 'active',
          objective: 'leads',
          budget: 1500,
          spent: 1280,
          startDate: '2026-02-15',
        },
        {
          id: 'camp-2',
          name: 'HydraFacial Promo - Renton',
          status: 'active',
          objective: 'conversions',
          budget: 800,
          spent: 720,
          startDate: '2026-03-01',
        },
        {
          id: 'camp-3',
          name: 'GLP-1 Weight Loss - WA State',
          status: 'active',
          objective: 'leads',
          budget: 2000,
          spent: 1850,
          startDate: '2026-01-20',
        },
      ],
      adSets: [
        {
          id: 'as-1',
          campaignId: 'camp-1',
          name: 'Women 25-45 Renton',
          targeting: {
            ageMin: 25,
            ageMax: 45,
            genders: ['female'],
            locations: ['Renton, WA'],
            interests: ['Beauty', 'Skincare', 'Anti-aging'],
            radius: 15,
          },
          budget: 1500,
          spent: 1280,
          status: 'active',
        },
        {
          id: 'as-2',
          campaignId: 'camp-2',
          name: 'Women 22-55 Local',
          targeting: {
            ageMin: 22,
            ageMax: 55,
            genders: ['female'],
            locations: ['Renton, WA'],
            interests: ['Facials', 'Skincare', 'Spa'],
            radius: 10,
          },
          budget: 800,
          spent: 720,
          status: 'active',
        },
        {
          id: 'as-3',
          campaignId: 'camp-3',
          name: 'Adults 30-60 WA',
          targeting: {
            ageMin: 30,
            ageMax: 60,
            genders: ['all'],
            locations: ['Washington State'],
            interests: ['Weight Loss', 'Health', 'Wellness'],
            radius: 50,
          },
          budget: 2000,
          spent: 1850,
          status: 'active',
        },
      ],
      ads: [
        {
          id: 'ad-1',
          adSetId: 'as-1',
          name: 'Botox Natural Results',
          type: 'image',
          headline: 'Natural-Looking Botox Results',
          body: 'Physician-supervised Botox at Rani Beauty Clinic. Natural results, expert care.',
          callToAction: 'Book Now',
          metrics: {
            impressions: 45000,
            reach: 28000,
            clicks: 1200,
            ctr: 2.67,
            cpc: 1.07,
            leads: 85,
            cpl: 15.06,
            conversions: 12,
            cpa: 106.67,
            spent: 1280,
            revenue: 4800,
            roas: 3.75,
            frequency: 1.6,
          },
          createdDate: '2026-02-15',
          status: 'active',
        },
        {
          id: 'ad-2',
          adSetId: 'as-2',
          name: 'HydraFacial Glow',
          type: 'video',
          headline: 'Get Your Glow On — HydraFacial $225',
          body: 'The celebrity-favorite facial. Immediate results, no downtime.',
          callToAction: 'Book Now',
          metrics: {
            impressions: 32000,
            reach: 22000,
            clicks: 960,
            ctr: 3.0,
            cpc: 0.75,
            leads: 72,
            cpl: 10.0,
            conversions: 18,
            cpa: 40.0,
            spent: 720,
            revenue: 4050,
            roas: 5.63,
            frequency: 1.45,
          },
          createdDate: '2026-03-01',
          status: 'active',
        },
        {
          id: 'ad-3',
          adSetId: 'as-3',
          name: 'GLP-1 Transform',
          type: 'image',
          headline: 'Medical Weight Loss That Works',
          body: 'Doctor-supervised GLP-1 program. Lose 15-20% body weight.',
          callToAction: 'Learn More',
          metrics: {
            impressions: 68000,
            reach: 42000,
            clicks: 1700,
            ctr: 2.5,
            cpc: 1.09,
            leads: 95,
            cpl: 19.47,
            conversions: 8,
            cpa: 231.25,
            spent: 1850,
            revenue: 3992,
            roas: 2.16,
            frequency: 1.62,
          },
          createdDate: '2026-01-20',
          status: 'active',
        },
      ],
      monthlyBudget: 5000,
      targetCPA: 100,
      targetROAS: 3.0,
      services: [
        { service: 'Botox', avgBookingValue: 400, ltv: 2400, targetAudience: 'Women 25-55', bestPerformingAngle: 'Natural results' },
        { service: 'HydraFacial', avgBookingValue: 225, ltv: 1350, targetAudience: 'Women 22-45', bestPerformingAngle: 'Instant glow' },
        { service: 'GLP-1', avgBookingValue: 499, ltv: 5988, targetAudience: 'Adults 30-60', bestPerformingAngle: 'Medical weight loss' },
        { service: 'Laser Hair Removal', avgBookingValue: 225, ltv: 1800, targetAudience: 'Women 18-45', bestPerformingAngle: 'Summer ready' },
        { service: 'Sofwave', avgBookingValue: 2750, ltv: 5500, targetAudience: 'Women 40-65', bestPerformingAngle: 'Non-surgical facelift' },
      ],
    };

    const result = analyzeMetaAds(sampleInput);

    return NextResponse.json({
      success: true,
      data: result,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Meta Ads analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze Meta Ads performance' },
      { status: 500 }
    );
  }
}
