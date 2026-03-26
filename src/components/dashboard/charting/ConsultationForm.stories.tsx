import type { Meta, StoryObj } from '@storybook/react';
import ConsultationForm from './ConsultationForm';

const meta: Meta<typeof ConsultationForm> = {
  title: 'Dashboard/Charting/ConsultationForm',
  component: ConsultationForm,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-2xl p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof ConsultationForm>;

export const Default: Story = {};
