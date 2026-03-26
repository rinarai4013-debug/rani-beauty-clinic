import type { Meta, StoryObj } from '@storybook/react';
import HIPAAPanel from './HIPAAPanel';

const meta: Meta<typeof HIPAAPanel> = {
  title: 'Dashboard/Compliance/HIPAAPanel',
  component: HIPAAPanel,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-2xl p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof HIPAAPanel>;

export const Default: Story = {};
