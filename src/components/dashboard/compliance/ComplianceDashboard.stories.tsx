import type { Meta, StoryObj } from '@storybook/react';
import ComplianceDashboard from './ComplianceDashboard';

const meta: Meta<typeof ComplianceDashboard> = {
  title: 'Dashboard/Compliance/ComplianceDashboard',
  component: ComplianceDashboard,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof ComplianceDashboard>;

export const Default: Story = {};
