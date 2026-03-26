import type { Meta, StoryObj } from '@storybook/react';
import TreatmentTimeline, { type TreatmentEntry } from './TreatmentTimeline';

const meta: Meta<typeof TreatmentTimeline> = {
  title: 'Portal/TreatmentTimeline',
  component: TreatmentTimeline,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-2xl p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof TreatmentTimeline>;

const sampleTreatments: TreatmentEntry[] = [
  {
    id: '1',
    service: 'HydraFacial Signature',
    date: '2026-03-15',
    provider: 'Dr. Mom',
    notes: 'Great results. Skin hydration improved significantly. Recommended monthly maintenance.',
    aftercareUrl: '/aftercare/hydrafacial',
  },
  {
    id: '2',
    service: 'Sofwave',
    date: '2026-03-01',
    provider: 'Dr. Mom',
    notes: 'Initial treatment in skin tightening series.',
    beforePhoto: '/photos/before.jpg',
    afterPhoto: '/photos/after.jpg',
  },
  {
    id: '3',
    service: 'VI Peel',
    date: '2026-02-10',
    provider: 'Dr. Mom',
  },
  {
    id: '4',
    service: 'Botox',
    date: '2026-01-20',
    provider: 'Dr. Mom',
    notes: 'Forehead and crow\'s feet. 32 units total.',
  },
  {
    id: '5',
    service: 'HydraFacial Signature',
    date: '2026-01-05',
    provider: 'Dr. Mom',
    aftercareUrl: '/aftercare/hydrafacial',
  },
];

export const Default: Story = {
  args: { treatments: sampleTreatments },
};

export const SingleTreatment: Story = {
  args: { treatments: [sampleTreatments[0]] },
};

export const Empty: Story = {
  args: { treatments: [] },
};

export const WithPhotos: Story = {
  args: {
    treatments: [sampleTreatments[1]],
  },
};
