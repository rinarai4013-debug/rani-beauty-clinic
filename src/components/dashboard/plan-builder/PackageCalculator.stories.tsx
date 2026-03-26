import type { Meta, StoryObj } from '@storybook/react';
import PackageCalculator from './PackageCalculator';

const meta: Meta<typeof PackageCalculator> = {
  title: 'Dashboard/PlanBuilder/PackageCalculator',
  component: PackageCalculator,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-md p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof PackageCalculator>;

export const Default: Story = {};
