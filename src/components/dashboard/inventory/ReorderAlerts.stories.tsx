import type { Meta, StoryObj } from '@storybook/react';
import ReorderAlerts from './ReorderAlerts';

const meta: Meta<typeof ReorderAlerts> = {
  title: 'Dashboard/Inventory/ReorderAlerts',
  component: ReorderAlerts,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof ReorderAlerts>;

export const Default: Story = {};
