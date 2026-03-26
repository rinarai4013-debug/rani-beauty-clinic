import type { Meta, StoryObj } from '@storybook/react';
import BodyTreatmentForm from './BodyTreatmentForm';

const meta: Meta<typeof BodyTreatmentForm> = {
  title: 'Dashboard/Charting/BodyTreatmentForm',
  component: BodyTreatmentForm,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-2xl p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof BodyTreatmentForm>;

export const Default: Story = {};
