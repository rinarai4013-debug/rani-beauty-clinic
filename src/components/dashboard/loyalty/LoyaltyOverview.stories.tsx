import type { Meta, StoryObj } from '@storybook/react';
import LoyaltyOverview from './LoyaltyOverview';

const meta: Meta<typeof LoyaltyOverview> = {
  title: 'Dashboard/Loyalty/LoyaltyOverview',
  component: LoyaltyOverview,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof LoyaltyOverview>;

export const Default: Story = {};
