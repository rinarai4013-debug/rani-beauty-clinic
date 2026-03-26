import type { Meta, StoryObj } from '@storybook/react';
import ComplianceCalendar from './ComplianceCalendar';

const meta: Meta<typeof ComplianceCalendar> = {
  title: 'Dashboard/Compliance/ComplianceCalendar',
  component: ComplianceCalendar,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof ComplianceCalendar>;

export const Default: Story = {};
