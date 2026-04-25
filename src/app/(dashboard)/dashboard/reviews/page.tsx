'use client';

import { useMemo } from 'react';
import { ArrowRight, Star } from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import DataTable, { type DataTableColumn } from '@/components/dashboard/shared/DataTable';
import StatCard from '@/components/dashboard/shared/StatCard';
import ChartWrapper from '@/components/dashboard/shared/ChartWrapper';
import EmptyState from '@/components/dashboard/shared/EmptyState';

interface ReviewItem {
  id: string;
  platform: string;
  rating: number;
  reviewText: string;
  clientName: string;
  date: string;
  responseStatus: string;
  responseText: string;
  [key: string]: unknown;
}

interface ReviewsPayload {
  status: string;
  label?: string;
  reviews: ReviewItem[];
  stats: {
    avgRating: number;
    totalCount: number;
    byPlatform: { platform: string; count: number }[];
    responseRate: number;
    pendingResponses: number;
  };
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Unknown date';
  return parsed.toLocaleDateString();
}

function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return `${text.slice(0, length - 1)}…`;
}

function RatingCell({ rating }: { rating: number }) {
  const rounded = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rating: ${rounded} out of 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-3.5 w-3.5 ${index < rounded ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );
}

function ResponseBadge({ status }: { status: string }) {
  const normalized = status.trim().toLowerCase();
  const isResponded = ['responded', 'posted', 'completed', 'sent'].some((value) => normalized.includes(value));
  const badgeClass = isResponded
    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
    : 'bg-amber-50 text-amber-700 border-amber-100';

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${badgeClass}`}>
      {status || 'Pending'}
    </span>
  );
}

export default function ReviewsDashboardPage() {
  const { data, error, isLoading, retry } = useDashboardData<ReviewsPayload>('/marketing/reviews', {
    refreshInterval: 60_000,
  });

  const reviews = data?.reviews ?? [];
  const stats = data?.stats ?? {
    avgRating: 0,
    totalCount: 0,
    byPlatform: [],
    responseRate: 0,
    pendingResponses: 0,
  };

  const columns = useMemo<DataTableColumn<ReviewItem>[]>(() => ([
    {
      key: 'date',
      header: 'Date',
      render: (row) => formatDate(row.date),
      accessor: (row) => new Date(row.date).getTime(),
      width: 'min-w-[110px]',
    },
    {
      key: 'platform',
      header: 'Platform',
      render: (row) => row.platform,
      width: 'min-w-[110px]',
    },
    {
      key: 'rating',
      header: 'Rating',
      render: (row) => <RatingCell rating={row.rating} />,
      accessor: (row) => row.rating,
      width: 'min-w-[120px]',
    },
    {
      key: 'clientName',
      header: 'Client',
      render: (row) => row.clientName,
      width: 'min-w-[130px]',
    },
    {
      key: 'reviewText',
      header: 'Review',
      render: (row) => (
        <p className="max-w-[400px] text-sm leading-5 text-rani-navy/90" title={row.reviewText}>
          {truncate(row.reviewText || 'No review text', 140)}
        </p>
      ),
      width: 'min-w-[280px]',
      sortable: false,
    },
    {
      key: 'responseStatus',
      header: 'Response',
      render: (row) => <ResponseBadge status={row.responseStatus} />,
      accessor: (row) => row.responseStatus,
      width: 'min-w-[130px]',
    },
    {
      key: 'actions',
      header: 'Action',
      render: (row) => (
        <a
          href={`/dashboard/marketing/reviews?reviewId=${encodeURIComponent(row.id)}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-rani-navy hover:text-rani-gold"
        >
          Open
          <ArrowRight className="h-3.5 w-3.5" />
        </a>
      ),
      sortable: false,
      width: 'min-w-[90px]',
      align: 'right',
    },
  ]), []);

  return (
    <main className="space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-rani-navy">Reviews Dashboard</h1>
        <p className="text-sm text-rani-muted">Live trust signals from Airtable Reviews with response queue visibility.</p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Average Rating"
          icon="star"
          value={stats.avgRating}
          loading={isLoading}
          error={error}
          onRetry={retry}
        />
        <StatCard
          title="Total Reviews"
          icon="users"
          value={stats.totalCount}
          format="number"
          loading={isLoading}
          error={error}
          onRetry={retry}
        />
        <StatCard
          title="Response Rate"
          icon="target"
          value={stats.responseRate}
          format="percent"
          loading={isLoading}
          error={error}
          onRetry={retry}
        />
        <StatCard
          title="Pending Responses"
          icon="message"
          value={stats.pendingResponses}
          format="number"
          loading={isLoading}
          error={error}
          onRetry={retry}
        />
      </section>

      {!isLoading && !error && reviews.length === 0 ? (
        <div className="rounded-xl border border-rani-border bg-white/80">
          <EmptyState
            icon="star"
            title="No reviews found"
            description="Once reviews sync into Airtable, this queue will show ratings, sentiment, and response status."
          />
        </div>
      ) : (
        <ChartWrapper
          title="Review Queue"
          subtitle="Sorted by most recent reviews"
          loading={isLoading}
          error={error}
          onRetry={retry}
          isEmpty={!isLoading && !error && reviews.length === 0}
          emptyTitle="No reviews available"
          emptyDescription="There are no review records to display yet."
          emptyIcon="star"
          chartType="bar"
          height="h-auto"
        >
          <DataTable<ReviewItem>
            title="Reviews"
            subtitle="Latest 100 reviews from Airtable"
            columns={columns}
            data={reviews}
            rowKey={(row) => row.id}
            loading={isLoading}
            error={error}
            onRetry={retry}
            searchPlaceholder="Search reviews, clients, or platforms..."
            searchFields={['platform', 'clientName', 'reviewText', 'responseStatus']}
            paginate
            pageSize={12}
            emptyTitle="No reviews available"
            emptyDescription="Try again after the next sync."
          />
        </ChartWrapper>
      )}
    </main>
  );
}
