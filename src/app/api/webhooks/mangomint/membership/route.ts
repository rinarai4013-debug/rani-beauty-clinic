import { NextRequest, NextResponse } from 'next/server';

// Mangomint Membership webhook receiver
// Handles both Membership Started and Membership Canceled events
// Updates Airtable Memberships table and triggers engagement workflows

const AIRTABLE_PAT = process.env.AIRTABLE_PAT || '';
const AIRTABLE_BASE = process.env.AIRTABLE_BASE_ID || 'app1SwhSfwe8GKUg4';

interface MembershipData {
  id?: number | string;
  client_id?: number;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  membership_name?: string;
  membership_tier?: string;
  price?: number;
  billing_frequency?: string;
  status?: string;
  start_date?: string;
  cancel_date?: string;
  cancel_reason?: string;
  created_at?: string;
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const membership: MembershipData = payload.data || payload;
    const eventType: string = payload.event || '';
    const isCancellation = eventType.includes('cancel') ||
      membership.status === 'canceled' ||
      !!membership.cancel_date;

    console.log(`[Mangomint Membership Webhook] ${isCancellation ? 'CANCELED' : 'STARTED'}:`, JSON.stringify({
      membershipId: membership.id,
      clientName: membership.client_name,
      tier: membership.membership_name || membership.membership_tier,
      price: membership.price,
      timestamp: new Date().toISOString(),
    }));

    // Write/update membership in Airtable
    if (AIRTABLE_PAT && membership.client_name) {
      if (isCancellation) {
        // Find existing membership record and update status
        try {
          const searchRes = await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE}/Memberships?filterByFormula=AND({MangoMint Membership ID}="${membership.id}",{Status}="Active")&maxRecords=1`,
            {
              headers: { Authorization: `Bearer ${AIRTABLE_PAT}` },
            }
          );
          const searchData = await searchRes.json();
          const existingRecord = searchData.records?.[0];

          if (existingRecord) {
            await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/Memberships/${existingRecord.id}`, {
              method: 'PATCH',
              headers: {
                Authorization: `Bearer ${AIRTABLE_PAT}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                fields: {
                  'Status': 'Canceled',
                  'Cancel Date': membership.cancel_date || new Date().toISOString().split('T')[0],
                  'Cancel Reason': membership.cancel_reason || 'Canceled via Mangomint',
                },
              }),
            });
            console.log('[Mangomint Membership] Cancellation recorded');
          }
        } catch (err) {
          console.error('[Mangomint Membership] Cancel update failed:', err);
        }

        // Create alert for membership cancellation
        try {
          await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/Alerts`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${AIRTABLE_PAT}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fields: {
                'Type': 'membership_churn',
                'Severity': 'warning',
                'Message': `${membership.client_name} canceled their ${membership.membership_name || ''} membership${membership.cancel_reason ? `: ${membership.cancel_reason}` : ''}`,
                'Action Recommended': 'Reach out within 24h with retention offer',
                'Status': 'active',
              },
              typecast: true,
            }),
          });
        } catch {
          // Alert is best-effort
        }
      } else {
        // New membership — create record
        const fields: Record<string, unknown> = {
          'Tier': membership.membership_name || membership.membership_tier || 'Unknown',
          'Monthly Price': membership.price || 0,
          'Status': 'Active',
          'Start Date': membership.start_date || new Date().toISOString().split('T')[0],
          'Billing Frequency': membership.billing_frequency || 'Monthly',
          'MangoMint Membership ID': String(membership.id || ''),
          'Source': 'Mangomint Webhook',
        };

        try {
          await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/Memberships`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${AIRTABLE_PAT}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ fields, typecast: true }),
          });
          console.log('[Mangomint Membership] New membership recorded');
        } catch (err) {
          console.error('[Mangomint Membership] Airtable write failed:', err);
        }
      }
    }

    // Forward to n8n for further processing
    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    if (n8nUrl) {
      const webhookPath = isCancellation ? '/webhook/membership-canceled' : '/webhook/membership-started';
      try {
        await fetch(`${n8nUrl}${webhookPath}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch {
        // n8n forwarding is best-effort
      }
    }

    return NextResponse.json({
      success: true,
      message: isCancellation ? 'Membership cancellation recorded' : 'New membership recorded',
    });
  } catch (error) {
    console.error('[Mangomint Membership Webhook] Error:', error);
    return NextResponse.json({ success: false, error: 'Processing failed' }, { status: 500 });
  }
}
