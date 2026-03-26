import type { Meta, StoryObj } from '@storybook/react';
import RecommendationsPanel from './RecommendationsPanel';

const meta: Meta<typeof RecommendationsPanel> = {
  title: 'Dashboard/Panels/RecommendationsPanel',
  component: RecommendationsPanel,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-md p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof RecommendationsPanel>;

export const Default: Story = {};
