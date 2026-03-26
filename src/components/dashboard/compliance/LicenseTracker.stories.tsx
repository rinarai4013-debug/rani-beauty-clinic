import type { Meta, StoryObj } from '@storybook/react';
import LicenseTracker from './LicenseTracker';

const meta: Meta<typeof LicenseTracker> = {
  title: 'Dashboard/Compliance/LicenseTracker',
  component: LicenseTracker,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof LicenseTracker>;

export const Default: Story = {};
