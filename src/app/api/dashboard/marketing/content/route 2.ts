import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { generateContentCalendar, getTopicClusters, scoreContentPerformance } from '@/lib/marketing/content-calendar';
import type { ContentPerformance } from '@/lib/marketing/content-calendar';

/**
 * GET /api/dashboard/marketing/content?period=30_day|60_day|90_day
 * Content calendar dashboard — calendar, performances, topic clusters.
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(session.role, 'view_revenue')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || '30_day') as '30_day' | '60_day' | '90_day';

    const calendar = generateContentCalendar(period);
    const topicClusters = calendar.topicClusters;

    // Sample performance data — in production, pulled from analytics
    const performances: ContentPerformance[] = [
      { pieceId: 'p1', title: 'Sofwave vs Ultherapy: Complete Guide', type: 'blog_post', channel: 'blog', publishedDate: '2026-03-10', metrics: { pageViews: 1240, uniqueVisitors: 890, avgTimeOnPage: 245, bounceRate: 32, conversions: 4, conversionRate: 0.45 }, performanceScore: 0 },
      { pieceId: 'p2', title: 'HydraFacial Transformation', type: 'before_after', channel: 'instagram', publishedDate: '2026-03-15', metrics: { likes: 347, saves: 89, comments: 23, socialShares: 15 }, performanceScore: 0 },
      { pieceId: 'p3', title: 'GLP-1 Weight Loss Results', type: 'educational_reel', channel: 'instagram', publishedDate: '2026-03-18', metrics: { likes: 512, saves: 134, comments: 41, socialShares: 28 }, performanceScore: 0 },
      { pieceId: 'p4', title: 'Spring Skin Prep Newsletter', type: 'email_newsletter', channel: 'email', publishedDate: '2026-03-01', metrics: { emailOpens: 456, emailClicks: 87, conversions: 3 }, performanceScore: 0 },
      { pieceId: 'p5', title: 'RF Microneedling FAQ', type: 'faq', channel: 'blog', publishedDate: '2026-03-05', metrics: { pageViews: 890, avgTimeOnPage: 180, bounceRate: 45, conversions: 2 }, performanceScore: 0 },
    ];

    // Score each performance
    for (const perf of performances) {
      perf.performanceScore = scoreContentPerformance(perf.metrics);
    }

    return NextResponse.json({
      calendar,
      performances,
      topicClusters,
      kpis: {
        totalPieces: calendar.totalPieces,
        publishedThisMonth: performances.length,
        avgPerformanceScore: performances.length > 0
          ? Math.round(performances.reduce((s, p) => s + p.performanceScore, 0) / performances.length)
          : 0,
        totalConversions: performances.reduce((s, p) => s + (p.metrics.conversions || 0), 0),
      },
    });
  } catch (error) {
    console.error('[Marketing Content]', error);
    return NextResponse.json({ error: 'Failed to load content data' }, { status: 500 });
  }
}
