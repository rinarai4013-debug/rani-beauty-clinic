import type { Meta, StoryObj } from '@storybook/react';
import SkipNav from './SkipNav';

const meta: Meta<typeof SkipNav> = {
  title: 'UI/SkipNav',
  component: SkipNav,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof SkipNav>;

export const Default: Story = {
  render: () => (
    <div>
      <SkipNav />
      <p className="p-8 text-sm text-rani-muted">
        Press Tab to reveal the Skip Nav link. It appears when focused.
      </p>
      <main id="main-content" className="p-8">
        <h1 className="font-heading text-2xl text-rani-navy">Main Content</h1>
      </main>
    </div>
  ),
};
