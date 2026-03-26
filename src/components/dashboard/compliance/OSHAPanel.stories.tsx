import type { Meta, StoryObj } from '@storybook/react';
import OSHAPanel from './OSHAPanel';

const meta: Meta<typeof OSHAPanel> = {
  title: 'Dashboard/Compliance/OSHAPanel',
  component: OSHAPanel,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-2xl p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof OSHAPanel>;

export const Default: Story = {};
