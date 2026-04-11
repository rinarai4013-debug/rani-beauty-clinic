import { fetchAll, Tables } from '@/lib/airtable/client';
import { FIELDS } from '@/lib/airtable/tables';

export interface ReviewSnapshot {
  id: string;
  platform: string;
  reviewerName: string;
  starRating: number;
  reviewDate: string;
  sentiment: string;
  responseStatus: string;
  reviewText: string;
}

export interface ReviewsSummary {
  totalReviews: number;
  averageRating: number;
  reviewVelocity: number;
  platformBreakdown: Record<string, number>;
  responseBreakdown: Record<string, number>;
  recentReviews: ReviewSnapshot[];
}

export async function getReviewsSummary(days = 30, recentLimit = 10): Promise<ReviewsSummary> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - Math.max(days - 1, 0));
  const fromDate = startDate.toISOString().slice(0, 10);

  const reviews = await fetchAll<Record<string, unknown>>(Tables.reviews(), {
    filterByFormula: `IS_AFTER({${FIELDS.reviews.reviewDate}}, '${fromDate}')`,
    sort: [{ field: FIELDS.reviews.reviewDate, direction: 'desc' }],
  });

  let ratingTotal = 0;
  const platformBreakdown: Record<string, number> = {};
  const responseBreakdown: Record<string, number> = {};

  const recentReviews = reviews.slice(0, recentLimit).map((review) => {
    const platform = String(review.fields[FIELDS.reviews.platform] || 'Unknown');
    const responseStatus = String(review.fields[FIELDS.reviews.responseStatus] || 'Pending');
    const starRating = Number(review.fields[FIELDS.reviews.starRating]) || 0;

    ratingTotal += starRating;
    platformBreakdown[platform] = (platformBreakdown[platform] || 0) + 1;
    responseBreakdown[responseStatus] = (responseBreakdown[responseStatus] || 0) + 1;

    return {
      id: review.id,
      platform,
      reviewerName: String(review.fields[FIELDS.reviews.reviewerName] || 'Anonymous'),
      starRating,
      reviewDate: String(review.fields[FIELDS.reviews.reviewDate] || ''),
      sentiment: String(review.fields[FIELDS.reviews.sentiment] || 'Unknown'),
      responseStatus,
      reviewText: String(review.fields[FIELDS.reviews.reviewText] || ''),
    };
  });

  for (const review of reviews.slice(recentLimit)) {
    const platform = String(review.fields[FIELDS.reviews.platform] || 'Unknown');
    const responseStatus = String(review.fields[FIELDS.reviews.responseStatus] || 'Pending');
    const starRating = Number(review.fields[FIELDS.reviews.starRating]) || 0;

    ratingTotal += starRating;
    platformBreakdown[platform] = (platformBreakdown[platform] || 0) + 1;
    responseBreakdown[responseStatus] = (responseBreakdown[responseStatus] || 0) + 1;
  }

  return {
    totalReviews: reviews.length,
    averageRating: reviews.length > 0 ? Number((ratingTotal / reviews.length).toFixed(2)) : 0,
    reviewVelocity: Number((reviews.length / Math.max(days, 1)).toFixed(2)),
    platformBreakdown,
    responseBreakdown,
    recentReviews,
  };
}
