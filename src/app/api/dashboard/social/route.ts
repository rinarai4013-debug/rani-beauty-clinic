import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { FIELDS } from '@/lib/airtable/tables';
import { generateSocialPlan, type SocialInput, type ClinicStats } from '@/lib/social/auto-post-engine';

// Rani's service catalog for social content (static reference data)
const RANI_SERVICE_INFO = [
  {
    name: 'HydraFacial',
    category: 'Facial',
    price: 275,
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
    price: 395,
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
  {
    name: 'Sofwave',
    category: 'Laser',
    price: 2750,
    popularity: 50,
    beforeAfterAvailable: true,
    educationalPoints: [
      'Sofwave uses SUPERB ultrasound technology for non-invasive skin tightening.',
      'FDA-cleared for lifting eyebrows, submental, and neck areas.',
      'Single treatment with results that continue to improve over 3 months.',
    ],
  },
  {
    name: 'PRX-T33',
    category: 'Facial',
    price: 495,
    popularity: 45,
    beforeAfterAvailable: true,
    educationalPoints: [
      'PRX-T33 is a biorevitalization treatment that stimulates collagen without peeling.',
      'Combines TCA, hydrogen peroxide, and kojic acid for deep dermal stimulation.',
      'Zero downtime — often called the lunchtime peel alternative.',
    ],
  },
];

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.role, 'view_executive')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Query Clients table for total count
    let totalClients = 0;
    try {
      const clientRecords = await fetchAll(
        Tables.clients(),
        {},
        true // skipTestFilter — Clients table has no "Is Test" field
      );
      totalClients = clientRecords.length;
    } catch (err) {
      console.error('Error fetching clients for social:', err);
    }

    // Query Appointments table for monthly booking count
    let monthlyBookings = 0;
    const now = new Date();
    const thirtyDaysAgoStr = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);
    try {
      const appointmentRecords = await fetchAll(
        Tables.appointments(),
        {
          filterByFormula: `AND(
            {${FIELDS.appointments.status}} != 'Cancelled',
            IS_AFTER({${FIELDS.appointments.date}}, '${thirtyDaysAgoStr}')
          )`,
        }
      );
      monthlyBookings = appointmentRecords.length;
    } catch (err) {
      console.error('Error fetching appointments for social:', err);
    }

    // Query Reviews table for average rating
    let googleRating = 4.9;
    let reviewCount = 0;
    try {
      const reviewRecords = await fetchAll(
        Tables.reviews(),
        {}
      );
      reviewCount = reviewRecords.length;
      if (reviewCount > 0) {
        const totalRating = reviewRecords.reduce((sum, r) => {
          return sum + (Number(r.fields[FIELDS.reviews.starRating]) || 0);
        }, 0);
        googleRating = Math.round((totalRating / reviewCount) * 10) / 10;
      }
    } catch (err) {
      console.error('Error fetching reviews for social:', err);
    }

    // Query memberships count
    let membershipCount = 0;
    try {
      const membershipRecords = await fetchAll(
        Tables.memberships(),
        { filterByFormula: `{${FIELDS.memberships.status}} = 'Active'` }
      );
      membershipCount = membershipRecords.length;
    } catch {
      // Table may be empty
    }

    // Determine the top service from recent transactions
    let topService = 'Botox';
    try {
      const recentTransactions = await fetchAll(
        Tables.transactions(),
        {
          filterByFormula: `AND({${FIELDS.transactions.status}} = 'Completed', IS_AFTER({${FIELDS.transactions.date}}, '${thirtyDaysAgoStr}'))`,
        }
      );
      if (recentTransactions.length > 0) {
        const serviceCounts: Record<string, number> = {};
        for (const rec of recentTransactions) {
          const svc = (rec.fields[FIELDS.transactions.serviceName] as string) || '';
          if (svc) serviceCounts[svc] = (serviceCounts[svc] || 0) + 1;
        }
        const sorted = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]);
        if (sorted.length > 0) topService = sorted[0][0];
      }
    } catch (err) {
      console.error('Error fetching transactions for top service:', err);
    }

    const clinicStats: ClinicStats = {
      totalClients: totalClients || 131, // Fall back to known minimum
      monthlyBookings: monthlyBookings || 0,
      googleRating,
      reviewCount,
      topService,
      membershipCount,
    };

    // Determine season
    const month = now.getMonth() + 1;
    let season: 'spring' | 'summer' | 'fall' | 'winter' = 'spring';
    if (month >= 3 && month <= 5) season = 'spring';
    else if (month >= 6 && month <= 8) season = 'summer';
    else if (month >= 9 && month <= 11) season = 'fall';
    else season = 'winter';

    const socialInput: SocialInput = {
      services: RANI_SERVICE_INFO,
      recentPromotions: [],
      clinicStats,
      seasonality: {
        currentMonth: month,
        upcomingHolidays: [],
        season,
        weddingSeason: month >= 4 && month <= 9,
      },
    };

    const result = generateSocialPlan(socialInput);

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
