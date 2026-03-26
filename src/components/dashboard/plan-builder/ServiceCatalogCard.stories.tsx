import type { Meta, StoryObj } from '@storybook/react';
import ServiceCatalogCard from './ServiceCatalogCard';

const meta: Meta<typeof ServiceCatalogCard> = {
  title: 'Dashboard/PlanBuilder/ServiceCatalogCard',
  component: ServiceCatalogCard,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-xs p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof ServiceCatalogCard>;

export const Default: Story = {};
