import type { Meta, StoryObj } from '@storybook/react';
import PurchaseOrderList from './PurchaseOrderList';

const meta: Meta<typeof PurchaseOrderList> = {
  title: 'Dashboard/Inventory/PurchaseOrderList',
  component: PurchaseOrderList,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof PurchaseOrderList>;

export const Default: Story = {};
