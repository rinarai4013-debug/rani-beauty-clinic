import type { Meta, StoryObj } from '@storybook/react';
import StockLevelCard from './StockLevelCard';

const meta: Meta<typeof StockLevelCard> = {
  title: 'Dashboard/Inventory/StockLevelCard',
  component: StockLevelCard,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-sm p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof StockLevelCard>;

export const Default: Story = {};
