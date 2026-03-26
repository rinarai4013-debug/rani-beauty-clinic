import type { Meta, StoryObj } from '@storybook/react';
import SparklineChart from './SparklineChart';

const meta: Meta<typeof SparklineChart> = {
  title: 'Dashboard/Charts/SparklineChart',
  component: SparklineChart,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-xs h-12 p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof SparklineChart>;

export const Default: Story = {
  args: {
    data: [12, 15, 11, 18, 22, 19, 25, 28, 24, 30, 35, 32],
  },
};

export const Uptrend: Story = {
  args: {
    data: [5, 8, 12, 15, 20, 25, 30, 38, 42, 48, 55, 60],
  },
};

export const Downtrend: Story = {
  args: {
    data: [60, 55, 48, 42, 38, 30, 25, 20, 15, 12, 8, 5],
  },
};

export const Volatile: Story = {
  args: {
    data: [20, 45, 15, 60, 25, 55, 10, 70, 30, 50, 20, 65],
  },
};

export const CustomColor: Story = {
  args: {
    data: [10, 20, 15, 30, 25, 35, 40],
    color: '#059669',
    gradientId: 'greenGrad',
  },
};

export const FewPoints: Story = {
  args: {
    data: [10, 30, 25],
  },
};
