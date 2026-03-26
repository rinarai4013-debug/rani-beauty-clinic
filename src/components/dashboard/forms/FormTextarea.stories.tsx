import type { Meta, StoryObj } from '@storybook/react';
import FormTextarea from './FormTextarea';

const meta: Meta<typeof FormTextarea> = {
  title: 'Dashboard/Forms/FormTextarea',
  component: FormTextarea,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-md p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof FormTextarea>;

export const Default: Story = {
  args: { placeholder: 'Enter notes...' },
};

export const WithValue: Story = {
  args: { value: 'Client expressed interest in Sofwave after HydraFacial. Follow up in 1 week with treatment plan.', rows: 4 },
};
