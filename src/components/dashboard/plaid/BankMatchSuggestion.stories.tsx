import type { Meta, StoryObj } from '@storybook/react';
import BankMatchSuggestion from './BankMatchSuggestion';

const meta: Meta<typeof BankMatchSuggestion> = {
  title: 'Dashboard/Plaid/BankMatchSuggestion',
  component: BankMatchSuggestion,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-lg p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof BankMatchSuggestion>;

export const Default: Story = {};
