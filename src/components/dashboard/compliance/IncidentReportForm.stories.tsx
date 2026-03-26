import type { Meta, StoryObj } from '@storybook/react';
import IncidentReportForm from './IncidentReportForm';

const meta: Meta<typeof IncidentReportForm> = {
  title: 'Dashboard/Compliance/IncidentReportForm',
  component: IncidentReportForm,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-2xl p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof IncidentReportForm>;

export const Default: Story = {};
