import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import {
  calculateReviewStats, analyzeSentiment, compareWithCompetitors,
  type Review, type CompetitorReviewData,
} from '@/lib/marketing/review-engine';

/**
 * GET /api/dashboard/marketing/reviews
 * Review management dashboard — reviews, stats, sentiment, competitor comparison.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(session.role, 'view_revenue')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Sample reviews — in production, fetched from Airtable Reviews table
    const reviews: Review[] = [
      { id: 'r1', platform: 'google', rating: 5, reviewerName: 'Maria S.', reviewText: 'Amazing experience at Rani Beauty Clinic! The staff was incredibly professional and friendly. My Sofwave treatment exceeded all my expectations. The results are stunning and I feel so confident. Highly recommend!', date: '2026-03-23T10:00:00Z', service: 'Sofwave', provider: 'Mom', responseStatus: 'published', verified: true },
      { id: 'r2', platform: 'google', rating: 5, reviewerName: 'Jessica L.', reviewText: 'Best HydraFacial I have ever had! Clean facility, gentle provider, and my skin is glowing. Love this place!', date: '2026-03-20T15:00:00Z', service: 'HydraFacial', provider: 'Mom', responseStatus: 'published', verified: true },
      { id: 'r3', platform: 'google', rating: 4, reviewerName: 'Karen P.', reviewText: 'Good experience overall. The treatment was effective and the staff was nice. Had to wait about 15 minutes past my appointment time though.', date: '2026-03-18T11:00:00Z', service: 'VI Peel', responseStatus: 'published', verified: true },
      { id: 'r4', platform: 'yelp', rating: 5, reviewerName: 'Diana M.', reviewText: 'I cannot say enough great things about Rani Beauty Clinic. The wellness injections have transformed my energy levels. The NAD+ injection especially has been a game-changer. Professional, knowledgeable, and caring team.', date: '2026-03-15T09:00:00Z', service: 'NAD+ Injection', responseStatus: 'published', verified: true },
      { id: 'r5', platform: 'google', rating: 3, reviewerName: 'Patricia N.', reviewText: 'The treatment itself was fine but I felt the pricing was on the expensive side. Would have appreciated more transparency about costs upfront.', date: '2026-03-12T14:00:00Z', service: 'RF Microneedling', responseStatus: 'pending', verified: true },
      { id: 'r6', platform: 'google', rating: 5, reviewerName: 'Rachel B.', reviewText: 'The GLP-1 weight loss program has been incredible. Down 18 pounds in two months with amazing support from the clinic. They really care about your results and check in regularly.', date: '2026-03-10T16:00:00Z', service: 'GLP-1', responseStatus: 'published', verified: true },
      { id: 'r7', platform: 'google', rating: 5, reviewerName: 'Stephanie K.', reviewText: 'Came in for Botox and the results are so natural! My friends keep asking what my secret is. The provider really took the time to understand what I wanted.', date: '2026-03-08T11:00:00Z', service: 'Botox', provider: 'Mom', responseStatus: 'published', verified: true },
      { id: 'r8', platform: 'google', rating: 2, reviewerName: 'Linda W.', reviewText: 'Disappointed with my experience. The wait was over 30 minutes and I felt rushed during the actual treatment. Expected more for the price.', date: '2026-03-05T13:00:00Z', responseStatus: 'pending', verified: true },
    ];

    // Analyze sentiment for each review
    for (const review of reviews) {
      review.sentiment = analyzeSentiment(review.reviewText, review.rating);
    }

    const stats = calculateReviewStats(reviews);

    // Competitor data — in production from competitor intelligence table
    const competitors: CompetitorReviewData[] = [
      { name: 'Seattle Skin & Laser', platform: 'google', totalReviews: 312, avgRating: 4.6, reviewsPerMonth: 8 },
      { name: 'Eastside Aesthetics', platform: 'google', totalReviews: 198, avgRating: 4.7, reviewsPerMonth: 6 },
      { name: 'PNW Beauty Lab', platform: 'google', totalReviews: 145, avgRating: 4.4, reviewsPerMonth: 4 },
    ];

    const comparison = compareWithCompetitors(reviews, competitors);

    return NextResponse.json({
      reviews,
      stats,
      competitorComparison: {
        ourRank: comparison.ourRank,
        totalCompetitors: competitors.length + 1,
        insights: comparison.insights,
      },
    });
  } catch (error) {
    console.error('[Marketing Reviews]', error);
    return NextResponse.json({ error: 'Failed to load review data' }, { status: 500 });
  }
}
