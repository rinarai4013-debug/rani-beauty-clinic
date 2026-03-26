import type { Meta, StoryObj } from '@storybook/react';
import SoundProvider from './SoundProvider';

const meta: Meta<typeof SoundProvider> = {
  title: 'Dashboard/Sound/SoundProvider',
  component: SoundProvider,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof SoundProvider>;

export const Default: Story = {
  args: {
    children: <div className="p-6 text-sm text-rani-muted">SoundProvider manages audio context for dashboard sounds.</div>,
  },
};
