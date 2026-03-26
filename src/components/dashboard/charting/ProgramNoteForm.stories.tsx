import type { Meta, StoryObj } from '@storybook/react';
import ProgramNoteForm from './ProgramNoteForm';

const meta: Meta<typeof ProgramNoteForm> = {
  title: 'Dashboard/Charting/ProgramNoteForm',
  component: ProgramNoteForm,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-2xl p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof ProgramNoteForm>;

export const Default: Story = {};
