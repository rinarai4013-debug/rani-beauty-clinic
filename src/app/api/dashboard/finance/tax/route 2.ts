import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { FIELDS } from '@/lib/airtable/tables';
import { generateTaxPlan, type TaxPlanningInput } from '@/lib/finance/tax-planning';

/**
 * GET /api/dashboard/finance/tax
 * Tax planning dashboard with quarterly estimates, deductions, and strategies.
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
    // Fetch YTD transactions
    const now = new Date();
    const yearStart = `${now.getFullYear()}-01-01`;

    let records: { id: string; fields: Record<string, unknown> }[] = [];
    try {
      records = await fetchAll(Tables.transactions(), {
        filterByFormula: `AND({${FIELDS.transactions.status}} = 'Completed', IS_AFTER({${FIELDS.transactions.date}}, '${yearStart}'))`,
      });
    } catch (err) {
      console.error('Error fetching transactions for tax:', err);
    }

    let ytdRevenue = 0;
    let ytdExpenses = 0;
    for (const rec of records) {
      const amount = Number(rec.fields[FIELDS.transactions.amount]) || 0;
      if (amount > 0) ytdRevenue += amount;
      else ytdExpenses += Math.abs(amount);
    }

    // Annualize from YTD
    const monthsElapsed = now.getMonth() + 1;
    const annualizationFactor = monthsElapsed > 0 ? 12 / monthsElapsed : 1;
    const annualRevenue = Math.round(ytdRevenue * annualizationFactor);
    const annualExpenses = Math.round(ytdExpenses * annualizationFactor);

    const input: TaxPlanningInput = {
      annualRevenue,
      annualExpenses,
      ytdRevenue,
      ytdExpenses,
      estimatedTaxesPaid: 0, // Would come from tax payment tracking
      filingStatus: 'married_joint',
      entityType: 'llc_single',
      equipment: [
        {
          name: 'Sofwave Device',
          purchaseDate: '2024-06-01',
          cost: 150000,
          usefulLifeYears: 7,
          section179Eligible: true,
          section179Claimed: 150000,
          accumulatedDepreciation: 0,
          category: 'laser_device',
        },
        {
          name: 'HydraFacial Machine',
          purchaseDate: '2024-01-15',
          cost: 25000,
          usefulLifeYears: 5,
          section179Eligible: true,
          section179Claimed: 25000,
          accumulatedDepreciation: 0,
          category: 'skincare_device',
        },
        {
          name: 'PicoWay Laser',
          purchaseDate: '2025-03-01',
          cost: 120000,
          usefulLifeYears: 7,
          section179Eligible: true,
          section179Claimed: 120000,
          accumulatedDepreciation: 0,
          category: 'laser_device',
        },
      ],
      expenses: [
        { description: 'Clinical Supplies', amount: annualExpenses * 0.25, category: 'supplies', deductible: true, deductiblePercent: 100 },
        { description: 'Rent', amount: 54000, category: 'rent', deductible: true, deductiblePercent: 100 },
        { description: 'Insurance', amount: 9600, category: 'insurance', deductible: true, deductiblePercent: 100 },
        { description: 'Marketing', amount: annualExpenses * 0.15, category: 'marketing', deductible: true, deductiblePercent: 100 },
        { description: 'Software & SaaS', amount: 7200, category: 'software', deductible: true, deductiblePercent: 100 },
        { description: 'Professional Services (CPA, Legal)', amount: 5000, category: 'professional_fees', deductible: true, deductiblePercent: 100 },
        { description: 'Training & CE', amount: 3000, category: 'training_education', deductible: true, deductiblePercent: 100 },
        { description: 'Business Meals', amount: 2400, category: 'meals', deductible: true, deductiblePercent: 50 },
      ],
      retirementContributions: {
        type: 'sep_ira',
        ytdContributions: 0,
      },
      healthInsurance: {
        monthlyPremium: 800,
        coveredMonths: monthsElapsed,
        familyMembers: 2,
      },
      homeOffice: {
        method: 'simplified',
        squareFootageOffice: 200,
        squareFootageHome: 2000,
      },
      mileage: {
        businessMiles: Math.round(monthsElapsed * 200), // ~200 miles/month
        totalMiles: Math.round(monthsElapsed * 800),
      },
    };

    const result = generateTaxPlan(input);

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error('Tax planning API error:', err);
    return NextResponse.json({ error: 'Failed to generate tax plan' }, { status: 500 });
  }
}
