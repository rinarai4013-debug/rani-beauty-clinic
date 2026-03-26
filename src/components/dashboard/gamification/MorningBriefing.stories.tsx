import type { Meta, StoryObj } from '@storybook/react';
import MorningBriefing from './MorningBriefing';

const meta: Meta<typeof MorningBriefing> = {
  title: 'Dashboard/Gamification/MorningBriefing',
  component: MorningBriefing,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-2xl p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof MorningBriefing>;

export const Default: Story = {};
