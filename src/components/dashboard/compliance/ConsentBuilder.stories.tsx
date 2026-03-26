import type { Meta, StoryObj } from '@storybook/react';
import ConsentBuilder from './ConsentBuilder';

const meta: Meta<typeof ConsentBuilder> = {
  title: 'Dashboard/Compliance/ConsentBuilder',
  component: ConsentBuilder,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof ConsentBuilder>;

export const Default: Story = {};
