import { CodeTransformer } from '../../src/transformer.js';
import { StyleConverter } from '../../src/converter.js';

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

    const transformer = new CodeTransformer(sourceCode);
    
    // This should throw an error with helpful guidance
    expect(() => {
      transformer.transform(converter);
    }).toThrow(/Optional chaining in theme reference: theme\.custom\.main\?/);
    
    expect(() => {
      transformer.transform(converter);
    }).toThrow(/customThemeMapping/);
    
    expect(() => {
      transformer.transform(converter);
    }).toThrow(/theme\.custom\.main.*text-blue-600/);
  });

  test('should provide helpful error for theme.palette?.primary?.main', () => {
    const sourceCode = `
import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  text: {
    color: theme.palette?.primary?.main,
  }
}));
    `;

    const transformer = new CodeTransformer(sourceCode);
    
    expect(() => {
      transformer.transform(converter);
    }).toThrow(/Optional chaining in theme reference/);
    
    expect(() => {
      transformer.transform(converter);
    }).toThrow(/theme\.palette\.primary\.main.*text-primary/);
  });

  test('should work normally with non-optional theme references', () => {
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

    const transformer = new CodeTransformer(sourceCode);
    const result = transformer.transform(converter);
    
    expect(result.success).toBe(true);
    expect(result.migratedCode).toContain('min-w-[65px]');
    expect(result.migratedCode).toContain('cursor-pointer');
  });

  test('should handle custom theme mapping to resolve optional chaining', () => {
    const customMapping = {
      'theme.custom.main': 'text-blue-600'
    };
    
    const converterWithMapping = new StyleConverter(customMapping);
    
    const sourceCode = `
import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  button: {
    color: theme.custom.main, // Non-optional version should work with mapping
    minWidth: 65,
  }
}));

export const TestComponent: React.FC = () => {
  const classes = useStyles();
  return <button className={classes.button}>Test</button>;
};
    `;

    const transformer = new CodeTransformer(sourceCode);
    const result = transformer.transform(converterWithMapping);
    
    expect(result.success).toBe(true);
    expect(result.migratedCode).toContain('text-blue-600');
    expect(result.migratedCode).toContain('min-w-[65px]');
  });
});