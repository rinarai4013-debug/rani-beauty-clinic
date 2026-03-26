import type { Meta, StoryObj } from '@storybook/react';
import ReceivingForm from './ReceivingForm';

const meta: Meta<typeof ReceivingForm> = {
  title: 'Dashboard/Inventory/ReceivingForm',
  component: ReceivingForm,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-2xl p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof ReceivingForm>;

export const Default: Story = {};
