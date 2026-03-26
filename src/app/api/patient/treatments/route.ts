import { NextResponse } from 'next/server';
import { requirePatientAuth, getAirtableBase } from '@/lib/patient-auth/require-patient';

export async function GET() {
  const auth = await requirePatientAuth();
  if (auth.error) return auth.error;

  try {
    const base = await getAirtableBase();

    // Fetch completed appointments as treatment history
    const records = await base('Appointments')
      .select({
        filterByFormula: `AND(
          FIND("${auth.session.patientId}", ARRAYJOIN({Clients})),
          {Status} = "Completed"
        )`,
        sort: [{ field: 'Date', direction: 'desc' }],
        maxRecords: 100,
        fields: [
          'Service Name', 'Provider', 'Date', 'Status',
        ],
      })
      .firstPage();

    const treatments = records.map((r) => ({
      id: r.id,
      service: (r.get('Service Name') as string) || '',
      provider: (r.get('Provider') as string) || '',
      date: (r.get('Date') as string) || '',
      notes: undefined, // Patient-safe: no internal notes exposed
      aftercareUrl: getAftercareUrl(r.get('Service Name') as string),
    }));

    return NextResponse.json({ treatments });
  } catch (error) {
    console.error('Patient treatments error:', error);
    return NextResponse.json(
      { error: 'Failed to load treatment history' },
      { status: 500 }
    );
  }
}

function getAftercareUrl(service: string | undefined): string | undefined {
  if (!service) return undefined;
  const s = service.toLowerCase();
  if (s.includes('hydrafacial')) return '/aftercare#hydrafacial';
  if (s.includes('botox') || s.includes('filler')) return '/aftercare#injectables';
  if (s.includes('laser') || s.includes('picoway')) return '/aftercare#laser';
  if (s.includes('peel') || s.includes('vi peel')) return '/aftercare#chemical-peel';
  if (s.includes('microneedling') || s.includes('rf')) return '/aftercare#microneedling';
  if (s.includes('sofwave')) return '/aftercare#sofwave';
  return '/aftercare';
}
