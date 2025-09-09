#!/usr/bin/env node

import { glob } from 'glob';
import { program } from 'commander';
import { MigrationTool } from './migration-tool.js';
import type { MigrationConfig } from './types.js';

// Re-export for backward compatibility
export { MigrationTool };

async function findFiles(include: string[], exclude: string[]): Promise<string[]> {
  const patterns = include.length > 0 ? include : ['**/*.{ts,tsx}'];
  const allFiles: string[] = [];
  
  for (const pattern of patterns) {
    const files = await glob(pattern, {
      ignore: exclude,
      absolute: true,
    });
    allFiles.push(...files);
  }

  return [...new Set(allFiles)];
}

// CLI Setup
program
  .name('mttwm')
  .description('MTTWM - Material To Tailwind Migrator: Migrate CSS-in-JS (makeStyles) to Tailwind CSS')
  .version('1.0.0');

program
  .command('migrate')
  .description('Migrate files from CSS-in-JS to Tailwind')
  .option('-p, --pattern <patterns...>', 'File patterns to include', ['**/*.{ts,tsx}'])
  .option('-e, --exclude <patterns...>', 'File patterns to exclude', ['node_modules/**', 'dist/**'])
  .option('-d, --dry-run', 'Preview changes without modifying files', false)
  .option('-v, --verbose', 'Show detailed output', false)
  .option('--preserve-original', 'Create backup files', false)
  .option('--use-cn', 'Use cn utility for conditional classes', true)
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
      useCn: options.useCn,
      customThemeMapping: {},
      customPropertyMapping: {},
      maxWarningsPerFile: 50,
      failOnErrors: false,
      generateReport: options.generateReport,
    };

    const files = await findFiles(config.include, config.exclude);
    const tool = new MigrationTool(config);
    await tool.migrate(files);
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
      useCn: true,
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