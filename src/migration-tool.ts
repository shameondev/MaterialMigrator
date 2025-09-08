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
    this.converter = new StyleConverter(
      config.customThemeMapping
    );
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
        return {
          filePath,
          success: true,
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

      return {
        filePath,
        success: true,
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
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Successfully processed: ${successful.length} files`);
    console.log(`❌ Failed to process: ${failed.length} files\n`);
    
    if (failed.length > 0) {
      console.log('Failed files:');
      failed.forEach(r => {
        console.log(`- ${r.filePath}: ${r.error}`);
      });
      console.log();
    }
    
    // Show preview of changes
    if (successful.length > 0) {
      console.log('Preview of changes:');
      console.log(this.generatePreview(successful));
    }
  }
}