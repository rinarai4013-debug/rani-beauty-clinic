import type { Meta, StoryObj } from '@storybook/react';
import LevelUpModal from './LevelUpModal';

const meta: Meta<typeof LevelUpModal> = {
  title: 'Dashboard/Gamification/LevelUpModal',
  component: LevelUpModal,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof LevelUpModal>;

export const Default: Story = {};
