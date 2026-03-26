import type { Meta, StoryObj } from '@storybook/react';
import ComposeMessage from './ComposeMessage';

const meta: Meta<typeof ComposeMessage> = {
  title: 'Dashboard/Communications/ComposeMessage',
  component: ComposeMessage,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-2xl p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof ComposeMessage>;

export const Default: Story = {};
