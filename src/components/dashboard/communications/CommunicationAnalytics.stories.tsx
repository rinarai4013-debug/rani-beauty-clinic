import type { Meta, StoryObj } from '@storybook/react';
import CommunicationAnalytics from './CommunicationAnalytics';

const meta: Meta<typeof CommunicationAnalytics> = {
  title: 'Dashboard/Communications/CommunicationAnalytics',
  component: CommunicationAnalytics,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof CommunicationAnalytics>;

export const Default: Story = {};
