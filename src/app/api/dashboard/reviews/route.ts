import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';

interface ReviewFields {
  'Rating': number;
  'Source': string;
  'Date': string;
  'Comment': string;
  'Reviewer Name': string;
  'Sentiment': string;
  'Response Status': string;
  'Response Draft': string;
  'Response Sent': string;
  'Service': string;
  'Provider': string;
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (!hasPermission(session.role, 'view_executive')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const cacheKey = 'reviews';
  const cached = cache.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const records = await fetchAll<ReviewFields>(Tables.reviews(), {
      sort: [{ field: 'Date', direction: 'desc' }],
    });

    const reviews = records.map((r) => ({
      id: r.id,
      rating: r.fields['Rating'] || 0,
      source: r.fields['Source'] || 'Google',
      date: r.fields['Date'] || '',
      comment: r.fields['Comment'] || '',
      reviewerName: r.fields['Reviewer Name'] || 'Anonymous',
      sentiment: r.fields['Sentiment'] || 'neutral',
      responseStatus: r.fields['Response Status'] || 'pending',
      responseDraft: r.fields['Response Draft'] || '',
      responseSent: r.fields['Response Sent'] || '',
      service: r.fields['Service'] || '',
      provider: r.fields['Provider'] || '',
    }));

    // Calculate stats
    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
      : 0;
    const fiveStarCount = reviews.filter(r => r.rating === 5).length;
    const fiveStarPercent = totalReviews > 0 ? Math.round((fiveStarCount / totalReviews) * 100) : 0;
    const pendingResponses = reviews.filter(r => r.responseStatus === 'pending').length;
    const sentimentBreakdown = {
      positive: reviews.filter(r => r.sentiment === 'positive').length,
      neutral: reviews.filter(r => r.sentiment === 'neutral').length,
      negative: reviews.filter(r => r.sentiment === 'negative').length,
    };

    // Source breakdown
    const sourceBreakdown: Record<string, number> = {};
    reviews.forEach(r => {
      sourceBreakdown[r.source] = (sourceBreakdown[r.source] || 0) + 1;
    });

    const data = {
      success: true,
      data: {
        reviews,
        stats: {
          totalReviews,
          avgRating,
          fiveStarPercent,
          pendingResponses,
          sentimentBreakdown,
          sourceBreakdown,
        },
      },
    };

    cache.set(cacheKey, data, TTL.MODERATE);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Reviews route error:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}
