#!/usr/bin/env node

import { glob } from 'glob';
import { program } from 'commander';
import chalk from 'chalk';
import { MigrationTool } from './migration-tool.js';
import type { MigrationConfig } from './types.js';

// CLI Setup
program
  .name('mttwm')
  .description('MTTWM - Material To Tailwind Migrator: Migrate CSS-in-JS (makeStyles) to Tailwind CSS')
  .version('1.4.0');

program
  .command('migrate')
  .description('Migrate files from CSS-in-JS to Tailwind')
  .argument('[files...]', 'Specific files to migrate (optional)')
  .option('-p, --pattern <patterns...>', 'File patterns to include', ['**/*.{ts,tsx}'])
  .option('-e, --exclude <patterns...>', 'File patterns to exclude', ['node_modules/**', 'dist/**'])
  .option('-d, --dry-run', 'Preview changes without modifying files', false)
  .option('-v, --verbose', 'Show detailed output', false)
  .option('--preserve-original', 'Create backup files', false)
  .option('--use-clsx', 'Use clsx for conditional classes', true)
  .option('--generate-report', 'Generate detailed migration report', false)
  .action(async (files, options) => {
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
    let filesToMigrate: string[] = [];
    
    if (files && files.length > 0) {
      // Direct file paths provided as arguments
      filesToMigrate = files;
      console.log(chalk.blue(`📁 Processing ${files.length} specified file(s)`));
    } else {
      // Use pattern-based file discovery
      console.log(chalk.blue('🔍 Discovering files using patterns...'));
      for (const pattern of config.include) {
        const matches = await glob(pattern, { 
          ignore: config.exclude,
          cwd: config.projectRoot 
        });
        filesToMigrate.push(...matches);
      }
    }

    if (filesToMigrate.length === 0) {
      console.log(chalk.yellow('No files found to migrate'));
      return;
    }

    const tool = new MigrationTool(config);
    
    if (options.dryRun) {
      await tool.test(filesToMigrate);
    } else {
      const results = await tool.migrate(filesToMigrate);
      
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


// Always run the CLI - simplified approach
program.parse();