import type { Meta, StoryObj } from '@storybook/react';
import Badge from './Badge';

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="p-6 flex items-center gap-4 flex-wrap"><Story /></div>],
  argTypes: {
    icon: { control: 'select', options: ['check', 'shield', 'clock', 'heart'] },
    variant: { control: 'select', options: ['light', 'dark'] },
  },
};
export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: { children: 'Board Certified', icon: 'check' },
};

export const Shield: Story = {
  args: { children: 'HIPAA Compliant', icon: 'shield' },
};

export const Clock: Story = {
  args: { children: '30 Min Session', icon: 'clock' },
};

export const Heart: Story = {
  args: { children: 'Most Popular', icon: 'heart' },
};

export const DarkVariant: Story = {
  args: { children: 'Premium Service', icon: 'check', variant: 'dark' },
  parameters: { backgrounds: { default: 'dark' } },
};

export const AllVariants: StoryObj = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge icon="check">Board Certified</Badge>
      <Badge icon="shield">HIPAA Compliant</Badge>
      <Badge icon="clock">30 Min Session</Badge>
      <Badge icon="heart">Most Popular</Badge>
    </div>
  ),
};
