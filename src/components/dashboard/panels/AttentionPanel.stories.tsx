import type { Meta, StoryObj } from '@storybook/react';
import AttentionPanel from './AttentionPanel';

const meta: Meta<typeof AttentionPanel> = {
  title: 'Dashboard/Panels/AttentionPanel',
  component: AttentionPanel,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-md p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof AttentionPanel>;

export const Default: Story = {};
