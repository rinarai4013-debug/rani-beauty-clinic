import type { Meta, StoryObj } from '@storybook/react';
import LoyaltyCard from './LoyaltyCard';

const meta: Meta<typeof LoyaltyCard> = {
  title: 'Portal/LoyaltyCard',
  component: LoyaltyCard,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-md p-6"><Story /></div>],
  argTypes: {
    tier: { control: 'select', options: ['Silver', 'Gold', 'Platinum'] },
    compact: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<typeof LoyaltyCard>;

export const Silver: Story = {
  args: {
    patientName: 'Sarah Johnson',
    tier: 'Silver',
    pointsBalance: 1250,
    tierProgress: 35,
    nextTier: 'Gold',
    pointsToNextTier: 2250,
  },
};

export const Gold: Story = {
  args: {
    patientName: 'Emily Chen',
    tier: 'Gold',
    pointsBalance: 4800,
    tierProgress: 65,
    nextTier: 'Platinum',
    pointsToNextTier: 2700,
  },
};

export const Platinum: Story = {
  args: {
    patientName: 'Maria Rodriguez',
    tier: 'Platinum',
    pointsBalance: 12500,
    tierProgress: 100,
    nextTier: null,
    pointsToNextTier: 0,
  },
};

export const CompactSilver: Story = {
  args: {
    patientName: 'Sarah Johnson',
    tier: 'Silver',
    pointsBalance: 1250,
    tierProgress: 35,
    nextTier: 'Gold',
    pointsToNextTier: 2250,
    compact: true,
  },
};

export const CompactGold: Story = {
  args: {
    patientName: 'Emily Chen',
    tier: 'Gold',
    pointsBalance: 4800,
    tierProgress: 65,
    nextTier: 'Platinum',
    pointsToNextTier: 2700,
    compact: true,
  },
};
