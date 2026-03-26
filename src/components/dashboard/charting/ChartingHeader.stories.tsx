import type { Meta, StoryObj } from '@storybook/react';
import ChartingHeader from './ChartingHeader';

const meta: Meta<typeof ChartingHeader> = {
  title: 'Dashboard/Charting/ChartingHeader',
  component: ChartingHeader,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof ChartingHeader>;

export const Default: Story = {};
