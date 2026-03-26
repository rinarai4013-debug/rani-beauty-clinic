import { NextResponse } from 'next/server';
import { requirePatientAuth, getAirtableBase } from '@/lib/patient-auth/require-patient';

export async function GET() {
  const auth = await requirePatientAuth();
  if (auth.error) return auth.error;

  try {
    const base = await getAirtableBase();

    // Fetch treatment plans for this patient
    let activePlan = null;
    try {
      const planRecords = await base('Treatment Plans')
        .select({
          filterByFormula: `FIND("${auth.session.patientId}", ARRAYJOIN({Clients}))`,
          maxRecords: 1,
          sort: [{ field: 'Created', direction: 'desc' }],
        })
        .firstPage();

      if (planRecords.length > 0) {
        const plan = planRecords[0];
        activePlan = {
          id: plan.id,
          name: (plan.get('Plan Name') as string) || 'Treatment Plan',
          goal: (plan.get('Goal') as string) || '',
          startDate: (plan.get('Start Date') as string) || '',
          estimatedEndDate: (plan.get('End Date') as string) || undefined,
          steps: [], // Steps would be populated from linked records
          overallProgress: (plan.get('Progress') as number) || 0,
        };
      }
    } catch {
      // Treatment Plans table may not exist yet
    }

    // Fetch packages
    const packages: Array<{
      name: string;
      totalSessions: number;
      sessionsUsed: number;
      sessionsRemaining: number;
      expiresAt?: string;
    }> = [];

    try {
      const pkgRecords = await base('Packages')
        .select({
          filterByFormula: `FIND("${auth.session.patientId}", ARRAYJOIN({Clients}))`,
          maxRecords: 10,
          fields: ['Package Name', 'Total Sessions', 'Sessions Used', 'Sessions Remaining', 'Expiry Date'],
        })
        .firstPage();

      for (const pkg of pkgRecords) {
        const total = (pkg.get('Total Sessions') as number) || 0;
        const used = (pkg.get('Sessions Used') as number) || 0;
        packages.push({
          name: (pkg.get('Package Name') as string) || 'Package',
          totalSessions: total,
          sessionsUsed: used,
          sessionsRemaining: (pkg.get('Sessions Remaining') as number) || Math.max(total - used, 0),
          expiresAt: (pkg.get('Expiry Date') as string) || undefined,
        });
      }
    } catch {
      // Packages table fields may differ
    }

    // Fetch membership
    let membership = null;
    try {
      const memRecords = await base('Memberships')
        .select({
          filterByFormula: `AND(
            FIND("${auth.session.patientId}", ARRAYJOIN({Clients})),
            {Status} = "Active"
          )`,
          maxRecords: 1,
          fields: ['Tier', 'Monthly Price', 'Status', 'Start Date'],
        })
        .firstPage();

      if (memRecords.length > 0) {
        const mem = memRecords[0];
        const tier = (mem.get('Tier') as string) || 'Standard';
        membership = {
          tier,
          monthlyPrice: (mem.get('Monthly Price') as number) || 0,
          status: (mem.get('Status') as string) || 'Active',
          startDate: (mem.get('Start Date') as string) || '',
          benefits: getMembershipBenefits(tier),
        };
      }
    } catch {
      // Memberships table fields may differ
    }

    // Recommended next treatments based on history
    const recommendedNext: string[] = [];
    try {
      const recentAppts = await base('Appointments')
        .select({
          filterByFormula: `AND(
            FIND("${auth.session.patientId}", ARRAYJOIN({Clients})),
            {Status} = "Completed"
          )`,
          sort: [{ field: 'Date', direction: 'desc' }],
          maxRecords: 5,
          fields: ['Service Name', 'Service Category'],
        })
        .firstPage();

      const recentServices = recentAppts.map((r) => r.get('Service Name') as string);
      const suggestions = getNextTreatmentSuggestions(recentServices);
      recommendedNext.push(...suggestions);
    } catch {
      // Best-effort recommendations
    }

    return NextResponse.json({
      activePlan,
      packages,
      membership,
      recommendedNext,
    });
  } catch (error) {
    console.error('Patient plan error:', error);
    return NextResponse.json(
      { error: 'Failed to load treatment plan' },
      { status: 500 }
    );
  }
}

function getMembershipBenefits(tier: string): string[] {
  const benefits: Record<string, string[]> = {
    Standard: ['Monthly treatment included', '10% off additional services'],
    Premium: ['Monthly treatment included', '15% off additional services', 'Priority booking'],
    VIP: ['Monthly treatment included', '20% off additional services', 'Priority booking', 'Free skincare product monthly'],
  };
  return benefits[tier] || benefits.Standard;
}

function getNextTreatmentSuggestions(recentServices: string[]): string[] {
  const pathways: Record<string, string> = {
    'HydraFacial': 'Follow up with a VI Peel for enhanced results',
    'VI Peel': 'Continue with HydraFacial for maintenance',
    'Botox': 'Maintenance in 3-4 months',
    'RF Microneedling': 'Follow-up session recommended in 4-6 weeks',
    'Sofwave': 'Optimal results with a second session in 3-6 months',
    'PicoWay': 'Follow-up session in 6-8 weeks',
  };

  const suggestions: string[] = [];
  for (const service of recentServices) {
    for (const [key, suggestion] of Object.entries(pathways)) {
      if (service?.toLowerCase().includes(key.toLowerCase()) && !suggestions.includes(suggestion)) {
        suggestions.push(suggestion);
      }
    }
    if (suggestions.length >= 3) break;
  }
  return suggestions;
}
