import type { Meta, StoryObj } from '@storybook/react';
import BudExpiryWarning from './BudExpiryWarning';

const meta: Meta<typeof BudExpiryWarning> = {
  title: 'Dashboard/Inventory/BudExpiryWarning',
  component: BudExpiryWarning,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-md p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof BudExpiryWarning>;

export const Default: Story = {};
