import type { Meta, StoryObj } from '@storybook/react';
import FormInput from './FormInput';

const meta: Meta<typeof FormInput> = {
  title: 'Dashboard/Forms/FormInput',
  component: FormInput,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-sm p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof FormInput>;

export const Default: Story = {
  args: { placeholder: 'Enter value...' },
};

export const WithPrefix: Story = {
  args: { prefix: '$', placeholder: '0.00', type: 'number' },
};

export const WithSuffix: Story = {
  args: { suffix: 'units', placeholder: '0', type: 'number' },
};

export const WithPrefixAndSuffix: Story = {
  args: { prefix: '$', suffix: '/mo', placeholder: '0.00' },
};

export const EmailInput: Story = {
  args: { type: 'email', placeholder: 'client@example.com' },
};

export const Disabled: Story = {
  args: { placeholder: 'Read only', disabled: true, value: 'Locked value' },
};
