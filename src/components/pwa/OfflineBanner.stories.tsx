import type { Meta, StoryObj } from '@storybook/react';
import OfflineBanner from './OfflineBanner';

const meta: Meta<typeof OfflineBanner> = {
  title: 'PWA/OfflineBanner',
  component: OfflineBanner,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof OfflineBanner>;

export const Default: Story = {};
