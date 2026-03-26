import type { Meta, StoryObj } from '@storybook/react';
import SectionViewer from './SectionViewer';

const meta: Meta<typeof SectionViewer> = {
  title: 'Dashboard/Training/SectionViewer',
  component: SectionViewer,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-2xl p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof SectionViewer>;

export const Default: Story = {};
