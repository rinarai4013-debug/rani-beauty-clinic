import type { Meta, StoryObj } from '@storybook/react';
import WasteLog from './WasteLog';

const meta: Meta<typeof WasteLog> = {
  title: 'Dashboard/Inventory/WasteLog',
  component: WasteLog,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof WasteLog>;

export const Default: Story = {};
