import type { Meta, StoryObj } from '@storybook/react';
import DraggableServiceItem from './DraggableServiceItem';

const meta: Meta<typeof DraggableServiceItem> = {
  title: 'Dashboard/PlanBuilder/DraggableServiceItem',
  component: DraggableServiceItem,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-sm p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof DraggableServiceItem>;

export const Default: Story = {};
