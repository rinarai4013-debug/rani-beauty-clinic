import type { Meta, StoryObj } from '@storybook/react';
import SoapNoteForm from './SoapNoteForm';

const meta: Meta<typeof SoapNoteForm> = {
  title: 'Dashboard/Charting/SoapNoteForm',
  component: SoapNoteForm,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-2xl p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof SoapNoteForm>;

export const Default: Story = {};
