import type { Meta, StoryObj } from '@storybook/react';
import PlaidLinkButton from './PlaidLinkButton';

const meta: Meta<typeof PlaidLinkButton> = {
  title: 'Dashboard/Plaid/PlaidLinkButton',
  component: PlaidLinkButton,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof PlaidLinkButton>;

export const Default: Story = {};
