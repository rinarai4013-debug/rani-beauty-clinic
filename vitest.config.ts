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
      // Untracked test files on disk from old feature branches — not in
      // git, should not run in CI. Remove each line when the feature lands.
      'src/lib/ads/creative-engine/**',
      'src/lib/ads/landing-page-generator/**',
      'src/lib/ads/meta-creative-factory/**',
      'src/lib/ads/google-ads-engine/**',
      'src/lib/marketing/**',
      'src/lib/mastermind/simulation-engine.test.ts',
      'src/lib/plan-builder/conversion-engine.test.ts',
      // Tracked files with circular-import crashes during mock hoisting.
      // vi.mock factories reference modules before initialization.
      // Fix: rewrite mocks to not reference originals at import time.
      'src/lib/analytics/__tests__/hooks.test.ts',
      'src/lib/plan-builder/__tests__/plan-templates.test.ts',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
