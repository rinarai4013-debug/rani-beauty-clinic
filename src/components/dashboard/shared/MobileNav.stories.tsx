import type { Meta, StoryObj } from '@storybook/react';
import MobileNav from './MobileNav';

const meta: Meta<typeof MobileNav> = {
  title: 'Dashboard/Shared/MobileNav',
  component: MobileNav,
  tags: ['autodocs'],
  parameters: {
    viewport: { defaultViewport: 'mobile' },
    layout: 'fullscreen',
  },
};
export default meta;
type Story = StoryObj<typeof MobileNav>;

export const CEORole: Story = {
  args: {
    role: 'ceo',
  },
};

export const FrontDeskRole: Story = {
  args: {
    role: 'frontdesk',
  },
};

export const ProviderRole: Story = {
  args: {
    role: 'provider',
  },
};
