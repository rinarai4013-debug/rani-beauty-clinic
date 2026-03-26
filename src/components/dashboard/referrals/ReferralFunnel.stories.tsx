import type { Meta, StoryObj } from '@storybook/react';
import ReferralFunnel from './ReferralFunnel';

const meta: Meta<typeof ReferralFunnel> = {
  title: 'Dashboard/Referrals/ReferralFunnel',
  component: ReferralFunnel,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-lg p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof ReferralFunnel>;

export const Default: Story = {};
