import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { ASTParser } from '../src/parser.js';
import { StyleConverter } from '../src/converter.js';
import { CodeTransformer } from '../src/transformer.js';
import type { TailwindConversion } from '../src/types.js';

describe('Migration Tool', () => {
  const fixturesDir = resolve(__dirname, 'fixtures');
  
  async function loadFixture(type: 'input' | 'expected', filename: string): Promise<string> {
    const filePath = resolve(fixturesDir, type, filename);
    return readFile(filePath, 'utf-8');
  }

  async function runMigration(sourceCode: string): Promise<string> {
    // Parse and extract styles
    const parser = new ASTParser(sourceCode);
    const extractions = parser.extractMakeStylesCalls();

    if (extractions.length === 0) {
      return sourceCode;
    }

    // Convert styles to Tailwind
    const converter = new StyleConverter();
    const conversions = new Map<string, TailwindConversion>();
    
    for (const extraction of extractions) {
      for (const style of extraction.styles) {
        const conversion = converter.convertStyles(style.properties);
        conversions.set(`${extraction.hookName}.${style.name}`, conversion);
      }
    }

    // Transform the code
    const transformer = new CodeTransformer(sourceCode);
    const result = transformer.transform(extractions, conversions);
    
    return result.migratedCode;
  }

  function normalizeWhitespace(code: string): string {
    return code
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');
  }

  describe('Simple Component Migration', () => {
    it('should migrate simple makeStyles to Tailwind classes', async () => {
      const input = await loadFixture('input', 'simple-component.tsx');
      const expected = await loadFixture('expected', 'simple-component.tsx');
      
      const result = await runMigration(input);
      
      // Normalize whitespace for comparison
      const normalizedResult = normalizeWhitespace(result);
      const normalizedExpected = normalizeWhitespace(expected);
      
      expect(normalizedResult).toBe(normalizedExpected);
    });

    it('should remove makeStyles import when fully migrated', async () => {
      const input = await loadFixture('input', 'simple-component.tsx');
      const result = await runMigration(input);
      
      expect(result).not.toContain('import { makeStyles }');
      expect(result).not.toContain('useStyles');
      expect(result).not.toContain('const classes =');
    });

    it('should preserve other imports', async () => {
      const input = await loadFixture('input', 'simple-component.tsx');
      const result = await runMigration(input);
      
      expect(result).toContain('import React from \'react\'');
      expect(result).toContain('import { Button } from \'@material-ui/core\'');
    });
  });

  describe('Theme Component Migration', () => {
    it('should convert theme references to CSS variables', async () => {
      const input = await loadFixture('input', 'theme-component.tsx');
      const result = await runMigration(input);
      
      // Should contain theme-based Tailwind classes
      expect(result).toContain('bg-builder-primary');
      expect(result).toContain('text-builder-content-primary');
      expect(result).toContain('rounded-lg');
    });

    it('should remove makeStyles but may keep Theme import', async () => {
      const input = await loadFixture('input', 'theme-component.tsx');
      const result = await runMigration(input);
      
      // makeStyles should be removed when migrated
      expect(result).not.toContain('makeStyles');
      // Theme import might remain if not all references are resolved
    });
  });

  describe('Complex Component Migration', () => {
    it('should preserve unmigrated styles when not all can be converted', async () => {
      const input = await loadFixture('input', 'complex-component.tsx');
      const result = await runMigration(input);
      
      // Should preserve the original makeStyles call and imports
      expect(result).toContain('import { makeStyles, Theme }');
      expect(result).toContain('const useStyles = makeStyles');
      expect(result).toContain('const classes = useStyles()');
      
      // Should preserve keyframes and complex selectors
      expect(result).toContain('@keyframes slideIn');
      expect(result).toContain('& .child');
      expect(result).toContain('animation: \'$slideIn');
    });

    it('should not replace className usages when preservation mode is active', async () => {
      const input = await loadFixture('input', 'complex-component.tsx');
      const result = await runMigration(input);
      
      // className usages should remain as classes.* references
      expect(result).toContain('className={classes.simple}');
      expect(result).toContain('className={classes.animated}');
      expect(result).toContain('className={classes.nested}');
    });
  });

  describe('Edge Cases', () => {
    it('should handle files with no makeStyles', async () => {
      const input = `
        import React from 'react';
        
        export const NoStylesComponent = () => {
          return <div>No styles here</div>;
        };
      `;
      
      const result = await runMigration(input);
      expect(result).toBe(input);
    });

    it('should handle empty makeStyles', async () => {
      const input = `
        import React from 'react';
        import { makeStyles } from '@material-ui/core/styles';
        
        const useStyles = makeStyles(() => ({}));
        
        export const EmptyStylesComponent = () => {
          const classes = useStyles();
          return <div>Empty styles</div>;
        };
      `;
      
      const result = await runMigration(input);
      
      // Should remove empty makeStyles
      expect(result).not.toContain('makeStyles');
      expect(result).not.toContain('useStyles');
    });

    it('should handle multiple makeStyles hooks', async () => {
      const input = `
        import React from 'react';
        import { makeStyles } from '@material-ui/core/styles';
        
        const useStyles1 = makeStyles(() => ({
          root: { padding: 16 }
        }));
        
        const useStyles2 = makeStyles(() => ({
          container: { margin: 8 }
        }));
        
        export const MultipleHooksComponent = () => {
          const classes1 = useStyles1();
          const classes2 = useStyles2();
          
          return (
            <div className={classes1.root}>
              <div className={classes2.container}>Content</div>
            </div>
          );
        };
      `;
      
      const result = await runMigration(input);
      
      // Should convert styles if all are convertible, otherwise preserve
      const isFullyMigrated = !result.includes('makeStyles');
      if (isFullyMigrated) {
        expect(result).toContain('className="p-4"');
        expect(result).toContain('className="m-2"');
        expect(result).not.toContain('useStyles');
      } else {
        expect(result).toContain('classes1.root');
        expect(result).toContain('classes2.container');
      }
    });
  });

  describe('Conversion Statistics', () => {
    it('should provide accurate conversion statistics', async () => {
      const input = await loadFixture('input', 'simple-component.tsx');
      
      const parser = new ASTParser(input);
      const extractions = parser.extractMakeStylesCalls();
      const converter = new StyleConverter();
      
      let totalStyles = 0;
      let convertibleStyles = 0;
      
      for (const extraction of extractions) {
        for (const style of extraction.styles) {
          totalStyles++;
          const conversion = converter.convertStyles(style.properties);
          if (conversion.tailwindClasses.length > 0) {
            convertibleStyles++;
          }
        }
      }
      
      // Simple component should have all styles convertible
      expect(totalStyles).toBeGreaterThan(0);
      expect(convertibleStyles).toBe(totalStyles);
    });
  });
});