import type { Meta, StoryObj } from '@storybook/react';
import QuizSection from './QuizSection';

const meta: Meta<typeof QuizSection> = {
  title: 'Dashboard/Training/QuizSection',
  component: QuizSection,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-2xl p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof QuizSection>;

export const Default: Story = {};
