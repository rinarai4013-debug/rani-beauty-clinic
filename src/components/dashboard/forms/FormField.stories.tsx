import type { Meta, StoryObj } from '@storybook/react';
import FormField from './FormField';
import FormInput from './FormInput';

const meta: Meta<typeof FormField> = {
  title: 'Dashboard/Forms/FormField',
  component: FormField,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-sm p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof FormField>;

export const Default: Story = {
  args: {
    label: 'Client Name',
    children: <FormInput placeholder="Enter client name" />,
  },
};

export const Required: Story = {
  args: {
    label: 'Email Address',
    required: true,
    children: <FormInput type="email" placeholder="client@example.com" />,
  },
};

export const WithHint: Story = {
  args: {
    label: 'Phone Number',
    hint: 'Include area code',
    children: <FormInput type="tel" placeholder="(425) 555-0100" />,
  },
};

export const WithError: Story = {
  args: {
    label: 'Revenue Amount',
    required: true,
    error: 'Amount must be greater than 0',
    children: <FormInput type="number" value="0" />,
  },
};
