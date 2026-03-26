import type { Meta, StoryObj } from '@storybook/react';
import DEAReconciliation from './DEAReconciliation';

const meta: Meta<typeof DEAReconciliation> = {
  title: 'Dashboard/Compliance/DEAReconciliation',
  component: DEAReconciliation,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof DEAReconciliation>;

export const Default: Story = {};
