import type { Meta, StoryObj } from '@storybook/react';
import ProgressBar from './ProgressBar';

const meta: Meta<typeof ProgressBar> = {
  title: 'Dashboard/Charts/ProgressBar',
  component: ProgressBar,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-sm p-6"><Story /></div>],
  argTypes: {
    colorMode: { control: 'select', options: ['score', 'gold', 'green'] },
    height: { control: { type: 'range', min: 2, max: 16, step: 1 } },
  },
};
export default meta;
type Story = StoryObj<typeof ProgressBar>;

export const Default: Story = {
  args: { current: 65, target: 100, label: 'Monthly Goal' },
};

export const GoldColor: Story = {
  args: { current: 32500, target: 50000, label: 'Revenue Target', colorMode: 'gold' },
};

export const GreenColor: Story = {
  args: { current: 80, target: 100, label: 'Completion', colorMode: 'green' },
};

export const ScoreColor: Story = {
  args: { current: 45, target: 100, label: 'Health Score', colorMode: 'score' },
};

export const HighProgress: Story = {
  args: { current: 95, target: 100, label: 'Almost there!', colorMode: 'green' },
};

export const LowProgress: Story = {
  args: { current: 15, target: 100, label: 'Just started', colorMode: 'score' },
};

export const OverTarget: Story = {
  args: { current: 120, target: 100, label: 'Exceeded!' },
};

export const NoLabel: Story = {
  args: { current: 50, target: 100 },
};

export const NoPercentage: Story = {
  args: { current: 50, target: 100, label: 'Progress', showPercentage: false },
};

export const Thick: Story = {
  args: { current: 70, target: 100, label: 'Large', height: 12 },
};

export const Thin: Story = {
  args: { current: 70, target: 100, label: 'Thin', height: 3 },
};
