import type { Meta, StoryObj } from '@storybook/react';
import SupplierScorecard from './SupplierScorecard';

const meta: Meta<typeof SupplierScorecard> = {
  title: 'Dashboard/Inventory/SupplierScorecard',
  component: SupplierScorecard,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-lg p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof SupplierScorecard>;

export const Default: Story = {};
