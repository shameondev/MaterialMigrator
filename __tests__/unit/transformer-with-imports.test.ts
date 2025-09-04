import { CodeTransformer } from '../../src/transformer.js';
import { ImportResolver } from '../../src/import-resolver.js';
import { existsSync, readFileSync } from 'fs';
import type { StyleImport, MakeStylesExtraction, TailwindConversion } from '../../src/types.js';

// Mock fs functions  
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}));

const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;
const mockReadFileSync = readFileSync as jest.MockedFunction<typeof readFileSync>;

describe('CodeTransformer with Imports', () => {
  let resolver: ImportResolver;

  beforeEach(() => {
    resolver = new ImportResolver();
    jest.clearAllMocks();
  });

  describe('transformWithImports', () => {
    it('should transform component with imported styles', () => {
      const sourceCode = `
        import React from 'react';
        import { useHeaderStyles } from './Header.styles';

        const Header = () => {
          const classes = useHeaderStyles();
          return <div className={classes.root}>Header</div>;
        };
      `;

      const importedStyles: StyleImport[] = [
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
              properties: {
                padding: 16,
                display: 'flex',
              },
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
      expect(result.migratedCode).not.toContain('./Header.styles');
    });

    it('should handle mixed local and imported styles', () => {
      const sourceCode = `
        import React from 'react';
        import { makeStyles } from '@material-ui/core/styles';
        import { useSharedStyles } from './shared/styles';

        const useLocalStyles = makeStyles(() => ({
          wrapper: { padding: 8 },
        }));

        const Component = () => {
          const localClasses = useLocalStyles();
          const sharedClasses = useSharedStyles();

          return (
            <div className={localClasses.wrapper}>
              <div className={sharedClasses.container}>Content</div>
            </div>
          );
        };
      `;

      const importedStyles: StyleImport[] = [
        {
          hookName: 'useSharedStyles',
          importPath: './shared/styles',
          resolvedPath: '/src/shared/styles',
          sourceFile: '/src/Component.tsx',
          importedName: 'useSharedStyles',
        },
      ];

      const extractions: MakeStylesExtraction[] = [
        {
          importName: 'makeStyles',
          hookName: 'useLocalStyles',
          styles: [
            {
              name: 'wrapper',
              properties: { padding: 8 },
              sourceLocation: { start: 0, end: 0, line: 0, column: 0 },
            },
          ],
          sourceFile: '/src/Component.tsx',
        },
        {
          importName: 'makeStyles',
          hookName: 'useSharedStyles',
          styles: [
            {
              name: 'container',
              properties: { margin: 16 },
              sourceLocation: { start: 0, end: 0, line: 0, column: 0 },
            },
          ],
          sourceFile: '/src/shared/styles.ts',
        },
      ];

      const conversions = new Map<string, TailwindConversion>([
        [
          'useLocalStyles.wrapper',
          {
            original: { padding: 8 },
            tailwindClasses: ['p-2'],
            warnings: [],
            unconvertible: [],
          },
        ],
        [
          'useSharedStyles.container',
          {
            original: { margin: 16 },
            tailwindClasses: ['m-4'],
            warnings: [],
            unconvertible: [],
          },
        ],
      ]);

      const transformer = new CodeTransformer(sourceCode);
      const result = transformer.transformWithImports(extractions, conversions, importedStyles);

      expect(result.migratedCode).toContain('className="p-2"');
      expect(result.migratedCode).toContain('className="m-4"');
      expect(result.migratedCode).not.toContain('useLocalStyles');
      expect(result.migratedCode).not.toContain('useSharedStyles');
      expect(result.migratedCode).not.toContain('makeStyles');
    });

    it('should remove only migrated imported styles from imports', () => {
      const sourceCode = `
        import React from 'react';
        import { useStyles, someUtilFunction } from './utils';
        import { useCardStyles, useButtonStyles } from './styles';

        const Component = () => {
          const classes = useStyles();
          const cardClasses = useCardStyles();
          const util = someUtilFunction();
          
          return (
            <div className={classes.root}>
              <div className={cardClasses.card}>Content</div>
            </div>
          );
        };
      `;

      const importedStyles: StyleImport[] = [
        {
          hookName: 'useStyles',
          importPath: './utils',
          resolvedPath: '/src/utils',
          sourceFile: '/src/Component.tsx',
          importedName: 'useStyles',
        },
        {
          hookName: 'useCardStyles',
          importPath: './styles',
          resolvedPath: '/src/styles',
          sourceFile: '/src/Component.tsx',
          importedName: 'useCardStyles',
        },
      ];

      const extractions: MakeStylesExtraction[] = [
        {
          importName: 'makeStyles',
          hookName: 'useStyles',
          styles: [
            {
              name: 'root',
              properties: { display: 'flex' },
              sourceLocation: { start: 0, end: 0, line: 0, column: 0 },
            },
          ],
          sourceFile: '/src/utils.ts',
        },
        {
          importName: 'makeStyles',
          hookName: 'useCardStyles',
          styles: [
            {
              name: 'card',
              properties: { padding: 16 },
              sourceLocation: { start: 0, end: 0, line: 0, column: 0 },
            },
          ],
          sourceFile: '/src/styles.ts',
        },
      ];

      const conversions = new Map<string, TailwindConversion>([
        [
          'useStyles.root',
          {
            original: { display: 'flex' },
            tailwindClasses: ['flex'],
            warnings: [],
            unconvertible: [],
          },
        ],
        [
          'useCardStyles.card',
          {
            original: { padding: 16 },
            tailwindClasses: ['p-4'],
            warnings: [],
            unconvertible: [],
          },
        ],
      ]);

      const transformer = new CodeTransformer(sourceCode);
      const result = transformer.transformWithImports(extractions, conversions, importedStyles);

      // Should keep someUtilFunction but remove style hooks
      expect(result.migratedCode).toContain('someUtilFunction');
      expect(result.migratedCode).not.toContain('useStyles');
      expect(result.migratedCode).not.toContain('useCardStyles');
      
      // Should keep useButtonStyles since it wasn't migrated
      expect(result.migratedCode).toContain('useButtonStyles');
      
      // Should have transformed classNames
      expect(result.migratedCode).toContain('className="flex"');
      expect(result.migratedCode).toContain('className="p-4"');
    });

    it('should handle errors during transformation gracefully', () => {
      const sourceCode = `
        import React from 'react';
        import { useStyles } from './broken-styles';

        const Component = () => {
          const classes = useStyles();
          return <div className={classes.root}>Content</div>;
        };
      `;

      const importedStyles: StyleImport[] = [
        {
          hookName: 'useStyles',
          importPath: './broken-styles',
          resolvedPath: '/src/broken-styles',
          sourceFile: '/src/Component.tsx',
          importedName: 'useStyles',
        },
      ];

      const extractions: MakeStylesExtraction[] = [];
      const conversions = new Map<string, TailwindConversion>();

      const transformer = new CodeTransformer(sourceCode);
      const result = transformer.transformWithImports(extractions, conversions, importedStyles);

      // Should not throw errors
      expect(result.errors).toEqual([]);
      // The code will be reformatted but should contain the same content
      expect(result.migratedCode).toContain('useStyles');
      expect(result.migratedCode).toContain('classes.root');
    });

    it('should preserve non-style imports completely', () => {
      const sourceCode = `
        import React from 'react';
        import { Button, TextField } from '@mui/material';
        import { useCallback } from 'react';
        import { someFunction } from './utils';

        const Component = () => {
          const handleClick = useCallback(() => {
            someFunction();
          }, []);

          return (
            <div>
              <Button onClick={handleClick}>Click</Button>
              <TextField label="Input" />
            </div>
          );
        };
      `;

      const importedStyles: StyleImport[] = [];
      const extractions: MakeStylesExtraction[] = [];
      const conversions = new Map<string, TailwindConversion>();

      const transformer = new CodeTransformer(sourceCode);
      const result = transformer.transformWithImports(extractions, conversions, importedStyles);

      // All imports should remain unchanged
      expect(result.migratedCode).toContain("import React from 'react'");
      expect(result.migratedCode).toContain("import { Button, TextField } from '@mui/material'");
      expect(result.migratedCode).toContain("import { useCallback } from 'react'");
      expect(result.migratedCode).toContain("import { someFunction } from './utils'");
    });
  });
});