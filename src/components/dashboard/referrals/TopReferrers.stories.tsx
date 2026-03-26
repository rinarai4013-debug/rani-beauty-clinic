import type { Meta, StoryObj } from '@storybook/react';
import TopReferrers from './TopReferrers';

const meta: Meta<typeof TopReferrers> = {
  title: 'Dashboard/Referrals/TopReferrers',
  component: TopReferrers,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-md p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof TopReferrers>;

export const Default: Story = {};
