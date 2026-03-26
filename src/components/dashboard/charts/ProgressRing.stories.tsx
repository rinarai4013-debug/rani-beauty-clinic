import type { Meta, StoryObj } from '@storybook/react';
import ProgressRing from './ProgressRing';

const meta: Meta<typeof ProgressRing> = {
  title: 'Dashboard/Charts/ProgressRing',
  component: ProgressRing,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="p-6 flex items-end gap-6"><Story /></div>],
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100, step: 1 } },
    size: { control: { type: 'range', min: 40, max: 200, step: 10 } },
    strokeWidth: { control: { type: 'range', min: 2, max: 16, step: 1 } },
    colorMode: { control: 'select', options: ['score', 'gold'] },
  },
};
export default meta;
type Story = StoryObj<typeof ProgressRing>;

export const Default: Story = {
  args: { value: 75, label: 'Clinic Score' },
};

export const Low: Story = {
  args: { value: 25, label: 'Low Score' },
};

export const Medium: Story = {
  args: { value: 55, label: 'Moderate' },
};

export const High: Story = {
  args: { value: 90, label: 'Excellent' },
};

export const Full: Story = {
  args: { value: 100, label: 'Perfect!' },
};

export const GoldMode: Story = {
  args: { value: 70, label: 'Progress', colorMode: 'gold' },
};

export const Large: Story = {
  args: { value: 82, label: 'Health Score', size: 120, strokeWidth: 10 },
};

export const Small: Story = {
  args: { value: 60, size: 48, strokeWidth: 4 },
};

export const NoValue: Story = {
  args: { value: 65, showValue: false, label: 'Hidden Value' },
};

export const MultipleRings: StoryObj = {
  render: () => (
    <div className="flex items-end gap-6">
      <ProgressRing value={92} label="Revenue" />
      <ProgressRing value={68} label="Bookings" />
      <ProgressRing value={45} label="Retention" />
      <ProgressRing value={15} label="Churn" />
    </div>
  ),
};
