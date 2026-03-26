import type { Meta, StoryObj } from '@storybook/react';
import ComplianceBanner from './ComplianceBanner';

const meta: Meta<typeof ComplianceBanner> = {
  title: 'Dashboard/Charting/ComplianceBanner',
  component: ComplianceBanner,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-2xl p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof ComplianceBanner>;

export const Default: Story = {};
