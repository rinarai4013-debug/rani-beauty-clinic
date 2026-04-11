import { NextRequest, NextResponse } from "next/server";
import { generateDailyBriefing } from '@/lib/briefing';
import { env } from '@/lib/env';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const briefing = await generateDailyBriefing();
    return NextResponse.json({
      status: 'ok',
      generatedAt: briefing.generatedAt,
      subject: briefing.subject,
      preheader: briefing.preheader,
      actionItemCount: briefing.data.actionItems.length,
      revenue: briefing.data.revenue.total,
      appointments: briefing.data.schedule.totalAppointments,
    });
  } catch (error) {
    console.error('[cron/daily-briefing]', error);
    return NextResponse.json({ error: 'Failed to generate daily briefing' }, { status: 500 });
  }
}
