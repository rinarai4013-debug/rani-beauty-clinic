import type { Meta, StoryObj } from '@storybook/react';
import PortalNav from './PortalNav';

const meta: Meta<typeof PortalNav> = {
  title: 'Portal/PortalNav',
  component: PortalNav,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof PortalNav>;

export const Default: Story = {
  args: { patientName: 'Sarah Johnson' },
};

export const LongName: Story = {
  args: { patientName: 'Alexandria Marie Rodriguez-Thompson' },
};

export const Mobile: Story = {
  args: { patientName: 'Emily Chen' },
  parameters: { viewport: { defaultViewport: 'mobile' } },
};
