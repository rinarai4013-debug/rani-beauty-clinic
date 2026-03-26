import type { Meta, StoryObj } from '@storybook/react';
import CostAnalysis from './CostAnalysis';

const meta: Meta<typeof CostAnalysis> = {
  title: 'Dashboard/Inventory/CostAnalysis',
  component: CostAnalysis,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof CostAnalysis>;

export const Default: Story = {};
