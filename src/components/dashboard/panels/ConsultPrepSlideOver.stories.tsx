import type { Meta, StoryObj } from '@storybook/react';
import ConsultPrepSlideOver from './ConsultPrepSlideOver';

const meta: Meta<typeof ConsultPrepSlideOver> = {
  title: 'Dashboard/Panels/ConsultPrepSlideOver',
  component: ConsultPrepSlideOver,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof ConsultPrepSlideOver>;

export const Default: Story = {};
