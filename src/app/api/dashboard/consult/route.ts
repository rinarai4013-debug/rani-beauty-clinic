import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll, fetchFirst } from '@/lib/airtable/client';
import { FIELDS } from '@/lib/airtable/tables';
import { generateConsultCopilot, type ConsultInput, type ClientProfile } from '@/lib/consult/copilot-engine';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.role, 'view_clients')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();

    const consultInput: ConsultInput = {
      client: body.client || {
        name: 'New Client',
        previousServices: [],
        totalSpend: 0,
        visitCount: 0,
        membershipStatus: 'none',
      },
      concerns: body.concerns || ['skin rejuvenation'],
      consultType: body.consultType || 'new_client',
      interestedServices: body.interestedServices,
      budget: body.budget || 'unknown',
      timeAvailable: body.timeAvailable || 30,
    };

    const result = generateConsultCopilot(consultInput);

    return NextResponse.json({
      success: true,
      data: result,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Consult co-pilot error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate consult intelligence' },
      { status: 500 }
    );
  }
}

// GET — Pull a real active client from Airtable with their history
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.role, 'view_clients')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Query a random Active client from Clients table
    let clientProfile: ClientProfile = {
      name: 'New Client',
      previousServices: [],
      totalSpend: 0,
      visitCount: 0,
      membershipStatus: 'none',
    };

    let concerns: string[] = ['skin rejuvenation'];
    let consultType: ConsultInput['consultType'] = 'new_client';
    let interestedServices: string[] | undefined;

    try {
      // Fetch active clients
      const activeClients = await fetchAll(
        Tables.clients(),
        {
          filterByFormula: `{${FIELDS.clients.status}} = 'Active'`,
        },
        true // skipTestFilter — Clients table has no "Is Test" field
      );

      if (activeClients.length > 0) {
        // Pick a random active client
        const randomIndex = Math.floor(Math.random() * activeClients.length);
        const client = activeClients[randomIndex];
        const clientName = (client.fields[FIELDS.clients.name] as string) || 'Client';

        // Fetch their transaction history for spend and service data
        const clientTransactionIds = (client.fields[FIELDS.clients.transactions] as string[]) || [];
        let totalSpend = 0;
        const previousServices: string[] = [];

        if (clientTransactionIds.length > 0) {
          // Fetch transactions linked to this client
          // Use OR formula for linked record IDs
          const idFormulas = clientTransactionIds.slice(0, 20).map(id => `RECORD_ID() = '${id}'`);
          try {
            const clientTransactions = await fetchAll(
              Tables.transactions(),
              {
                filterByFormula: idFormulas.length === 1
                  ? idFormulas[0]
                  : `OR(${idFormulas.join(', ')})`,
              }
            );

            for (const t of clientTransactions) {
              const amount = Number(t.fields[FIELDS.transactions.amount]) || 0;
              if (amount > 0) totalSpend += amount;
              const svc = t.fields[FIELDS.transactions.serviceName] as string;
              if (svc && !previousServices.includes(svc)) {
                previousServices.push(svc);
              }
            }
          } catch (err) {
            console.error('Error fetching client transactions:', err);
          }
        }

        // Fetch appointment history for visit count and last visit
        const clientAppointmentIds = (client.fields[FIELDS.clients.appointments] as string[]) || [];
        let visitCount = clientAppointmentIds.length;
        let lastVisit: string | undefined;

        if (clientAppointmentIds.length > 0) {
          try {
            const apptIdFormulas = clientAppointmentIds.slice(0, 10).map(id => `RECORD_ID() = '${id}'`);
            const clientAppointments = await fetchAll(
              Tables.appointments(),
              {
                filterByFormula: apptIdFormulas.length === 1
                  ? apptIdFormulas[0]
                  : `OR(${apptIdFormulas.join(', ')})`,
                sort: [{ field: FIELDS.appointments.date, direction: 'desc' }],
              }
            );

            visitCount = clientAppointments.filter(a => {
              const status = ((a.fields[FIELDS.appointments.status] as string) || '').toLowerCase();
              return status.includes('complete') || status.includes('check');
            }).length || clientAppointmentIds.length;

            if (clientAppointments.length > 0) {
              // Find the most recent completed appointment
              for (const a of clientAppointments) {
                const dateStr = a.fields[FIELDS.appointments.date] as string;
                if (dateStr) {
                  lastVisit = dateStr.slice(0, 10);
                  break;
                }
              }
            }
          } catch (err) {
            console.error('Error fetching client appointments:', err);
          }
        }

        // Check membership status
        const clientMembershipIds = (client.fields[FIELDS.clients.memberships] as string[]) || [];
        let membershipStatus: 'none' | 'active' | 'cancelled' = 'none';
        if (clientMembershipIds.length > 0) {
          try {
            const membershipRecords = await fetchFirst(
              Tables.memberships(),
              1,
              {
                filterByFormula: `AND(RECORD_ID() = '${clientMembershipIds[0]}', {${FIELDS.memberships.status}} = 'Active')`,
              }
            );
            if (membershipRecords.length > 0) {
              membershipStatus = 'active';
            }
          } catch {
            // Ignore membership lookup errors
          }
        }

        clientProfile = {
          name: clientName,
          previousServices,
          totalSpend: Math.round(totalSpend),
          visitCount,
          lastVisit,
          membershipStatus,
        };

        // Determine consult type based on visit history
        if (visitCount === 0) {
          consultType = 'new_client';
        } else if (visitCount >= 3) {
          consultType = 'upsell';
          // Suggest services they haven't tried
          const allServices = ['HydraFacial', 'Botox', 'VI Peel', 'RF Microneedling', 'Sofwave', 'GLP-1', 'Laser Hair Removal'];
          interestedServices = allServices.filter(s => !previousServices.includes(s)).slice(0, 3);
        } else {
          consultType = 'existing_client';
        }

        // Set concerns based on services history
        if (previousServices.some(s => s.includes('Botox') || s.includes('Filler'))) {
          concerns = ['anti-aging', 'wrinkle prevention', 'skin maintenance'];
        } else if (previousServices.some(s => s.includes('HydraFacial') || s.includes('Facial'))) {
          concerns = ['skin rejuvenation', 'hydration', 'glow'];
        } else if (previousServices.some(s => s.includes('GLP'))) {
          concerns = ['weight management', 'body contouring', 'wellness'];
        } else if (previousServices.some(s => s.includes('Laser') || s.includes('Pico'))) {
          concerns = ['pigmentation', 'skin tone', 'texture improvement'];
        } else {
          concerns = ['skin rejuvenation', 'anti-aging'];
        }
      }
    } catch (err) {
      console.error('Error fetching client for consult:', err);
      // Fall through with default client profile
    }

    const consultInput: ConsultInput = {
      client: clientProfile,
      concerns,
      consultType,
      interestedServices,
      budget: clientProfile.totalSpend > 2000 ? 'premium' : clientProfile.totalSpend > 500 ? 'moderate' : 'unknown',
      timeAvailable: 30,
    };

    const result = generateConsultCopilot(consultInput);

    return NextResponse.json({
      success: true,
      data: result,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Consult co-pilot error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate consult intelligence' },
      { status: 500 }
    );
  }
}
