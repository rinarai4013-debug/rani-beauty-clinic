import type { Meta, StoryObj } from '@storybook/react';
import {
  SkeletonBar,
  KPICardSkeleton,
  KPIRowSkeleton,
  PanelSkeleton,
  TableSkeleton,
  ChartSkeleton,
  PageSkeleton,
} from './DashboardSkeleton';

const meta: Meta = {
  title: 'Dashboard/Shared/DashboardSkeleton',
  tags: ['autodocs'],
  decorators: [(Story) => <div className="p-6"><Story /></div>],
};
export default meta;

export const Bar: StoryObj = {
  render: () => (
    <div className="space-y-2 max-w-md">
      <SkeletonBar className="h-4 w-48" />
      <SkeletonBar className="h-4 w-32" />
      <SkeletonBar className="h-4 w-64" />
    </div>
  ),
};

export const KPICardHero: StoryObj = {
  render: () => (
    <div className="max-w-sm">
      <KPICardSkeleton size="hero" />
    </div>
  ),
};

export const KPICardCompact: StoryObj = {
  render: () => (
    <div className="max-w-sm">
      <KPICardSkeleton size="compact" />
    </div>
  ),
};

export const KPIRow: StoryObj = {
  render: () => <KPIRowSkeleton count={4} />,
};

export const Panel: StoryObj = {
  render: () => (
    <div className="max-w-md">
      <PanelSkeleton rows={4} />
    </div>
  ),
};

export const Table: StoryObj = {
  render: () => <TableSkeleton rows={5} cols={4} />,
};

export const Chart: StoryObj = {
  render: () => (
    <div className="max-w-lg">
      <ChartSkeleton />
    </div>
  ),
};

export const FullPage: StoryObj = {
  render: () => <PageSkeleton />,
};
