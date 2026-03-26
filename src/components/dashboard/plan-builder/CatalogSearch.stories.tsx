import type { Meta, StoryObj } from '@storybook/react';
import CatalogSearch from './CatalogSearch';

const meta: Meta<typeof CatalogSearch> = {
  title: 'Dashboard/PlanBuilder/CatalogSearch',
  component: CatalogSearch,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-md p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof CatalogSearch>;

export const Default: Story = {};
