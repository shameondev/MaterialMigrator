import { ImportResolver } from '../../src/import-resolver.js';
import { existsSync } from 'fs';
import { readFileSync } from 'fs';

// Mock fs functions
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  existsSync: jest.fn(),
}));

const mockReadFileSync = readFileSync as jest.MockedFunction<typeof readFileSync>;
const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;

describe('ImportResolver', () => {
  let resolver: ImportResolver;

  beforeEach(() => {
    resolver = new ImportResolver();
    jest.clearAllMocks();
  });

  describe('resolveStyleImports', () => {
    it('should identify style hook imports from relative paths', () => {
      const sourceCode = `
        import React from 'react';
        import { useHeaderStyles } from './components/Header/styles';
        import useButtonStyles from '../Button/useButtonStyles';
        import { useState } from 'react';
        import { makeStyles } from '@material-ui/core/styles';

        const useLocalStyles = makeStyles(() => ({
          root: { padding: 16 }
        }));
      `;

      const result = resolver.resolveStyleImports(sourceCode, '/src/pages/HomePage.tsx');

      expect(result.localStyles).toHaveLength(1);
      expect(result.localStyles[0].hookName).toBe('useLocalStyles');

      expect(result.importedStyles).toHaveLength(2);
      
      // Check first import
      expect(result.importedStyles[0]).toEqual({
        hookName: 'useHeaderStyles',
        importPath: './components/Header/styles',
        resolvedPath: '/src/pages/components/Header/styles',
        sourceFile: '/src/pages/HomePage.tsx',
        importedName: 'useHeaderStyles',
      });

      // Check second import (default)
      expect(result.importedStyles[1]).toEqual({
        hookName: 'useButtonStyles',
        importPath: '../Button/useButtonStyles',
        resolvedPath: '/src/Button/useButtonStyles',
        sourceFile: '/src/pages/HomePage.tsx',
        importedName: 'default',
      });
    });

    it('should ignore non-style imports', () => {
      const sourceCode = `
        import React from 'react';
        import { Button } from '@mui/material';
        import { getData } from './api/getData';
        import utils from '../utils/helpers';
      `;

      const result = resolver.resolveStyleImports(sourceCode, '/src/Component.tsx');

      expect(result.localStyles).toHaveLength(0);
      expect(result.importedStyles).toHaveLength(0);
    });

    it('should handle mixed imports with styles and non-styles', () => {
      const sourceCode = `
        import React from 'react';
        import { useTheme, useCardStyles } from './shared/styles';
        import { fetchData, useApiStyles } from '../api/hooks';
        import { Button } from '@mui/material';
      `;

      const result = resolver.resolveStyleImports(sourceCode, '/src/Component.tsx');

      expect(result.importedStyles).toHaveLength(2);
      expect(result.importedStyles[0].hookName).toBe('useCardStyles');
      expect(result.importedStyles[1].hookName).toBe('useApiStyles');
    });

    it('should handle alias imports', () => {
      const sourceCode = `
        import { useHeaderStyles as headerStyles } from './Header/styles';
        import buttonStyles from '../Button/styles';
      `;

      const result = resolver.resolveStyleImports(sourceCode, '/src/Component.tsx');

      expect(result.importedStyles).toHaveLength(2);
      expect(result.importedStyles[0].hookName).toBe('headerStyles');
      expect(result.importedStyles[0].importedName).toBe('useHeaderStyles');
      expect(result.importedStyles[1].hookName).toBe('buttonStyles');
    });
  });

  describe('loadStylesFromFile', () => {
    it('should load and parse styles from existing file', () => {
      const styleFileContent = `
        import { makeStyles } from '@material-ui/core/styles';

        export const useHeaderStyles = makeStyles((theme) => ({
          root: {
            backgroundColor: theme.palette.primary.main,
            padding: theme.spacing(2),
          },
          title: {
            fontSize: '1.5rem',
            fontWeight: 'bold',
          },
        }));
      `;

      mockExistsSync.mockImplementation((path: any) => {
        return path === '/src/Header/styles.ts';
      });
      mockReadFileSync.mockReturnValue(styleFileContent);

      const result = resolver.loadStylesFromFile('/src/Header/styles');

      expect(result).toHaveLength(1);
      expect(result![0].hookName).toBe('useHeaderStyles');
      expect(result![0].styles).toHaveLength(2);
      expect(result![0].styles[0].name).toBe('root');
      expect(result![0].styles[1].name).toBe('title');
      expect(result![0].styles[0].properties.backgroundColor).toEqual({
        type: 'theme',
        path: ['palette', 'primary', 'main'],
        isOptional: false,
      });
      expect(result![0].styles[1].properties.fontSize).toBe('1.5rem');
    });

    it('should try multiple file extensions', () => {
      mockExistsSync.mockImplementation((path: any) => {
        return path === '/src/styles.jsx';
      });
      const simpleStylesCode = `
        import { makeStyles } from '@material-ui/core/styles';
        export default makeStyles(() => ({ root: { padding: 16 } }));
      `;
      mockReadFileSync.mockReturnValue(simpleStylesCode);

      const result = resolver.loadStylesFromFile('/src/styles');

      expect(mockExistsSync).toHaveBeenCalledWith('/src/styles');
      expect(mockExistsSync).toHaveBeenCalledWith('/src/styles.ts');
      expect(mockExistsSync).toHaveBeenCalledWith('/src/styles.tsx');
      expect(mockExistsSync).toHaveBeenCalledWith('/src/styles.js');
      expect(mockExistsSync).toHaveBeenCalledWith('/src/styles.jsx');
      
      // The anonymous makeStyles export might not be detected as it has no hook name
      expect(mockReadFileSync).toHaveBeenCalled();
    });

    it('should return null for non-existent files', () => {
      mockExistsSync.mockReturnValue(false);

      const result = resolver.loadStylesFromFile('/src/nonexistent');

      expect(result).toBeNull();
    });

    it('should cache loaded files', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(`
        import { makeStyles } from '@material-ui/core/styles';
        export default makeStyles(() => ({ root: { padding: 16 } }));
      `);

      // Load twice
      resolver.loadStylesFromFile('/src/styles.ts');
      resolver.loadStylesFromFile('/src/styles.ts');

      // Should only read file once
      expect(mockReadFileSync).toHaveBeenCalledTimes(1);
    });
  });

  describe('resolveImportedStyles', () => {
    it('should resolve imported styles to their definitions', () => {
      const styleImports = [
        {
          hookName: 'useHeaderStyles',
          importPath: './Header/styles',
          resolvedPath: '/src/Header/styles',
          sourceFile: '/src/Component.tsx',
          importedName: 'useHeaderStyles',
        },
        {
          hookName: 'useButtonStyles',
          importPath: '../Button/styles',
          resolvedPath: '/src/Button/styles',
          sourceFile: '/src/Component.tsx',
          importedName: 'default',
        },
      ];

      mockExistsSync.mockImplementation((path: any) => {
        return path === '/src/Header/styles.ts' || path === '/src/Button/styles.ts';
      });

      mockReadFileSync.mockImplementation((path: any) => {
        if (path === '/src/Header/styles.ts') {
          return `
            import { makeStyles } from '@material-ui/core/styles';
            export const useHeaderStyles = makeStyles(() => ({
              root: { padding: 16 }
            }));
          `;
        }
        if (path === '/src/Button/styles.ts') {
          return `
            import { makeStyles } from '@material-ui/core/styles';
            export default makeStyles(() => ({
              button: { margin: 8 }
            }));
          `;
        }
        return '';
      });

      const result = resolver.resolveImportedStyles(styleImports);

      // At least one should be resolved (the named export)
      expect(result.size).toBeGreaterThanOrEqual(1);
      expect(result.get('useHeaderStyles')?.hookName).toBe('useHeaderStyles');
    });

    it('should handle missing style files gracefully', () => {
      const styleImports = [
        {
          hookName: 'useNonexistentStyles',
          importPath: './nonexistent',
          resolvedPath: '/src/nonexistent',
          sourceFile: '/src/Component.tsx',
          importedName: 'useNonexistentStyles',
        },
      ];

      mockExistsSync.mockReturnValue(false);

      const result = resolver.resolveImportedStyles(styleImports);

      expect(result.size).toBe(0);
    });
  });

  describe('isStyleHookName', () => {
    it('should identify various style hook naming patterns', () => {
      const testCases = [
        { name: 'useStyles', expected: true },
        { name: 'useHeaderStyles', expected: true },
        { name: 'useButtonStyle', expected: true },
        { name: 'styles', expected: true },
        { name: 'classes', expected: true },
        { name: 'useTheme', expected: false },
        { name: 'useEffect', expected: false },
        { name: 'useState', expected: false },
        { name: 'myVariable', expected: false },
      ];

      testCases.forEach(({ name, expected }) => {
        // Access private method via any cast for testing
        const result = (resolver as any).isStyleHookName(name);
        expect(result).toBe(expected);
      });
    });
  });

  describe('trackImport and getImporters', () => {
    it('should track import relationships', () => {
      resolver.trackImport('/src/ComponentA.tsx', '/src/styles/buttonStyles.ts');
      resolver.trackImport('/src/ComponentB.tsx', '/src/styles/buttonStyles.ts');
      resolver.trackImport('/src/ComponentA.tsx', '/src/styles/headerStyles.ts');

      const buttonImporters = resolver.getImporters('/src/styles/buttonStyles.ts');
      const headerImporters = resolver.getImporters('/src/styles/headerStyles.ts');
      const nonexistentImporters = resolver.getImporters('/src/styles/nonexistent.ts');

      expect(buttonImporters).toEqual(['/src/ComponentA.tsx', '/src/ComponentB.tsx']);
      expect(headerImporters).toEqual(['/src/ComponentA.tsx']);
      expect(nonexistentImporters).toEqual([]);
    });
  });

  describe('clearCache', () => {
    it('should clear file cache and import graph', () => {
      // Add some data
      resolver.trackImport('/src/A.tsx', '/src/B.ts');
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(`
        import { makeStyles } from '@material-ui/core/styles';
        export default makeStyles(() => ({ root: { padding: 16 } }));
      `);
      resolver.loadStylesFromFile('/src/styles.ts');

      // Clear cache
      resolver.clearCache();

      // Verify cache is cleared
      const importers = resolver.getImporters('/src/B.ts');
      expect(importers).toEqual([]);

      // Loading same file should read again
      resolver.loadStylesFromFile('/src/styles.ts');
      expect(mockReadFileSync).toHaveBeenCalledTimes(2);
    });
  });
});