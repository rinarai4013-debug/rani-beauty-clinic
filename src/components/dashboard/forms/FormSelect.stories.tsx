import type { Meta, StoryObj } from '@storybook/react';
import FormSelect from './FormSelect';

const meta: Meta<typeof FormSelect> = {
  title: 'Dashboard/Forms/FormSelect',
  component: FormSelect,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-sm p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof FormSelect>;

export const Default: Story = {
  args: {
    options: [
      { value: 'hydrafacial', label: 'HydraFacial' },
      { value: 'sofwave', label: 'Sofwave' },
      { value: 'botox', label: 'Botox' },
      { value: 'vi-peel', label: 'VI Peel' },
    ],
    placeholder: 'Select a service...',
  },
};

export const WithSelectedValue: Story = {
  args: {
    options: [
      { value: 'mom', label: 'Dr. Mom' },
      { value: 'rina', label: 'Rina' },
    ],
    value: 'mom',
  },
};
