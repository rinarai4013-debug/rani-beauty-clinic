import type { Meta, StoryObj } from '@storybook/react';
import VisuallyHidden from './VisuallyHidden';
import { Search } from 'lucide-react';

const meta: Meta<typeof VisuallyHidden> = {
  title: 'UI/VisuallyHidden',
  component: VisuallyHidden,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="p-6"><Story /></div>],
  argTypes: {
    as: { control: 'select', options: ['span', 'div', 'p', 'h1', 'h2', 'label'] },
  },
};
export default meta;
type Story = StoryObj<typeof VisuallyHidden>;

export const Default: Story = {
  args: { children: 'This text is hidden visually but read by screen readers' },
};

export const WithIcon: StoryObj = {
  render: () => (
    <button className="p-2 rounded-lg bg-rani-navy text-white hover:bg-rani-navy-light transition-colors">
      <Search className="w-5 h-5" />
      <VisuallyHidden>Search</VisuallyHidden>
    </button>
  ),
};
