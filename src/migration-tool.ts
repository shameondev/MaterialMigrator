import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { ASTParser } from './parser.js';
import { StyleConverter } from './converter.js';
import { CodeTransformer } from './transformer.js';
import { ImportResolver } from './import-resolver.js';
import type { MigrationConfig, MigrationResult, TailwindConversion, StyleImport, MakeStylesExtraction } from './types.js';

export class MigrationTool {
  private config: MigrationConfig;
  private converter: StyleConverter;
  private importResolver: ImportResolver;

  constructor(config: MigrationConfig) {
    this.config = config;
    this.converter = new StyleConverter({
      customThemeMapping: config.customThemeMapping
    });
    this.importResolver = new ImportResolver();
  }

  async migrate(files: string[]): Promise<MigrationResult[]> {
    const results: MigrationResult[] = [];
    
    for (const filePath of files) {
      try {
        const result = await this.migrateFile(filePath);
        results.push(result);
      } catch (error) {
        results.push({
          filePath,
          success: false,
          migrationStatus: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          originalCode: '',
          migratedCode: '',
          conversions: [],
          classNameReplacements: new Map(),
          removedImports: [],
          stats: {
            totalStyles: 0,
            convertedStyles: 0,
            unconvertibleStyles: 0,
            classNameReplacements: 0,
            remainingClassesUsages: 0,
          }
        });
      }
    }

    return results;
  }

  async migrateFile(filePath: string): Promise<MigrationResult> {
    const fullPath = filePath.startsWith('/') ? filePath : resolve(this.config.projectRoot, filePath);
    const originalCode = await readFile(fullPath, 'utf-8');
    
    try {
      // Parse the source code
      const parser = new ASTParser(originalCode);
      const extractions = parser.extractMakeStylesCalls();
      
      // Resolve imported styles if any  
      const importedStyles = this.importResolver.resolveStyleImports(originalCode, filePath);
      
      
      // If no makeStyles found locally and no imported styles, return original
      if (extractions.length === 0 && (!importedStyles || importedStyles.importedStyles.length === 0)) {
        // Determine the specific reason for skipping
        let skipReason = 'No makeStyles calls found';
        if (originalCode.includes('makeStyles')) {
          skipReason = 'makeStyles calls found but could not be parsed';
        } else if (originalCode.includes('classes.') || originalCode.includes('classes?.')) {
          skipReason = 'Found classes usage but no makeStyles or imported styles';
        } else if (originalCode.includes('useStyles')) {
          skipReason = 'Found useStyles references but could not resolve imports';
        }

        return {
          filePath,
          success: true,
          migrationStatus: 'skipped',
          error: skipReason,
          originalCode,
          migratedCode: originalCode,
          conversions: [],
          classNameReplacements: new Map(),
          removedImports: [],
          stats: {
            totalStyles: 0,
            convertedStyles: 0,
            unconvertibleStyles: 0,
            classNameReplacements: 0,
            remainingClassesUsages: 0,
          }
        };
      }
      
      // Convert styles to Tailwind
      const conversions = new Map<string, TailwindConversion>();
      
      // Process local styles
      for (const extraction of extractions) {
        for (const style of extraction.styles) {
          const styleKey = `${extraction.hookName}.${style.name}`;
          const conversion = this.converter.convertStyles(style.properties);
          conversions.set(styleKey, conversion);
        }
      }
      
      // Process imported styles and add them to extractions
      const importedExtractions: MakeStylesExtraction[] = [];
      if (importedStyles && importedStyles.importedStyles.length > 0) {
        const resolvedImports = this.importResolver.resolveImportedStyles(importedStyles.importedStyles);
        for (const [styleKey, extraction] of resolvedImports) {
          // Add the extraction to our list so transformer can find it
          importedExtractions.push(extraction);
          
          for (const style of extraction.styles) {
            const fullStyleKey = `${extraction.hookName}.${style.name}`;
            const conversion = this.converter.convertStyles(style.properties);
            conversions.set(fullStyleKey, conversion);
            
          }
        }
      }
      
      // Combine local and imported extractions for transformer
      const allExtractions = [...extractions, ...importedExtractions];

      // Transform the code
      const transformer = new CodeTransformer(originalCode);
      
      
      const transformResult = importedStyles && importedStyles.importedStyles.length > 0
        ? transformer.transformWithImports(allExtractions, conversions, importedStyles.importedStyles)
        : transformer.transform(allExtractions, conversions);

      // Write the migrated code if requested
      if (this.config.writeFiles && transformResult.migratedCode !== originalCode) {
        await writeFile(fullPath, transformResult.migratedCode, 'utf-8');
      }

      // Update imported style files if they have converted properties
      if (this.config.writeFiles && importedStyles && importedStyles.importedStyles.length > 0) {
        await this.updateImportedStyleFiles(importedExtractions, conversions, importedStyles.importedStyles);
      }

      // Determine migration status based on actual results
      const migrationStatus = this.determineMigrationStatus(
        originalCode,
        transformResult.migratedCode,
        transformResult.stats,
        transformResult.classNameReplacements
      );

      return {
        filePath,
        success: migrationStatus !== 'failed',
        migrationStatus,
        originalCode,
        migratedCode: transformResult.migratedCode,
        conversions: transformResult.conversions,
        classNameReplacements: transformResult.classNameReplacements,
        removedImports: transformResult.removedImports,
        errors: transformResult.errors,
        warnings: transformResult.warnings,
        stats: transformResult.stats,
      };

    } catch (error) {
      return {
        filePath,
        success: false,
        migrationStatus: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        originalCode,
        migratedCode: originalCode,
        conversions: [],
        classNameReplacements: new Map(),
        removedImports: [],
        stats: {
          totalStyles: 0,
          convertedStyles: 0,
          unconvertibleStyles: 0,
          classNameReplacements: 0,
          remainingClassesUsages: 0,
        }
      };
    }
  }

