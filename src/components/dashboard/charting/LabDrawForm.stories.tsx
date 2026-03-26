import type { Meta, StoryObj } from '@storybook/react';
import LabDrawForm from './LabDrawForm';

const meta: Meta<typeof LabDrawForm> = {
  title: 'Dashboard/Charting/LabDrawForm',
  component: LabDrawForm,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-2xl p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof LabDrawForm>;

export const Default: Story = {};
