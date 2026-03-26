import type { Meta, StoryObj } from '@storybook/react';
import SyncStatusBadge from './SyncStatusBadge';

const meta: Meta<typeof SyncStatusBadge> = {
  title: 'Dashboard/Plaid/SyncStatusBadge',
  component: SyncStatusBadge,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof SyncStatusBadge>;

export const Default: Story = {};
