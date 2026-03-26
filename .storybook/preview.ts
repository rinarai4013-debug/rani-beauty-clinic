import type { Preview } from '@storybook/react';
import '../src/app/globals.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#FAF8F5' },
        { name: 'white', value: '#FFFFFF' },
        { name: 'dark', value: '#0F1D2C' },
        { name: 'dashboard', value: '#F3F4F6' },
      ],
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: { width: '375px', height: '812px' },
        },
        tablet: {
          name: 'Tablet',
          styles: { width: '768px', height: '1024px' },
        },
        desktop: {
          name: 'Desktop',
          styles: { width: '1280px', height: '800px' },
        },
        dashboardWide: {
          name: 'Dashboard Wide',
          styles: { width: '1440px', height: '900px' },
        },
      },
    },
    layout: 'padded',
  },
};

export default preview;
