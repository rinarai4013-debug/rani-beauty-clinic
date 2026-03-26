import type { Meta, StoryObj } from '@storybook/react';
import PlanTotals from './PlanTotals';

const meta: Meta<typeof PlanTotals> = {
  title: 'Dashboard/PlanBuilder/PlanTotals',
  component: PlanTotals,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-md p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof PlanTotals>;

export const Default: Story = {};
