import type { Meta, StoryObj } from '@storybook/react';
import PlanProgress, { type TreatmentPlan } from './PlanProgress';

const meta: Meta<typeof PlanProgress> = {
  title: 'Portal/PlanProgress',
  component: PlanProgress,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-2xl p-6"><Story /></div>],
  argTypes: {
    compact: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<typeof PlanProgress>;

const samplePlan: TreatmentPlan = {
  id: 'plan-1',
  name: 'Anti-Aging Transformation',
  goal: 'Reduce fine lines, improve skin texture, and restore youthful glow',
  startDate: '2026-01-15',
  estimatedEndDate: '2026-06-15',
  overallProgress: 45,
  steps: [
    { id: 's1', treatment: 'HydraFacial Signature', status: 'completed', completedDate: '2026-01-20', sessionNumber: 1, totalSessions: 3 },
    { id: 's2', treatment: 'Sofwave Skin Tightening', status: 'completed', completedDate: '2026-02-10', description: 'Full face and neck treatment' },
    { id: 's3', treatment: 'HydraFacial Signature', status: 'scheduled', scheduledDate: '2026-04-01', sessionNumber: 2, totalSessions: 3 },
    { id: 's4', treatment: 'VI Peel', status: 'upcoming', description: 'Chemical peel for texture improvement' },
    { id: 's5', treatment: 'Botox Touch-Up', status: 'recommended', description: 'Forehead and crow\'s feet maintenance' },
    { id: 's6', treatment: 'HydraFacial Signature', status: 'upcoming', sessionNumber: 3, totalSessions: 3 },
  ],
};

export const Default: Story = {
  args: { plan: samplePlan },
};

export const Compact: Story = {
  args: { plan: samplePlan, compact: true },
};

export const AlmostComplete: Story = {
  args: {
    plan: {
      ...samplePlan,
      overallProgress: 85,
      steps: samplePlan.steps.map((s, i) => i < 5 ? { ...s, status: 'completed' as const, completedDate: '2026-03-01' } : s),
    },
  },
};

export const JustStarted: Story = {
  args: {
    plan: {
      ...samplePlan,
      overallProgress: 10,
      steps: samplePlan.steps.map((s, i) => i === 0 ? s : { ...s, status: 'upcoming' as const }),
    },
  },
};
