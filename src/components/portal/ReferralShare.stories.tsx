import type { Meta, StoryObj } from '@storybook/react';
import ReferralShare from './ReferralShare';

const meta: Meta<typeof ReferralShare> = {
  title: 'Portal/ReferralShare',
  component: ReferralShare,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-md p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof ReferralShare>;

export const Default: Story = {
  args: {
    shareContent: {
      referralCode: 'SARAH50',
      shareUrl: 'https://ranibeautyclinic.com/refer/SARAH50',
      smsText: 'Get $25 off your first treatment at Rani Beauty Clinic! Use code SARAH50. Book here: https://ranibeautyclinic.com/refer/SARAH50',
      emailSubject: 'You deserve this - $25 off at Rani Beauty Clinic',
      emailBody: 'I wanted to share my favorite medspa with you! Use my referral code SARAH50 for $25 off your first treatment.',
    },
    totalReferred: 5,
    totalEarned: 250,
  },
};

export const NewReferrer: Story = {
  args: {
    shareContent: {
      referralCode: 'EMILY25',
      shareUrl: 'https://ranibeautyclinic.com/refer/EMILY25',
      smsText: 'Check out Rani Beauty Clinic! Use code EMILY25.',
      emailSubject: '$25 off at Rani Beauty Clinic',
      emailBody: 'Use my referral code EMILY25.',
    },
    totalReferred: 0,
    totalEarned: 0,
  },
};

export const TopReferrer: Story = {
  args: {
    shareContent: {
      referralCode: 'MARIA100',
      shareUrl: 'https://ranibeautyclinic.com/refer/MARIA100',
      smsText: 'Join me at Rani Beauty! Code: MARIA100.',
      emailSubject: 'My referral code for Rani Beauty Clinic',
      emailBody: 'Use MARIA100 for $25 off!',
    },
    totalReferred: 12,
    totalEarned: 600,
  },
};
