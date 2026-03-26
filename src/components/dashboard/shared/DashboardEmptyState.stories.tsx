import type { Meta, StoryObj } from '@storybook/react';
import DashboardEmptyState from './DashboardEmptyState';

const meta: Meta<typeof DashboardEmptyState> = {
  title: 'Dashboard/Shared/DashboardEmptyState',
  component: DashboardEmptyState,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-2xl mx-auto p-6"><Story /></div>],
  argTypes: {
    icon: {
      control: 'select',
      options: ['calendar', 'users', 'dollar', 'chart', 'package', 'message', 'star', 'trending', 'shield', 'brain', 'phone', 'megaphone', 'cart', 'clock', 'file'],
    },
    compact: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<typeof DashboardEmptyState>;

export const Default: Story = {
  args: {
    title: 'No data available',
    description: 'Start tracking metrics to see data here.',
    icon: 'chart',
  },
};

export const WithAction: Story = {
  args: {
    title: 'No appointments scheduled',
    description: 'Book your first appointment to get started.',
    icon: 'calendar',
    action: { label: 'Book Now', onClick: () => {} },
  },
};

export const WithHrefAction: Story = {
  args: {
    title: 'No clients found',
    description: 'Import your client list or add clients manually.',
    icon: 'users',
    action: { label: 'Add Client', href: '/dashboard/clients/new' },
  },
};

export const Compact: Story = {
  args: {
    title: 'No items in this view',
    description: 'Try adjusting your filters.',
    compact: true,
    icon: 'package',
  },
};
