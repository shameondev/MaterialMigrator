import { CodeTransformer } from '../../src/transformer.js';
import { StyleConverter } from '../../src/converter.js';
import { ASTParser } from '../../src/parser.js';

describe('Optional Chaining in Theme References', () => {
  let converter: StyleConverter;

  beforeEach(() => {
    converter = new StyleConverter();
  });

  test('should provide helpful error for theme.custom?.main', () => {
    const sourceCode = `
import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  button: {
    color: theme.custom?.main,
    minWidth: 65,
  }
}));

export const TestComponent: React.FC = () => {
  const classes = useStyles();
  return <button className={classes.button}>Test</button>;
};
    `;

    const parser = new ASTParser(sourceCode);
    const extractions = parser.extractMakeStylesCalls();
    
    // This should throw an error during style conversion
    expect(() => {
      extractions.forEach(extraction => {
        extraction.styles.forEach(style => {
          converter.convertStyles(style.properties);
        });
      });
    }).toThrow(/Unknown theme property: theme\.custom\.main\?/);
  });

  test('should handle theme.palette?.primary?.main with normal behavior', () => {
    const sourceCode = `
import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  text: {
    color: theme.palette?.primary?.main,
  }
}));
    `;

    const parser = new ASTParser(sourceCode);
    const extractions = parser.extractMakeStylesCalls();
    
    // Palette properties should work normally (not throw errors)
    expect(() => {
      extractions.forEach(extraction => {
        extraction.styles.forEach(style => {
          converter.convertStyles(style.properties);
        });
      });
    }).not.toThrow();
  });

  test('should work normally with non-theme references', () => {
    const sourceCode = `
import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  button: {
    minWidth: 65,
    cursor: 'pointer',
  }
}));

export const TestComponent: React.FC = () => {
  const classes = useStyles();
  return <button className={classes.button}>Test</button>;
};
    `;

    const parser = new ASTParser(sourceCode);
    const extractions = parser.extractMakeStylesCalls();
    const transformer = new CodeTransformer(sourceCode);
    
    // Convert styles to get conversions
    const conversions = new Map();
    extractions.forEach(extraction => {
      extraction.styles.forEach(style => {
        const conversion = converter.convertStyles(style.properties);
        conversions.set(`${extraction.hookName}.${style.name}`, conversion);
      });
    });
    
    const result = transformer.transform(extractions, conversions);
    
    expect(result.migratedCode).toContain('min-w-[65px]');
    expect(result.migratedCode).toContain('cursor-pointer');
  });

  test('should handle custom theme mapping to resolve theme references', () => {
    const customMapping = {
      customThemeMapping: {
        'theme.custom.main': 'text-blue-600'
      }
    };
    
    const converterWithMapping = new StyleConverter(customMapping);
    
    const sourceCode = `
import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  button: {
    color: theme.custom.main, // Should work with mapping
    minWidth: 65,
  }
}));

export const TestComponent: React.FC = () => {
  const classes = useStyles();
  return <button className={classes.button}>Test</button>;
};
    `;

    const parser = new ASTParser(sourceCode);
    const extractions = parser.extractMakeStylesCalls();
    const transformer = new CodeTransformer(sourceCode);
    
    // Convert styles with custom mapping
    const conversions = new Map();
    extractions.forEach(extraction => {
      extraction.styles.forEach(style => {
        const conversion = converterWithMapping.convertStyles(style.properties);
        conversions.set(`${extraction.hookName}.${style.name}`, conversion);
      });
    });
    
    const result = transformer.transform(extractions, conversions);
    
    expect(result.migratedCode).toContain('text-blue-600');
    expect(result.migratedCode).toContain('min-w-[65px]');
  });
});