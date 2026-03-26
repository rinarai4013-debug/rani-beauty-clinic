import type { Meta, StoryObj } from '@storybook/react';
import ChartFormRenderer from './ChartFormRenderer';

const meta: Meta<typeof ChartFormRenderer> = {
  title: 'Dashboard/Charting/ChartFormRenderer',
  component: ChartFormRenderer,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-2xl p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof ChartFormRenderer>;

export const Default: Story = {};
