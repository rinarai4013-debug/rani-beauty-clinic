import type { Meta, StoryObj } from '@storybook/react';
import ProgressMatrix from './ProgressMatrix';

const meta: Meta<typeof ProgressMatrix> = {
  title: 'Dashboard/Training/ProgressMatrix',
  component: ProgressMatrix,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof ProgressMatrix>;

export const Default: Story = {};
