import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { scoreLead, getSourceQualityRanking, getPipelineSummary, calibrateModel } from '@/lib/marketing/lead-scoring';
import type { LeadScoringInput, LeadGrade } from '@/lib/marketing/lead-scoring';

/**
 * GET /api/dashboard/marketing/leads
 * Lead scoring dashboard — scored leads, pipeline, source quality, calibration.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(session.role, 'view_revenue')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // In production, fetch from Airtable Clients table filtered by lead status
    const sampleLeads: LeadScoringInput[] = [
      {
        lead: { id: 'lead_1', name: 'Sarah M.', email: 'sarah@example.com', source: 'google_organic', createdAt: '2026-03-22T10:00:00Z', lastActivityAt: '2026-03-25T09:30:00Z', status: 'new', location: { city: 'Renton', state: 'WA', distanceMiles: 3.2 } },
        behavioral: { totalPageViews: 24, uniquePageViews: 12, totalSessions: 4, avgSessionDuration: 420, pagesPerSession: 6, returnVisits: 3, lastSessionDate: '2026-03-25T09:30:00Z', pagesViewed: [{ path: '/services/sofwave', category: 'service', viewCount: 3, totalTimeSeconds: 180, lastViewed: '2026-03-25' }, { path: '/pricing', category: 'pricing', viewCount: 2, totalTimeSeconds: 120, lastViewed: '2026-03-25' }, { path: '/get-started', category: 'booking', viewCount: 1, totalTimeSeconds: 60, lastViewed: '2026-03-25' }] },
        engagement: { chatInteractions: 1, chatMessages: 4, formSubmissions: 0, emailOpens: 2, emailClicks: 1, smsReplies: 0, phoneCallsMade: 0, downloadedContent: [], quizCompleted: true, consultFormStarted: true, consultFormCompleted: false },
      },
      {
        lead: { id: 'lead_2', name: 'Jennifer W.', email: 'jennifer@example.com', source: 'referral', createdAt: '2026-03-20T14:00:00Z', lastActivityAt: '2026-03-24T16:00:00Z', status: 'contacted', location: { city: 'Bellevue', state: 'WA', distanceMiles: 12 } },
        behavioral: { totalPageViews: 32, uniquePageViews: 18, totalSessions: 6, avgSessionDuration: 540, pagesPerSession: 5.3, returnVisits: 5, lastSessionDate: '2026-03-24T16:00:00Z', pagesViewed: [{ path: '/services/botox', category: 'service', viewCount: 4, totalTimeSeconds: 240, lastViewed: '2026-03-24' }, { path: '/services/fillers', category: 'service', viewCount: 3, totalTimeSeconds: 180, lastViewed: '2026-03-24' }, { path: '/pricing', category: 'pricing', viewCount: 3, totalTimeSeconds: 150, lastViewed: '2026-03-24' }, { path: '/financing', category: 'financing', viewCount: 1, totalTimeSeconds: 90, lastViewed: '2026-03-23' }] },
        engagement: { chatInteractions: 2, chatMessages: 8, formSubmissions: 1, emailOpens: 4, emailClicks: 2, smsReplies: 1, phoneCallsMade: 1, downloadedContent: [], quizCompleted: true, consultFormStarted: true, consultFormCompleted: true },
      },
      {
        lead: { id: 'lead_3', name: 'Lisa K.', email: 'lisa@example.com', source: 'meta_ads', createdAt: '2026-03-24T08:00:00Z', lastActivityAt: '2026-03-25T07:00:00Z', status: 'new', location: { city: 'Seattle', state: 'WA', distanceMiles: 18 } },
        behavioral: { totalPageViews: 8, uniquePageViews: 5, totalSessions: 2, avgSessionDuration: 180, pagesPerSession: 4, returnVisits: 1, lastSessionDate: '2026-03-25T07:00:00Z', pagesViewed: [{ path: '/services/hydrafacial', category: 'service', viewCount: 2, totalTimeSeconds: 90, lastViewed: '2026-03-25' }, { path: '/pricing', category: 'pricing', viewCount: 1, totalTimeSeconds: 45, lastViewed: '2026-03-25' }] },
        engagement: { chatInteractions: 0, chatMessages: 0, formSubmissions: 0, emailOpens: 1, emailClicks: 0, smsReplies: 0, phoneCallsMade: 0, downloadedContent: [], quizCompleted: false, consultFormStarted: false, consultFormCompleted: false },
      },
      {
        lead: { id: 'lead_4', name: 'Amanda R.', source: 'google_ads', createdAt: '2026-03-18T12:00:00Z', lastActivityAt: '2026-03-20T11:00:00Z', status: 'new', location: { state: 'WA' } },
        behavioral: { totalPageViews: 4, uniquePageViews: 3, totalSessions: 1, avgSessionDuration: 90, pagesPerSession: 4, returnVisits: 0, lastSessionDate: '2026-03-20T11:00:00Z', pagesViewed: [{ path: '/services/glp-1', category: 'service', viewCount: 1, totalTimeSeconds: 45, lastViewed: '2026-03-20' }] },
        engagement: { chatInteractions: 0, chatMessages: 0, formSubmissions: 0, emailOpens: 0, emailClicks: 0, smsReplies: 0, phoneCallsMade: 0, downloadedContent: [], quizCompleted: false, consultFormStarted: false, consultFormCompleted: false },
      },
      {
        lead: { id: 'lead_5', name: 'Michelle T.', source: 'instagram_organic', createdAt: '2026-03-23T09:00:00Z', lastActivityAt: '2026-03-24T15:00:00Z', status: 'new', location: { city: 'Renton', state: 'WA', distanceMiles: 5 } },
        behavioral: { totalPageViews: 12, uniquePageViews: 7, totalSessions: 3, avgSessionDuration: 240, pagesPerSession: 4, returnVisits: 2, lastSessionDate: '2026-03-24T15:00:00Z', pagesViewed: [{ path: '/results', category: 'results', viewCount: 3, totalTimeSeconds: 120, lastViewed: '2026-03-24' }, { path: '/services/rf-microneedling', category: 'service', viewCount: 2, totalTimeSeconds: 90, lastViewed: '2026-03-24' }] },
        engagement: { chatInteractions: 1, chatMessages: 2, formSubmissions: 0, emailOpens: 1, emailClicks: 1, smsReplies: 0, phoneCallsMade: 0, downloadedContent: [], quizCompleted: false, consultFormStarted: false, consultFormCompleted: false },
      },
    ];

    const scoredLeads = sampleLeads.map(input => ({
      id: input.lead.id,
      name: input.lead.name,
      source: input.lead.source,
      score: scoreLead(input),
    })).sort((a, b) => b.score.totalScore - a.score.totalScore);

    const pipelineScores = scoredLeads.map(l => ({ leadId: l.id, ...l.score }));
    const pipeline = getPipelineSummary(pipelineScores);

    const sourceQuality = getSourceQualityRanking().map(sq => ({
      ...sq,
      leads: sampleLeads.filter(l => l.lead.source === sq.source).length,
      conversions: 0,
    }));

    const calibration = calibrateModel([
      { grade: 'A' as LeadGrade, converted: true, source: 'google_organic' },
      { grade: 'A' as LeadGrade, converted: true, source: 'referral' },
      { grade: 'B' as LeadGrade, converted: true, source: 'meta_ads' },
      { grade: 'B' as LeadGrade, converted: false, source: 'google_ads' },
      { grade: 'C' as LeadGrade, converted: false, source: 'instagram_organic' },
      { grade: 'D' as LeadGrade, converted: false, source: 'tiktok' },
    ]);

    return NextResponse.json({
      leads: scoredLeads,
      pipeline,
      sourceQuality,
      calibration,
    });
  } catch (error) {
    console.error('[Marketing Leads]', error);
    return NextResponse.json({ error: 'Failed to load lead scoring data' }, { status: 500 });
  }
}
