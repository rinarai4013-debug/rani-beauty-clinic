import type { Meta, StoryObj } from '@storybook/react';
import DeviceMaintenanceLog from './DeviceMaintenanceLog';

const meta: Meta<typeof DeviceMaintenanceLog> = {
  title: 'Dashboard/Compliance/DeviceMaintenanceLog',
  component: DeviceMaintenanceLog,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof DeviceMaintenanceLog>;

export const Default: Story = {};
