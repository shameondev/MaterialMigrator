#!/usr/bin/env node

import { resolve } from 'path';
import { readdir } from 'fs/promises';
import chalk from 'chalk';
import { MigrationTool } from './migrate.js';
import type { MigrationConfig } from './types.js';

/**
 * Test runner for all test files
 */
async function runAllTests(): Promise<void> {
  console.log(chalk.blue('🧪 Running CSS-in-JS to Tailwind Migration Tests\n'));

  const testDir = resolve(process.cwd(), 'test-files');
  
  try {
    const files = await readdir(testDir);
    const testFiles = files
      .filter(file => file.endsWith('.test.tsx'))
      .map(file => resolve(testDir, file))
      .sort();

    if (testFiles.length === 0) {
      console.log(chalk.yellow('⚠️  No test files found in test-files directory'));
      return;
    }

    console.log(chalk.green(`Found ${testFiles.length} test files:\n`));

    // Test configuration
    const config: MigrationConfig = {
      include: [],
      exclude: [],
      dryRun: true,
      verbose: true,
      preserveOriginal: false,
      useClsx: true,
      customThemeMapping: {},
      customPropertyMapping: {},
      maxWarningsPerFile: 100,
      failOnErrors: false,
      generateReport: false,
    };

    const tool = new (MigrationTool as any)(config);

    // Run tests sequentially to avoid output mixing
    for (let i = 0; i < testFiles.length; i++) {
      const file = testFiles[i];
      console.log(chalk.cyan(`\n📋 Test ${i + 1}/${testFiles.length}: ${file.split('/').pop()}`));
      console.log(chalk.gray('─'.repeat(60)));
      
      await tool.test([file]);
      
      if (i < testFiles.length - 1) {
        console.log(chalk.gray('─'.repeat(60)));
      }
    }

    console.log(chalk.blue('\n✅ All tests completed!'));
    console.log(chalk.gray('Check the generated .preview.md files for detailed results.'));

  } catch (error) {
    console.error(chalk.red(`❌ Error running tests: ${error}`));
    process.exit(1);
  }
}

/**
 * Run specific test by name
 */
async function runSpecificTest(testName: string): Promise<void> {
  const testDir = resolve(process.cwd(), 'test-files');
  const testFile = resolve(testDir, `${testName}.test.tsx`);

  const config: MigrationConfig = {
    include: [],
    exclude: [],
    dryRun: true,
    verbose: true,
    preserveOriginal: false,
    useClsx: true,
    customThemeMapping: {},
    customPropertyMapping: {},
    maxWarningsPerFile: 100,
    failOnErrors: false,
    generateReport: false,
  };

  const tool = new (MigrationTool as any)(config);
  await tool.test([testFile]);
}

// CLI handling
const args = process.argv.slice(2);

if (args.length === 0) {
  runAllTests();
} else {
  const testName = args[0];
  console.log(chalk.blue(`🧪 Running specific test: ${testName}\n`));
  runSpecificTest(testName);
}

export { runAllTests, runSpecificTest };