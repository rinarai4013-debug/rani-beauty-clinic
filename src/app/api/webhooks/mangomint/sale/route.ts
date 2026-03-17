import { NextRequest, NextResponse } from 'next/server';

// Mangomint Sale Completed webhook receiver
// Receives sale data when a transaction is completed in Mangomint
// Updates Airtable Transactions table and triggers downstream workflows

const AIRTABLE_PAT = process.env.AIRTABLE_PAT || '';
const AIRTABLE_BASE = process.env.AIRTABLE_BASE_ID || 'app1SwhSfwe8GKUg4';

interface SaleData {
  id?: number | string;
  client_id?: number;
  client_name?: string;
  client_email?: string;
  total?: number;
  subtotal?: number;
  tax?: number;
  tip?: number;
  discount?: number;
  payment_method?: string;
  services?: Array<{
    name?: string;
    price?: number;
    provider_name?: string;
    category?: string;
  }>;
  created_at?: string;
  completed_at?: string;
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const sale: SaleData = payload.data || payload;

    console.log('[Mangomint Sale Webhook] Received:', JSON.stringify({
      saleId: sale.id,
      clientName: sale.client_name,
      total: sale.total,
      timestamp: new Date().toISOString(),
    }));

    // Write transaction to Airtable
    if (AIRTABLE_PAT && sale.client_name) {
      const services = sale.services || [];
      const primaryService = services[0];

      const fields: Record<string, unknown> = {
        'Date': sale.completed_at || sale.created_at || new Date().toISOString().split('T')[0],
        'Type': 'Service',
        'Amount': sale.total || 0,
        'Payment Method': sale.payment_method || 'Unknown',
        'Service': primaryService?.name || 'Mangomint Sale',
        'Provider': primaryService?.provider_name || '',
        'Status': 'Completed',
        'Source': 'Mangomint Webhook',
        'MangoMint Sale ID': String(sale.id || ''),
      };

      try {
        await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/Transactions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${AIRTABLE_PAT}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fields, typecast: true }),
        });
        console.log('[Mangomint Sale] Transaction recorded in Airtable');
      } catch (err) {
        console.error('[Mangomint Sale] Airtable write failed:', err);
      }
    }

    // Forward to n8n for further processing if needed
    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    if (n8nUrl) {
      try {
        await fetch(`${n8nUrl}/webhook/sale-completed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch {
        // n8n forwarding is best-effort
      }
    }

    return NextResponse.json({ success: true, message: 'Sale recorded' });
  } catch (error) {
    console.error('[Mangomint Sale Webhook] Error:', error);
    return NextResponse.json({ success: false, error: 'Processing failed' }, { status: 500 });
  }
}
