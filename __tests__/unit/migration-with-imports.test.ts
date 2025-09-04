// import { MigrationTool } from '../../src/migrate.js';
import { ImportResolver } from '../../src/import-resolver.js';
import { CodeTransformer } from '../../src/transformer.js';
import { readFile, writeFile } from 'fs/promises';
import { glob } from 'glob';
import { existsSync, readFileSync } from 'fs';
import type { MigrationConfig } from '../../src/types.js';

// Mock external dependencies
jest.mock('fs/promises');
jest.mock('fs');
jest.mock('glob');

const mockReadFile = readFile as jest.MockedFunction<typeof readFile>;
const mockWriteFile = writeFile as jest.MockedFunction<typeof writeFile>;
const mockGlob = glob as jest.MockedFunction<typeof glob>;
const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;
const mockReadFileSync = readFileSync as jest.MockedFunction<typeof readFileSync>;

describe('MigrationTool with Import Support', () => {
  let config: MigrationConfig;
  let migrationTool: MigrationTool;

  beforeEach(() => {
    config = {
      include: ['**/*.{ts,tsx}'],
      exclude: ['node_modules/**'],
      dryRun: true,
      verbose: false,
      preserveOriginal: false,
      useClsx: true,
      customThemeMapping: {},
      customPropertyMapping: {},
      maxWarningsPerFile: 50,
      failOnErrors: false,
      generateReport: false,
    };

    migrationTool = new MigrationTool(config);
    jest.clearAllMocks();
  });

  describe('migrating files with imported styles', () => {
    it('should migrate component that imports styles from separate file', async () => {
      const componentCode = `
        import React from 'react';
        import { useHeaderStyles } from './Header.styles';

        interface HeaderProps {
          title: string;
        }

        const Header: React.FC<HeaderProps> = ({ title }) => {
          const classes = useHeaderStyles();

          return (
            <div className={classes.root}>
              <h1 className={classes.title}>{title}</h1>
              <div className={classes.subtitle}>Subtitle</div>
            </div>
          );
        };

        export default Header;
      `;

      const stylesFileCode = `
        import { makeStyles } from '@material-ui/core/styles';

        export const useHeaderStyles = makeStyles((theme) => ({
          root: {
            display: 'flex',
            flexDirection: 'column',
            padding: theme.spacing(2),
            backgroundColor: theme.palette.primary.main,
          },
          title: {
            fontSize: '2rem',
            fontWeight: 'bold',
            color: theme.palette.primary.contrastText,
          },
          subtitle: {
            fontSize: '1rem',
            opacity: 0.8,
          },
        }));
      `;

      mockReadFile.mockResolvedValue(componentCode);
      mockExistsSync.mockImplementation((path: any) => {
        return path.includes('Header.styles.ts');
      });
      mockReadFileSync.mockReturnValue(stylesFileCode);

      // Mock glob to return our test file
      mockGlob.mockResolvedValue(['/src/components/Header/Header.tsx']);

      await migrationTool.migrate(['/src/components/Header/Header.tsx']);

      // Verify the file was processed
      expect(mockReadFile).toHaveBeenCalledWith('/src/components/Header/Header.tsx', 'utf-8');
      expect(mockReadFileSync).toHaveBeenCalledWith(
        expect.stringContaining('Header.styles.ts'), 
        'utf-8'
      );

      // Since it's a dry run, no actual writing should happen
      expect(mockWriteFile).not.toHaveBeenCalled();
    });

    it('should migrate component with both local and imported styles', async () => {
      const componentCode = `
        import React from 'react';
        import { makeStyles } from '@material-ui/core/styles';
        import { useSharedStyles } from '../shared/styles';

        const useLocalStyles = makeStyles(() => ({
          wrapper: {
            padding: 16,
            margin: 8,
          },
        }));

        const Component = () => {
          const localClasses = useLocalStyles();
          const sharedClasses = useSharedStyles();

          return (
            <div className={localClasses.wrapper}>
              <div className={sharedClasses.container}>
                <span className={sharedClasses.text}>Hello</span>
              </div>
            </div>
          );
        };
      `;

      const sharedStylesCode = `
        import { makeStyles } from '@material-ui/core/styles';

        export const useSharedStyles = makeStyles((theme) => ({
          container: {
            display: 'flex',
            alignItems: 'center',
          },
          text: {
            color: theme.palette.text.primary,
            fontSize: '1rem',
          },
        }));
      `;

      mockReadFile.mockResolvedValue(componentCode);
      mockExistsSync.mockImplementation((path: any) => {
        return path.includes('shared/styles.ts');
      });
      mockReadFileSync.mockReturnValue(sharedStylesCode);

      await migrationTool.migrate(['/src/Component.tsx']);

      expect(mockReadFile).toHaveBeenCalledWith('/src/Component.tsx', 'utf-8');
      expect(mockReadFileSync).toHaveBeenCalled();
    });

    it('should handle multiple imported style files', async () => {
      const componentCode = `
        import React from 'react';
        import { useHeaderStyles } from './Header.styles';
        import { useFooterStyles } from './Footer.styles';
        import { useButtonStyles } from '../Button/Button.styles';

        const Component = () => {
          const headerClasses = useHeaderStyles();
          const footerClasses = useFooterStyles();
          const buttonClasses = useButtonStyles();

          return (
            <div>
              <header className={headerClasses.root}>Header</header>
              <button className={buttonClasses.primary}>Click me</button>
              <footer className={footerClasses.root}>Footer</footer>
            </div>
          );
        };
      `;

      const headerStylesCode = `
        import { makeStyles } from '@material-ui/core/styles';
        export const useHeaderStyles = makeStyles(() => ({
          root: { padding: 16, backgroundColor: 'blue' }
        }));
      `;

      const footerStylesCode = `
        import { makeStyles } from '@material-ui/core/styles';
        export const useFooterStyles = makeStyles(() => ({
          root: { padding: 8, backgroundColor: 'gray' }
        }));
      `;

      const buttonStylesCode = `
        import { makeStyles } from '@material-ui/core/styles';
        export const useButtonStyles = makeStyles(() => ({
          primary: { backgroundColor: 'green', color: 'white' }
        }));
      `;

      mockReadFile.mockResolvedValue(componentCode);
      mockExistsSync.mockImplementation((path: any) => {
        return path.includes('.styles.ts');
      });
      
      mockReadFileSync.mockImplementation((path: any) => {
        if (path.includes('Header.styles.ts')) return headerStylesCode;
        if (path.includes('Footer.styles.ts')) return footerStylesCode;
        if (path.includes('Button.styles.ts')) return buttonStylesCode;
        return '';
      });

      await migrationTool.migrate(['/src/Component.tsx']);

      expect(mockReadFileSync).toHaveBeenCalledTimes(3);
    });

    it('should handle missing imported style files gracefully', async () => {
      const componentCode = `
        import React from 'react';
        import { useNonexistentStyles } from './nonexistent-styles';

        const Component = () => {
          const classes = useNonexistentStyles();
          return <div className={classes.root}>Content</div>;
        };
      `;

      mockReadFile.mockResolvedValue(componentCode);
      mockExistsSync.mockReturnValue(false); // File doesn't exist

      // Should not throw an error
      await expect(migrationTool.migrate(['/src/Component.tsx'])).resolves.not.toThrow();
    });

    it('should properly remove imported style hooks after migration', async () => {
      const componentCode = `
        import React from 'react';
        import { useCardStyles, useOtherUtils } from './utils';

        const Component = () => {
          const cardClasses = useCardStyles();
          const utils = useOtherUtils();

          return (
            <div className={cardClasses.root}>
              {utils.formatText('Hello')}
            </div>
          );
        };
      `;

      const utilsCode = `
        import { makeStyles } from '@material-ui/core/styles';

        export const useCardStyles = makeStyles(() => ({
          root: {
            padding: 16,
            borderRadius: 4,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          },
        }));

        export const useOtherUtils = () => {
          return {
            formatText: (text: string) => text.toUpperCase(),
          };
        };
      `;

      mockReadFile.mockResolvedValue(componentCode);
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(utilsCode);

      await migrationTool.migrate(['/src/Component.tsx']);

      // Verify that both files were processed
      expect(mockReadFile).toHaveBeenCalledWith('/src/Component.tsx', 'utf-8');
      expect(mockReadFileSync).toHaveBeenCalled();
    });

    it('should handle default exports from style files', async () => {
      const componentCode = `
        import React from 'react';
        import useStyles from './Component.styles';

        const Component = () => {
          const classes = useStyles();
          return <div className={classes.root}>Content</div>;
        };
      `;

      const stylesCode = `
        import { makeStyles } from '@material-ui/core/styles';

        export default makeStyles(() => ({
          root: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          },
        }));
      `;

      mockReadFile.mockResolvedValue(componentCode);
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(stylesCode);

      await migrationTool.migrate(['/src/Component.tsx']);

      expect(mockReadFile).toHaveBeenCalled();
      expect(mockReadFileSync).toHaveBeenCalled();
    });
  });

  describe('error handling with imports', () => {
    it('should handle malformed imported style files', async () => {
      const componentCode = `
        import React from 'react';
        import { useBrokenStyles } from './broken-styles';

        const Component = () => {
          const classes = useBrokenStyles();
          return <div className={classes.root}>Content</div>;
        };
      `;

      const brokenStylesCode = `
        import { makeStyles } from '@material-ui/core/styles';
        
        // This has syntax errors
        export const useBrokenStyles = makeStyles(() => ({
          root: {
            display: flex, // Missing quotes
            padding: 16px // Invalid CSS value format
          }
        });
      `;

      mockReadFile.mockResolvedValue(componentCode);
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(brokenStylesCode);

      // Should handle the error gracefully
      await expect(migrationTool.migrate(['/src/Component.tsx'])).resolves.not.toThrow();
    });

    it('should report errors when style conversion fails', async () => {
      const componentCode = `
        import React from 'react';
        import { useComplexStyles } from './complex-styles';

        const Component = () => {
          const classes = useComplexStyles();
          return <div className={classes.complex}>Content</div>;
        };
      `;

      const complexStylesCode = `
        import { makeStyles } from '@material-ui/core/styles';

        export const useComplexStyles = makeStyles(() => ({
          complex: {
            // Some very complex CSS that might not convert well
            background: 'linear-gradient(45deg, red, blue)',
            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
            filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))',
          },
        }));
      `;

      mockReadFile.mockResolvedValue(componentCode);
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(complexStylesCode);

      await migrationTool.migrate(['/src/Component.tsx']);

      // Should process without throwing, but might report warnings
      expect(mockReadFile).toHaveBeenCalled();
    });
  });

  describe('configuration options with imports', () => {
    it('should respect dryRun setting when processing imported styles', async () => {
      const componentCode = `
        import React from 'react';
        import { useTestStyles } from './test-styles';

        const Component = () => {
          const classes = useTestStyles();
          return <div className={classes.root}>Content</div>;
        };
      `;

      const testStylesCode = `
        import { makeStyles } from '@material-ui/core/styles';
        export const useTestStyles = makeStyles(() => ({
          root: { padding: 16 }
        }));
      `;

      mockReadFile.mockResolvedValue(componentCode);
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(testStylesCode);

      // Test with dryRun = true
      await migrationTool.migrate(['/src/Component.tsx']);
      expect(mockWriteFile).not.toHaveBeenCalled();

      // Test with dryRun = false
      const nonDryRunConfig = { ...config, dryRun: false };
      const nonDryRunTool = new MigrationTool(nonDryRunConfig);
      
      await nonDryRunTool.migrate(['/src/Component.tsx']);
      expect(mockWriteFile).toHaveBeenCalled();
    });

    it('should handle preserveOriginal setting with imported styles', async () => {
      const componentCode = `
        import React from 'react';
        import { useTestStyles } from './test-styles';
        const Component = () => {
          const classes = useTestStyles();
          return <div className={classes.root}>Content</div>;
        };
      `;

      const testStylesCode = `
        export const useTestStyles = makeStyles(() => ({
          root: { padding: 16 }
        }));
      `;

      mockReadFile.mockResolvedValue(componentCode);
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(testStylesCode);

      const preserveConfig = { ...config, dryRun: false, preserveOriginal: true };
      const preserveTool = new MigrationTool(preserveConfig);

      await preserveTool.migrate(['/src/Component.tsx']);

      // Should create backup file
      expect(mockWriteFile).toHaveBeenCalledWith('/src/Component.tsx.backup', componentCode);
      expect(mockWriteFile).toHaveBeenCalledWith('/src/Component.tsx', expect.any(String));
    });
  });
});