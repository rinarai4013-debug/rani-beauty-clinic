import type { Meta, StoryObj } from '@storybook/react';
import {
  Shimmer,
  StatCardSkeleton,
  StatRowSkeleton,
  PanelSkeleton,
  TableSkeleton,
  ChartSkeleton,
  PageSkeleton,
} from './LoadingSkeleton';

/* ─── Shimmer ──────────────────────────────────────────────────────── */

const shimmerMeta: Meta<typeof Shimmer> = {
  title: 'Dashboard/Shared/Shimmer',
  component: Shimmer,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-md p-6"><Story /></div>],
};
export default shimmerMeta;
type ShimmerStory = StoryObj<typeof Shimmer>;

export const Default: ShimmerStory = {
  args: { className: 'h-4 w-48' },
};

export const RoundedFull: ShimmerStory = {
  args: { className: 'h-10 w-10', rounded: 'full' },
};

export const LargeBar: ShimmerStory = {
  args: { className: 'h-8 w-full', rounded: 'lg' },
};

/* ─── StatCardSkeleton ─────────────────────────────────────────────── */

export const StatCardHero: StoryObj = {
  render: () => (
    <div className="max-w-sm">
      <StatCardSkeleton size="hero" />
    </div>
  ),
};

export const StatCardStandard: StoryObj = {
  render: () => (
    <div className="max-w-sm">
      <StatCardSkeleton size="standard" />
    </div>
  ),
};

export const StatCardCompact: StoryObj = {
  render: () => (
    <div className="max-w-sm">
      <StatCardSkeleton size="compact" />
    </div>
  ),
};

/* ─── StatRowSkeleton ──────────────────────────────────────────────── */

export const StatRow4: StoryObj = {
  render: () => <StatRowSkeleton count={4} size="hero" />,
};

export const StatRow3: StoryObj = {
  render: () => <StatRowSkeleton count={3} size="standard" />,
};

/* ─── PanelSkeleton ────────────────────────────────────────────────── */

export const PanelDefault: StoryObj = {
  render: () => (
    <div className="max-w-md">
      <PanelSkeleton rows={4} showHeader />
    </div>
  ),
};

export const PanelNoHeader: StoryObj = {
  render: () => (
    <div className="max-w-md">
      <PanelSkeleton rows={3} showHeader={false} />
    </div>
  ),
};

/* ─── TableSkeleton ────────────────────────────────────────────────── */

export const TableDefault: StoryObj = {
  render: () => <TableSkeleton rows={5} cols={5} />,
};

export const TableWide: StoryObj = {
  render: () => <TableSkeleton rows={8} cols={7} />,
};

/* ─── ChartSkeleton ────────────────────────────────────────────────── */

export const ChartBar: StoryObj = {
  render: () => (
    <div className="max-w-lg">
      <ChartSkeleton type="bar" />
    </div>
  ),
};

export const ChartLine: StoryObj = {
  render: () => (
    <div className="max-w-lg">
      <ChartSkeleton type="line" />
    </div>
  ),
};

export const ChartPie: StoryObj = {
  render: () => (
    <div className="max-w-lg">
      <ChartSkeleton type="pie" />
    </div>
  ),
};

/* ─── PageSkeleton ─────────────────────────────────────────────────── */

export const PageStandard: StoryObj = {
  render: () => <PageSkeleton layout="standard" />,
};

export const PageTable: StoryObj = {
  render: () => <PageSkeleton layout="table" />,
};

export const PageDetail: StoryObj = {
  render: () => <PageSkeleton layout="detail" />,
};
