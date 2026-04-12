import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { fetchProviderIntelligence } from "@/lib/briefing/provider-intelligence";
import { withSentry } from '@/lib/sentry-utils';
export async function GET() {
  return withSentry('dashboard/providers/performance', async () => {
    try {
      const session = await getSession();
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const providers = await fetchProviderIntelligence();
      return NextResponse.json({ status: "ok", providers });
    } catch (error) {
      console.error('[dashboard/providers/performance]', error);
      return NextResponse.json({ error: 'Failed to fetch provider performance' }, { status: 500 });
    }
  });
}
