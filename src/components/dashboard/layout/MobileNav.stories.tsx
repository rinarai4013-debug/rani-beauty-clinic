import type { Meta, StoryObj } from '@storybook/react';
import MobileNav from './MobileNav';

const meta: Meta<typeof MobileNav> = {
  title: 'Dashboard/Layout/MobileNav',
  component: MobileNav,
  tags: ['autodocs'],
  parameters: {
    viewport: { defaultViewport: 'mobile' },
    layout: 'fullscreen',
  },
};
export default meta;
type Story = StoryObj<typeof MobileNav>;

export const Default: Story = {};
