import type { Meta, StoryObj } from '@storybook/react';
import AuditLog from './AuditLog';

const meta: Meta<typeof AuditLog> = {
  title: 'Dashboard/Compliance/AuditLog',
  component: AuditLog,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof AuditLog>;

export const Default: Story = {};
