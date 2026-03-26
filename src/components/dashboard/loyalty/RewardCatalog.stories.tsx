import type { Meta, StoryObj } from '@storybook/react';
import RewardCatalog from './RewardCatalog';

const meta: Meta<typeof RewardCatalog> = {
  title: 'Dashboard/Loyalty/RewardCatalog',
  component: RewardCatalog,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof RewardCatalog>;

export const Default: Story = {};
