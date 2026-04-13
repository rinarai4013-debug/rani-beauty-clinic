import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { fetchReactivationIntelligence } from "@/lib/briefing/reactivation-intelligence";
import { withSentry } from "@/lib/sentry-utils";
export async function GET() {
  return withSentry("dashboard/reactivation", async () => {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const reactivation = await fetchReactivationIntelligence();
    return NextResponse.json({ status: "ok", reactivation });
  });
}
