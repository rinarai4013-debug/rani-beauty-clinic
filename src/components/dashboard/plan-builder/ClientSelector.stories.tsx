import type { Meta, StoryObj } from '@storybook/react';
import ClientSelector from './ClientSelector';

const meta: Meta<typeof ClientSelector> = {
  title: 'Dashboard/PlanBuilder/ClientSelector',
  component: ClientSelector,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-md p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof ClientSelector>;

export const Default: Story = {};
