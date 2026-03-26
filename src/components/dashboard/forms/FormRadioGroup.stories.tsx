import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import FormRadioGroup from './FormRadioGroup';

const meta: Meta<typeof FormRadioGroup> = {
  title: 'Dashboard/Forms/FormRadioGroup',
  component: FormRadioGroup,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-md p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof FormRadioGroup>;

export const Default: Story = {
  args: {
    value: 'consultation',
    onChange: () => {},
    options: [
      { value: 'walk_in', label: 'Walk-in' },
      { value: 'phone', label: 'Phone' },
      { value: 'consultation', label: 'Consultation' },
    ],
    columns: 3,
  },
};

export const WithEmojis: Story = {
  args: {
    value: '',
    onChange: () => {},
    options: [
      { value: 'great', label: 'Great', emoji: '🎉' },
      { value: 'good', label: 'Good', emoji: '👍' },
      { value: 'ok', label: 'OK', emoji: '😐' },
      { value: 'poor', label: 'Poor', emoji: '👎' },
    ],
    columns: 4,
  },
};

export const TwoColumns: Story = {
  args: {
    value: 'cash',
    onChange: () => {},
    options: [
      { value: 'cash', label: 'Cash' },
      { value: 'card', label: 'Card' },
      { value: 'financing', label: 'Financing' },
      { value: 'membership', label: 'Membership' },
    ],
    columns: 2,
  },
};

export const Interactive: StoryObj = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <FormRadioGroup
        value={value}
        onChange={setValue}
        options={[
          { value: 'new', label: 'New Lead' },
          { value: 'consult', label: 'Consulted' },
          { value: 'booked', label: 'Booked' },
        ]}
        columns={3}
      />
    );
  },
};
