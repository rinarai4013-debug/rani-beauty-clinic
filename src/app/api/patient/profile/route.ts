import { NextResponse } from 'next/server';
import { requirePatientAuth, getAirtableBase } from '@/lib/patient-auth/require-patient';

export async function GET() {
  const auth = await requirePatientAuth();
  if (auth.error) return auth.error;

  try {
    const base = await getAirtableBase();

    // Fetch patient record
    let profile = {
      name: auth.session.name,
      email: auth.session.email,
      phone: undefined as string | undefined,
      address: undefined as string | undefined,
      dateOfBirth: undefined as string | undefined,
      preferredContact: 'email',
      emergencyContact: undefined as string | undefined,
      allergies: [] as string[],
      medications: [] as string[],
      medicalNotes: undefined as string | undefined,
      communicationPreferences: {
        emailAppointmentReminders: true,
        smsAppointmentReminders: true,
        marketingEmails: true,
        marketingSms: false,
      },
    };

    try {
      const records = await base('Clients')
        .select({
          filterByFormula: `RECORD_ID() = "${auth.session.patientId}"`,
          maxRecords: 1,
          fields: [
            'Client', 'Email', 'Phone', 'Preferred Contact', 'Status',
          ],
        })
        .firstPage();

      if (records.length > 0) {
        const r = records[0];
        profile = {
          ...profile,
          name: (r.get('Client') as string) || auth.session.name,
          email: (r.get('Email') as string) || auth.session.email,
          phone: (r.get('Phone') as string) || undefined,
          preferredContact: (r.get('Preferred Contact') as string) || 'email',
        };
      }
    } catch {
      // Use session data as fallback
    }

    // Fetch intake data for medical info (if available)
    try {
      const intakeRecords = await base('Client Intakes')
        .select({
          filterByFormula: `FIND("${auth.session.patientId}", ARRAYJOIN({Clients}))`,
          maxRecords: 1,
          sort: [{ field: 'Created', direction: 'desc' }],
        })
        .firstPage();

      if (intakeRecords.length > 0) {
        const intake = intakeRecords[0];
        const allergiesField = intake.get('Allergies') as string;
        const medicationsField = intake.get('Medications') as string;

        if (allergiesField) {
          profile.allergies = allergiesField.split(',').map((a: string) => a.trim()).filter(Boolean);
        }
        if (medicationsField) {
          profile.medications = medicationsField.split(',').map((m: string) => m.trim()).filter(Boolean);
        }
      }
    } catch {
      // Intake data optional
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Patient profile error:', error);
    return NextResponse.json(
      { error: 'Failed to load profile' },
      { status: 500 }
    );
  }
}
