import type { Meta, StoryObj } from '@storybook/react';
import InboxView from './InboxView';

const meta: Meta<typeof InboxView> = {
  title: 'Dashboard/Communications/InboxView',
  component: InboxView,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof InboxView>;

export const Default: Story = {};
