#!/usr/bin/env node

import { readFile, writeFile } from 'fs/promises';
import { resolve, basename } from 'path';
import { glob } from 'glob';
import { program } from 'commander';
import chalk from 'chalk';
import { MigrationTool } from './migration-tool.js';
import type { MigrationConfig } from './types.js';

// CLI Setup
program
  .name('mttwm')
  .description('MTTWM - Material To Tailwind Migrator: Migrate CSS-in-JS (makeStyles) to Tailwind CSS')
  .version('1.1.0');

program
  .command('migrate')
  .description('Migrate files from CSS-in-JS to Tailwind')
  .option('-p, --pattern <patterns...>', 'File patterns to include', ['**/*.{ts,tsx}'])
  .option('-e, --exclude <patterns...>', 'File patterns to exclude', ['node_modules/**', 'dist/**'])
  .option('-d, --dry-run', 'Preview changes without modifying files', false)
  .option('-v, --verbose', 'Show detailed output', false)
  .option('--preserve-original', 'Create backup files', false)
  .option('--use-clsx', 'Use clsx for conditional classes', true)
  .option('--generate-report', 'Generate detailed migration report', false)
  .action(async (options) => {
    const config: MigrationConfig = {
      projectRoot: process.cwd(),
      writeFiles: !options.dryRun,
      include: options.pattern,
      exclude: options.exclude,
      dryRun: options.dryRun,
      verbose: options.verbose,
      preserveOriginal: options.preserveOriginal,
      useClsx: options.useClsx,
      customThemeMapping: {},
      customPropertyMapping: {},
      maxWarningsPerFile: 50,
      failOnErrors: false,
      generateReport: options.generateReport,
    };

    // Find files to migrate
    const files: string[] = [];
    for (const pattern of config.include) {
      const matches = await glob(pattern, { 
        ignore: config.exclude,
        cwd: config.projectRoot 
      });
      files.push(...matches);
    }

    if (files.length === 0) {
      console.log(chalk.yellow('No files found to migrate'));
      return;
    }

    const tool = new MigrationTool(config);
    
    if (options.dryRun) {
      await tool.test(files);
    } else {
      const results = await tool.migrate(files);
      
      // Show summary
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);
      
      console.log(chalk.blue('\n📊 Migration Summary:'));
      console.log(chalk.green(`✅ Successfully migrated: ${successful.length} files`));
      if (failed.length > 0) {
        console.log(chalk.red(`❌ Failed to migrate: ${failed.length} files`));
      }
    }
  });

program
  .command('test')
  .description('Test migration on specific files')
  .argument('<files...>', 'Test files to process')
  .option('-v, --verbose', 'Show detailed output', false)
  .action(async (files, options) => {
    const config: MigrationConfig = {
      projectRoot: process.cwd(),
      writeFiles: false,
      include: [],
      exclude: [],
      dryRun: true,
      verbose: options.verbose,
      preserveOriginal: false,
      useClsx: true,
      customThemeMapping: {},
      customPropertyMapping: {},
      maxWarningsPerFile: 50,
      failOnErrors: false,
      generateReport: false,
    };

    const tool = new MigrationTool(config);
    await tool.test(files);
  });

// Run the CLI when executed directly (not when imported in tests)
// Avoid import.meta in Jest environment to prevent syntax errors
const isMainModule = (() => {
  // Check if we're in Jest environment
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    return false;
  }
  
  // Check if we're in Jest (another way)
  if (typeof global !== 'undefined' && (global as any).it && (global as any).describe) {
    return false;
  }
  
  try {
    // Use eval to prevent Jest from parsing import.meta at compile time
    const importMeta = eval('import.meta');
    return importMeta.url === `file://${process.argv[1]}`;
  } catch {
    return false;
  }
})();

if (isMainModule) {
  program.parse();
}