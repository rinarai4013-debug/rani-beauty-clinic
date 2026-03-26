import type { Meta, StoryObj } from '@storybook/react';
import SoundToggle from './SoundToggle';

const meta: Meta<typeof SoundToggle> = {
  title: 'Dashboard/Sound/SoundToggle',
  component: SoundToggle,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof SoundToggle>;

export const Default: Story = {};
