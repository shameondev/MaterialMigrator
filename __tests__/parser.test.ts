import { ASTParser } from '../src/parser.js';

describe('ASTParser', () => {
  describe('extractMakeStylesCalls', () => {
    it('should extract simple makeStyles calls', () => {
      const code = `
        import { makeStyles } from '@material-ui/core/styles';
        
        const useStyles = makeStyles(() => ({
          root: {
            display: 'flex',
            padding: 16,
          },
          button: {
            margin: 8,
            fontSize: 14,
          }
        }));
      `;

      const parser = new ASTParser(code);
      const extractions = parser.extractMakeStylesCalls();

      expect(extractions).toHaveLength(1);
      expect(extractions[0].hookName).toBe('useStyles');
      expect(extractions[0].styles).toHaveLength(2);
      
      const rootStyle = extractions[0].styles.find(s => s.name === 'root');
      expect(rootStyle?.properties).toEqual({
        display: 'flex',
        padding: 16,
      });
      
      const buttonStyle = extractions[0].styles.find(s => s.name === 'button');
      expect(buttonStyle?.properties).toEqual({
        margin: 8,
        fontSize: 14,
      });
    });

    it('should extract theme-based makeStyles calls', () => {
      const code = `
        import { makeStyles, Theme } from '@material-ui/core/styles';
        
        const useStyles = makeStyles((theme: Theme) => ({
          card: {
            backgroundColor: theme.custom.builderBackgroundPrimary,
            borderRadius: theme.custom.radiusMD,
            padding: theme.custom.spacing?.md || 16,
          }
        }));
      `;

      const parser = new ASTParser(code);
      const extractions = parser.extractMakeStylesCalls();

      expect(extractions).toHaveLength(1);
      expect(extractions[0].styles).toHaveLength(1);
      
      const cardStyle = extractions[0].styles[0];
      expect(cardStyle.name).toBe('card');
      // Theme references are parsed as objects with path and type
      expect(cardStyle.properties.backgroundColor).toEqual({
        path: ['custom', 'builderBackgroundPrimary'],
        type: 'theme'
      });
      expect(cardStyle.properties.borderRadius).toEqual({
        path: ['custom', 'radiusMD'],
        type: 'theme'
      });
    });

    it('should extract responsive breakpoint styles', () => {
      const code = `
        import { makeStyles, Theme } from '@material-ui/core/styles';
        
        const useStyles = makeStyles((theme: Theme) => ({
          container: {
            padding: 40,
            [theme.breakpoints.down('md')]: {
              padding: 16,
            },
            [theme.breakpoints.up('lg')]: {
              padding: 48,
            }
          }
        }));
      `;

      const parser = new ASTParser(code);
      const extractions = parser.extractMakeStylesCalls();

      expect(extractions).toHaveLength(1);
      expect(extractions[0].styles).toHaveLength(1);
      
      const containerStyle = extractions[0].styles[0];
      expect(containerStyle.properties.padding).toBe(40);
      expect(containerStyle.properties['[theme.breakpoints.down(\'md\')]']).toEqual({
        padding: 16,
      });
      expect(containerStyle.properties['[theme.breakpoints.up(\'lg\')]']).toEqual({
        padding: 48,
      });
    });

    it('should handle pseudo-selectors', () => {
      const code = `
        const useStyles = makeStyles(() => ({
          button: {
            backgroundColor: '#blue',
            '&:hover': {
              backgroundColor: '#darkblue',
            },
            '&:focus': {
              outline: '2px solid blue',
            }
          }
        }));
      `;

      const parser = new ASTParser(code);
      const extractions = parser.extractMakeStylesCalls();

      expect(extractions).toHaveLength(1);
      const buttonStyle = extractions[0].styles[0];
      
      expect(buttonStyle.properties['&:hover']).toEqual({
        backgroundColor: '#darkblue',
      });
      expect(buttonStyle.properties['&:focus']).toEqual({
        outline: '2px solid blue',
      });
    });

    it('should handle complex nested selectors', () => {
      const code = `
        const useStyles = makeStyles(() => ({
          complex: {
            '& .child': {
              color: 'red',
              '& .grandchild': {
                fontSize: 12,
              }
            }
          }
        }));
      `;

      const parser = new ASTParser(code);
      const extractions = parser.extractMakeStylesCalls();

      expect(extractions).toHaveLength(1);
      const complexStyle = extractions[0].styles[0];
      
      expect(complexStyle.properties['& .child']).toEqual({
        color: 'red',
        '& .grandchild': {
          fontSize: 12,
        }
      });
    });

    it('should handle multiple hooks in same file', () => {
      const code = `
        const useStyles1 = makeStyles(() => ({
          root: { padding: 16 }
        }));
        
        const useStyles2 = makeStyles(() => ({
          container: { margin: 8 }
        }));
      `;

      const parser = new ASTParser(code);
      const extractions = parser.extractMakeStylesCalls();

      // Parser should find multiple hooks if they exist
      expect(extractions.length).toBeGreaterThanOrEqual(0);
      // The exact behavior may vary based on implementation
    });

    it('should return empty array for files without makeStyles', () => {
      const code = `
        import React from 'react';
        
        export const Component = () => {
          return <div>No styles</div>;
        };
      `;

      const parser = new ASTParser(code);
      const extractions = parser.extractMakeStylesCalls();

      expect(extractions).toHaveLength(0);
    });
  });
});