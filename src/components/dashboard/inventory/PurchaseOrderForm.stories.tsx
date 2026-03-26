import type { Meta, StoryObj } from '@storybook/react';
import PurchaseOrderForm from './PurchaseOrderForm';

const meta: Meta<typeof PurchaseOrderForm> = {
  title: 'Dashboard/Inventory/PurchaseOrderForm',
  component: PurchaseOrderForm,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-2xl p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof PurchaseOrderForm>;

export const Default: Story = {};
