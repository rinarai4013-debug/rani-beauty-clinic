import type { Meta, StoryObj } from '@storybook/react';
import PlanPreviewModal from './PlanPreviewModal';

const meta: Meta<typeof PlanPreviewModal> = {
  title: 'Dashboard/PlanBuilder/PlanPreviewModal',
  component: PlanPreviewModal,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof PlanPreviewModal>;

export const Default: Story = {};
