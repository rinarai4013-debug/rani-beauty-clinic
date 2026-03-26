import type { Meta, StoryObj } from '@storybook/react';
import PWAProvider from './PWAProvider';

const meta: Meta<typeof PWAProvider> = {
  title: 'PWA/PWAProvider',
  component: PWAProvider,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof PWAProvider>;

export const Default: Story = {
  args: {
    children: <div className="p-6 text-sm text-rani-muted">PWAProvider wraps the app with offline detection, install prompts, and update notifications.</div>,
  },
};
