export interface FollowUpTemplate {
  id: string;
  name: string;
  channel: 'email' | 'sms' | 'internal';
  subject?: string;
  body: string;
  tone: string;
}

export const FOLLOW_UP_TEMPLATES: Record<string, FollowUpTemplate> = {
  // ─── SMS: Sent → No Response after 72h ──────────────────────────
  plan_reminder_sms: {
    id: 'plan_reminder_sms',
    name: 'Plan Reminder SMS',
    channel: 'sms',
    body: 'Hi {{clientName}}! Your personalized treatment plan from Rani Beauty Clinic is ready for you. Take a look: {{planUrl}} Questions? Call us at {{clinicPhone}}',
    tone: 'Warm, concise, action-oriented',
  },

  // ─── Email: Viewed → Needs Follow-Up after 48h ─────────────────
  confidence_builder: {
    id: 'confidence_builder',
    name: 'Confidence Builder',
    channel: 'email',
    subject: '{{clientName}}, we\'re here to answer any questions',
    body: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#FAF8F5;font-family:'Montserrat',Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <p style="color:#C9A96E;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0;">Rani Beauty Clinic</p>
    </div>
    <div style="background:#ffffff;border-radius:16px;padding:40px 32px;border:1px solid #f0ece6;">
      <h1 style="font-family:'Playfair Display',Georgia,serif;color:#0F1D2C;font-size:24px;margin:0 0 16px;">
        We noticed you reviewed your treatment plan
      </h1>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 20px;">
        Hi {{clientName}},
      </p>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 20px;">
        Thank you for taking the time to review your personalized treatment plan. We understand that choosing the right aesthetic journey is an important decision, and we want to make sure you feel completely confident every step of the way.
      </p>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 20px;">
        Our most popular option is the <strong>Transform package</strong> — it delivers the most impactful results while keeping your investment thoughtfully balanced. Many of our clients find it strikes the ideal balance between transformation and value.
      </p>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 24px;">
        If you have any questions about your plan, the treatment process, or financing options, we would love to walk you through everything.
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="{{planUrl}}" style="display:inline-block;background:#0F1D2C;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:600;font-size:15px;">
          Review Your Plan
        </a>
      </div>
      <div style="text-align:center;margin:24px 0 0;">
        <a href="tel:+14255394440" style="display:inline-block;background:#C9A96E;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:12px;font-weight:600;font-size:14px;">
          Book a Quick Call
        </a>
      </div>
    </div>
    <p style="text-align:center;color:#999;font-size:12px;margin-top:32px;">
      Rani Beauty Clinic · 401 Olympia Ave NE, Suite 101, Renton, WA 98056<br>
      <a href="tel:+14255394440" style="color:#C9A96E;text-decoration:none;">{{clinicPhone}}</a>
    </p>
  </div>
</body>
</html>`,
    tone: 'Supportive, reassuring, luxury. No pressure — positions the clinic as a partner in their decision.',
  },

  // ─── Email: Financing Clicked → no booking after 24h ────────────
  financing_followup: {
    id: 'financing_followup',
    name: 'Financing Follow-Up',
    channel: 'email',
    subject: 'Making your treatment plan affordable',
    body: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#FAF8F5;font-family:'Montserrat',Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <p style="color:#C9A96E;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0;">Rani Beauty Clinic</p>
    </div>
    <div style="background:#ffffff;border-radius:16px;padding:40px 32px;border:1px solid #f0ece6;">
      <h1 style="font-family:'Playfair Display',Georgia,serif;color:#0F1D2C;font-size:24px;margin:0 0 16px;">
        Your transformation, on your terms
      </h1>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 20px;">
        Hi {{clientName}},
      </p>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 20px;">
        We noticed you explored our financing options — great news, because we have made it incredibly easy to invest in yourself without the financial stress.
      </p>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 8px;">
        Here is what makes our financing stand out:
      </p>
      <ul style="color:#555;font-size:15px;line-height:1.9;margin:0 0 20px;padding-left:20px;">
        <li><strong>Zero impact on your credit score</strong> to check eligibility</li>
        <li>Approval in under 60 seconds through Cherry or PatientFi</li>
        <li>Flexible monthly payments starting as low as <strong>$50/month</strong></li>
        <li>No hidden fees or surprises</li>
      </ul>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 24px;">
        Many of our clients choose financing to begin their full treatment journey right away rather than spacing sessions out. The results speak for themselves when you can commit to the complete plan.
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="https://patient.withcherry.com/apply/rani-beauty-clinic" style="display:inline-block;background:#0F1D2C;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:600;font-size:15px;">
          Check Your Rate with Cherry
        </a>
      </div>
      <div style="text-align:center;margin:16px 0;">
        <a href="https://app.patientfi.com/v2/rani-beauty-clinic/apply" style="display:inline-block;background:transparent;color:#0F1D2C;text-decoration:none;padding:12px 28px;border-radius:12px;font-weight:600;font-size:14px;border:2px solid #0F1D2C;">
          Or Apply with PatientFi
        </a>
      </div>
      <p style="color:#999;font-size:13px;line-height:1.6;margin:24px 0 0;text-align:center;">
        Questions? Call us at <a href="tel:+14255394440" style="color:#C9A96E;text-decoration:none;">{{clinicPhone}}</a> — we are happy to walk you through the process.
      </p>
    </div>
    <p style="text-align:center;color:#999;font-size:12px;margin-top:32px;">
      Rani Beauty Clinic · 401 Olympia Ave NE, Suite 101, Renton, WA 98056<br>
      <a href="tel:+14255394440" style="color:#C9A96E;text-decoration:none;">{{clinicPhone}}</a>
    </p>
  </div>
</body>
</html>`,
    tone: 'Empowering, transparent, removes friction. Positions financing as smart — not as a concession.',
  },

  // ─── Internal Alert: Multiple plan views ────────────────────────
  hot_lead_alert: {
    id: 'hot_lead_alert',
    name: 'Hot Lead Internal Alert',
    channel: 'internal',
    subject: '[HOT LEAD] {{clientName}} viewed plan {{viewCount}} times',
    body: `INTERNAL ALERT — HOT LEAD DETECTED

Client: {{clientName}}
Plan Views: {{viewCount}}
Last Viewed: {{lastViewedAt}}

This client has viewed their treatment plan multiple times, indicating strong interest. Recommend immediate outreach:

1. Call {{clientName}} directly to answer questions
2. Offer to schedule a brief follow-up consultation
3. Mention financing options if cost may be a concern
4. Emphasize limited availability for their preferred treatment window

Action Required: Reach out within the next 2 hours for highest conversion probability.`,
    tone: 'Direct, urgent, action-oriented. Internal staff communication.',
  },

  // ─── Email: Lost → Re-engaged ──────────────────────────────────
  reengagement: {
    id: 'reengagement',
    name: 'Re-engagement Welcome Back',
    channel: 'email',
    subject: 'Welcome back, {{clientName}}',
    body: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#FAF8F5;font-family:'Montserrat',Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <p style="color:#C9A96E;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0;">Rani Beauty Clinic</p>
    </div>
    <div style="background:#ffffff;border-radius:16px;padding:40px 32px;border:1px solid #f0ece6;">
      <h1 style="font-family:'Playfair Display',Georgia,serif;color:#0F1D2C;font-size:24px;margin:0 0 16px;">
        We are glad you are back, {{clientName}}
      </h1>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 20px;">
        Hi {{clientName}},
      </p>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 20px;">
        We noticed you revisited your personalized treatment plan — and we could not be more excited. Your plan is still ready and waiting for you, crafted specifically around your unique skin goals.
      </p>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 20px;">
        A lot can change, and we completely understand that timing matters. If your needs or goals have shifted since your last consultation, we would love to offer a complimentary follow-up to make sure your plan reflects exactly where you are today.
      </p>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 24px;">
        No pressure, no rush — just expert guidance whenever you are ready.
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="{{planUrl}}" style="display:inline-block;background:#0F1D2C;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:600;font-size:15px;">
          View Your Plan
        </a>
      </div>
      <div style="text-align:center;margin:16px 0;">
        <a href="https://booking.mangomint.com/ranibeautyclinic1" style="display:inline-block;background:#C9A96E;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:12px;font-weight:600;font-size:14px;">
          Schedule a Follow-Up Consultation
        </a>
      </div>
    </div>
    <p style="text-align:center;color:#999;font-size:12px;margin-top:32px;">
      Rani Beauty Clinic · 401 Olympia Ave NE, Suite 101, Renton, WA 98056<br>
      <a href="tel:+14255394440" style="color:#C9A96E;text-decoration:none;">{{clinicPhone}}</a>
    </p>
  </div>
</body>
</html>`,
    tone: 'Warm, welcoming, zero-pressure. Celebrates their return without making them feel guilty for the gap.',
  },

  // ─── Email: Plan re-send with fresh framing ─────────────────────
  plan_resend: {
    id: 'plan_resend',
    name: 'Plan Re-send',
    channel: 'email',
    subject: 'Your transformation journey awaits, {{clientName}}',
    body: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#FAF8F5;font-family:'Montserrat',Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <p style="color:#C9A96E;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0;">Rani Beauty Clinic</p>
    </div>
    <div style="background:#ffffff;border-radius:16px;padding:40px 32px;border:1px solid #f0ece6;">
      <h1 style="font-family:'Playfair Display',Georgia,serif;color:#0F1D2C;font-size:24px;margin:0 0 16px;">
        Your personalized plan is ready
      </h1>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 20px;">
        Hi {{clientName}},
      </p>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 20px;">
        We wanted to make sure your customized treatment plan made it to your inbox. Our team put together a thoughtful approach tailored to your specific skin concerns and aesthetic goals.
      </p>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 8px;">
        Inside your plan, you will find:
      </p>
      <ul style="color:#555;font-size:15px;line-height:1.9;margin:0 0 20px;padding-left:20px;">
        <li>Your personalized skin health assessment</li>
        <li>A phased treatment journey designed for lasting results</li>
        <li>Tiered investment options to match your goals and budget</li>
        <li>Flexible financing with zero credit impact</li>
      </ul>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 24px;">
        Every treatment at Rani Beauty Clinic is performed under physician supervision, ensuring you receive the highest standard of care alongside stunning results.
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="{{planUrl}}" style="display:inline-block;background:#C9A96E;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:600;font-size:15px;">
          View Your Treatment Plan
        </a>
      </div>
      <p style="color:#999;font-size:13px;line-height:1.6;margin:24px 0 0;text-align:center;">
        Questions? We are always here — call <a href="tel:+14255394440" style="color:#C9A96E;text-decoration:none;">{{clinicPhone}}</a> or reply to this email.
      </p>
    </div>
    <p style="text-align:center;color:#999;font-size:12px;margin-top:32px;">
      Rani Beauty Clinic · 401 Olympia Ave NE, Suite 101, Renton, WA 98056<br>
      <a href="tel:+14255394440" style="color:#C9A96E;text-decoration:none;">{{clinicPhone}}</a>
    </p>
  </div>
</body>
</html>`,
    tone: 'Fresh, inviting, clinically assured. Reframes the plan without feeling like a nag.',
  },
};

/**
 * Render a template by replacing placeholders with actual values.
 */
export function renderTemplate(
  templateId: string,
  variables: Record<string, string>
): { subject?: string; body: string } | null {
  const template = FOLLOW_UP_TEMPLATES[templateId];
  if (!template) return null;

  let body = template.body;
  let subject = template.subject;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    body = body.replaceAll(placeholder, value);
    if (subject) {
      subject = subject.replaceAll(placeholder, value);
    }
  }

  return { subject, body };
}
