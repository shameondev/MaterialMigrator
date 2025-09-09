#!/usr/bin/env node

import { glob } from 'glob';
import { program } from 'commander';
import chalk from 'chalk';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { createRequire } from 'module';
import { MigrationTool } from './migration-tool.js';
import type { MigrationConfig } from './types.js';

/**
 * Load configuration from mttwm.config.js in project root
 */
async function loadConfigFile(projectRoot: string): Promise<Partial<MigrationConfig>> {
  const configPath = join(projectRoot, 'mttwm.config.js');
  
  if (!existsSync(configPath)) {
    return {};
  }

  try {
    // Use dynamic import for ES modules
    const { default: config } = await import(`file://${configPath}`);
    console.log(chalk.green(`📝 Loaded config from ${configPath}`));
    return config || {};
  } catch (error) {
    try {
      // Fallback to require for CommonJS modules
      const require = createRequire(import.meta.url);
      const config = require(configPath);
      console.log(chalk.green(`📝 Loaded config from ${configPath}`));
      return config || {};
    } catch (requireError) {
      console.warn(chalk.yellow(`⚠️  Failed to load config from ${configPath}: ${error}`));
      return {};
    }
  }
}

// CLI Setup
program
  .name('mttwm')
  .description('MTTWM - Material To Tailwind Migrator: Migrate CSS-in-JS (makeStyles) to Tailwind CSS')
  .version('1.6.0');

program
  .command('migrate')
  .description('Migrate files from CSS-in-JS to Tailwind')
  .argument('[files...]', 'Specific files to migrate (optional)')
  .option('-p, --pattern <patterns...>', 'File patterns to include', ['**/*.{ts,tsx}'])
  .option('-e, --exclude <patterns...>', 'File patterns to exclude', ['node_modules/**', 'dist/**'])
  .option('-d, --dry-run', 'Preview changes without modifying files', false)
  .option('-v, --verbose', 'Show detailed output', false)
  .option('--preserve-original', 'Create backup files', false)
  .option('--use-cn', 'Use cn utility for conditional classes', true)
  .option('--generate-report', 'Generate detailed migration report', false)
  .action(async (files, options) => {
    const projectRoot = process.cwd();
    
    // Load config from mttwm.config.js if it exists
    const fileConfig = await loadConfigFile(projectRoot);
    
    const config: MigrationConfig = {
      // Default values
      projectRoot,
      include: options.pattern,
      exclude: options.exclude,
      customThemeMapping: {},
      customPropertyMapping: {},
      maxWarningsPerFile: 50,
      failOnErrors: false,
      // Merge file config
      ...fileConfig,
      // CLI options always take precedence over config file
      writeFiles: !options.dryRun,
      dryRun: options.dryRun,
      verbose: options.verbose,
      preserveOriginal: options.preserveOriginal,
      useCn: options.useCn,
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
      
      // Show summary with detailed status
      const complete = results.filter(r => r.migrationStatus === 'complete');
      const partial = results.filter(r => r.migrationStatus === 'partial');
      const failed = results.filter(r => r.migrationStatus === 'failed');
      const skipped = results.filter(r => r.migrationStatus === 'skipped');
      
      console.log(chalk.blue('\n📊 Migration Summary:'));
      console.log(chalk.green(`✅ Fully migrated: ${complete.length} files`));
      if (partial.length > 0) {
        console.log(chalk.yellow(`🔄 Partially migrated: ${partial.length} files`));
      }
      if (failed.length > 0) {
        console.log(chalk.red(`❌ Failed to migrate: ${failed.length} files`));
      }
      if (skipped.length > 0) {
        console.log(chalk.gray(`⏭️  Skipped: ${skipped.length} files`));
      }

      // Show details for files that need attention
      if (failed.length > 0) {
        console.log(chalk.red('\nFailed files:'));
        failed.forEach(r => {
          console.log(chalk.red(`- ${r.filePath}: ${r.error || 'No styles migrated, all classes.x remain'}`));
        });
      }

      // Show skipped files details when verbose
      if (options.verbose && skipped.length > 0) {
        // Group skipped files by reason for cleaner output
        const skipReasons = new Map<string, string[]>();
        skipped.forEach(r => {
          const reason = r.error || 'No makeStyles calls found';
          if (!skipReasons.has(reason)) {
            skipReasons.set(reason, []);
          }
          skipReasons.get(reason)!.push(r.filePath);
        });

        console.log(chalk.gray('\nSkipped files by reason:'));
        for (const [reason, files] of skipReasons) {
          console.log(chalk.gray(`\n📋 ${reason}: ${files.length} files`));
          const displayFiles = files.slice(0, 10); // Show up to 10 files in verbose mode
          displayFiles.forEach(filePath => console.log(chalk.gray(`  - ${filePath}`)));
          if (files.length > 10) {
            console.log(chalk.gray(`  ... and ${files.length - 10} more files`));
          }
        }
      } else if (skipped.length > 0) {
        console.log(chalk.gray('\nUse --verbose to see details about skipped files'));
      }

      if (partial.length > 0) {
        console.log(chalk.yellow('\nPartially migrated files (manual review required):'));
        partial.forEach(r => {
          const remaining = r.stats.remainingClassesUsages;
          console.log(chalk.yellow(`- ${r.filePath}: ${remaining} classes.x usages remain`));
        });
      }
    }
  });


// Always run the CLI - simplified approach
program.parse();