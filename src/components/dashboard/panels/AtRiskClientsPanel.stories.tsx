import type { Meta, StoryObj } from '@storybook/react';
import AtRiskClientsPanel from './AtRiskClientsPanel';

const meta: Meta<typeof AtRiskClientsPanel> = {
  title: 'Dashboard/Panels/AtRiskClientsPanel',
  component: AtRiskClientsPanel,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-md p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof AtRiskClientsPanel>;

export const Default: Story = {};
