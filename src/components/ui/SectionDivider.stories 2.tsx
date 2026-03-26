import type { Meta, StoryObj } from '@storybook/react';
import SectionDivider from './SectionDivider';

const meta: Meta<typeof SectionDivider> = {
  title: 'UI/SectionDivider',
  component: SectionDivider,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="p-12"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof SectionDivider>;

export const Default: Story = {};

export const CustomWidth: Story = {
  args: { className: 'w-[120px]' },
};
