import type { Meta, StoryObj } from '@storybook/react';
import AudienceBuilder from './AudienceBuilder';

const meta: Meta<typeof AudienceBuilder> = {
  title: 'Dashboard/Communications/AudienceBuilder',
  component: AudienceBuilder,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-2xl p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof AudienceBuilder>;

export const Default: Story = {};
