import type { Meta, StoryObj } from '@storybook/react';
import CertificateBadge from './CertificateBadge';

const meta: Meta<typeof CertificateBadge> = {
  title: 'Dashboard/Training/CertificateBadge',
  component: CertificateBadge,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-xs p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof CertificateBadge>;

export const Default: Story = {};