  generatePreview(results: MigrationResult[]): string {
    const transformer = new CodeTransformer('');
    
    // Create a simple preview from results
    const preview: string[] = [];
    preview.push('# Migration Preview\n');
    
    results.forEach(result => {
      if (result.success && result.conversions.length > 0) {
        preview.push(`## ${result.filePath}\n`);
        result.conversions.forEach(conversion => {
          if (conversion.tailwindClasses.length > 0) {
            preview.push(`- ${conversion.tailwindClasses.join(' ')}`);
          }
        });
        preview.push('');
      }
    });
    
    return preview.join('\n');
  }

  async test(files: string[]): Promise<void> {
    console.log('🧪 Testing migration on files (dry run)...\n');
    
    const results = await this.migrate(files);
    
    // Categorize results by migration status
    const complete = results.filter(r => r.migrationStatus === 'complete');
    const partial = results.filter(r => r.migrationStatus === 'partial');
    const failed = results.filter(r => r.migrationStatus === 'failed');
    const skipped = results.filter(r => r.migrationStatus === 'skipped');
    
    console.log('📊 Migration Summary:');
    console.log(`✅ Fully migrated: ${complete.length} files`);
    console.log(`🔄 Partially migrated: ${partial.length} files`);
    console.log(`❌ Failed to migrate: ${failed.length} files`);
    console.log(`⏭️  Skipped: ${skipped.length} files\n`);
    
    if (failed.length > 0) {
      console.log('Failed files:');
      failed.forEach(r => {
        console.log(`- ${r.filePath}: ${r.error || 'No styles migrated, all classes.x remain'}`);
      });
      console.log();
    }

    if (skipped.length > 0) {
      // Group skipped files by reason for cleaner output
      const skipReasons = new Map<string, string[]>();
      skipped.forEach(r => {
        const reason = r.error || 'No makeStyles calls found';
        if (!skipReasons.has(reason)) {
          skipReasons.set(reason, []);
        }
        skipReasons.get(reason)!.push(r.filePath);
      });

      console.log('Skipped files by reason:');
      for (const [reason, files] of skipReasons) {
        console.log(`\n📋 ${reason}: ${files.length} files`);
        if (files.length <= 5) {
          // Show all files if 5 or fewer
          files.forEach(filePath => console.log(`  - ${filePath}`));
        } else {
          // Show first 3 and last 2 with count
          files.slice(0, 3).forEach(filePath => console.log(`  - ${filePath}`));
          console.log(`  ... and ${files.length - 5} more files`);
          files.slice(-2).forEach(filePath => console.log(`  - ${filePath}`));
        }
      }
      console.log();
    }

    if (partial.length > 0) {
      console.log('Partially migrated files (manual review required):');
      partial.forEach(r => {
        const remaining = r.stats.remainingClassesUsages;
        console.log(`- ${r.filePath}: ${remaining} classes.x usages remain`);
      });
      console.log();
    }
    
    // Show preview of changes
    if (complete.length > 0 || partial.length > 0) {
      console.log('Preview of changes:');
      console.log(this.generatePreview([...complete, ...partial]));
    }
  }

