import type { Meta, StoryObj } from '@storybook/react';
import CampaignList from './CampaignList';

const meta: Meta<typeof CampaignList> = {
  title: 'Dashboard/Communications/CampaignList',
  component: CampaignList,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof CampaignList>;

export const Default: Story = {};
