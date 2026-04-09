import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { fetchReactivationIntelligence } from "@/lib/briefing/reactivation-intelligence";
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const reactivation = await fetchReactivationIntelligence();
  return NextResponse.json({ status: "ok", reactivation });
}
