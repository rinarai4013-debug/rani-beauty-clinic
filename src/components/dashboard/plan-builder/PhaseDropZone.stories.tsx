import type { Meta, StoryObj } from '@storybook/react';
import PhaseDropZone from './PhaseDropZone';

const meta: Meta<typeof PhaseDropZone> = {
  title: 'Dashboard/PlanBuilder/PhaseDropZone',
  component: PhaseDropZone,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-lg p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof PhaseDropZone>;

export const Default: Story = {};
