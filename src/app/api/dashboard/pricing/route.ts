import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { FIELDS } from '@/lib/airtable/tables';
import { analyzePricing, type PricingInput, type TransactionHistory, type ServicePricing } from '@/lib/pricing/dynamic-engine';

// Rani's service catalog with costs and durations (static reference data)
const RANI_SERVICES: ServicePricing[] = [
  { service: 'HydraFacial', category: 'Facial', basePrice: 275, cost: 56, duration: 60, popularity: 0 },
  { service: 'VI Peel', category: 'Peel', basePrice: 395, cost: 65, duration: 30, popularity: 0 },
  { service: 'RF Microneedling', category: 'Laser', basePrice: 495, cost: 99, duration: 60, popularity: 0 },
  { service: 'Botox', category: 'Injectable', basePrice: 400, cost: 120, duration: 30, popularity: 0 },
  { service: 'Laser Hair Removal', category: 'Hair Removal', basePrice: 225, cost: 34, duration: 25, popularity: 0 },
  { service: 'Sofwave', category: 'Laser', basePrice: 2750, cost: 413, duration: 45, popularity: 0 },
  { service: 'GLP-1', category: 'Wellness', basePrice: 499, cost: 200, duration: 15, popularity: 0 },
  { service: 'NAD+ Injection', category: 'Wellness', basePrice: 150, cost: 30, duration: 10, popularity: 0 },
  { service: 'B12 Injection', category: 'Wellness', basePrice: 35, cost: 5, duration: 5, popularity: 0 },
  { service: 'PRX-T33', category: 'Facial', basePrice: 495, cost: 80, duration: 30, popularity: 0 },
  { service: 'PicoWay', category: 'Laser', basePrice: 475, cost: 70, duration: 30, popularity: 0 },
  { service: 'Fillers', category: 'Injectable', basePrice: 600, cost: 180, duration: 30, popularity: 0 },
];

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.role, 'view_revenue')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 86400000);
    const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().slice(0, 10);

    // Query Transactions table for completed service payments (last 90 days)
    let transactionRecords: { id: string; fields: Record<string, unknown> }[] = [];
    try {
      transactionRecords = await fetchAll(
        Tables.transactions(),
        {
          filterByFormula: `AND({${FIELDS.transactions.status}} = 'Completed', IS_AFTER({${FIELDS.transactions.date}}, '${ninetyDaysAgoStr}'))`,
        }
      );
    } catch (err) {
      console.error('Error fetching transactions for pricing:', err);
    }

    // Build transaction history for the pricing engine
    const transactions: TransactionHistory[] = transactionRecords
      .filter(r => {
        const amount = Number(r.fields[FIELDS.transactions.amount]) || 0;
        return amount > 0; // Only revenue transactions
      })
      .map(r => {
        const dateStr = r.fields[FIELDS.transactions.date] as string || '';
        const d = new Date(dateStr);
        return {
          service: (r.fields[FIELDS.transactions.serviceName] as string) || 'Unknown',
          amount: Number(r.fields[FIELDS.transactions.amount]) || 0,
          date: dateStr,
          dayOfWeek: d.getDay(),
          hour: d.getHours() || 12, // default to noon if no time
          clientType: 'returning' as const, // default; we don't have client type on transactions
          hadFinancing: !!(r.fields[FIELDS.transactions.isFinancing]),
        };
      });

    // Compute popularity from transaction counts per service
    const serviceCounts: Record<string, number> = {};
    for (const t of transactions) {
      serviceCounts[t.service] = (serviceCounts[t.service] || 0) + 1;
    }
    const services: ServicePricing[] = RANI_SERVICES.map(s => ({
      ...s,
      popularity: serviceCounts[s.service] || 0,
    }));

    // Query Appointments table for utilization data
    let appointmentRecords: { id: string; fields: Record<string, unknown> }[] = [];
    try {
      appointmentRecords = await fetchAll(
        Tables.appointments(),
        {
          filterByFormula: `AND({${FIELDS.appointments.status}} != 'Cancelled', IS_AFTER({${FIELDS.appointments.date}}, '${ninetyDaysAgoStr}'))`,
        }
      );
    } catch (err) {
      console.error('Error fetching appointments for pricing:', err);
    }

    // Build utilization from appointments (or fall back to defaults)
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let byDayOfWeek: { day: string; rate: number }[];
    let byTimeSlot: { slot: string; rate: number }[];
    let overallRate = 0;

    if (appointmentRecords.length > 0) {
      // Count appointments per day of week
      const dayCounts: Record<number, number> = {};
      const slotCounts: Record<string, number> = {};
      for (const rec of appointmentRecords) {
        const dateStr = rec.fields[FIELDS.appointments.date] as string;
        if (!dateStr) continue;
        const d = new Date(dateStr);
        const dow = d.getDay();
        dayCounts[dow] = (dayCounts[dow] || 0) + 1;

        const timeStr = rec.fields[FIELDS.appointments.time] as string || '';
        if (timeStr) {
          const hour = parseInt(timeStr.split(':')[0], 10);
          if (!isNaN(hour)) {
            const slot = `${hour}-${hour + 1}`;
            slotCounts[slot] = (slotCounts[slot] || 0) + 1;
          }
        }
      }

      // Max daily capacity: assume 12 appts/day * number of weeks in 90 days
      const weeksInPeriod = 90 / 7;
      const maxPerDay = 12 * weeksInPeriod;
      byDayOfWeek = dayNames.map((name, i) => ({
        day: name,
        rate: Math.min(100, Math.round(((dayCounts[i] || 0) / maxPerDay) * 100)),
      }));

      // Time slots: assume 1 provider * weeksInPeriod as max per slot
      const maxPerSlot = 1 * weeksInPeriod;
      const allSlots = ['10-11', '11-12', '12-13', '13-14', '14-15', '15-16', '16-17', '17-18'];
      byTimeSlot = allSlots.map(slot => ({
        slot,
        rate: Math.min(100, Math.round(((slotCounts[slot] || 0) / maxPerSlot) * 100)),
      }));

      const totalBooked = appointmentRecords.length;
      const totalSlots = 8 * 6 * weeksInPeriod; // 8 hours * 6 working days * weeks
      overallRate = Math.min(100, Math.round((totalBooked / totalSlots) * 100));
    } else {
      // No appointment data — use zero utilization
      byDayOfWeek = dayNames.map(name => ({ day: name, rate: 0 }));
      byTimeSlot = ['10-11', '11-12', '12-13', '13-14', '14-15', '15-16', '16-17', '17-18']
        .map(slot => ({ slot, rate: 0 }));
      overallRate = 0;
    }

    // Query memberships (may be empty)
    let membershipCount = 0;
    try {
      const membershipRecords = await fetchAll(
        Tables.memberships(),
        { filterByFormula: `{${FIELDS.memberships.status}} = 'Active'` }
      );
      membershipCount = membershipRecords.length;
    } catch {
      // Table may be empty or not exist yet
    }

    const pricingInput: PricingInput = {
      services,
      utilization: {
        byDayOfWeek,
        byTimeSlot,
        overall: overallRate,
      },
      transactions,
      memberships: {
        totalMembers: membershipCount,
        avgMemberSpend: 680,
        avgNonMemberSpend: 385,
        churnRate: 8,
      },
      seasonality: {
        currentMonth: now.getMonth() + 1,
        isHolidaySeason: false,
        upcomingEvents: [],
      },
    };

    const result = analyzePricing(pricingInput);

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
