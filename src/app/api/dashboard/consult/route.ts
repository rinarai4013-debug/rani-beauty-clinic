import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { fetchConsultIntelligence } from "@/lib/briefing/consult-intelligence";
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const consult = await fetchConsultIntelligence();
  return NextResponse.json({ status: "ok", consult });
}
