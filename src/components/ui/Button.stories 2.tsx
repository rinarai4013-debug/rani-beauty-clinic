import type { Meta, StoryObj } from '@storybook/react';
import Button from './Button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="p-6 flex items-center gap-4 flex-wrap"><Story /></div>],
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'ghost'] },
    icon: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { children: 'Book Consultation', variant: 'primary' },
};

export const PrimaryWithIcon: Story = {
  args: { children: 'Book Consultation', variant: 'primary', icon: true },
};

export const Secondary: Story = {
  args: { children: 'Learn More', variant: 'secondary' },
};

export const Ghost: Story = {
  args: { children: 'View All Treatments', variant: 'ghost' },
};

export const AsLink: Story = {
  args: { children: 'Visit Our Clinic', variant: 'primary', href: '/contact' },
};

export const ExternalLink: Story = {
  args: { children: 'Call Now', variant: 'secondary', href: 'tel:+14258906395', target: '_blank' },
};

export const AllVariants: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="primary" icon>With Arrow</Button>
        <Button variant="secondary" icon>With Arrow</Button>
      </div>
    </div>
  ),
};
