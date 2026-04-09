import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { fetchProviderIntelligence } from "@/lib/briefing/provider-intelligence";
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const providers = await fetchProviderIntelligence();
  return NextResponse.json({ status: "ok", providers });
}
