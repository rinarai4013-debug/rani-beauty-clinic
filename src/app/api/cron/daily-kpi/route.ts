import { NextRequest, NextResponse } from "next/server";
import { withSentry } from "@/lib/sentry-utils";
export async function GET(req: NextRequest) {
  return withSentry("cron/daily-kpi", async () => {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ status: "not_implemented" }, { status: 501 });
  });
}
