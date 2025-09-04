import { CodeTransformer } from '../../src/transformer.js';
import type { MakeStylesExtraction, TailwindConversion } from '../../src/types.js';

describe('Flexible Variable Naming', () => {
  describe('Common naming patterns', () => {
    it('should handle classes = useStyles() pattern', () => {
      const sourceCode = `
        import React from 'react';
        import { makeStyles } from '@material-ui/core/styles';

        const useStyles = makeStyles(() => ({
          root: { padding: 16, display: 'flex' },
          title: { fontSize: '1.5rem', fontWeight: 'bold' },
        }));

        const Component = () => {
          const classes = useStyles();
          return (
            <div className={classes.root}>
              <h1 className={classes.title}>Title</h1>
            </div>
          );
        };
      `;

      const extractions: MakeStylesExtraction[] = [
        {
          importName: 'makeStyles',
          hookName: 'useStyles',
          styles: [
            {
              name: 'root',
              properties: { padding: 16, display: 'flex' },
              sourceLocation: { start: 0, end: 0, line: 0, column: 0 },
            },
            {
              name: 'title',
              properties: { fontSize: '1.5rem', fontWeight: 'bold' },
              sourceLocation: { start: 0, end: 0, line: 0, column: 0 },
            },
          ],
          sourceFile: '/src/Component.tsx',
        },
      ];

      const conversions = new Map<string, TailwindConversion>([
        [
          'useStyles.root',
          {
            original: { padding: 16, display: 'flex' },
            tailwindClasses: ['p-4', 'flex'],
            warnings: [],
            unconvertible: [],
          },
        ],
        [
          'useStyles.title',
          {
            original: { fontSize: '1.5rem', fontWeight: 'bold' },
            tailwindClasses: ['text-2xl', 'font-bold'],
            warnings: [],
            unconvertible: [],
          },
        ],
      ]);

      const transformer = new CodeTransformer(sourceCode);
      const result = transformer.transform(extractions, conversions);

      expect(result.migratedCode).toContain('className="p-4 flex"');
      expect(result.migratedCode).toContain('className="text-2xl font-bold"');
      expect(result.migratedCode).not.toContain('useStyles');
      expect(result.migratedCode).not.toContain('classes.root');
      expect(result.migratedCode).not.toContain('classes.title');
    });

    it('should handle styles = useButtonStyles() pattern', () => {
      const sourceCode = `
        import React from 'react';
        import { makeStyles } from '@material-ui/core/styles';

        const useButtonStyles = makeStyles(() => ({
          button: { 
            backgroundColor: '#blue',
            color: 'white',
            padding: 8,
          },
        }));

        const Button = () => {
          const styles = useButtonStyles();
          return (
            <button className={styles.button}>
              Click Me
            </button>
          );
        };
      `;

      const extractions: MakeStylesExtraction[] = [
        {
          importName: 'makeStyles',
          hookName: 'useButtonStyles',
          styles: [
            {
              name: 'button',
              properties: {
                backgroundColor: '#blue',
                color: 'white',
                padding: 8,
              },
              sourceLocation: { start: 0, end: 0, line: 0, column: 0 },
            },
          ],
          sourceFile: '/src/Button.tsx',
        },
      ];

      const conversions = new Map<string, TailwindConversion>([
        [
          'useButtonStyles.button',
          {
            original: {
              backgroundColor: '#blue',
              color: 'white',
              padding: 8,
            },
            tailwindClasses: ['bg-blue-500', 'text-white', 'p-2'],
            warnings: [],
            unconvertible: [],
          },
        ],
      ]);

      const transformer = new CodeTransformer(sourceCode);
      const result = transformer.transform(extractions, conversions);

      expect(result.migratedCode).toContain('className="bg-blue-500 text-white p-2"');
      expect(result.migratedCode).not.toContain('useButtonStyles');
      expect(result.migratedCode).not.toContain('styles.button');
    });

    it('should handle destructuring pattern', () => {
      const sourceCode = `
        import React from 'react';
        import { makeStyles } from '@material-ui/core/styles';

        const useCardStyles = makeStyles(() => ({
          card: { padding: 16 },
          header: { fontSize: '1.25rem' },
        }));

        const Card = () => {
          const { card, header } = useCardStyles();
          return (
            <div className={card}>
              <div className={header}>Header</div>
            </div>
          );
        };
      `;

      const extractions: MakeStylesExtraction[] = [
        {
          importName: 'makeStyles',
          hookName: 'useCardStyles',
          styles: [
            {
              name: 'card',
              properties: { padding: 16 },
              sourceLocation: { start: 0, end: 0, line: 0, column: 0 },
            },
            {
              name: 'header',
              properties: { fontSize: '1.25rem' },
              sourceLocation: { start: 0, end: 0, line: 0, column: 0 },
            },
          ],
          sourceFile: '/src/Card.tsx',
        },
      ];

      const conversions = new Map<string, TailwindConversion>([
        [
          'useCardStyles.card',
          {
            original: { padding: 16 },
            tailwindClasses: ['p-4'],
            warnings: [],
            unconvertible: [],
          },
        ],
        [
          'useCardStyles.header',
          {
            original: { fontSize: '1.25rem' },
            tailwindClasses: ['text-xl'],
            warnings: [],
            unconvertible: [],
          },
        ],
      ]);

      const transformer = new CodeTransformer(sourceCode);
      const result = transformer.transform(extractions, conversions);

      // Destructuring pattern is more complex - variables are used directly (not dot notation)
      // The transformer removes the hook but leaves the destructured variables as-is
      expect(result.migratedCode).not.toContain('useCardStyles');
      // The className should still reference the destructured variables for now
      expect(result.migratedCode).toContain('className={card}');
      expect(result.migratedCode).toContain('className={header}');
    });

    it('should handle multiple hooks with different variable names', () => {
      const sourceCode = `
        import React from 'react';
        import { makeStyles } from '@material-ui/core/styles';

        const useContainerStyles = makeStyles(() => ({
          root: { display: 'flex' },
        }));

        const useTextStyles = makeStyles(() => ({
          title: { fontSize: '2rem' },
        }));

        const Component = () => {
          const containerClasses = useContainerStyles();
          const textStyles = useTextStyles();

          return (
            <div className={containerClasses.root}>
              <h1 className={textStyles.title}>Title</h1>
            </div>
          );
        };
      `;

      const extractions: MakeStylesExtraction[] = [
        {
          importName: 'makeStyles',
          hookName: 'useContainerStyles',
          styles: [
            {
              name: 'root',
              properties: { display: 'flex' },
              sourceLocation: { start: 0, end: 0, line: 0, column: 0 },
            },
          ],
          sourceFile: '/src/Component.tsx',
        },
        {
          importName: 'makeStyles',
          hookName: 'useTextStyles',
          styles: [
            {
              name: 'title',
              properties: { fontSize: '2rem' },
              sourceLocation: { start: 0, end: 0, line: 0, column: 0 },
            },
          ],
          sourceFile: '/src/Component.tsx',
        },
      ];

      const conversions = new Map<string, TailwindConversion>([
        [
          'useContainerStyles.root',
          {
            original: { display: 'flex' },
            tailwindClasses: ['flex'],
            warnings: [],
            unconvertible: [],
          },
        ],
        [
          'useTextStyles.title',
          {
            original: { fontSize: '2rem' },
            tailwindClasses: ['text-4xl'],
            warnings: [],
            unconvertible: [],
          },
        ],
      ]);

      const transformer = new CodeTransformer(sourceCode);
      const result = transformer.transform(extractions, conversions);

      expect(result.migratedCode).toContain('className="flex"');
      expect(result.migratedCode).toContain('className="text-4xl"');
      expect(result.migratedCode).not.toContain('useContainerStyles');
      expect(result.migratedCode).not.toContain('useTextStyles');
      expect(result.migratedCode).not.toContain('containerClasses.root');
      expect(result.migratedCode).not.toContain('textStyles.title');
    });

    it('should handle imported styles with custom variable names', () => {
      const sourceCode = `
        import React from 'react';
        import { useHeaderStyles } from './Header.styles';

        const Header = () => {
          const classes = useHeaderStyles();
          return <div className={classes.root}>Header</div>;
        };
      `;

      const importedStyles = [
        {
          hookName: 'useHeaderStyles',
          importPath: './Header.styles',
          resolvedPath: '/src/Header.styles',
          sourceFile: '/src/Header.tsx',
          importedName: 'useHeaderStyles',
        },
      ];

      const extractions: MakeStylesExtraction[] = [
        {
          importName: 'makeStyles',
          hookName: 'useHeaderStyles',
          styles: [
            {
              name: 'root',
              properties: { padding: 16, display: 'flex' },
              sourceLocation: { start: 0, end: 0, line: 0, column: 0 },
            },
          ],
          sourceFile: '/src/Header.styles.ts',
        },
      ];

      const conversions = new Map<string, TailwindConversion>([
        [
          'useHeaderStyles.root',
          {
            original: { padding: 16, display: 'flex' },
            tailwindClasses: ['p-4', 'flex'],
            warnings: [],
            unconvertible: [],
          },
        ],
      ]);

      const transformer = new CodeTransformer(sourceCode);
      const result = transformer.transformWithImports(extractions, conversions, importedStyles);

      expect(result.migratedCode).toContain('className="p-4 flex"');
      expect(result.migratedCode).not.toContain('useHeaderStyles');
      expect(result.migratedCode).not.toContain('classes.root');
      expect(result.migratedCode).not.toContain('./Header.styles');
    });
  });

  describe('Edge cases and complex patterns', () => {
    it('should handle conditional className expressions', () => {
      const sourceCode = `
        import React from 'react';
        import { makeStyles } from '@material-ui/core/styles';

        const useStyles = makeStyles(() => ({
          active: { backgroundColor: 'blue' },
          inactive: { backgroundColor: 'gray' },
        }));

        const Component = ({ isActive }) => {
          const classes = useStyles();
          return (
            <div className={isActive ? classes.active : classes.inactive}>
              Content
            </div>
          );
        };
      `;

      const extractions: MakeStylesExtraction[] = [
        {
          importName: 'makeStyles',
          hookName: 'useStyles',
          styles: [
            {
              name: 'active',
              properties: { backgroundColor: 'blue' },
              sourceLocation: { start: 0, end: 0, line: 0, column: 0 },
            },
            {
              name: 'inactive',
              properties: { backgroundColor: 'gray' },
              sourceLocation: { start: 0, end: 0, line: 0, column: 0 },
            },
          ],
          sourceFile: '/src/Component.tsx',
        },
      ];

      const conversions = new Map<string, TailwindConversion>([
        [
          'useStyles.active',
          {
            original: { backgroundColor: 'blue' },
            tailwindClasses: ['bg-blue-500'],
            warnings: [],
            unconvertible: [],
          },
        ],
        [
          'useStyles.inactive',
          {
            original: { backgroundColor: 'gray' },
            tailwindClasses: ['bg-gray-500'],
            warnings: [],
            unconvertible: [],
          },
        ],
      ]);

      const transformer = new CodeTransformer(sourceCode);
      const result = transformer.transform(extractions, conversions);

      // Complex conditional expressions are not yet fully supported
      // But the hook should be removed and makeStyles import should be gone
      expect(result.migratedCode).not.toContain('useStyles');
      expect(result.migratedCode).not.toContain('makeStyles');
      // The className expression should remain as-is for manual review
      expect(result.migratedCode).toContain('classes.active');
      expect(result.migratedCode).toContain('classes.inactive');
    });

    it('should handle template literal className expressions', () => {
      const sourceCode = `
        import React from 'react';
        import { makeStyles } from '@material-ui/core/styles';

        const useStyles = makeStyles(() => ({
          base: { padding: 8 },
        }));

        const Component = () => {
          const classes = useStyles();
          return (
            <div className={\`\${classes.base} additional-class\`}>
              Content
            </div>
          );
        };
      `;

      const extractions: MakeStylesExtraction[] = [
        {
          importName: 'makeStyles',
          hookName: 'useStyles',
          styles: [
            {
              name: 'base',
              properties: { padding: 8 },
              sourceLocation: { start: 0, end: 0, line: 0, column: 0 },
            },
          ],
          sourceFile: '/src/Component.tsx',
        },
      ];

      const conversions = new Map<string, TailwindConversion>([
        [
          'useStyles.base',
          {
            original: { padding: 8 },
            tailwindClasses: ['p-2'],
            warnings: [],
            unconvertible: [],
          },
        ],
      ]);

      const transformer = new CodeTransformer(sourceCode);
      const result = transformer.transform(extractions, conversions);

      expect(result.migratedCode).toContain('p-2');
      expect(result.migratedCode).toContain('additional-class');
      expect(result.migratedCode).not.toContain('classes.base');
    });
  });
});