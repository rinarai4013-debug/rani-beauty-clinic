import { NextRequest, NextResponse } from 'next/server';
import { requirePatientAuth, getAirtableBase } from '@/lib/patient-auth/require-patient';

export async function GET(request: NextRequest) {
  const auth = await requirePatientAuth();
  if (auth.error) return auth.error;

  try {
    const base = await getAirtableBase();
    const limit = Number(request.nextUrl.searchParams.get('limit')) || 50;
    const upcomingOnly = request.nextUrl.searchParams.get('upcoming') === 'true';

    // Fetch appointments linked to this patient's record
    const records = await base('Appointments')
      .select({
        filterByFormula: `FIND("${auth.session.patientId}", ARRAYJOIN({Clients}))`,
        sort: [{ field: 'Date', direction: 'desc' }],
        maxRecords: limit,
        fields: [
          'Service Name', 'Service Category', 'Provider', 'Date', 'Time',
          'Duration', 'Status', 'Amount Paid',
        ],
      })
      .firstPage();

    const now = new Date();
    const appointments = records.map((r) => ({
      id: r.id,
      service: (r.get('Service Name') as string) || '',
      category: (r.get('Service Category') as string) || '',
      provider: (r.get('Provider') as string) || '',
      date: (r.get('Date') as string) || '',
      time: (r.get('Time') as string) || '',
      duration: (r.get('Duration') as number) || 0,
      status: (r.get('Status') as string) || '',
      location: '401 Olympia Ave NE #101, Renton, WA 98056',
    }));

    const upcoming = appointments.filter((a) => {
      const apptDate = new Date(a.date);
      return apptDate >= now && a.status !== 'Cancelled' && a.status !== 'No-Show';
    }).reverse(); // chronological order for upcoming

    const past = appointments.filter((a) => {
      const apptDate = new Date(a.date);
      return apptDate < now || a.status === 'Completed';
    });

    if (upcomingOnly) {
      return NextResponse.json({ upcoming: upcoming.slice(0, limit) });
    }

    return NextResponse.json({ upcoming, past });
  } catch (error) {
    console.error('Patient appointments error:', error);
    return NextResponse.json(
      { error: 'Failed to load appointments' },
      { status: 500 }
    );
  }
}
