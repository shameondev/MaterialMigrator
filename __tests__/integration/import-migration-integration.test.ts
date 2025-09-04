import { MigrationTool } from '../../src/migrate.js';
import { readFile, writeFile } from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import type { MigrationConfig } from '../../src/types.js';

// Mock only the file system operations
jest.mock('fs/promises');
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}));

const mockReadFile = readFile as jest.MockedFunction<typeof readFile>;
const mockWriteFile = writeFile as jest.MockedFunction<typeof writeFile>;
const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;
const mockReadFileSync = readFileSync as jest.MockedFunction<typeof readFileSync>;

describe('Import Migration Integration Tests', () => {
  let config: MigrationConfig;
  let migrationTool: MigrationTool;

  beforeEach(() => {
    config = {
      include: [],
      exclude: [],
      dryRun: false,
      verbose: true,
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

  describe('complete migration workflow', () => {
    it('should migrate a real-world component with imported styles', async () => {
      // Component that imports styles from a separate file
      const componentCode = `
import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useHeaderStyles } from './Header.styles';
import { useCardStyles } from '../shared/Card.styles';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showAction?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, showAction }) => {
  const headerClasses = useHeaderStyles();
  const cardClasses = useCardStyles();

  return (
    <Box className={headerClasses.root}>
      <div className={headerClasses.titleContainer}>
        <Typography 
          variant="h1" 
          className={headerClasses.title}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography 
            variant="subtitle1" 
            className={headerClasses.subtitle}
          >
            {subtitle}
          </Typography>
        )}
      </div>
      {showAction && (
        <div className={cardClasses.actionArea}>
          <Button 
            variant="contained" 
            className={headerClasses.actionButton}
          >
            Action
          </Button>
        </div>
      )}
    </Box>
  );
};
      `;

      // Styles file for Header component  
      const headerStylesCode = `
import { makeStyles } from '@material-ui/core/styles';

export const useHeaderStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(3, 4),
    backgroundColor: theme.palette.background.paper,
    borderBottom: \`1px solid \${theme.palette.divider}\`,
    minHeight: 80,
  },
  titleContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  title: {
    fontWeight: theme.typography.fontWeightBold,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(1),
  },
  subtitle: {
    color: theme.palette.text.secondary,
    opacity: 0.8,
  },
  actionButton: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1, 3),
  },
}));
      `;

      // Shared styles file
      const cardStylesCode = `
import { makeStyles } from '@material-ui/core/styles';

export const useCardStyles = makeStyles((theme) => ({
  actionArea: {
    display: 'flex',
    gap: theme.spacing(2),
    alignItems: 'center',
  },
  card: {
    padding: theme.spacing(3),
    borderRadius: theme.shape.borderRadius * 2,
    boxShadow: theme.shadows[3],
    backgroundColor: theme.palette.background.paper,
  },
  cardContent: {
    padding: theme.spacing(2),
    '&:last-child': {
      paddingBottom: theme.spacing(2),
    },
  },
}));
      `;

      // Expected output after migration
      const expectedMigratedCode = `
import React from 'react';
import { Box, Typography, Button } from '@mui/material';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showAction?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, showAction }) => {
  return (
    <Box className="flex justify-between items-center px-8 py-6 bg-white border-b border-gray-200 min-h-20">
      <div className="flex flex-col items-start">
        <Typography 
          variant="h1" 
          className="font-bold text-gray-900 mb-2"
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography 
            variant="subtitle1" 
            className="text-gray-600 opacity-80"
          >
            {subtitle}
          </Typography>
        )}
      </div>
      {showAction && (
        <div className="flex gap-4 items-center">
          <Button 
            variant="contained" 
            className="bg-blue-500 text-white hover:bg-blue-700 rounded px-6 py-2"
          >
            Action
          </Button>
        </div>
      )}
    </Box>
  );
};
      `.trim();

      // Setup mocks
      mockReadFile.mockResolvedValue(componentCode);
      
      mockExistsSync.mockImplementation((path: any) => {
        return path.includes('Header.styles.ts') || path.includes('Card.styles.ts');
      });

      mockReadFileSync.mockImplementation((path: any) => {
        if (path.includes('Header.styles.ts')) return headerStylesCode;
        if (path.includes('Card.styles.ts')) return cardStylesCode;
        return '';
      });

      // Run migration
      await migrationTool.migrate(['/src/components/Header/Header.tsx']);

      // Verify files were read
      expect(mockReadFile).toHaveBeenCalledWith('/src/components/Header/Header.tsx', 'utf-8');
      expect(mockReadFileSync).toHaveBeenCalledTimes(2);

      // Verify the transformed code was written
      expect(mockWriteFile).toHaveBeenCalledWith(
        '/src/components/Header/Header.tsx',
        expect.stringContaining('className="flex justify-between items-center')
      );

      // Verify imports were removed
      expect(mockWriteFile).toHaveBeenCalledWith(
        '/src/components/Header/Header.tsx',
        expect.not.stringContaining('useHeaderStyles')
      );
      expect(mockWriteFile).toHaveBeenCalledWith(
        '/src/components/Header/Header.tsx',
        expect.not.stringContaining('useCardStyles')
      );
    });

    it('should handle complex nested component structure', async () => {
      const pageCode = `
import React from 'react';
import { Container, Grid, Paper } from '@mui/material';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { useLayoutStyles } from './Layout.styles';

export const DashboardPage: React.FC = () => {
  const classes = useLayoutStyles();

  return (
    <Container maxWidth="xl" className={classes.container}>
      <Header />
      <Grid container spacing={3} className={classes.mainGrid}>
        <Grid item xs={12} md={3} className={classes.sidebarGrid}>
          <Paper className={classes.sidebarPaper}>
            <Sidebar />
          </Paper>
        </Grid>
        <Grid item xs={12} md={9} className={classes.contentGrid}>
          <Paper className={classes.contentPaper}>
            <MainContent />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};
      `;

      const layoutStylesCode = `
import { makeStyles } from '@material-ui/core/styles';

export const useLayoutStyles = makeStyles((theme) => ({
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
    minHeight: '100vh',
    backgroundColor: theme.palette.grey[50],
  },
  mainGrid: {
    marginTop: theme.spacing(2),
    height: 'calc(100vh - 200px)',
  },
  sidebarGrid: {
    height: '100%',
  },
  sidebarPaper: {
    padding: theme.spacing(2),
    height: '100%',
    borderRadius: theme.shape.borderRadius * 2,
    boxShadow: theme.shadows[2],
  },
  contentGrid: {
    height: '100%',
  },
  contentPaper: {
    padding: theme.spacing(3),
    height: '100%',
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[1],
  },
}));
      `;

      mockReadFile.mockResolvedValue(pageCode);
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(layoutStylesCode);

      await migrationTool.migrate(['/src/pages/Dashboard.tsx']);

      expect(mockWriteFile).toHaveBeenCalledWith(
        '/src/pages/Dashboard.tsx',
        expect.stringContaining('className="pt-8 pb-8 min-h-screen bg-gray-50"')
      );
    });

    it('should preserve non-migratable styles and show warnings', async () => {
      const componentCode = `
import React from 'react';
import { useComplexStyles } from './Complex.styles';

export const ComplexComponent: React.FC = () => {
  const classes = useComplexStyles();
  
  return (
    <div className={classes.root}>
      <div className={classes.complexBackground}>
        <div className={classes.animatedElement}>Content</div>
      </div>
    </div>
  );
};
      `;

      const complexStylesCode = `
import { makeStyles } from '@material-ui/core/styles';

export const useComplexStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    padding: theme.spacing(2), // This can be converted
  },
  complexBackground: {
    // These might not convert cleanly
    background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  animatedElement: {
    // Complex animation that may not have Tailwind equivalent
    animation: 'customKeyframe 2s ease-in-out infinite',
    transform: 'perspective(1000px) rotateX(45deg)',
    filter: 'drop-shadow(0 0 10px rgba(255, 0, 0, 0.5))',
  },
}));
      `;

      mockReadFile.mockResolvedValue(componentCode);
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(complexStylesCode);

      const verboseConfig = { ...config, verbose: true };
      const verboseTool = new MigrationTool(verboseConfig);

      await verboseTool.migrate(['/src/Complex.tsx']);

      // Should convert what it can and leave the rest
      expect(mockWriteFile).toHaveBeenCalledWith(
        '/src/Complex.tsx',
        expect.stringContaining('className="flex p-4"') // Converted simple styles
      );

      // Complex styles should remain as-is with warnings
      expect(mockWriteFile).toHaveBeenCalledWith(
        '/src/Complex.tsx',
        expect.stringContaining('useComplexStyles') // Hook should remain if not fully convertible
      );
    });
  });

  describe('error recovery and edge cases', () => {
    it('should handle circular import dependencies gracefully', async () => {
      const componentACode = `
import React from 'react';
import { useStylesB } from './ComponentB.styles';

export const ComponentA = () => {
  const classes = useStylesB();
  return <div className={classes.root}>A</div>;
};
      `;

      const componentBStylesCode = `
import { makeStyles } from '@material-ui/core/styles';
// This might import from ComponentA.styles, creating circular dependency

export const useStylesB = makeStyles(() => ({
  root: { padding: 16, margin: 8 }
}));
      `;

      mockReadFile.mockResolvedValue(componentACode);
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(componentBStylesCode);

      // Should not hang or crash due to circular dependencies
      await expect(migrationTool.migrate(['/src/ComponentA.tsx'])).resolves.not.toThrow();
    });

    it('should handle mixed JavaScript and TypeScript files', async () => {
      const jsComponentCode = `
import React from 'react';
import { useStyles } from './styles.ts'; // TS file imported by JS

const Component = () => {
  const classes = useStyles();
  return <div className={classes.root}>Content</div>;
};

export default Component;
      `;

      const tsStylesCode = `
import { makeStyles } from '@material-ui/core/styles';
import { Theme } from '@material-ui/core/styles/createTheme';

export const useStyles = makeStyles((theme: Theme) => ({
  root: {
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
  },
}));
      `;

      mockReadFile.mockResolvedValue(jsComponentCode);
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(tsStylesCode);

      await migrationTool.migrate(['/src/Component.jsx']);

      expect(mockWriteFile).toHaveBeenCalledWith(
        '/src/Component.jsx',
        expect.stringContaining('className="p-4 bg-white"')
      );
    });

    it('should handle deeply nested import paths', async () => {
      const componentCode = `
import React from 'react';
import { useDeepStyles } from '../../../shared/components/ui/styles/deep/nested/styles';

const Component = () => {
  const classes = useDeepStyles();
  return <div className={classes.deeply.nested.style}>Content</div>;
};
      `;

      const deepStylesCode = `
import { makeStyles } from '@material-ui/core/styles';

export const useDeepStyles = makeStyles(() => ({
  deeply: {
    nested: {
      style: {
        padding: 16,
        margin: 8,
        backgroundColor: 'red',
      }
    }
  }
}));
      `;

      mockReadFile.mockResolvedValue(componentCode);
      mockExistsSync.mockImplementation((path: any) => {
        return path.includes('nested/styles.ts');
      });
      mockReadFileSync.mockReturnValue(deepStylesCode);

      await migrationTool.migrate(['/src/components/feature/Component.tsx']);

      expect(mockReadFileSync).toHaveBeenCalledWith(
        expect.stringContaining('nested/styles.ts'),
        'utf-8'
      );
    });
  });

  describe('reporting and analytics', () => {
    it('should generate comprehensive reports for imported styles', async () => {
      const componentCode = `
import React from 'react';
import { useReportStyles } from './Report.styles';

const ReportComponent = () => {
  const classes = useReportStyles();
  return (
    <div className={classes.container}>
      <div className={classes.header}>Header</div>
      <div className={classes.content}>Content</div>
    </div>
  );
};
      `;

      const reportStylesCode = `
import { makeStyles } from '@material-ui/core/styles';

export const useReportStyles = makeStyles((theme) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing(2),
  },
  header: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: theme.spacing(2),
  },
  content: {
    flex: 1,
    padding: theme.spacing(1),
    backgroundColor: theme.palette.background.default,
  },
}));
      `;

      const reportConfig = { ...config, generateReport: true, verbose: true };
      const reportTool = new MigrationTool(reportConfig);

      mockReadFile.mockResolvedValue(componentCode);
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(reportStylesCode);

      await reportTool.migrate(['/src/Report.tsx']);

      // Should generate a detailed report
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('migration-report.json'),
        expect.stringContaining('"totalFiles"')
      );
    });
  });
});