import type { Meta, StoryObj } from '@storybook/react';
import NoShowRiskPanel from './NoShowRiskPanel';

const meta: Meta<typeof NoShowRiskPanel> = {
  title: 'Dashboard/Panels/NoShowRiskPanel',
  component: NoShowRiskPanel,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-md p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof NoShowRiskPanel>;

export const Default: Story = {};
