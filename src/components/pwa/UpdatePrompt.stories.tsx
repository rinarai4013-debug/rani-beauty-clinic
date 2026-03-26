import type { Meta, StoryObj } from '@storybook/react';
import UpdatePrompt from './UpdatePrompt';

const meta: Meta<typeof UpdatePrompt> = {
  title: 'PWA/UpdatePrompt',
  component: UpdatePrompt,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof UpdatePrompt>;

export const Default: Story = {};
