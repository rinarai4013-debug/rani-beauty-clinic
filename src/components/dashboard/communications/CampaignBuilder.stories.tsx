import type { Meta, StoryObj } from '@storybook/react';
import CampaignBuilder from './CampaignBuilder';

const meta: Meta<typeof CampaignBuilder> = {
  title: 'Dashboard/Communications/CampaignBuilder',
  component: CampaignBuilder,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof CampaignBuilder>;

export const Default: Story = {};
