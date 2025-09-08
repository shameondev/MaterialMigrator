#!/usr/bin/env tsx

import { MigrationTestRunner } from './migration-test-runner.js';

async function main() {
  const testDir = process.argv[2] || '__tests__/integration/migration-tests';
  
  console.log(`🔍 Discovering tests in ${testDir}...`);
  
  const runner = new MigrationTestRunner();
  await runner.discoverTests(testDir);
  
  const results = await runner.runAllTests();
  runner.printSummary(results);
  
  const failedCount = results.filter(r => !r.passed).length;
  
  if (failedCount > 0) {
    console.log(`\n💥 ${failedCount} tests failed!`);
    process.exit(1);
  } else {
    console.log(`\n🎉 All tests passed!`);
    process.exit(0);
  }
}

main().catch(error => {
  console.error('❌ Error running migration tests:', error);
  process.exit(1);
});