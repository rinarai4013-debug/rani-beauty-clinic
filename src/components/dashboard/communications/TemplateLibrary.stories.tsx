import type { Meta, StoryObj } from '@storybook/react';
import TemplateLibrary from './TemplateLibrary';

const meta: Meta<typeof TemplateLibrary> = {
  title: 'Dashboard/Communications/TemplateLibrary',
  component: TemplateLibrary,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof TemplateLibrary>;

export const Default: Story = {};
