import type { Meta, StoryObj } from '@storybook/react';
import RecentActivity from './RecentActivity';

const meta: Meta<typeof RecentActivity> = {
  title: 'Dashboard/Panels/RecentActivity',
  component: RecentActivity,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-md p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof RecentActivity>;

export const Default: Story = {};
