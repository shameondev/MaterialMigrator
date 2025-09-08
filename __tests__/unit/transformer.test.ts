import { CodeTransformer } from '../../src/transformer.js';
import type { MakeStylesExtraction, TailwindConversion } from '../../src/types.js';

describe('CodeTransformer', () => {
  describe('constructor and parsing', () => {
    it('should parse valid TypeScript/JSX code', () => {
      const code = `
        import React from 'react';
        const Component = () => <div>Hello</div>;
      `;
      
      expect(() => new CodeTransformer(code)).not.toThrow();
    });

    it('should throw error for invalid syntax', () => {
      const invalidCode = `
        const invalid = {
          unclosed: "string
        };
      `;
      
      expect(() => new CodeTransformer(invalidCode)).toThrow();
    });

    it('should handle empty code', () => {
      expect(() => new CodeTransformer('')).not.toThrow();
    });

    it('should handle JSX syntax', () => {
      const jsxCode = `
        const Component = () => (
          <div className="test">
            <span>Hello World</span>
          </div>
        );
      `;
      
      expect(() => new CodeTransformer(jsxCode)).not.toThrow();
    });
  });

  describe('transform method', () => {
    it('should transform simple makeStyles to Tailwind', () => {
      const sourceCode = `
        import React from 'react';
        import { makeStyles } from '@material-ui/core/styles';

        const useStyles = makeStyles(() => ({
          root: {
            display: 'flex',
            padding: 16,
          },
        }));

        export const Component = () => {
          const classes = useStyles();
          return <div className={classes.root}>Hello</div>;
        };
      `;

      const extractions: MakeStylesExtraction[] = [{
        importName: 'makeStyles',
        hookName: 'useStyles',
        styles: [{
          name: 'root',
          properties: {
            display: 'flex',
            padding: 16,
          },
          sourceLocation: { start: 0, end: 0, line: 0, column: 0 }
        }],
        sourceFile: 'test.tsx'
      }];

      const conversions = new Map<string, TailwindConversion>();
      conversions.set('useStyles.root', {
        original: { display: 'flex', padding: 16 },
        tailwindClasses: ['flex', 'p-4'],
        warnings: [],
        unconvertible: []
      });

      const transformer = new CodeTransformer(sourceCode);
      const result = transformer.transform(extractions, conversions);

      expect(result.migratedCode).toContain('className="flex p-4"');
      expect(result.migratedCode).not.toContain('makeStyles');
      expect(result.migratedCode).not.toContain('const classes = useStyles()');
      expect(result.classNameReplacements.get('classes.root')).toBe('flex p-4');
    });

    it('should handle multiple style classes', () => {
      const sourceCode = `
        import React from 'react';
        import { makeStyles } from '@material-ui/core/styles';

        const useStyles = makeStyles(() => ({
          container: {
            display: 'flex',
            flexDirection: 'column',
          },
          item: {
            padding: 8,
            margin: 4,
          },
        }));

        export const Component = () => {
          const classes = useStyles();
          return (
            <div className={classes.container}>
              <span className={classes.item}>Item</span>
            </div>
          );
        };
      `;

      const extractions: MakeStylesExtraction[] = [{
        importName: 'makeStyles',
        hookName: 'useStyles',
        styles: [
          {
            name: 'container',
            properties: { display: 'flex', flexDirection: 'column' },
            sourceLocation: { start: 0, end: 0, line: 0, column: 0 }
          },
          {
            name: 'item',
            properties: { padding: 8, margin: 4 },
            sourceLocation: { start: 0, end: 0, line: 0, column: 0 }
          }
        ],
        sourceFile: 'test.tsx'
      }];

      const conversions = new Map<string, TailwindConversion>();
      conversions.set('useStyles.container', {
        original: { display: 'flex', flexDirection: 'column' },
        tailwindClasses: ['flex', 'flex-col'],
        warnings: [],
        unconvertible: []
      });
      conversions.set('useStyles.item', {
        original: { padding: 8, margin: 4 },
        tailwindClasses: ['p-2', 'm-1'],
        warnings: [],
        unconvertible: []
      });

      const transformer = new CodeTransformer(sourceCode);
      const result = transformer.transform(extractions, conversions);

      expect(result.migratedCode).toContain('className="flex flex-col"');
      expect(result.migratedCode).toContain('className="p-2 m-1"');
      expect(result.classNameReplacements.size).toBe(2);
    });

    it('should preserve original code when styles have unconvertible properties', () => {
      const sourceCode = `
        import React from 'react';
        import { makeStyles } from '@material-ui/core/styles';

        const useStyles = makeStyles(() => ({
          root: {
            display: 'flex',
            animation: 'fadeIn 0.3s ease-in-out',
          },
        }));

        export const Component = () => {
          const classes = useStyles();
          return <div className={classes.root}>Hello</div>;
        };
      `;

      const extractions: MakeStylesExtraction[] = [{
        importName: 'makeStyles',
        hookName: 'useStyles',
        styles: [{
          name: 'root',
          properties: {
            display: 'flex',
            animation: 'fadeIn 0.3s ease-in-out',
          },
          sourceLocation: { start: 0, end: 0, line: 0, column: 0 }
        }],
        sourceFile: 'test.tsx'
      }];

      const conversions = new Map<string, TailwindConversion>();
      conversions.set('useStyles.root', {
        original: { display: 'flex', animation: 'fadeIn 0.3s ease-in-out' },
        tailwindClasses: ['flex'],
        warnings: [],
        unconvertible: [{
          type: 'unconvertible',
          property: 'animation',
          value: 'fadeIn 0.3s ease-in-out',
          reason: 'CSS animations require manual conversion',
          manualAction: 'Use Tailwind animations or move to separate CSS file'
        }]
      });

      const transformer = new CodeTransformer(sourceCode);
      const result = transformer.transform(extractions, conversions);

      // Should create mixed className using cn() function
      expect(result.migratedCode).toContain('className={cn(classes.root, "flex")}');
      expect(result.stats.unconvertibleStyles).toBe(1);
      
      // Should add cn import when mixed classes are used
      expect(result.migratedCode).toContain('import { cn } from "@/lib/utils"');
      
      // Check that the conversion included both convertible and unconvertible properties
      const conversion = result.conversions[0];
      expect(conversion.tailwindClasses).toContain('flex');
      expect(conversion.unconvertible).toBeDefined();
      expect(conversion.unconvertible.length).toBe(1);
      expect(conversion.unconvertible[0].property).toBe('animation');
    });

    it('should not add cn import for fully unconvertible styles', () => {
      const sourceCode = `
        import React from 'react';
        import { makeStyles } from '@material-ui/core/styles';

        const useStyles = makeStyles(() => ({
          root: {
            animation: 'fadeIn 0.3s ease-in-out',
            transform: 'scale(1.02)',
            '&:hover': { opacity: 0.8 }
          },
        }));

        export const Component = () => {
          const classes = useStyles();
          return <div className={classes.root}>Hello</div>;
        };
      `;

      const extractions: MakeStylesExtraction[] = [{
        importName: 'makeStyles',
        hookName: 'useStyles',
        styles: [{
          name: 'root',
          properties: {
            animation: 'fadeIn 0.3s ease-in-out',
            transform: 'scale(1.02)',
            '&:hover': { opacity: 0.8 }
          },
          sourceLocation: { start: 0, end: 0, line: 0, column: 0 }
        }],
        sourceFile: 'test.tsx'
      }];

      const conversions = new Map<string, TailwindConversion>();
      conversions.set('useStyles.root', {
        original: { animation: 'fadeIn 0.3s ease-in-out', transform: 'scale(1.02)', '&:hover': { opacity: 0.8 } },
        tailwindClasses: [], // No convertible classes
        warnings: [],
        unconvertible: [
          {
            type: 'unconvertible',
            property: 'animation',
            value: 'fadeIn 0.3s ease-in-out',
            reason: 'CSS animations require manual conversion',
            manualAction: 'Use Tailwind animations or move to separate CSS file'
          },
          {
            type: 'unconvertible', 
            property: 'transform',
            value: 'scale(1.02)',
            reason: 'Complex transforms require manual conversion',
            manualAction: 'Use Tailwind transforms or move to separate CSS file'
          },
          {
            type: 'unconvertible',
            property: '&:hover',
            value: { opacity: 0.8 },
            reason: 'Pseudo-selectors require manual conversion', 
            manualAction: 'Use Tailwind hover utilities or move to separate CSS file'
          }
        ]
      });

      const transformer = new CodeTransformer(sourceCode);
      const result = transformer.transform(extractions, conversions);

      // Should preserve original makeStyles without changes
      expect(result.migratedCode).toContain('const useStyles = makeStyles');
      expect(result.migratedCode).toContain('className={classes.root}');
      
      // Should NOT add cn import for fully unconvertible styles
      expect(result.migratedCode).not.toContain('import { cn } from "@/lib/utils"');
      
      expect(result.stats.unconvertibleStyles).toBe(3);
    });

    it('should handle code with no makeStyles', () => {
      const sourceCode = `
        import React from 'react';

        export const Component = () => {
          return <div className="existing-class">Hello</div>;
        };
      `;

      const transformer = new CodeTransformer(sourceCode);
      const result = transformer.transform([], new Map());

      expect(result.migratedCode).toBe(sourceCode);
      expect(result.classNameReplacements.size).toBe(0);
      expect(result.conversions).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('generatePreview method', () => {
    it('should generate markdown preview of migration', () => {
      const sourceCode = `
        const useStyles = makeStyles(() => ({
          root: { display: 'flex', padding: 16 },
        }));
      `;

      const extractions: MakeStylesExtraction[] = [{
        importName: 'makeStyles',
        hookName: 'useStyles',
        styles: [{
          name: 'root',
          properties: { display: 'flex', padding: 16 },
          sourceLocation: { start: 0, end: 0, line: 0, column: 0 }
        }],
        sourceFile: 'test.tsx'
      }];

      const conversions = new Map<string, TailwindConversion>();
      conversions.set('useStyles.root', {
        original: { display: 'flex', padding: 16 },
        tailwindClasses: ['flex', 'p-4'],
        warnings: [],
        unconvertible: []
      });

      const transformer = new CodeTransformer(sourceCode);
      const preview = transformer.generatePreview(extractions, conversions);

      expect(preview).toContain('# Migration Preview');
      expect(preview).toContain('useStyles');
      expect(preview).toContain('flex p-4');
      expect(preview).toContain('Tailwind');
    });

    it('should include warnings and unconvertible styles in preview', () => {
      const sourceCode = `const useStyles = makeStyles(() => ({ root: { animation: 'fadeIn 0.3s' } }));`;

      const extractions: MakeStylesExtraction[] = [{
        importName: 'makeStyles',
        hookName: 'useStyles',
        styles: [{
          name: 'root',
          properties: { animation: 'fadeIn 0.3s' },
          sourceLocation: { start: 0, end: 0, line: 0, column: 0 }
        }],
        sourceFile: 'test.tsx'
      }];

      const conversions = new Map<string, TailwindConversion>();
      conversions.set('useStyles.root', {
        original: { animation: 'fadeIn 0.3s' },
        tailwindClasses: [],
        warnings: [{ type: 'warning', message: 'Complex animation detected' }],
        unconvertible: [{
          type: 'unconvertible',
          property: 'animation',
          value: 'fadeIn 0.3s',
          reason: 'Animations not supported',
          manualAction: 'Use Tailwind animations'
        }]
      });

      const transformer = new CodeTransformer(sourceCode);
      const preview = transformer.generatePreview(extractions, conversions);

      expect(preview).toContain('⚠️');
      expect(preview).toContain('❌');
      expect(preview).toContain('animation');
      expect(preview).toContain('Animations not supported');
    });
  });

  describe('error handling', () => {
    it('should handle malformed AST gracefully', () => {
      // This tests internal error handling
      const sourceCode = `
        const useStyles = makeStyles(() => ({
          root: { display: 'flex' },
        }));
      `;

      const extractions: MakeStylesExtraction[] = [{
        importName: 'makeStyles',
        hookName: 'useStyles',
        styles: [{
          name: 'root',
          properties: { display: 'flex' },
          sourceLocation: { start: 0, end: 0, line: 0, column: 0 }
        }],
        sourceFile: 'test.tsx'
      }];

      const conversions = new Map<string, TailwindConversion>();
      conversions.set('useStyles.root', {
        original: { display: 'flex' },
        tailwindClasses: ['flex'],
        warnings: [],
        unconvertible: []
      });

      const transformer = new CodeTransformer(sourceCode);
      
      // Should not throw, even with edge cases
      expect(() => transformer.transform(extractions, conversions)).not.toThrow();
    });

    it('should handle empty extractions array', () => {
      const sourceCode = `export const Component = () => <div>Hello</div>;`;
      const transformer = new CodeTransformer(sourceCode);
      
      const result = transformer.transform([], new Map());
      
      expect(result.migratedCode).toBe(sourceCode);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle missing conversions for extractions', () => {
      const sourceCode = `const useStyles = makeStyles(() => ({ root: { display: 'flex' } }));`;
      
      const extractions: MakeStylesExtraction[] = [{
        importName: 'makeStyles',
        hookName: 'useStyles',
        styles: [{
          name: 'root',
          properties: { display: 'flex' },
          sourceLocation: { start: 0, end: 0, line: 0, column: 0 }
        }],
        sourceFile: 'test.tsx'
      }];

      const transformer = new CodeTransformer(sourceCode);
      
      // Empty conversions map - should handle gracefully
      const result = transformer.transform(extractions, new Map());
      
      expect(result.errors).toHaveLength(0);
      // Should preserve original when conversions are missing
      expect(result.migratedCode).toContain('makeStyles');
    });
  });
});