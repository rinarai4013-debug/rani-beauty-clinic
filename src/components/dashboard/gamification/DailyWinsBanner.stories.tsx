import type { Meta, StoryObj } from '@storybook/react';
import DailyWinsBanner from './DailyWinsBanner';

const meta: Meta<typeof DailyWinsBanner> = {
  title: 'Dashboard/Gamification/DailyWinsBanner',
  component: DailyWinsBanner,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof DailyWinsBanner>;

export const Default: Story = {};
