import type { Meta, StoryObj } from '@storybook/react';
import FormShell from './FormShell';
import FormField from './FormField';
import FormInput from './FormInput';
import FormSelect from './FormSelect';
import FormTextarea from './FormTextarea';
import { DollarSign } from 'lucide-react';

const meta: Meta<typeof FormShell> = {
  title: 'Dashboard/Forms/FormShell',
  component: FormShell,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof FormShell>;

export const Default: Story = {
  args: {
    title: 'Record Sale',
    subtitle: 'Log a new sale or transaction',
    icon: <DollarSign className="w-5 h-5" />,
    onSubmit: (e) => e.preventDefault(),
    children: (
      <div className="space-y-5">
        <FormField label="Client Name" required>
          <FormInput placeholder="Enter client name" />
        </FormField>
        <FormField label="Service">
          <FormSelect
            placeholder="Select service..."
            options={[
              { value: 'hydrafacial', label: 'HydraFacial - $275' },
              { value: 'sofwave', label: 'Sofwave - $2,750' },
            ]}
          />
        </FormField>
        <FormField label="Notes">
          <FormTextarea placeholder="Optional notes..." />
        </FormField>
      </div>
    ),
  },
};

export const Submitting: Story = {
  args: {
    title: 'Record Sale',
    subtitle: 'Log a new sale or transaction',
    icon: <DollarSign className="w-5 h-5" />,
    onSubmit: (e) => e.preventDefault(),
    isSubmitting: true,
    children: (
      <FormField label="Client Name" required>
        <FormInput placeholder="Enter client name" />
      </FormField>
    ),
  },
};
