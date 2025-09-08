#!/usr/bin/env node

import { readFile, writeFile } from 'fs/promises';
import { resolve, basename } from 'path';
import { glob } from 'glob';
import { program } from 'commander';
import chalk from 'chalk';
import { MigrationTool } from './migration-tool.js';
import type { MigrationConfig } from './types.js';

// Re-export for backward compatibility
export { MigrationTool };
  private config: MigrationConfig;
  private converter: StyleConverter;
  private importResolver: ImportResolver;

  constructor(config: MigrationConfig) {
    this.config = config;
    this.converter = new StyleConverter(
      config.customThemeMapping,
      // Custom breakpoints can be added here
    );
    this.importResolver = new ImportResolver();
  }

  /**
   * Run migration on specified files
   */
  async migrate(filePaths?: string[]): Promise<void> {
    console.log(chalk.blue('🚀 Starting CSS-in-JS to Tailwind migration...\n'));

    const files = filePaths || await this.findFiles();
    
    if (files.length === 0) {
      console.log(chalk.yellow('⚠️  No files found matching the criteria.'));
      return;
    }

    console.log(chalk.green(`Found ${files.length} files to migrate:\n`));
    
    const results: MigrationResult[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (const file of files) {
      try {
        console.log(chalk.cyan(`📄 Processing: ${basename(file)}`));
        
        const result = await this.migrateFile(file);
        results.push(result);

        if (result.errors.length === 0) {
          successCount++;
          console.log(chalk.green(`   ✅ Migrated successfully`));
        } else {
          errorCount++;
          console.log(chalk.red(`   ❌ Migration failed`));
          result.errors.forEach(error => {
            console.log(chalk.red(`      Error: ${error.message}`));
          });
        }

        if (result.warnings.length > 0) {
          console.log(chalk.yellow(`   ⚠️  ${result.warnings.length} warnings`));
          if (this.config.verbose) {
            result.warnings.forEach(warning => {
              console.log(chalk.yellow(`      Warning: ${warning.message}`));
            });
          }
        }

        this.printStats(result.stats);
        console.log(''); // Empty line for readability

      } catch (error) {
        console.log(chalk.red(`   ❌ Failed to process file: ${error}`));
        errorCount++;
      }
    }

    this.printSummary(results, successCount, errorCount);

    if (this.config.generateReport) {
      await this.generateReport(results);
    }
  }

  private async findFiles(): Promise<string[]> {
    const patterns = this.config.include.length > 0 
      ? this.config.include 
      : ['**/*.{ts,tsx}'];

    const allFiles: string[] = [];
    
    for (const pattern of patterns) {
      const files = await glob(pattern, {
        ignore: this.config.exclude,
        absolute: true,
      });
      allFiles.push(...files);
    }

    return [...new Set(allFiles)];
  }

  private async migrateFile(filePath: string): Promise<MigrationResult> {
    // Read the source file
    const sourceCode = await readFile(filePath, 'utf-8');
    
    // Resolve style imports from separate files
    const { localStyles, importedStyles } = this.importResolver.resolveStyleImports(sourceCode, filePath);
    
    // Resolve imported styles to their actual definitions
    const resolvedImports = this.importResolver.resolveImportedStyles(importedStyles);

    // Combine local and imported styles
    const allExtractions: MakeStylesExtraction[] = [
      ...localStyles,
      ...Array.from(resolvedImports.values())
    ];

    if (allExtractions.length === 0 && importedStyles.length === 0) {
      // No makeStyles found anywhere, return early
      return {
        originalFile: filePath,
        migratedCode: sourceCode,
        conversions: [],
        classNameReplacements: new Map(),
        removedImports: [],
        errors: [],
        warnings: [],
        stats: {
          totalStyles: 0,
          convertedStyles: 0,
          unconvertibleStyles: 0,
          classNameReplacements: 0,
        }
      };
    }

    // Convert styles to Tailwind
    const conversions = new Map<string, TailwindConversion>();
    const warnings: any[] = [];
    const errors: any[] = [];
    
    for (const extraction of allExtractions) {
      for (const style of extraction.styles) {
        try {
          const conversion = this.converter.convertStyles(style.properties);
          conversions.set(`${extraction.hookName}.${style.name}`, conversion);
          
          // Collect warnings
          warnings.push(...conversion.warnings);
        } catch (error) {
          errors.push({
            type: 'error',
            message: `Failed to convert style ${extraction.hookName}.${style.name}: ${error}`,
            location: style.sourceLocation ? {
              line: style.sourceLocation.line,
              column: style.sourceLocation.column,
            } : undefined,
          });
        }
      }
    }

    // Transform the code with both local and imported styles
    const transformer = new CodeTransformer(sourceCode);
    const result = transformer.transformWithImports(
      allExtractions, 
      conversions, 
      importedStyles
    );

    // Add any import-related warnings/errors
    result.errors.push(...errors);
    result.warnings.push(...warnings);

    // Write the transformed code if not in dry-run mode
    if (!this.config.dryRun) {
      if (this.config.preserveOriginal) {
        await writeFile(`${filePath}.backup`, sourceCode);
      }
      await writeFile(filePath, result.migratedCode);
    }

    return {
      ...result,
      originalFile: filePath,
    };
  }

  private printStats(stats: MigrationResult['stats']): void {
    if (!this.config.verbose) return;

    const { totalStyles, convertedStyles, unconvertibleStyles, classNameReplacements } = stats;
    const conversionRate = totalStyles > 0 ? (convertedStyles / totalStyles * 100).toFixed(1) : '0';

    console.log(chalk.gray(`      Stats: ${convertedStyles}/${totalStyles} styles converted (${conversionRate}%)`));
    console.log(chalk.gray(`             ${classNameReplacements} className replacements`));
    
    if (unconvertibleStyles > 0) {
      console.log(chalk.gray(`             ${unconvertibleStyles} require manual review`));
    }
  }

  private printSummary(
    results: MigrationResult[],
    successCount: number,
    errorCount: number
  ): void {
    console.log(chalk.blue('\n📊 Migration Summary:'));
    console.log(chalk.green(`   ✅ Successfully migrated: ${successCount} files`));
    
    if (errorCount > 0) {
      console.log(chalk.red(`   ❌ Failed: ${errorCount} files`));
    }

    // Calculate aggregate stats
    const totalStats = results.reduce(
      (acc, result) => ({
        totalStyles: acc.totalStyles + result.stats.totalStyles,
        convertedStyles: acc.convertedStyles + result.stats.convertedStyles,
        unconvertibleStyles: acc.unconvertibleStyles + result.stats.unconvertibleStyles,
        classNameReplacements: acc.classNameReplacements + result.stats.classNameReplacements,
      }),
      { totalStyles: 0, convertedStyles: 0, unconvertibleStyles: 0, classNameReplacements: 0 }
    );

    const overallRate = totalStats.totalStyles > 0 
      ? (totalStats.convertedStyles / totalStats.totalStyles * 100).toFixed(1)
      : '0';

    console.log(chalk.blue(`\n   Overall conversion rate: ${overallRate}%`));
    console.log(chalk.blue(`   Total styles processed: ${totalStats.totalStyles}`));
    console.log(chalk.blue(`   Total className replacements: ${totalStats.classNameReplacements}`));
    
    if (totalStats.unconvertibleStyles > 0) {
      console.log(chalk.yellow(`   Styles requiring manual review: ${totalStats.unconvertibleStyles}`));
    }

    if (this.config.dryRun) {
      console.log(chalk.yellow('\n🔍 This was a dry run - no files were modified.'));
    }
  }

  private async generateReport(results: MigrationResult[]): Promise<void> {
    const reportPath = resolve(process.cwd(), 'migration-report.json');
    
    const report = {
      timestamp: new Date().toISOString(),
      config: this.config,
      summary: {
        totalFiles: results.length,
        successfulMigrations: results.filter(r => r.errors.length === 0).length,
        failedMigrations: results.filter(r => r.errors.length > 0).length,
        totalWarnings: results.reduce((sum, r) => sum + r.warnings.length, 0),
      },
      results: results.map(r => ({
        file: r.originalFile,
        stats: r.stats,
        warnings: r.warnings,
        errors: r.errors,
        conversions: r.conversions.map(c => ({
          tailwindClasses: c.tailwindClasses,
          warnings: c.warnings,
          unconvertible: c.unconvertible,
        }))
      }))
    };

    await writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(chalk.blue(`\n📄 Detailed report saved to: ${reportPath}`));
  }

  /**
   * Test migration on specific files
   */
  async test(testFiles: string[]): Promise<void> {
    console.log(chalk.blue('🧪 Testing migration on test files...\n'));

    for (const file of testFiles) {
      try {
        console.log(chalk.cyan(`Testing: ${basename(file)}`));
        
        const sourceCode = await readFile(file, 'utf-8');
        const parser = new ASTParser(sourceCode);
        const extractions = parser.extractMakeStylesCalls();

        if (extractions.length === 0) {
          console.log(chalk.yellow('   No makeStyles found'));
          continue;
        }

        console.log(chalk.green(`   Found ${extractions.length} makeStyles hooks`));

        // Convert styles
        const conversions = new Map<string, TailwindConversion>();
        
        for (const extraction of extractions) {
          console.log(chalk.blue(`     Hook: ${extraction.hookName}`));
          
          for (const style of extraction.styles) {
            console.log(chalk.gray(`       Style: ${style.name}`));
            const conversion = this.converter.convertStyles(style.properties);
            conversions.set(`${extraction.hookName}.${style.name}`, conversion);
            
            console.log(chalk.green(`         → ${conversion.tailwindClasses.join(' ')}`));
            
            if (conversion.warnings.length > 0) {
              conversion.warnings.forEach(w => 
                console.log(chalk.yellow(`         ⚠ ${w.message}`))
              );
            }
            
            if (conversion.unconvertible.length > 0) {
              conversion.unconvertible.forEach(u => 
                console.log(chalk.red(`         ❌ ${u.property}: ${u.reason}`))
              );
            }
          }
        }

        // Generate preview
        const transformer = new CodeTransformer(sourceCode);
        const preview = transformer.generatePreview(extractions, conversions);
        
        const previewPath = file.replace(/\.tsx?$/, '.preview.md');
        await writeFile(previewPath, preview);
        console.log(chalk.blue(`   Preview saved to: ${basename(previewPath)}`));

      } catch (error) {
        console.log(chalk.red(`   Error: ${error}`));
      }

      console.log('');
    }
  }
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
  .option('--use-clsx', 'Use clsx for conditional classes', true)
  .option('--generate-report', 'Generate detailed migration report', false)
  .action(async (options) => {
    const config: MigrationConfig = {
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

    const tool = new MigrationTool(config);
    await tool.migrate();
  });

program
  .command('test')
  .description('Test migration on specific files')
  .argument('<files...>', 'Test files to process')
  .option('-v, --verbose', 'Show detailed output', false)
  .action(async (files, options) => {
    const config: MigrationConfig = {
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