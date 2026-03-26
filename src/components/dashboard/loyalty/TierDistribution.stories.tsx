import type { Meta, StoryObj } from '@storybook/react';
import TierDistribution from './TierDistribution';

const meta: Meta<typeof TierDistribution> = {
  title: 'Dashboard/Loyalty/TierDistribution',
  component: TierDistribution,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-md p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof TierDistribution>;

export const Default: Story = {};
