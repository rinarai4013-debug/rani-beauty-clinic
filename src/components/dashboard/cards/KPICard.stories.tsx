import type { Meta, StoryObj } from '@storybook/react';
import KPICard from './KPICard';

const meta: Meta<typeof KPICard> = {
  title: 'Dashboard/Cards/KPICard',
  component: KPICard,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-sm p-6"><Story /></div>],
  argTypes: {
    size: { control: 'select', options: ['hero', 'standard', 'compact'] },
    icon: { control: 'select', options: ['dollar-sign', 'calendar', 'target', 'users', 'star'] },
  },
};
export default meta;
type Story = StoryObj<typeof KPICard>;

export const Revenue: Story = {
  args: {
    title: 'Monthly Revenue',
    value: 42850,
    prefix: '$',
    icon: 'dollar-sign',
    size: 'hero',
    trend: { value: 12.5, direction: 'up', label: 'vs last month' },
    sparklineData: [12, 15, 11, 18, 22, 19, 25, 28, 24, 30, 35, 32],
  },
};

export const Bookings: Story = {
  args: {
    title: 'Total Bookings',
    value: 156,
    icon: 'calendar',
    trend: { value: 3.2, direction: 'up' },
  },
};

export const WithProgress: Story = {
  args: {
    title: 'Monthly Target',
    value: 32500,
    prefix: '$',
    icon: 'target',
    progress: { current: 32500, target: 50000, label: 'Goal: $50K' },
  },
};

export const Loading: Story = {
  args: { title: 'Revenue', value: 0, loading: true, size: 'hero' },
};

export const Compact: Story = {
  args: { title: 'Avg Rating', value: 4.9, suffix: '/5', icon: 'star', size: 'compact' },
};

export const Row: StoryObj = {
  decorators: [(Story) => <div className="p-6"><Story /></div>],
  render: () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
      <KPICard title="Revenue" value={42850} prefix="$" icon="dollar-sign" size="hero" trend={{ value: 12, direction: 'up' }} />
      <KPICard title="Bookings" value={156} icon="calendar" size="hero" trend={{ value: 3, direction: 'up' }} />
      <KPICard title="Consults" value={24} icon="users" size="hero" trend={{ value: 8, direction: 'up' }} />
      <KPICard title="Conversion" value={68} suffix="%" icon="target" size="hero" trend={{ value: 2, direction: 'down' }} />
    </div>
  ),
};
