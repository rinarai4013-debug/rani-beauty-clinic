import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, createRecord } from '@/lib/airtable/client';
import { cache } from '@/lib/cache';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!hasPermission(session.role, 'entry_review')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.platform) {
      return NextResponse.json({ error: 'Platform is required' }, { status: 400 });
    }
    if (!body.starRating || body.starRating < 1 || body.starRating > 5) {
      return NextResponse.json({ error: 'Star rating (1-5) is required' }, { status: 400 });
    }
    if (!body.reviewText) {
      return NextResponse.json({ error: 'Review text is required' }, { status: 400 });
    }
    if (!body.reviewerName) {
      return NextResponse.json({ error: 'Reviewer name is required' }, { status: 400 });
    }

    const sentiment = body.starRating >= 4 ? 'Positive' : body.starRating >= 3 ? 'Neutral' : 'Negative';

    // Valid Airtable select options:
    // Platform: Google, Yelp, Facebook, Instagram, RealSelf
    // Sentiment: Positive, Neutral, Negative
    // Response Status: Pending, Drafted, Approved, Posted, Escalated
    const platformMap: Record<string, string> = {
      'google': 'Google', 'yelp': 'Yelp', 'facebook': 'Facebook',
      'instagram': 'Instagram', 'other': 'Google',
    };
    const recordId = await createRecord(Tables.reviews(), {
      'Platform': platformMap[body.platform] || body.platform,
      'Star Rating': body.starRating,
      'Review Text': body.reviewText,
      'Reviewer Name': body.reviewerName,
      'Review Date': new Date().toISOString().split('T')[0],
      'Sentiment': sentiment,
      'Response Status': 'Pending',
    });

    cache.invalidate('kpis');

    return NextResponse.json({ success: true, recordId });
  } catch (error) {
    console.error('Error recording review:', error);
    return NextResponse.json({ error: 'Failed to record review' }, { status: 500 });
  }
}
