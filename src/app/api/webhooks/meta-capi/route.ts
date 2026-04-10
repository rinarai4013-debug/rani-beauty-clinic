import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from 'zod';

function getMetaPixelId() {
  return process.env.NEXT_PUBLIC_META_PIXEL_ID || "769852657929598";
}

function getMetaAccessToken() {
  return process.env.META_CAPI_ACCESS_TOKEN;
}

function getMetaWebhookSecret() {
  return process.env.META_CAPI_WEBHOOK_SECRET;
}

const MetaUserDataSchema = z.object({
  email: z.string().trim().toLowerCase().min(1).optional(),
  phone: z.string().trim().min(1).optional(),
  client_ip: z.string().trim().min(1).optional(),
  client_user_agent: z.string().trim().min(1).optional(),
});

const MetaCapiPayloadSchema = z.object({
  event_name: z.string().min(1),
  event_time: z.number().int().positive().optional(),
  event_source_url: z.string().trim().url().optional(),
  user_data: MetaUserDataSchema.partial().optional(),
  custom_data: z.record(z.unknown()).optional(),
});

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export async function POST(req: NextRequest) {
  const accessToken = getMetaAccessToken();
  const pixelId = getMetaPixelId();

  if (!accessToken) {
    return NextResponse.json({ error: "META_CAPI_ACCESS_TOKEN not configured" }, { status: 500 });
  }

  // Read raw body for HMAC verification
  const body = await req.text();

  // HMAC-SHA256 signature verification (Meta's x-hub-signature-256 header)
  const webhookSecret = getMetaWebhookSecret();
  if (webhookSecret) {
    const signature = req.headers.get("x-hub-signature-256");
    if (!signature) {
      console.error("[Meta CAPI] Missing x-hub-signature-256 header");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const expectedSig = "sha256=" + crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");
    const sigBuf = Buffer.from(signature, "utf8");
    const expBuf = Buffer.from(expectedSig, "utf8");
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      console.error("[Meta CAPI] Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } else {
    console.error("[Meta CAPI] WARNING: META_CAPI_WEBHOOK_SECRET not set — skipping signature verification");
  }

  try {
    let jsonBody: unknown = null;
    try {
      jsonBody = JSON.parse(body);
    } catch {
      // invalid JSON
    }
    const parsed = MetaCapiPayloadSchema.safeParse(jsonBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid META CAPI payload' },
        { status: 400 }
      );
    }

    const { event_name, event_time, user_data, custom_data, event_source_url } = parsed.data;

    const hashedUserData: Record<string, string> = {};
    if (user_data?.email) hashedUserData.em = sha256(user_data.email);
    if (user_data?.phone) hashedUserData.ph = sha256(user_data.phone.replace(/\D/g, ""));
    hashedUserData.client_ip_address =
      user_data?.client_ip || req.headers.get("x-forwarded-for") || "";
    hashedUserData.client_user_agent =
      user_data?.client_user_agent || req.headers.get("user-agent") || "";

    const eventData = {
      data: [{
        event_name,
        event_time: event_time || Math.floor(Date.now() / 1000),
        action_source: "website",
        event_source_url: event_source_url || "https://www.ranibeautyclinic.com",
        user_data: hashedUserData,
        custom_data: custom_data || {},
      }],
    };

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      }
    );

    const result = await response.json();
    if (!response.ok) {
      console.error("[Meta CAPI] Error:", result);
      return NextResponse.json({ error: "Meta CAPI request failed", details: result }, { status: 502 });
    }

    return NextResponse.json({ success: true, events_received: result.events_received });
  } catch (error) {
    console.error("[Meta CAPI] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
