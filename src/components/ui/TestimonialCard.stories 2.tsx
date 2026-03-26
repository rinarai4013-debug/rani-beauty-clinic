import type { Meta, StoryObj } from '@storybook/react';
import TestimonialCard from './TestimonialCard';

const meta: Meta<typeof TestimonialCard> = {
  title: 'UI/TestimonialCard',
  component: TestimonialCard,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-lg p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof TestimonialCard>;

export const FiveStars: Story = {
  args: {
    name: 'Sarah Johnson',
    text: 'The results were incredible. My skin has never looked better. The team made me feel so comfortable throughout the entire process.',
    rating: 5,
    treatment: 'HydraFacial',
    date: 'March 2026',
  },
};

export const FourStars: Story = {
  args: {
    name: 'Emily Chen',
    text: 'Great experience overall. Very professional staff and beautiful clinic.',
    rating: 4,
    treatment: 'Sofwave',
  },
};

export const WithoutTreatment: Story = {
  args: {
    name: 'Maria Rodriguez',
    text: 'I love how the clinic feels so luxurious. The results speak for themselves.',
    rating: 5,
  },
};

export const WithDate: Story = {
  args: {
    name: 'Ava Thompson',
    text: 'Best medspa experience in the Seattle area. Cannot recommend enough!',
    rating: 5,
    treatment: 'RF Microneedling',
    date: 'February 2026',
  },
};
