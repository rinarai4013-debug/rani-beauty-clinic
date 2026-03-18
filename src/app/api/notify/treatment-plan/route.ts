import { NextRequest, NextResponse } from 'next/server';

/**
 * Treatment Plan Notification API
 * Called by n8n after intake AI processing completes.
 * Sends email (via Resend) and optional SMS (via Twilio) with the treatment plan link.
 */
export async function POST(request: NextRequest) {
  try {
    const { intakeRecordId, clientEmail, clientPhone, clientName } = await request.json();

    if (!intakeRecordId || !clientName) {
      return NextResponse.json({ error: 'intakeRecordId and clientName are required' }, { status: 400 });
    }

    const planUrl = `https://www.ranibeautyclinic.com/plan/${intakeRecordId}`;
    const results = { email: false, sms: false, planUrl };

    // Send email via Resend
    if (clientEmail && process.env.RESEND_API_KEY) {
      try {
        const emailHtml = buildEmailHtml(clientName, planUrl);
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.FROM_EMAIL || 'Rani Beauty Clinic <noreply@ranibeautyclinic.com>',
            to: clientEmail,
            subject: 'Your Personalized Treatment Plan is Ready',
            html: emailHtml,
          }),
        });
        results.email = res.ok;
      } catch (e) {
        console.error('Email send error:', e);
      }
    }

    // Send SMS via Twilio (if configured)
    if (clientPhone && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      try {
        const smsBody = `Hi ${clientName.split(' ')[0]}! Your personalized treatment plan from Rani Beauty Clinic is ready: ${planUrl} Questions? Call (425) 207-8870`;
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
        const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
        
        const params = new URLSearchParams();
        params.append('To', clientPhone);
        params.append('From', process.env.TWILIO_FROM_NUMBER || '+14255394440');
        params.append('Body', smsBody);

        const res = await fetch(twilioUrl, {
          method: 'POST',
          headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        });
        results.sms = res.ok;
      } catch (e) {
        console.error('SMS send error:', e);
      }
    }

    // Log to Airtable Messages Log
    if (process.env.AIRTABLE_PAT && process.env.AIRTABLE_BASE_ID) {
      try {
        await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Messages%20Log`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.AIRTABLE_PAT}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            records: [{
              fields: {
                'Type': 'Treatment Plan Notification',
                'Channel': results.email ? 'Email' : 'SMS',
                'Recipient': clientEmail || clientPhone || clientName,
                'Status': (results.email || results.sms) ? 'Sent' : 'Failed',
                'Notes': `Plan URL: ${planUrl}`,
              }
            }]
          }),
        });
      } catch (e) {
        console.error('Log error:', e);
      }
    }

    return NextResponse.json({ success: true, ...results });
  } catch (error) {
    console.error('Notification error:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}

function buildEmailHtml(name: string, planUrl: string): string {
  const firstName = name.split(' ')[0];
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;padding:0;background:#F8F6F1;font-family:'Helvetica Neue',Arial,sans-serif}
.container{max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)}
.header{background:#0F1D2C;padding:40px 32px;text-align:center}
.header h1{color:#C9A96E;font-size:28px;margin:0 0 8px}
.header p{color:rgba(255,255,255,0.6);font-size:14px;margin:0}
.body{padding:40px 32px}
.body h2{color:#0F1D2C;font-size:22px;margin:0 0 16px}
.body p{color:#666;font-size:15px;line-height:1.6;margin:0 0 16px}
.cta{display:inline-block;background:#C9A96E;color:#0F1D2C;font-size:16px;font-weight:700;padding:16px 40px;border-radius:50px;text-decoration:none;margin:24px 0}
.cta:hover{background:#B8963D}
.footer{background:#F8F6F1;padding:24px 32px;text-align:center}
.footer p{color:#999;font-size:12px;margin:4px 0}
</style></head><body>
<div style="padding:24px">
<div class="container">
<div class="header">
<h1>Rani Beauty Clinic</h1>
<p>Your Personalized Treatment Plan</p>
</div>
<div class="body">
<h2>Hi ${firstName}, your treatment plan is ready!</h2>
<p>Our AI Treatment Architect has analyzed your intake and designed a custom transformation roadmap just for you.</p>
<p>Your personalized plan includes:</p>
<ul style="color:#666;font-size:14px;line-height:2">
<li>AI-powered skin analysis</li>
<li>Recommended treatment roadmap</li>
<li>Pricing with 0% financing options</li>
<li>Expected results timeline</li>
</ul>
<div style="text-align:center">
<a href="${planUrl}" class="cta">View My Treatment Plan</a>
</div>
<p style="color:#999;font-size:13px;text-align:center">Questions? Call us at <a href="tel:+14252078870" style="color:#C9A96E">(425) 207-8870</a></p>
</div>
<div class="footer">
<p>Rani Beauty Clinic</p>
<p>401 Olympia Ave NE #101, Renton, WA 98056</p>
<p>(425) 207-8870 · ranibeautyclinic.com</p>
</div>
</div>
</div>
</body></html>`;
}
