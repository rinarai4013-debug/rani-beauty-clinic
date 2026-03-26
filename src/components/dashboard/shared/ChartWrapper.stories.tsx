import type { Meta, StoryObj } from '@storybook/react';
import ChartWrapper, { ChartLegend } from './ChartWrapper';

const meta: Meta<typeof ChartWrapper> = {
  title: 'Dashboard/Shared/ChartWrapper',
  component: ChartWrapper,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-2xl p-6"><Story /></div>],
  argTypes: {
    chartType: { control: 'select', options: ['bar', 'line', 'pie', 'area'] },
    expandable: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<typeof ChartWrapper>;

const PlaceholderChart = () => (
  <div className="w-full h-full bg-gradient-to-b from-rani-gold/10 to-rani-gold/5 rounded-lg flex items-center justify-center text-rani-muted text-sm font-body">
    Chart renders here
  </div>
);

export const Default: Story = {
  args: {
    title: 'Revenue Trend',
    subtitle: 'Last 30 days',
    children: <PlaceholderChart />,
  },
};

export const WithDateRanges: Story = {
  args: {
    title: 'Revenue Trend',
    children: <PlaceholderChart />,
    dateRanges: [
      { label: '7D', value: '7d' },
      { label: '30D', value: '30d' },
      { label: '90D', value: '90d' },
      { label: 'YTD', value: 'ytd' },
    ],
    activeRange: '30d',
    onRangeChange: () => {},
  },
};

export const Expandable: Story = {
  args: {
    title: 'Revenue by Service',
    children: <PlaceholderChart />,
    expandable: true,
  },
};

export const WithRefreshAndDownload: Story = {
  args: {
    title: 'Lead Conversion',
    children: <PlaceholderChart />,
    onRefresh: () => {},
    onDownload: () => {},
  },
};

export const Loading: Story = {
  args: {
    title: 'Loading Chart',
    children: <PlaceholderChart />,
    loading: true,
    chartType: 'bar',
  },
};

export const LoadingPie: Story = {
  args: {
    title: 'Loading Pie Chart',
    children: <PlaceholderChart />,
    loading: true,
    chartType: 'pie',
  },
};

export const ErrorStory: Story = {
  name: 'Error',
  args: {
    title: 'Revenue Chart',
    children: <PlaceholderChart />,
    error: new Error('API timeout'),
    onRetry: () => {},
  },
};

export const Empty: Story = {
  args: {
    title: 'Booking Trends',
    children: <PlaceholderChart />,
    isEmpty: true,
    emptyTitle: 'No booking data yet',
    emptyDescription: 'Data will appear here once appointments are made.',
    emptyIcon: 'calendar',
  },
};

/* ─── ChartLegend ──────────────────────────────────────────────────── */

export const Legend: StoryObj<typeof ChartLegend> = {
  render: () => (
    <ChartLegend
      items={[
        { label: 'Revenue', color: '#0F1D2C' },
        { label: 'Bookings', color: '#F3D6BE' },
        { label: 'Consults', color: '#059669' },
      ]}
    />
  ),
};
