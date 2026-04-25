import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRecord, Tables } from "@/lib/airtable/client";
import { getRxProgram } from "@/lib/rx-programs";
import { withSentry } from "@/lib/sentry-utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const RxIntakePayloadSchema = z
  .object({
    program_slug: z.string().optional(),
    programSlug: z.string().optional(),
    program_id: z.string().optional(),
    patient_id: z.string().optional(),
    patientId: z.string().optional(),
    first_name: z.string().optional(),
    firstName: z.string().optional(),
    last_name: z.string().optional(),
    lastName: z.string().optional(),
    full_name: z.string().optional(),
    fullName: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    intake_date: z.string().optional(),
    intakeDate: z.string().optional(),
    consult_scheduled_date: z.string().optional(),
    consultScheduledDate: z.string().optional(),
    prescription_status: z.string().optional(),
    prescriptionStatus: z.string().optional(),
    pharmacy: z.string().optional(),
    monthly_billing_status: z.string().optional(),
    monthlyBillingStatus: z.string().optional(),
    source: z.string().optional(),
  })
  .passthrough();

function normalizeIsoDate(input?: string) {
  if (!input) return new Date().toISOString().slice(0, 10);
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().slice(0, 10);
  return parsed.toISOString().slice(0, 10);
}

function buildProviderNotificationHtml(data: {
  programLabel: string;
  patientName: string;
  email?: string;
  phone?: string;
  intakeDate: string;
  patientId: string;
}) {
  return `
<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; color: #0F1D2C;">
    <h2>New Rx Intake Enrollment</h2>
    <p><strong>Program:</strong> ${data.programLabel}</p>
    <p><strong>Patient:</strong> ${data.patientName}</p>
    <p><strong>Email:</strong> ${data.email || "Not provided"}</p>
    <p><strong>Phone:</strong> ${data.phone || "Not provided"}</p>
    <p><strong>Intake Date:</strong> ${data.intakeDate}</p>
    <p><strong>Patient ID:</strong> ${data.patientId}</p>
  </body>
</html>`;
}

export async function POST(req: NextRequest) {
  return withSentry("webhooks/rx-intake", async () => {
    const expectedSecret = process.env.RX_INTAKE_WEBHOOK_SECRET;
    const providedSecret = req.headers.get("x-rx-webhook-secret");
    if (expectedSecret && providedSecret !== expectedSecret) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = RxIntakePayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid payload",
          details: parsed.error.issues,
        },
        { status: 422 },
      );
    }

    const payload = parsed.data;
    const programSlug = payload.program_slug || payload.programSlug;
    if (!programSlug) {
      return NextResponse.json(
        { success: false, error: "Missing program_slug" },
        { status: 422 },
      );
    }

    const rxProgram = getRxProgram(programSlug);
    if (!rxProgram) {
      return NextResponse.json(
        { success: false, error: "Unknown program_slug" },
        { status: 422 },
      );
    }

    const firstName = payload.first_name || payload.firstName || "";
    const lastName = payload.last_name || payload.lastName || "";
    const fullName =
      payload.full_name ||
      payload.fullName ||
      `${firstName} ${lastName}`.trim() ||
      "Unknown Patient";
    const patientId =
      payload.patient_id ||
      payload.patientId ||
      payload.email ||
      payload.phone ||
      `rx-${Date.now()}`;
    const intakeDate = normalizeIsoDate(payload.intake_date || payload.intakeDate);
    const consultScheduledDate =
      payload.consult_scheduled_date || payload.consultScheduledDate || "";
    const prescriptionStatus =
      payload.prescription_status || payload.prescriptionStatus || "pending_review";
    const monthlyBillingStatus =
      payload.monthly_billing_status || payload.monthlyBillingStatus || "not_started";

    const airtableRecord = {
      program_id: payload.program_id || rxProgram.programId,
      patient_id: patientId,
      intake_date: intakeDate,
      consult_scheduled_date: consultScheduledDate,
      prescription_status: prescriptionStatus,
      pharmacy: payload.pharmacy || "",
      monthly_billing_status: monthlyBillingStatus,
    };

    let recordId = "";
    try {
      recordId = await createRecord(Tables.rxProgramEnrollments(), airtableRecord);
    } catch (error) {
      console.error(
        "[rx-intake webhook] Airtable insert failed:",
        error instanceof Error ? error.message : String(error),
      );
      return NextResponse.json(
        { success: false, error: "Failed to create enrollment record" },
        { status: 502 },
      );
    }

    const n8nWebhookUrl =
      process.env.N8N_RX_INTAKE_WEBHOOK_URL ||
      (process.env.N8N_WEBHOOK_URL
        ? `${process.env.N8N_WEBHOOK_URL.replace(/\/$/, "")}/webhook/rx-intake`
        : "");
    if (n8nWebhookUrl) {
      try {
        await fetch(n8nWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workflow: "W23",
            event: "rx_intake_received",
            source: payload.source || "rx_intake_form",
            programSlug: rxProgram.slug,
            programId: rxProgram.programId,
            programLabel: rxProgram.label,
            patientName: fullName,
            email: payload.email || "",
            phone: payload.phone || "",
            patientId,
            intakeDate,
            recordId,
            consultScheduledDate,
            prescriptionStatus,
            monthlyBillingStatus,
            submittedAt: new Date().toISOString(),
          }),
          signal: AbortSignal.timeout(5000),
        });
      } catch (error) {
        console.error(
          "[rx-intake webhook] n8n trigger failed:",
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    const resendKey = process.env.RESEND_API_KEY;
    const providerEmail =
      process.env.RX_PROVIDER_EMAIL ||
      process.env.CONTACT_EMAIL ||
      "info@ranibeautyclinic.com";
    const fromEmail =
      process.env.FROM_EMAIL || "Rani Beauty Clinic <noreply@ranibeautyclinic.com>";

    if (resendKey) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [providerEmail],
            reply_to: payload.email || undefined,
            subject: `New Rx Intake - ${rxProgram.label}`,
            html: buildProviderNotificationHtml({
              programLabel: rxProgram.label,
              patientName: fullName,
              email: payload.email,
              phone: payload.phone,
              intakeDate,
              patientId,
            }),
          }),
        });
      } catch (error) {
        console.error(
          "[rx-intake webhook] provider email failed:",
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        recordId,
        programSlug: rxProgram.slug,
      },
    });
  });
}
