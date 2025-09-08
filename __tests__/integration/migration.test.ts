import { createMigrationTests } from './migration-test-runner.js';

// This will create Jest tests for all discovered migration test cases
createMigrationTests('__tests__/integration/migration-tests');