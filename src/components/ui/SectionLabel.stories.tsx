import type { Meta, StoryObj } from '@storybook/react';
import SectionLabel from './SectionLabel';

const meta: Meta<typeof SectionLabel> = {
  title: 'UI/SectionLabel',
  component: SectionLabel,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="p-12"><Story /></div>],
  argTypes: {
    dark: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<typeof SectionLabel>;

export const Default: Story = {
  args: { label: 'Our Services' },
};

export const Dark: Story = {
  args: { label: 'Treatment Menu', dark: true },
  parameters: { backgrounds: { default: 'dark' } },
};

export const LongLabel: Story = {
  args: { label: 'Why Choose Rani Beauty Clinic' },
};
