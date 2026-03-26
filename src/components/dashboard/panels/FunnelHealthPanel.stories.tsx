import type { Meta, StoryObj } from '@storybook/react';
import FunnelHealthPanel from './FunnelHealthPanel';

const meta: Meta<typeof FunnelHealthPanel> = {
  title: 'Dashboard/Panels/FunnelHealthPanel',
  component: FunnelHealthPanel,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-md p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof FunnelHealthPanel>;

export const Default: Story = {};
