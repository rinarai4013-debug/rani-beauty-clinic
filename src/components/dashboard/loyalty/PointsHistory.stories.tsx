import type { Meta, StoryObj } from '@storybook/react';
import PointsHistory from './PointsHistory';

const meta: Meta<typeof PointsHistory> = {
  title: 'Dashboard/Loyalty/PointsHistory',
  component: PointsHistory,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof PointsHistory>;

export const Default: Story = {};
