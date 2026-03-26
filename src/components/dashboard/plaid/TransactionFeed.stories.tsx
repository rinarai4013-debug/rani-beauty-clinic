import type { Meta, StoryObj } from '@storybook/react';
import TransactionFeed from './TransactionFeed';

const meta: Meta<typeof TransactionFeed> = {
  title: 'Dashboard/Plaid/TransactionFeed',
  component: TransactionFeed,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof TransactionFeed>;

export const Default: Story = {};
