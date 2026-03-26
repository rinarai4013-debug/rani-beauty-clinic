import type { Meta, StoryObj } from '@storybook/react';
import InjectionLogForm from './InjectionLogForm';

const meta: Meta<typeof InjectionLogForm> = {
  title: 'Dashboard/Charting/InjectionLogForm',
  component: InjectionLogForm,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-2xl p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof InjectionLogForm>;

export const Default: Story = {};
