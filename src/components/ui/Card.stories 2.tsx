import type { Meta, StoryObj } from '@storybook/react';
import Card from './Card';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-sm p-6"><Story /></div>],
  argTypes: {
    goldTop: { control: 'boolean' },
    hover: { control: 'boolean' },
    asMotion: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    children: (
      <div>
        <h3 className="font-heading text-lg text-rani-navy mb-2">HydraFacial</h3>
        <p className="text-sm text-rani-muted">Signature facial treatment for glowing skin.</p>
        <p className="mt-3 text-lg font-bold text-rani-navy">$275</p>
      </div>
    ),
  },
};

export const GoldTopBorder: Story = {
  args: {
    goldTop: true,
    children: (
      <div>
        <h3 className="font-heading text-lg text-rani-navy mb-2">Featured Service</h3>
        <p className="text-sm text-rani-muted">Premium treatment with gold accent.</p>
      </div>
    ),
  },
};

export const NoHover: Story = {
  args: {
    hover: false,
    children: (
      <div>
        <h3 className="font-heading text-lg text-rani-navy mb-2">Static Card</h3>
        <p className="text-sm text-rani-muted">No hover effects on this card.</p>
      </div>
    ),
  },
};

export const StaticDiv: Story = {
  args: {
    asMotion: false,
    children: (
      <div>
        <h3 className="font-heading text-lg text-rani-navy mb-2">Non-Motion Card</h3>
        <p className="text-sm text-rani-muted">Rendered as a plain div, no framer-motion.</p>
      </div>
    ),
  },
};
