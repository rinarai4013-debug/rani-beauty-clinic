import type { Meta, StoryObj } from '@storybook/react';
import UsageAnalytics from './UsageAnalytics';

const meta: Meta<typeof UsageAnalytics> = {
  title: 'Dashboard/Inventory/UsageAnalytics',
  component: UsageAnalytics,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof UsageAnalytics>;

export const Default: Story = {};
