import { NextResponse } from 'next/server';
import { generateSocialPlan, type SocialInput } from '@/lib/social/auto-post-engine';

export async function GET() {
  try {
    const sampleInput: SocialInput = {
      services: [
        {
          name: 'HydraFacial',
          category: 'Facial',
          price: 225,
          popularity: 85,
          beforeAfterAvailable: true,
          educationalPoints: [
            'HydraFacial uses patented Vortex-Fusion technology to cleanse, extract, and hydrate skin simultaneously.',
            'Each treatment removes dead skin cells and impurities while delivering moisturizing serums.',
            'Results are immediate with no downtime — perfect for pre-event skin prep.',
          ],
        },
        {
          name: 'Botox',
          category: 'Injectable',
          price: 400,
          popularity: 90,
          beforeAfterAvailable: true,
          educationalPoints: [
            'Botox works by temporarily relaxing facial muscles that cause wrinkles.',
            'Preventative Botox in your 20s-30s can slow the formation of dynamic lines.',
            'Results typically last 3-4 months with regular maintenance.',
          ],
        },
        {
          name: 'VI Peel',
          category: 'Peel',
          price: 325,
          popularity: 65,
          beforeAfterAvailable: true,
          educationalPoints: [
            'VI Peel is a medical-grade chemical peel that improves skin tone, texture, and clarity.',
            'Safe for all skin types including melanin-rich skin.',
            'Fall and winter are ideal peel seasons for maximum results.',
          ],
        },
        {
          name: 'GLP-1',
          category: 'Wellness',
          price: 499,
          popularity: 70,
          beforeAfterAvailable: false,
          educationalPoints: [
            'GLP-1 medications like semaglutide work by regulating appetite and blood sugar.',
            'Medical weight loss programs include physician oversight and monthly monitoring.',
            'Average patients see 15-20% body weight reduction over 6 months.',
          ],
        },
        {
          name: 'Laser Hair Removal',
          category: 'Hair Removal',
          price: 225,
          popularity: 75,
          beforeAfterAvailable: true,
          educationalPoints: [
            'Our GentleMax Pro Plus laser works on all skin tones safely.',
            'Most areas require 6-8 sessions for 80-90% permanent reduction.',
            'Treatments are quick — underarms take just 10-15 minutes.',
          ],
        },
        {
          name: 'RF Microneedling',
          category: 'Laser',
          price: 495,
          popularity: 60,
          beforeAfterAvailable: true,
          educationalPoints: [
            'Cutera Secret Pro combines microneedling with radiofrequency energy for deeper collagen stimulation.',
            'Treats acne scars, fine lines, pore size, and skin laxity.',
            'Results continue improving for 3-6 months after treatment.',
          ],
        },
        {
          name: 'NAD+ Injection',
          category: 'Wellness',
          price: 150,
          popularity: 40,
          beforeAfterAvailable: false,
          educationalPoints: [
            'NAD+ is a coenzyme essential for cellular energy production and DNA repair.',
            'Injection delivery ensures maximum bioavailability vs. oral supplements.',
            'Benefits include improved energy, mental clarity, and anti-aging support.',
          ],
        },
      ],
      recentPromotions: [
        {
          title: 'Spring Glow Special',
          discount: '15% off HydraFacial + VI Peel combo',
          validUntil: '2026-04-15',
          services: ['HydraFacial', 'VI Peel'],
        },
      ],
      clinicStats: {
        totalClients: 2181,
        monthlyBookings: 180,
        googleRating: 4.9,
        reviewCount: 127,
        topService: 'Botox',
        membershipCount: 42,
      },
      seasonality: {
        currentMonth: new Date().getMonth() + 1,
        upcomingHolidays: [],
        season: 'spring',
        weddingSeason: true,
      },
    };

    const result = generateSocialPlan(sampleInput);

    return NextResponse.json({
      success: true,
      data: result,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Social content generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate social content plan' },
      { status: 500 }
    );
  }
}
