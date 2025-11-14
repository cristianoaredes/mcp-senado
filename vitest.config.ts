import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'build/**',
        'test/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/types/**',
        '**/bin/**',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },

    // Test directories
    include: ['test/**/*.test.ts', 'test/**/*.spec.ts'],
    exclude: ['node_modules/**', 'build/**'],

    // Globals
    globals: true,

    // Timeout
    testTimeout: 10000,
    hookTimeout: 10000,

    // Retry failed tests
    retry: 0,

    // Reporters
    reporters: ['verbose'],
  },
});
