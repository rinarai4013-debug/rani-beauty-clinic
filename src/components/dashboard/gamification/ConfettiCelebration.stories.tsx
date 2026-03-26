import type { Meta, StoryObj } from '@storybook/react';
import ConfettiCelebration from './ConfettiCelebration';

const meta: Meta<typeof ConfettiCelebration> = {
  title: 'Dashboard/Gamification/ConfettiCelebration',
  component: ConfettiCelebration,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ConfettiCelebration>;

export const Default: Story = {};
