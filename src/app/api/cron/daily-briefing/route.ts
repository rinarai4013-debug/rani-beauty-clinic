import { NextRequest, NextResponse } from 'next/server';
import { Tables, fetchAll } from '@/lib/airtable/client';

// Vercel Cron — runs daily at 6 AM Pacific (14:00 UTC)
// Stores a KPI snapshot and sends optional morning briefing SMS

export async function GET(req: NextRequest) {
  // Verify Vercel cron secret
  const auth = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const today = new Date().toISOString().slice(0, 10);

    // Pull today's data in parallel
    const [transactions, appointments, leads] = await Promise.all([
      fetchAll<{ Amount?: number; Status?: string }>(
        Tables.transactions(),
        {
          filterByFormula: `AND(IS_SAME({Date}, TODAY(), 'day'), {Status} = "Completed")`,
          fields: ['Amount', 'Status'],
        }
      ),
      fetchAll<{ Status?: string }>(
        Tables.appointments(),
        {
          filterByFormula: `AND(IS_SAME({Date}, TODAY(), 'day'), {Status} = "completed")`,
          fields: ['Status'],
        }
      ),
      fetchAll<Record<string, never>>(
        Tables.intakes(),
        {
          filterByFormula: `AND(IS_SAME({Created Date}, TODAY(), 'day'))`,
          fields: ['Status'],
        }
      ),
    ]);

    const revenue = transactions.reduce((sum, r) => sum + (Number(r.fields?.Amount) || 0), 0);
    const bookings = appointments.length;
    const newLeads = leads.length;

    // Store daily KPI snapshot
    await Tables.kpis().create({
      Date: today,
      Revenue: revenue,
      Bookings: bookings,
      'New Leads': newLeads,
      'Snapshot Type': 'Daily Briefing',
      'Created At': new Date().toISOString(),
    } as Record<string, unknown>);

    // Optional morning SMS to owner
    const ownerPhone = process.env.OWNER_PHONE;
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_FROM_NUMBER || '+14252509750';

    if (ownerPhone && twilioSid && twilioToken) {
      const msg = `Good morning Rani ✨\nToday so far: $${revenue.toFixed(0)} revenue, ${bookings} bookings, ${newLeads} new leads.\nranibeautyclinic.com/dashboard`;
      await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ To: ownerPhone, From: fromPhone, Body: msg }).toString(),
        }
      );
    }

    return NextResponse.json({ ok: true, date: today, revenue, bookings, leads: newLeads });
  } catch (err) {
    console.error('[cron/daily-briefing]', err);
    return NextResponse.json({ error: 'Briefing failed' }, { status: 500 });
  }
}
