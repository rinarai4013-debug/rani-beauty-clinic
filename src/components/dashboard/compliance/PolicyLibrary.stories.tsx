import type { Meta, StoryObj } from '@storybook/react';
import PolicyLibrary from './PolicyLibrary';

const meta: Meta<typeof PolicyLibrary> = {
  title: 'Dashboard/Compliance/PolicyLibrary',
  component: PolicyLibrary,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof PolicyLibrary>;

export const Default: Story = {};
