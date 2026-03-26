import type { Meta, StoryObj } from '@storybook/react';
import BossLevelMilestone from './BossLevelMilestone';

const meta: Meta<typeof BossLevelMilestone> = {
  title: 'Dashboard/Gamification/BossLevelMilestone',
  component: BossLevelMilestone,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-sm p-6"><Story /></div>],
  argTypes: {
    monthlyRevenue: { control: { type: 'range', min: 0, max: 200000, step: 5000 } },
  },
};
export default meta;
type Story = StoryObj<typeof BossLevelMilestone>;

export const Bronze: Story = {
  args: { monthlyRevenue: 15000 },
};

export const Silver: Story = {
  args: { monthlyRevenue: 45000 },
};

export const Gold: Story = {
  args: { monthlyRevenue: 85000 },
};

export const Diamond: Story = {
  args: { monthlyRevenue: 160000 },
};

export const JustStarting: Story = {
  args: { monthlyRevenue: 5000 },
};