  /**
   * Determine migration status based on actual migration results
   */
  private determineMigrationStatus(
    originalCode: string,
    migratedCode: string,
    stats: {
      totalStyles: number;
      convertedStyles: number;
      unconvertibleStyles: number;
      classNameReplacements: number;
      remainingClassesUsages: number;
    },
    classNameReplacements: Map<string, string>
  ): 'complete' | 'partial' | 'failed' | 'skipped' {
    // If no styles found at all, it's skipped
    if (stats.totalStyles === 0) {
      return 'skipped';
    }

    // Check if there are any remaining classes.x usages
    const hasRemainingClasses = stats.remainingClassesUsages > 0;
    const hasCnUsage = Array.from(classNameReplacements.values()).some(replacement => 
      replacement.includes('cn(')
    );

    // Complete migration: All classes.x are gone and no cn() usage
    if (!hasRemainingClasses && !hasCnUsage) {
      return 'complete';
    }

    // Partial migration: Some classes.x converted (cn() added or some replacements made) 
    if (stats.classNameReplacements > 0 || hasCnUsage) {
      return 'partial';
    }

    // Failed migration: All classes.x remain and no cn() added
    if (hasRemainingClasses && !hasCnUsage && stats.classNameReplacements === 0) {
      return 'failed';
    }

    // Default case - partial if there's any change at all
    return migratedCode !== originalCode ? 'partial' : 'failed';
  }

  /**
   * Update imported style files by removing converted properties from makeStyles calls
   */
  private async updateImportedStyleFiles(
    importedExtractions: MakeStylesExtraction[],
    conversions: Map<string, TailwindConversion>,
    styleImports: StyleImport[]
  ): Promise<void> {
    // Group extractions by resolved file path from StyleImport
    const fileGroups = new Map<string, MakeStylesExtraction[]>();
    
    for (const styleImport of styleImports) {
      const matchingExtraction = importedExtractions.find(ext => 
        ext.hookName === styleImport.hookName
      );
      
      if (matchingExtraction && styleImport.resolvedPath) {
        if (!fileGroups.has(styleImport.resolvedPath)) {
          fileGroups.set(styleImport.resolvedPath, []);
        }
        fileGroups.get(styleImport.resolvedPath)!.push(matchingExtraction);
      }
    }

    // Process each unique file
    for (const [filePath, extractions] of fileGroups) {
      try {
        // Find the actual file with extension (same logic as ImportResolver.loadStylesFromFile)
        const extensions = ['', '.ts', '.tsx', '.js', '.jsx'];
        let fullPath: string | null = null;
        
        const { existsSync } = await import('fs');
        for (const ext of extensions) {
          const testPath = filePath + ext;
          if (existsSync(testPath)) {
            fullPath = testPath;
            break;
          }
        }
        
        if (!fullPath) {
          console.warn(`Could not find imported style file: ${filePath}`);
          continue;
        }
        
        const originalCode = await readFile(fullPath, 'utf-8');
        
        // Create a transformer for this file
        const transformer = new CodeTransformer(originalCode);
        
        // Only process extractions that have convertible properties
        const hasConvertibleProperties = extractions.some(extraction =>
          extraction.styles.some(style => {
            const styleKey = `${extraction.hookName}.${style.name}`;
            const conversion = conversions.get(styleKey);
            return conversion && conversion.tailwindClasses.length > 0;
          })
        );

        if (hasConvertibleProperties) {
          // Transform only the makeStyles calls - don't update className usages
          const transformResult = transformer.updatePartialMakeStylesCallsAndGetCode(extractions, conversions);
          
          // Write the updated file if it changed
          if (transformResult.migratedCode !== originalCode) {
            await writeFile(fullPath, transformResult.migratedCode, 'utf-8');
          }
        }
      } catch (error) {
        // Log error but don't fail the main migration
        console.warn(`Warning: Failed to update imported style file ${filePath}:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }
}