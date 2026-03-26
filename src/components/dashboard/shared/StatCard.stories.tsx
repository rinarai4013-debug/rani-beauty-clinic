import type { Meta, StoryObj } from '@storybook/react';
import StatCard, { StatCardRow } from './StatCard';

const meta: Meta<typeof StatCard> = {
  title: 'Dashboard/Shared/StatCard',
  component: StatCard,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-sm p-6"><Story /></div>],
  argTypes: {
    size: { control: 'select', options: ['hero', 'standard', 'compact'] },
    format: { control: 'select', options: ['currency', 'percent', 'number', 'duration'] },
    icon: { control: 'select', options: ['dollar-sign', 'calendar', 'target', 'users', 'star', 'zap', 'phone', 'chart', 'package', 'cart', 'clock', 'shield'] },
  },
};
export default meta;
type Story = StoryObj<typeof StatCard>;

export const Default: Story = {
  args: {
    title: 'Monthly Revenue',
    value: 42850,
    format: 'currency',
    icon: 'dollar-sign',
    trend: { value: 12.5, direction: 'up', label: 'vs last month' },
  },
};

export const HeroSize: Story = {
  args: {
    title: 'Total Revenue',
    value: 142000,
    format: 'currency',
    icon: 'dollar-sign',
    size: 'hero',
    trend: { value: 8.3, direction: 'up', label: 'vs last month' },
    sparklineData: [12, 15, 11, 18, 22, 19, 25, 28, 24, 30, 35, 32],
  },
};

export const CompactSize: Story = {
  args: {
    title: 'Active Clients',
    value: 187,
    format: 'number',
    icon: 'users',
    size: 'compact',
    trend: { value: 3.2, direction: 'up' },
  },
};

export const WithProgress: Story = {
  args: {
    title: 'Monthly Target',
    value: 32500,
    format: 'currency',
    icon: 'target',
    progress: { current: 32500, target: 50000, label: 'Goal: $50K' },
  },
};

export const WithSparkline: Story = {
  args: {
    title: 'Bookings This Week',
    value: 47,
    format: 'number',
    icon: 'calendar',
    sparklineData: [8, 12, 6, 15, 10, 18, 14],
  },
};

export const DownTrend: Story = {
  args: {
    title: 'Cancellations',
    value: 8,
    format: 'number',
    icon: 'calendar',
    trend: { value: 15.3, direction: 'down', label: 'vs last week', upIsGood: false },
  },
};

export const NegativeTrend: Story = {
  args: {
    title: 'Revenue',
    value: 28000,
    format: 'currency',
    icon: 'dollar-sign',
    trend: { value: 5.2, direction: 'down', label: 'vs last month' },
  },
};

export const PercentFormat: Story = {
  args: {
    title: 'Conversion Rate',
    value: 68.5,
    format: 'percent',
    icon: 'target',
    trend: { value: 2.1, direction: 'up' },
  },
};

export const DurationFormat: Story = {
  args: {
    title: 'Avg. Appointment',
    value: 75,
    format: 'duration',
    icon: 'clock',
  },
};

export const Loading: Story = {
  args: {
    title: 'Revenue',
    loading: true,
  },
};

export const ErrorStory: Story = {
  name: 'Error',
  args: {
    title: 'Revenue',
    error: new Error('Failed to load'),
    onRetry: () => {},
  },
};

export const NullValue: Story = {
  args: {
    title: 'Pending Data',
    value: null,
    icon: 'chart',
  },
};

/* ─── StatCardRow ──────────────────────────────────────────────────── */

export const Row4Cards: StoryObj = {
  decorators: [(Story) => <div className="p-6"><Story /></div>],
  render: () => (
    <StatCardRow columns={4}>
      <StatCard title="Revenue" value={42850} format="currency" icon="dollar-sign" trend={{ value: 12.5, direction: 'up' }} />
      <StatCard title="Bookings" value={156} format="number" icon="calendar" trend={{ value: 3.2, direction: 'up' }} />
      <StatCard title="Consults" value={24} format="number" icon="users" trend={{ value: 8.0, direction: 'up' }} />
      <StatCard title="Conversion" value={68} format="percent" icon="target" trend={{ value: 1.5, direction: 'down' }} />
    </StatCardRow>
  ),
};
