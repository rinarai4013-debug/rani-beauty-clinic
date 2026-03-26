import type { Meta, StoryObj } from '@storybook/react';
import InstallPrompt from './InstallPrompt';

const meta: Meta<typeof InstallPrompt> = {
  title: 'PWA/InstallPrompt',
  component: InstallPrompt,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof InstallPrompt>;

export const Default: Story = {};
