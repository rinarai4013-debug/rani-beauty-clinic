import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    pool: 'threads',
    setupFiles: [],
    exclude: [
      'e2e/**',
      'node_modules/**',
      // Tracked files with circular-import crashes during mock hoisting.
      'src/lib/analytics/__tests__/hooks.test.ts',
      'src/lib/plan-builder/__tests__/plan-templates.test.ts',
      // Untracked stubs that crash on import (no source file backing them).
      'src/lib/ads/creative-engine/__tests__/creative-engine.test.ts',
      'src/lib/ads/landing-page-generator/__tests__/landing-page-generator.test.ts',
      'src/lib/ads/meta-creative-factory/__tests__/meta-creative-factory.test.ts',
      'src/lib/marketing/__tests__/seo-monitor.test.ts',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
