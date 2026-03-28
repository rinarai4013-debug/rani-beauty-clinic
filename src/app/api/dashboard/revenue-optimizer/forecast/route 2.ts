import { NextResponse } from 'next/server';
import { generateForecast } from '@/lib/revenue/forecasting-v2';
import type { ForecastInput } from '@/lib/revenue/forecasting-v2';

/**
 * GET /api/dashboard/revenue-optimizer/forecast
 *
 * Advanced revenue forecasting with Monte Carlo simulation,
 * scenario modeling, goal decomposition, and daily targets.
 */

export async function GET() {
  try {
    // In production, fetch historical data from Airtable KPI Snapshots + Transactions
    const now = new Date();

    const input: ForecastInput = {
      historicalRevenue: generateHistoricalData(now),
      appointments: [],
      marketing: [],
      providers: [
        { name: 'Rina', hoursPerWeek: 40, avgRevenuePerHour: 250, utilizationTarget: 0.75 },
        { name: 'Mom', hoursPerWeek: 35, avgRevenuePerHour: 180, utilizationTarget: 0.70 },
      ],
      memberships: {
        activeMembers: 45,
        avgMonthlyMRR: 8500,
        churnRate: 0.05,
        growthRate: 0.08,
      },
      seasonality: [
        { month: 1, multiplier: 0.90, notes: 'Post-holiday slowdown' },
        { month: 2, multiplier: 0.95, notes: 'Valentine prep' },
        { month: 3, multiplier: 1.05, notes: 'Spring revival' },
        { month: 4, multiplier: 1.10, notes: 'Wedding season' },
        { month: 5, multiplier: 1.08, notes: 'Pre-summer' },
        { month: 6, multiplier: 0.95, notes: 'Summer starts' },
        { month: 7, multiplier: 0.90, notes: 'Summer vacation' },
        { month: 8, multiplier: 0.92, notes: 'Late summer' },
        { month: 9, multiplier: 1.10, notes: 'Fall skin revival' },
        { month: 10, multiplier: 1.12, notes: 'Pre-holiday prep' },
        { month: 11, multiplier: 1.15, notes: 'Holiday season' },
        { month: 12, multiplier: 1.05, notes: 'Year-end' },
      ],
      currentGoals: {
        monthlyTarget: 60000,
        quarterlyTarget: 180000,
        annualTarget: 720000,
      },
      pipelineLeads: 18,
      consultsScheduled: 7,
    };

    const result = generateForecast(input);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Forecast error:', error);
    return NextResponse.json({ error: 'Failed to generate forecast' }, { status: 500 });
  }
}

function generateHistoricalData(now: Date) {
  const data = [];
  for (let i = 60; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 86400000);
    const dow = date.getDay();
    const isWeekday = dow >= 1 && dow <= 5;
    const isSaturday = dow === 6;
    const baseRevenue = isWeekday ? 2200 : isSaturday ? 1400 : 200;
    const variance = (Math.random() - 0.5) * 800;

    data.push({
      date: date.toISOString().split('T')[0],
      revenue: Math.max(0, Math.round(baseRevenue + variance)),
      bookings: Math.round((baseRevenue + variance) / 350),
      avgTicket: 350 + Math.round((Math.random() - 0.5) * 100),
      newClients: Math.round(Math.random() * 3),
      returningClients: Math.round(Math.random() * 6 + 2),
      dayOfWeek: dow,
      month: date.getMonth() + 1,
    });
  }
  return data;
}
