/**
 * RaniOS Tenant Dashboard — Communications Module Types
 */

export interface InboxSummary {
  total: number;
  unread: number;
  urgent: number;
  channels: { channel: string; count: number }[];
}

export interface MessageTemplate {
  id: string;
  name: string;
  channel: string;
  subject?: string;
  body: string;
  variables: string[];
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  recentReviews: { id: string; rating: number; text: string; date: string; source: string }[];
  ratingDistribution: Record<number, number>;
}
