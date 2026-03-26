import type { Meta, StoryObj } from '@storybook/react';
import EmptyState, { NoSearchResults, NoFilterResults, NoNotifications } from './EmptyState';

const meta: Meta<typeof EmptyState> = {
  title: 'Dashboard/Shared/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-2xl mx-auto p-6"><Story /></div>],
  argTypes: {
    icon: {
      control: 'select',
      options: ['calendar', 'users', 'dollar', 'chart', 'package', 'message', 'star', 'trending', 'shield', 'brain', 'phone', 'megaphone', 'cart', 'clock', 'file', 'inbox', 'search', 'zap', 'bell', 'filter'],
    },
    mood: { control: 'select', options: ['neutral', 'positive', 'attention'] },
    compact: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  args: {
    title: 'No data available',
    description: 'Start adding data to see it displayed here.',
    icon: 'chart',
  },
};

export const WithAction: Story = {
  args: {
    title: 'No clients found',
    description: 'Add your first client to get started.',
    icon: 'users',
    action: { label: 'Add Client', onClick: () => {} },
  },
};

export const WithTwoActions: Story = {
  args: {
    title: 'No appointments today',
    description: 'Your schedule is clear for now.',
    icon: 'calendar',
    mood: 'positive',
    action: { label: 'Book Appointment', onClick: () => {} },
    secondaryAction: { label: 'View Schedule', onClick: () => {} },
  },
};

export const Compact: Story = {
  args: {
    title: 'No items in this category',
    description: 'Try adjusting your filters.',
    compact: true,
    icon: 'filter',
  },
};

export const AttentionMood: Story = {
  args: {
    title: 'Action required',
    description: 'Some alerts need your attention.',
    icon: 'bell',
    mood: 'attention',
    action: { label: 'View Alerts', onClick: () => {} },
  },
};

export const PositiveMood: Story = {
  args: {
    title: 'All caught up!',
    description: 'No pending tasks at the moment.',
    icon: 'zap',
    mood: 'positive',
  },
};

/* ─── Preset variants ──────────────────────────────────────────────── */

export const SearchNoResults: StoryObj = {
  render: () => <NoSearchResults query="Botox premium" onClear={() => {}} />,
};

export const FilterNoResults: StoryObj = {
  render: () => <NoFilterResults onClear={() => {}} />,
};

export const Notifications: StoryObj = {
  render: () => <NoNotifications />,
};
