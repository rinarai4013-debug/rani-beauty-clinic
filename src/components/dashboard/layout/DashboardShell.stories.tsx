import type { Meta, StoryObj } from '@storybook/react';
import DashboardShell from './DashboardShell';

const meta: Meta<typeof DashboardShell> = {
  title: 'Dashboard/Layout/DashboardShell',
  component: DashboardShell,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof DashboardShell>;

export const Default: Story = {};
