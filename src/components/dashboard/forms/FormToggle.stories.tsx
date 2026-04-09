import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import FormToggle from './FormToggle';

const meta: Meta<typeof FormToggle> = {
  title: 'Dashboard/Forms/FormToggle',
  component: FormToggle,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-sm p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof FormToggle>;

export const Default: Story = {
  args: {
    label: 'Send SMS reminder',
    checked: false,
    onChange: () => {},
  },
};

export const Checked: Story = {
  args: {
    label: 'VIP Client',
    description: 'Mark this client as VIP for priority scheduling',
    checked: true,
    onChange: () => {},
  },
};

export const WithDescription: Story = {
  args: {
    label: 'Auto-reorder',
    description: 'Automatically reorder when stock falls below par level',
    checked: false,
    onChange: () => {},
  },
};

function InteractiveRender() {
  const [checked, setChecked] = useState(false);
  return <FormToggle label="Notification enabled" description="Toggle to try" checked={checked} onChange={setChecked} />;
}

export const Interactive: StoryObj = {
  render: () => <InteractiveRender />,
};
