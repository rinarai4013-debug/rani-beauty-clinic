import type { Meta, StoryObj } from '@storybook/react';
import SendTimeHeatmap from './SendTimeHeatmap';

const meta: Meta<typeof SendTimeHeatmap> = {
  title: 'Dashboard/Communications/SendTimeHeatmap',
  component: SendTimeHeatmap,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-2xl p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof SendTimeHeatmap>;

export const Default: Story = {};
