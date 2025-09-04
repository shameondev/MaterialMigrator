import { ASTParser } from '../../src/parser.js';

describe('ASTParser', () => {
  describe('constructor and parsing', () => {
    it('should parse valid TypeScript/JSX code', () => {
      const code = `
        import React from 'react';
        import { makeStyles } from '@material-ui/core/styles';
        
        const useStyles = makeStyles(() => ({
          root: {
            display: 'flex',
            padding: 16,
          },
        }));
        
        const Component = () => <div>Hello</div>;
      `;
      
      expect(() => new ASTParser(code)).not.toThrow();
    });

    it('should throw error for invalid syntax', () => {
      const invalidCode = `
        const invalid = {
          unclosed: "string
        };
      `;
      
      expect(() => new ASTParser(invalidCode)).toThrow(/Failed to parse source code/);
    });

    it('should handle empty code', () => {
      expect(() => new ASTParser('')).not.toThrow();
    });

    it('should handle complex JSX syntax', () => {
      const jsxCode = `
        import React from 'react';
        const Component = () => (
          <div className="test">
            <span>Hello World</span>
          </div>
        );
      `;
      
      expect(() => new ASTParser(jsxCode)).not.toThrow();
    });
  });

  describe('extractMakeStylesCalls', () => {
    it('should extract simple makeStyles calls', () => {
      const sourceCode = `
        import { makeStyles } from '@material-ui/core/styles';

        const useStyles = makeStyles(() => ({
          root: {
            display: 'flex',
            padding: 16,
          },
        }));
      `;

      const parser = new ASTParser(sourceCode);
      const extractions = parser.extractMakeStylesCalls();

      expect(extractions).toHaveLength(1);
      expect(extractions[0]).toEqual({
        importName: 'makeStyles',
        hookName: 'useStyles',
        styles: expect.arrayContaining([
          expect.objectContaining({
            name: 'root',
            properties: {
              display: 'flex',
              padding: 16,
            },
          }),
        ]),
        sourceFile: expect.any(String),
      });
    });

    it('should return empty array for code without makeStyles', () => {
      const sourceCode = `
        import React from 'react';
        
        const Component = () => <div>Hello</div>;
      `;

      const parser = new ASTParser(sourceCode);
      const extractions = parser.extractMakeStylesCalls();

      expect(extractions).toEqual([]);
    });

    it('should handle empty makeStyles call', () => {
      const sourceCode = `
        import { makeStyles } from '@material-ui/core/styles';

        const useStyles = makeStyles(() => ({}));
      `;

      const parser = new ASTParser(sourceCode);
      const extractions = parser.extractMakeStylesCalls();

      expect(extractions).toHaveLength(1);
      expect(extractions[0].styles).toEqual([]);
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle malformed makeStyles calls gracefully', () => {
      const sourceCode = `
        import { makeStyles } from '@material-ui/core/styles';

        const useStyles = makeStyles(); // No arguments
      `;

      const parser = new ASTParser(sourceCode);
      
      // Should not throw, but may return empty extractions
      expect(() => parser.extractMakeStylesCalls()).not.toThrow();
    });

    it('should handle mixed content with comments', () => {
      const sourceCode = `
        // This is a comment
        import React from 'react';
        import { makeStyles } from '@material-ui/core/styles';

        /* Multi-line comment */
        const useStyles = makeStyles(() => ({
          root: {
            display: 'flex', // Inline comment
            padding: 16,
          },
        }));
      `;

      const parser = new ASTParser(sourceCode);
      const extractions = parser.extractMakeStylesCalls();

      expect(extractions).toHaveLength(1);
      expect(extractions[0].hookName).toBe('useStyles');
    });

    it('should handle TypeScript syntax', () => {
      const sourceCode = `
        import { makeStyles, Theme } from '@material-ui/core/styles';

        interface Props {
          color?: string;
        }

        const useStyles = makeStyles<Theme, Props>((theme) => ({
          root: {
            display: 'flex',
          },
        }));
      `;

      const parser = new ASTParser(sourceCode);
      expect(() => parser.extractMakeStylesCalls()).not.toThrow();
    });
  });
});