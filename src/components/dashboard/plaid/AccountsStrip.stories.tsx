import type { Meta, StoryObj } from '@storybook/react';
import AccountsStrip from './AccountsStrip';

const meta: Meta<typeof AccountsStrip> = {
  title: 'Dashboard/Plaid/AccountsStrip',
  component: AccountsStrip,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof AccountsStrip>;

export const Default: Story = {};
