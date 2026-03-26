import type { Meta, StoryObj } from '@storybook/react';
import UnsubscribeManager from './UnsubscribeManager';

const meta: Meta<typeof UnsubscribeManager> = {
  title: 'Dashboard/Communications/UnsubscribeManager',
  component: UnsubscribeManager,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof UnsubscribeManager>;

export const Default: Story = {};
