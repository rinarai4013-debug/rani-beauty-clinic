import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "769852657929598";
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export async function POST(req: NextRequest) {
  if (!ACCESS_TOKEN) {
    return NextResponse.json({ error: "META_CAPI_ACCESS_TOKEN not configured" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { event_name, event_time, user_data, custom_data } = body;

    if (!event_name) {
      return NextResponse.json({ error: "event_name required" }, { status: 400 });
    }

    const hashedUserData: Record<string, string> = {};
    if (user_data?.email) hashedUserData.em = sha256(user_data.email);
    if (user_data?.phone) hashedUserData.ph = sha256(user_data.phone.replace(/\D/g, ""));
    hashedUserData.client_ip_address = user_data?.client_ip || req.headers.get("x-forwarded-for") || "";
    hashedUserData.client_user_agent = user_data?.user_agent || req.headers.get("user-agent") || "";

    const eventData = {
      data: [{
        event_name,
        event_time: event_time || Math.floor(Date.now() / 1000),
        action_source: "website",
        event_source_url: body.event_source_url || "https://www.ranibeautyclinic.com",
        user_data: hashedUserData,
        custom_data: custom_data || {},
      }],
    };

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
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
