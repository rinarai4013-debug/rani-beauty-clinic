import type { Meta, StoryObj } from '@storybook/react';
import PortalLogin from './PortalLogin';

const meta: Meta<typeof PortalLogin> = {
  title: 'Portal/PortalLogin',
  component: PortalLogin,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof PortalLogin>;

export const Default: Story = {};
