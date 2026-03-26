import type { Meta, StoryObj } from '@storybook/react';
import QuickActions from './QuickActions';

const meta: Meta<typeof QuickActions> = {
  title: 'Dashboard/Panels/QuickActions',
  component: QuickActions,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-md p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof QuickActions>;

export const Default: Story = {};
