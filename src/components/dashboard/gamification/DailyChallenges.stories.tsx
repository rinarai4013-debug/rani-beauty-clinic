import type { Meta, StoryObj } from '@storybook/react';
import DailyChallenges from './DailyChallenges';

const meta: Meta<typeof DailyChallenges> = {
  title: 'Dashboard/Gamification/DailyChallenges',
  component: DailyChallenges,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-md p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof DailyChallenges>;

export const Default: Story = {};
