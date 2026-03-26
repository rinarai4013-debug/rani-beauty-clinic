import type { Meta, StoryObj } from '@storybook/react';
import ProductCatalog from './ProductCatalog';

const meta: Meta<typeof ProductCatalog> = {
  title: 'Dashboard/Inventory/ProductCatalog',
  component: ProductCatalog,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof ProductCatalog>;

export const Default: Story = {};
