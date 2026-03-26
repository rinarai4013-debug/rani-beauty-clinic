import { NextRequest, NextResponse } from 'next/server';
import { Tables, fetchAll, createRecord, updateRecord } from '@/lib/airtable/client';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { FIELDS } from '@/lib/airtable/tables';

// Google Business Profile API config
const GOOGLE_PLACE_ID = process.env.GOOGLE_PLACE_ID; // Rani Beauty Clinic, Renton WA
const GOOGLE_API_KEY = process.env.GOOGLE_REVIEWS_API_KEY;

interface GoogleReview {
  author_name: string;
  rating: number;
  text: string;
  time: number; // Unix timestamp
  relative_time_description: string;
  profile_photo_url?: string;
  author_url?: string;
}

interface GooglePlaceDetails {
  result: {
    name: string;
    rating: number;
    user_ratings_total: number;
    reviews?: GoogleReview[];
  };
  status: string;
}

interface ReviewFields {
  [FIELDS.reviews.platform]: string;
  [FIELDS.reviews.starRating]: number;
  [FIELDS.reviews.reviewText]: string;
  [FIELDS.reviews.reviewerName]: string;
  [FIELDS.reviews.reviewDate]: string;
  [FIELDS.reviews.sentiment]: string;
  [FIELDS.reviews.responseStatus]: string;
  [FIELDS.reviews.aiDraftResponse]?: string;
}

function classifySentiment(rating: number, text: string): string {
  if (rating >= 4) return 'Positive';
  if (rating === 3) {
    const negativeTerms = ['disappointed', 'bad', 'terrible', 'worst', 'rude', 'unprofessional'];
    const hasNeg = negativeTerms.some(t => text.toLowerCase().includes(t));
    return hasNeg ? 'Negative' : 'Neutral';
  }
  return 'Negative';
}

function generateReviewDate(unixTimestamp: number): string {
  return new Date(unixTimestamp * 1000).toISOString().split('T')[0];
}

// POST - sync Google reviews to Airtable Reviews table
export async function POST(request: NextRequest) {
  try {
    // Auth: session or cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (authHeader === `Bearer ${cronSecret}` && cronSecret) {
      // Authorized via cron secret
    } else {
      const session = await getSession();
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (!hasPermission(session.role, 'manage_settings')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    if (!GOOGLE_API_KEY || !GOOGLE_PLACE_ID) {
      return NextResponse.json({
        success: false,
        error: 'Google Reviews not configured',
        action: 'Add GOOGLE_REVIEWS_API_KEY and GOOGLE_PLACE_ID to .env.local',
      }, { status: 400 });
    }

    // Fetch reviews from Google Places API
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${GOOGLE_PLACE_ID}&fields=name,rating,user_ratings_total,reviews&reviews_sort=newest&key=${GOOGLE_API_KEY}`;
    const googleRes = await fetch(url);
    const data: GooglePlaceDetails = await googleRes.json();

    if (data.status !== 'OK') {
      return NextResponse.json({
        success: false,
        error: `Google API error: ${data.status}`,
      }, { status: 502 });
    }

    const googleReviews = data.result.reviews || [];

    // Fetch existing reviews from Airtable to avoid duplicates
    const existingReviews = await fetchAll<Record<string, unknown>>(
      Tables.reviews(),
      {
        filterByFormula: `{${FIELDS.reviews.platform}} = "Google"`,
        fields: [FIELDS.reviews.reviewerName, FIELDS.reviews.reviewDate, FIELDS.reviews.starRating],
      },
      true
    );

    // Build dedup key: reviewerName + date + rating
    const existingKeys = new Set(
      existingReviews.map(r => {
        const name = String(r.fields[FIELDS.reviews.reviewerName] || '');
        const date = String(r.fields[FIELDS.reviews.reviewDate] || '');
        const rating = Number(r.fields[FIELDS.reviews.starRating] || 0);
        return `${name}|${date}|${rating}`;
      })
    );

    let created = 0;
    let skipped = 0;

    for (const review of googleReviews) {
      const reviewDate = generateReviewDate(review.time);
      const dedupKey = `${review.author_name}|${reviewDate}|${review.rating}`;

      if (existingKeys.has(dedupKey)) {
        skipped++;
        continue;
      }

      const sentiment = classifySentiment(review.rating, review.text || '');

      const fields: ReviewFields = {
        [FIELDS.reviews.platform]: 'Google',
        [FIELDS.reviews.starRating]: review.rating,
        [FIELDS.reviews.reviewText]: review.text || '',
        [FIELDS.reviews.reviewerName]: review.author_name,
        [FIELDS.reviews.reviewDate]: reviewDate,
        [FIELDS.reviews.sentiment]: sentiment,
        [FIELDS.reviews.responseStatus]: 'Pending',
      };

      await createRecord(Tables.reviews(), fields);
      existingKeys.add(dedupKey);
      created++;
    }

    return NextResponse.json({
      success: true,
      data: {
        overallRating: data.result.rating,
        totalReviews: data.result.user_ratings_total,
        fetchedReviews: googleReviews.length,
        newReviewsSynced: created,
        duplicatesSkipped: skipped,
        syncedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Google Reviews sync error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to sync Google reviews' },
      { status: 500 }
    );
  }
}

// GET - check Google Reviews sync status
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const configured = !!(GOOGLE_API_KEY && GOOGLE_PLACE_ID);

    // Get latest reviews from Airtable
    const recentReviews = await fetchAll<Record<string, unknown>>(
      Tables.reviews(),
      {
        filterByFormula: `{${FIELDS.reviews.platform}} = "Google"`,
        sort: [{ field: FIELDS.reviews.reviewDate, direction: 'desc' }],
        maxRecords: 10,
      },
      true
    );

    const totalGoogle = await fetchAll<Record<string, unknown>>(
      Tables.reviews(),
      {
        filterByFormula: `{${FIELDS.reviews.platform}} = "Google"`,
        fields: [FIELDS.reviews.starRating],
      },
      true
    );

    const avgRating = totalGoogle.length > 0
      ? Math.round(
          (totalGoogle.reduce((s, r) => s + Number(r.fields[FIELDS.reviews.starRating] || 0), 0) /
            totalGoogle.length) *
            10
        ) / 10
      : 0;

    const pendingResponse = totalGoogle.filter(
      r => r.fields[FIELDS.reviews.responseStatus as keyof typeof r.fields] === 'Pending'
    ).length;

    return NextResponse.json({
      configured,
      action: configured
        ? 'Ready to sync'
        : 'Add GOOGLE_REVIEWS_API_KEY and GOOGLE_PLACE_ID to .env.local',
      stats: {
        totalGoogleReviews: totalGoogle.length,
        averageRating: avgRating,
        pendingResponses: pendingResponse,
      },
      recentReviews: recentReviews.slice(0, 5).map(r => ({
        id: r.id,
        reviewer: r.fields[FIELDS.reviews.reviewerName],
        rating: r.fields[FIELDS.reviews.starRating],
        text: r.fields[FIELDS.reviews.reviewText],
        date: r.fields[FIELDS.reviews.reviewDate],
        sentiment: r.fields[FIELDS.reviews.sentiment],
        responseStatus: r.fields[FIELDS.reviews.responseStatus],
      })),
    });
  } catch (error) {
    console.error('Google Reviews status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get review status' },
      { status: 500 }
    );
  }
}
