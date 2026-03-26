import type { Meta, StoryObj } from '@storybook/react';
import ClinicScoreMeter from './ClinicScoreMeter';

const meta: Meta<typeof ClinicScoreMeter> = {
  title: 'Dashboard/Gamification/ClinicScoreMeter',
  component: ClinicScoreMeter,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-xs p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof ClinicScoreMeter>;

export const Default: Story = {};
