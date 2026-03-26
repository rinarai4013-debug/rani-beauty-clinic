import type { Meta, StoryObj } from '@storybook/react';
import DeliveryStatusBadge from './DeliveryStatusBadge';

const meta: Meta<typeof DeliveryStatusBadge> = {
  title: 'Dashboard/Communications/DeliveryStatusBadge',
  component: DeliveryStatusBadge,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="p-6 flex items-center gap-4 flex-wrap"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof DeliveryStatusBadge>;

export const Default: Story = {};
