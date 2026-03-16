import { defineConfig } from 'vitest/config';
import { config } from 'dotenv';

// Load .env from project root so integration tests pick up credentials
config();

export default defineConfig({
  test: {
    include: ['tests/integration/**/*.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 15_000,
    sequence: {
      // Run test files sequentially — some depend on resources created by earlier tests
      concurrent: false,
    },
    // Run tests within each file sequentially
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
