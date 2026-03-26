import type { Meta, StoryObj } from '@storybook/react';
import ModuleCard from './ModuleCard';

const meta: Meta<typeof ModuleCard> = {
  title: 'Dashboard/Training/ModuleCard',
  component: ModuleCard,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-sm p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof ModuleCard>;

export const Default: Story = {};
