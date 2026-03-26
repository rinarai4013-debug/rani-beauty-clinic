import type { Meta, StoryObj } from '@storybook/react';
import RevenueHealthPanel from './RevenueHealthPanel';

const meta: Meta<typeof RevenueHealthPanel> = {
  title: 'Dashboard/Panels/RevenueHealthPanel',
  component: RevenueHealthPanel,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-md p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof RevenueHealthPanel>;

export const Default: Story = {};
