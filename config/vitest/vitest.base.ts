import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/**
 * vitest.base.ts — LKVIP GROUP
 * ─────────────────────────────────────────────────────────────────────────────
 * Base Vitest config dùng chung cho tất cả frontend SPA.
 *
 * Usage trong mỗi app (apps/hub/vitest.config.ts):
 *   import { mergeConfig } from 'vite';
 *   import baseConfig from '../../config/vitest/vitest.base.ts';
 *   export default mergeConfig(baseConfig, defineConfig({
 *     resolve: { alias: { '@': new URL('./src', import.meta.url).pathname } },
 *   }));
 *
 * IMPORTANT: Mỗi app phải có file src/test/setup.ts riêng (hoặc overide setupFiles).
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals:     true,
    setupFiles:  ['./src/test/setup.ts'],
    include:     ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude:     ['node_modules', 'dist', 'src/test/setup.ts'],
    reporters:   ['verbose'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'lcov', 'html'],
      exclude: [
        'node_modules',
        'dist',
        'src/test',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts',
      ],
      thresholds: {
        lines:      60,
        functions:  60,
        branches:   50,
        statements: 60,
      },
    },
  },
});
