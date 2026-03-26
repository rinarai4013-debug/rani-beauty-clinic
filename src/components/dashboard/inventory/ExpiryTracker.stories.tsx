import type { Meta, StoryObj } from '@storybook/react';
import ExpiryTracker from './ExpiryTracker';

const meta: Meta<typeof ExpiryTracker> = {
  title: 'Dashboard/Inventory/ExpiryTracker',
  component: ExpiryTracker,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof ExpiryTracker>;

export const Default: Story = {};
