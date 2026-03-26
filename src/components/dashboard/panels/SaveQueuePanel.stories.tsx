import type { Meta, StoryObj } from '@storybook/react';
import SaveQueuePanel from './SaveQueuePanel';

const meta: Meta<typeof SaveQueuePanel> = {
  title: 'Dashboard/Panels/SaveQueuePanel',
  component: SaveQueuePanel,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-md p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof SaveQueuePanel>;

export const Default: Story = {};
