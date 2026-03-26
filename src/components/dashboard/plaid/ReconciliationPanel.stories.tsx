import type { Meta, StoryObj } from '@storybook/react';
import ReconciliationPanel from './ReconciliationPanel';

const meta: Meta<typeof ReconciliationPanel> = {
  title: 'Dashboard/Plaid/ReconciliationPanel',
  component: ReconciliationPanel,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof ReconciliationPanel>;

export const Default: Story = {};
