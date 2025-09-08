import { ASTParser } from '../../src/parser.js';
import type { MakeStylesExtraction } from '../../src/types.js';

describe('Theme Spacing Parser', () => {
  let parser: ASTParser;

  beforeEach(() => {
    parser = new ASTParser('');
  });

  describe('theme.spacing() extraction', () => {
    test('should extract theme.spacing(0) as 0px', () => {
      const code = `
        const useStyles = makeStyles((theme) => ({
          root: {
            padding: theme.spacing(0),
          },
        }));
      `;
      
      parser = new ASTParser(code);
      const extractions = parser.extractMakeStylesCalls();
      
      expect(extractions).toHaveLength(1);
      expect(extractions[0].styles).toHaveLength(1);
      expect(extractions[0].styles[0].properties.padding).toBe('0px');
    });

    test('should extract theme.spacing(1) as 8px', () => {
      const code = `
        const useStyles = makeStyles((theme) => ({
          root: {
            padding: theme.spacing(1),
          },
        }));
      `;
      
      parser = new ASTParser(code);
      const extractions = parser.extractMakeStylesCalls();
      
      expect(extractions).toHaveLength(1);
      expect(extractions[0].styles).toHaveLength(1);
      expect(extractions[0].styles[0].properties.padding).toBe('8px');
    });

    test('should extract theme.spacing(3) as 24px', () => {
      const code = `
        const useStyles = makeStyles((theme) => ({
          root: {
            padding: theme.spacing(3),
          },
        }));
      `;
      
      parser = new ASTParser(code);
      const extractions = parser.extractMakeStylesCalls();
      
      expect(extractions).toHaveLength(1);
      expect(extractions[0].styles).toHaveLength(1);
      expect(extractions[0].styles[0].properties.padding).toBe('24px');
    });

    test('should extract theme.spacing(8) as 64px', () => {
      const code = `
        const useStyles = makeStyles((theme) => ({
          root: {
            padding: theme.spacing(8),
          },
        }));
      `;
      
      parser = new ASTParser(code);
      const extractions = parser.extractMakeStylesCalls();
      
      expect(extractions).toHaveLength(1);
      expect(extractions[0].styles).toHaveLength(1);
      expect(extractions[0].styles[0].properties.padding).toBe('64px');
    });

    test('should handle theme.spacing() with dynamic arguments', () => {
      const code = `
        const useStyles = makeStyles((theme) => ({
          root: {
            padding: theme.spacing(props => props.spacing || 2),
          },
        }));
      `;
      
      parser = new ASTParser(code);
      const extractions = parser.extractMakeStylesCalls();
      
      expect(extractions).toHaveLength(1);
      expect(extractions[0].styles).toHaveLength(1);
      expect(extractions[0].styles[0].properties.padding).toEqual({
        type: 'theme-spacing',
        multiplier: '{ArrowFunctionExpression}'
      });
    });

    test('should handle theme.spacing() with conditional expressions', () => {
      const code = `
        const useStyles = makeStyles((theme) => ({
          root: {
            padding: theme.spacing(props.isLarge ? 4 : 2),
          },
        }));
      `;
      
      parser = new ASTParser(code);
      const extractions = parser.extractMakeStylesCalls();
      
      expect(extractions).toHaveLength(1);
      expect(extractions[0].styles).toHaveLength(1);
      expect(extractions[0].styles[0].properties.padding).toEqual({
        type: 'theme-spacing',
        multiplier: {
          type: 'conditional',
          condition: '{condition}',
          consequent: 4,
          alternate: 2
        }
      });
    });

    test('should handle multiple theme.spacing() calls in same style object', () => {
      const code = `
        const useStyles = makeStyles((theme) => ({
          root: {
            padding: theme.spacing(3),
            margin: theme.spacing(2),
            paddingTop: theme.spacing(1),
            marginBottom: theme.spacing(4),
          },
        }));
      `;
      
      parser = new ASTParser(code);
      const extractions = parser.extractMakeStylesCalls();
      
      expect(extractions).toHaveLength(1);
      expect(extractions[0].styles).toHaveLength(1);
      const properties = extractions[0].styles[0].properties;
      
      expect(properties.padding).toBe('24px');
      expect(properties.margin).toBe('16px');
      expect(properties.paddingTop).toBe('8px');
      expect(properties.marginBottom).toBe('32px');
    });
  });
});
