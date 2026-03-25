import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Exclude Playwright E2E specs — those are run via `npx playwright test`
    exclude: [
      '**/node_modules/**',
      '**/tests/e2e/**',
    ],
    workspace: [
      {
        test: {
          name: 'shared',
          root: './packages/shared',
          include: ['**/__tests__/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'admin',
          root: './apps/admin',
          include: ['src/**/__tests__/**/*.test.{ts,tsx}'],
          environment: 'jsdom',
          globals: true,
          css: false,
          setupFiles: ['./src/__tests__/setup.ts'],
          alias: {
            '@': path.resolve(__dirname, './apps/admin/src'),
          },
        },
      },
      {
        test: {
          name: 'client',
          root: './apps/client',
          include: ['src/**/__tests__/**/*.test.{ts,tsx}'],
          environment: 'jsdom',
          globals: true,
          css: false,
          setupFiles: ['./src/__tests__/setup.ts'],
          alias: {
            '@': path.resolve(__dirname, './apps/client/src'),
          },
        },
      },
    ],
  },
});
