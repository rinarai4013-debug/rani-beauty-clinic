import type { Meta, StoryObj } from '@storybook/react';
import ConversationThread from './ConversationThread';

const meta: Meta<typeof ConversationThread> = {
  title: 'Dashboard/Communications/ConversationThread',
  component: ConversationThread,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-xl p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof ConversationThread>;

export const Default: Story = {};
