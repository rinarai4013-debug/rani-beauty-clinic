import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Tables, createRecord } from "@/lib/airtable/client";
import { getClientIP, rateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

const ContactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().max(20).optional().default(""),
  service: z.string().min(1).max(100),
  message: z.string().max(2000).optional().default(""),
  honeypot: z.string().max(0, "Bot detected").optional().default(""),
});

export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  const { allowed, resetIn } = rateLimit("contact-form", ip, RATE_LIMITS.FORM);
  if (!allowed) return rateLimitResponse(resetIn);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Check honeypot first — bots get a silent 200 before any validation
  const raw = body as Record<string, unknown>;
  if (typeof raw?.honeypot === "string" && raw.honeypot.length > 0) {
    return NextResponse.json({ success: true });
  }

  const parsed = ContactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 422 }
    );
  }

  const { name, email, phone, service, message } = parsed.data;

  // Build intake summary for AI pipeline
  const intakeSummary = [
    `Service Interest: ${service}`,
    message ? `Message: ${message}` : null,
    `Source: Contact Form`,
  ]
    .filter(Boolean)
    .join("\n");

  // 1. Write to Airtable Client Intakes
  // Field names verified against live Airtable schema 2026-03-28
  const airtablePayload = {
    "Full Name": name,
    "Email": email,
    ...(phone ? { "Phone Number": phone } : {}),
    "Intake Summary (AI)": intakeSummary,
    "Processing Status": "New",
  };

  try {
    await createRecord(Tables.intakes(), airtablePayload);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(
      "[contact] Airtable write failed:",
      errMsg,
      "| Payload fields:",
      Object.keys(airtablePayload).join(", ")
    );
    if (errMsg.includes("UNKNOWN_FIELD_NAME")) {
      console.error(
        "[contact] FIELD NAME MISMATCH — one or more fields in",
        Object.keys(airtablePayload),
        "do not exist in the Client Intakes table. Verify field names at https://airtable.com/app1SwhSfwe8GKUg4"
      );
    }
    // Don't block the user — still attempt email + n8n
  }

  // 2. Send notification email via Resend
  const resendKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_EMAIL ?? "info@ranibeautyclinic.com";
  const fromEmail = process.env.FROM_EMAIL ?? "Rani Beauty Clinic <noreply@ranibeautyclinic.com>";

  if (!resendKey) {
    console.warn("[contact] RESEND_API_KEY not set — skipping email notification");
  } else {
    try {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [toEmail],
          reply_to: email,
          subject: `New Consultation Request — ${service}`,
          html: buildNotificationEmail({ name, email, phone, service, message }),
        }),
      });
      if (!emailRes.ok) {
        const resBody = await emailRes.text().catch(() => "");
        console.error("[contact] Resend returned", emailRes.status, resBody);
        if (emailRes.status === 403) {
          console.error("[contact] Resend 403 — likely domain not verified. Verify at https://resend.com/domains");
        }
      }
    } catch (err) {
      console.error("[contact] Resend email failed:", err instanceof Error ? err.message : err);
    }
  }

  // 3. Forward to n8n lead intake webhook
  const n8nUrl = process.env.N8N_WEBHOOK_URL;
  if (!n8nUrl) {
    console.warn("[contact] N8N_WEBHOOK_URL not set — skipping webhook");
  } else {
    try {
      await fetch(`${n8nUrl}/webhook/contact-form-intake`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "contact_form",
          name,
          email,
          phone,
          service,
          message,
          submittedAt: new Date().toISOString(),
        }),
        signal: AbortSignal.timeout(5000),
      });
    } catch (err) {
      console.error("[contact] n8n webhook failed:", err);
    }
  }

  return NextResponse.json({ success: true });
}

function buildNotificationEmail(data: {
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #0F1D2C;">
  <div style="border-top: 4px solid #C9A96E; padding-top: 20px; margin-bottom: 24px;">
    <h1 style="font-size: 22px; margin: 0; color: #0F1D2C;">New Consultation Request</h1>
    <p style="margin: 4px 0 0; color: #888; font-size: 14px;">Submitted via ranibeautyclinic.com</p>
  </div>

  <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #eee; width: 140px; color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Name</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600;">${escHtml(data.name)}</td>
    </tr>
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Email</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><a href="mailto:${escHtml(data.email)}" style="color: #C9A96E;">${escHtml(data.email)}</a></td>
    </tr>
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Phone</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${data.phone ? `<a href="tel:${escHtml(data.phone)}" style="color: #C9A96E;">${escHtml(data.phone)}</a>` : '<span style="color:#aaa">Not provided</span>'}</td>
    </tr>
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Service</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600; color: #C9A96E;">${escHtml(data.service)}</td>
    </tr>
    ${
      data.message
        ? `<tr>
      <td style="padding: 10px 0; color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; vertical-align: top;">Message</td>
      <td style="padding: 10px 0; line-height: 1.6;">${escHtml(data.message)}</td>
    </tr>`
        : ""
    }
  </table>

  <div style="margin-top: 28px; padding: 16px; background: #F8F6F1; border-radius: 8px; font-size: 13px; color: #888; text-align: center;">
    Reply directly to this email to contact ${escHtml(data.name)} · Respond within 24 hours
  </div>
</body>
</html>
`;
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
