import type { Meta, StoryObj } from '@storybook/react';
import BulkSendPreview from './BulkSendPreview';

const meta: Meta<typeof BulkSendPreview> = {
  title: 'Dashboard/Communications/BulkSendPreview',
  component: BulkSendPreview,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-2xl p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof BulkSendPreview>;

export const Default: Story = {};
