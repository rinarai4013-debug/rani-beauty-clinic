import type { Meta, StoryObj } from '@storybook/react';
import { ErrorState, InlineError } from './ErrorState';

const meta: Meta<typeof ErrorState> = {
  title: 'Dashboard/Shared/ErrorState',
  component: ErrorState,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-2xl mx-auto p-6"><Story /></div>],
  argTypes: {
    compact: { control: 'boolean' },
    onRetry: { action: 'retry clicked' },
  },
};
export default meta;
type Story = StoryObj<typeof ErrorState>;

export const Unknown: Story = {
  args: {
    error: new Error('Something went wrong'),
    onRetry: () => {},
  },
};

export const NetworkError: Story = {
  args: {
    error: new Error('NetworkError: Failed to fetch'),
    onRetry: () => {},
  },
};

export const ServerError: Story = {
  args: {
    error: new Error('500 Internal Server Error'),
    onRetry: () => {},
  },
};

export const AuthError: Story = {
  args: {
    error: new Error('401 Unauthorized'),
    onRetry: () => {},
  },
};

export const CustomTitleAndDescription: Story = {
  args: {
    title: 'Revenue data unavailable',
    description: 'We could not load your revenue metrics. Please try again in a moment.',
    onRetry: () => {},
  },
};

export const Compact: Story = {
  args: {
    error: new Error('Network error'),
    compact: true,
    onRetry: () => {},
  },
};

export const CompactWithoutRetry: Story = {
  args: {
    error: new Error('Something broke'),
    compact: true,
  },
};

export const WithoutRetry: Story = {
  args: {
    error: new Error('Unrecoverable error'),
  },
};

/* ─── InlineError ──────────────────────────────────────────────────── */

export const InlineDefault: StoryObj<typeof InlineError> = {
  render: () => (
    <div className="max-w-sm bg-white rounded-xl border border-gray-200 p-4">
      <InlineError message="Failed to load data" onRetry={() => {}} />
    </div>
  ),
};

export const InlineWithoutRetry: StoryObj<typeof InlineError> = {
  render: () => (
    <div className="max-w-sm bg-white rounded-xl border border-gray-200 p-4">
      <InlineError message="Something went wrong" />
    </div>
  ),
};
