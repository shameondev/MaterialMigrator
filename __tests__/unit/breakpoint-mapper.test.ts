import { BreakpointMapper } from '../../src/mappings/breakpoint-mapper.js';
import type { CSSProperties, BreakpointMapping } from '../../src/types.js';

describe('BreakpointMapper', () => {
  let breakpointMapper: BreakpointMapper;

  beforeEach(() => {
    breakpointMapper = new BreakpointMapper();
  });

  describe('constructor', () => {
    it('should initialize with default breakpoints', () => {
      const mapper = new BreakpointMapper();
      expect(mapper).toBeInstanceOf(BreakpointMapper);
    });

    it('should merge custom breakpoints with defaults', () => {
      const customBreakpoints: Partial<BreakpointMapping> = {
        xxl: 2560,
      };
      
      const mapper = new BreakpointMapper(customBreakpoints);
      expect(mapper).toBeInstanceOf(BreakpointMapper);
    });
  });

  describe('isBreakpoint', () => {
    it('should identify breakpoint keys correctly', () => {
      expect(breakpointMapper.isBreakpoint('[theme.breakpoints.up(\'md\')]')).toBe(true);
      expect(breakpointMapper.isBreakpoint('[theme.breakpoints.down(\'lg\')]')).toBe(true);
      expect(breakpointMapper.isBreakpoint('[theme.breakpoints.between(\'sm\', \'xl\')]')).toBe(true);
    });

    it('should not identify non-breakpoint keys', () => {
      expect(breakpointMapper.isBreakpoint('display')).toBe(false);
      expect(breakpointMapper.isBreakpoint('margin')).toBe(false);
      expect(breakpointMapper.isBreakpoint('color')).toBe(false);
      expect(breakpointMapper.isBreakpoint('breakpoint')).toBe(false);
    });
  });

  describe('parseBreakpointKey', () => {
    it('should parse up() breakpoints correctly', () => {
      const testCases = [
        "[theme.breakpoints.up('md')]",
        '[theme.breakpoints.up("md")]',
        "[theme.breakpoints.up('sm')]",
        "[theme.breakpoints.up('lg')]",
      ];

      testCases.forEach((key) => {
        const result = breakpointMapper['parseBreakpointKey'](key);
        expect(result).toEqual({
          direction: 'up',
          breakpoint: expect.any(String),
        });
      });
    });

    it('should parse down() breakpoints correctly', () => {
      const testCases = [
        "[theme.breakpoints.down('md')]",
        '[theme.breakpoints.down("lg")]',
        "[theme.breakpoints.down('sm')]",
      ];

      testCases.forEach((key) => {
        const result = breakpointMapper['parseBreakpointKey'](key);
        expect(result).toEqual({
          direction: 'down',
          breakpoint: expect.any(String),
        });
      });
    });

    it('should parse between() breakpoints correctly', () => {
      const result = breakpointMapper['parseBreakpointKey']("[theme.breakpoints.between('sm', 'lg')]");
      expect(result).toEqual({
        direction: 'between',
        breakpoint: 'sm',
        endBreakpoint: 'lg',
      });
    });

    it('should handle different quote styles', () => {
      const singleQuote = breakpointMapper['parseBreakpointKey']("[theme.breakpoints.up('md')]");
      const doubleQuote = breakpointMapper['parseBreakpointKey']('[theme.breakpoints.up("md")]');
      
      expect(singleQuote).toEqual({ direction: 'up', breakpoint: 'md' });
      expect(doubleQuote).toEqual({ direction: 'up', breakpoint: 'md' });
    });

    it('should return null for invalid breakpoint keys', () => {
      const invalidKeys = [
        'invalid-key',
        '[theme.breakpoints.invalid(\'md\')]',
        '[breakpoints.up(\'md\')]',
        'theme.breakpoints.up(\'md\')',
      ];

      invalidKeys.forEach((key) => {
        const result = breakpointMapper['parseBreakpointKey'](key);
        expect(result).toBeNull();
      });
    });
  });

  describe('mapBreakpointToTailwind', () => {
    it('should map Material-UI breakpoints to Tailwind correctly', () => {
      const mappings = [
        { mui: 'xs', tailwind: 'sm' },
        { mui: 'sm', tailwind: 'sm' },
        { mui: 'md', tailwind: 'md' },
        { mui: 'lg', tailwind: 'lg' },
        { mui: 'xl', tailwind: 'xl' },
      ];

      mappings.forEach(({ mui, tailwind }) => {
        const result = breakpointMapper['mapBreakpointToTailwind'](mui);
        expect(result).toBe(tailwind);
      });
    });

    it('should return original breakpoint for unmapped values', () => {
      const result = breakpointMapper['mapBreakpointToTailwind']('xxl');
      expect(result).toBe('xxl');
    });
  });

  describe('createResponsiveClasses', () => {
    it('should create up() responsive classes', () => {
      const result = breakpointMapper['createResponsiveClasses'](
        'up',
        'md',
        undefined,
        ['flex', 'p-4']
      );
      
      expect(result).toEqual(['md:flex', 'md:p-4']);
    });

    it('should create down() responsive classes', () => {
      const result = breakpointMapper['createResponsiveClasses'](
        'down',
        'md',
        undefined,
        ['hidden', 'text-sm']
      );
      
      expect(result).toEqual(['max-md:hidden', 'max-md:text-sm']);
    });

    it('should create between() responsive classes', () => {
      const result = breakpointMapper['createResponsiveClasses'](
        'between',
        'sm',
        'lg',
        ['block', 'font-bold']
      );
      
      expect(result).toEqual(['sm:max-lg:block', 'sm:max-lg:font-bold']);
    });

    it('should handle empty base classes', () => {
      const result = breakpointMapper['createResponsiveClasses'](
        'up',
        'md',
        undefined,
        []
      );
      
      expect(result).toEqual([]);
    });

    it('should handle single base class', () => {
      const result = breakpointMapper['createResponsiveClasses'](
        'up',
        'lg',
        undefined,
        ['grid']
      );
      
      expect(result).toEqual(['lg:grid']);
    });
  });

  describe('convertBreakpointStyles', () => {
    it('should convert valid breakpoint styles', () => {
      const styles: CSSProperties = {
        display: 'flex',
        padding: '16px',
      };
      
      const result = breakpointMapper.convertBreakpointStyles(
        "[theme.breakpoints.up('md')]",
        styles,
        ['flex', 'p-4']
      );
      
      expect(result.classes).toEqual(['md:flex', 'md:p-4']);
      expect(result.warnings).toEqual([]);
    });

    it('should handle invalid breakpoint keys gracefully', () => {
      const styles: CSSProperties = {
        display: 'block',
      };
      
      const result = breakpointMapper.convertBreakpointStyles(
        'invalid-breakpoint-key',
        styles,
        ['block']
      );
      
      expect(result.classes).toEqual(['block']);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('Could not parse breakpoint');
    });

    it('should catch and handle errors during conversion', () => {
      // Mock parseBreakpointKey to throw an error
      const originalParse = breakpointMapper['parseBreakpointKey'];
      breakpointMapper['parseBreakpointKey'] = jest.fn(() => {
        throw new Error('Parsing error');
      });

      const result = breakpointMapper.convertBreakpointStyles(
        "[theme.breakpoints.up('md')]",
        {},
        ['test-class']
      );
      
      expect(result.classes).toEqual(['test-class']);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('Error converting breakpoint');

      // Restore original method
      breakpointMapper['parseBreakpointKey'] = originalParse;
    });
  });

  describe('extractBreakpointStyles', () => {
    it('should separate base styles from breakpoint styles', () => {
      const styles: CSSProperties = {
        display: 'flex',
        padding: '8px',
        "[theme.breakpoints.up('md')]": {
          padding: '16px',
          margin: '8px',
        },
        "[theme.breakpoints.down('sm')]": {
          display: 'block',
        },
        color: 'red',
      };

      const result = breakpointMapper.extractBreakpointStyles(styles);
      
      expect(result.baseStyles).toEqual({
        display: 'flex',
        padding: '8px',
        color: 'red',
      });
      
      expect(result.breakpointStyles).toEqual({
        "[theme.breakpoints.up('md')]": {
          padding: '16px',
          margin: '8px',
        },
        "[theme.breakpoints.down('sm')]": {
          display: 'block',
        },
      });
    });

    it('should handle styles with no breakpoints', () => {
      const styles: CSSProperties = {
        display: 'flex',
        padding: '8px',
        color: 'blue',
      };

      const result = breakpointMapper.extractBreakpointStyles(styles);
      
      expect(result.baseStyles).toEqual(styles);
      expect(result.breakpointStyles).toEqual({});
    });

    it('should handle styles with only breakpoints', () => {
      const styles: CSSProperties = {
        "[theme.breakpoints.up('md')]": {
          display: 'flex',
        },
        "[theme.breakpoints.down('sm')]": {
          display: 'none',
        },
      };

      const result = breakpointMapper.extractBreakpointStyles(styles);
      
      expect(result.baseStyles).toEqual({});
      expect(result.breakpointStyles).toEqual(styles);
    });

    it('should handle non-object breakpoint values', () => {
      const styles: CSSProperties = {
        display: 'flex',
        "[theme.breakpoints.up('md')]": 'invalid-value' as any,
      };

      const result = breakpointMapper.extractBreakpointStyles(styles);
      
      expect(result.baseStyles).toEqual({ display: 'flex' });
      expect(result.breakpointStyles).toEqual({});
    });

    it('should handle null and array values correctly', () => {
      const styles: CSSProperties = {
        display: 'flex',
        "[theme.breakpoints.up('md')]": null as any,
        "[theme.breakpoints.down('sm')]": ['flex', 'p-4'] as any,
      };

      const result = breakpointMapper.extractBreakpointStyles(styles);
      
      expect(result.baseStyles).toEqual({ display: 'flex' });
      expect(result.breakpointStyles).toEqual({});
    });
  });

  describe('hasNestedBreakpoints', () => {
    it('should detect nested breakpoints', () => {
      const stylesWithBreakpoints: CSSProperties = {
        display: 'flex',
        "[theme.breakpoints.up('md')]": {
          padding: '16px',
        },
      };

      expect(breakpointMapper.hasNestedBreakpoints(stylesWithBreakpoints)).toBe(true);
    });

    it('should return false for styles without breakpoints', () => {
      const stylesWithoutBreakpoints: CSSProperties = {
        display: 'flex',
        padding: '8px',
        color: 'red',
      };

      expect(breakpointMapper.hasNestedBreakpoints(stylesWithoutBreakpoints)).toBe(false);
    });

    it('should handle empty styles object', () => {
      expect(breakpointMapper.hasNestedBreakpoints({})).toBe(false);
    });
  });

  describe('generateBreakpointComments', () => {
    it('should generate descriptive comments for breakpoint styles', () => {
      const styles: CSSProperties = {
        display: 'flex',
        padding: '16px',
        margin: '8px',
      };

      const result = breakpointMapper.generateBreakpointComments(
        "[theme.breakpoints.up('md')]",
        styles
      );

      expect(result).toContain('TODO: Review responsive styles');
      expect(result).toContain("[theme.breakpoints.up('md')]");
      expect(result).toContain('display: flex');
      expect(result).toContain('padding: 16px');
      expect(result).toContain('margin: 8px');
    });

    it('should handle empty styles object', () => {
      const result = breakpointMapper.generateBreakpointComments(
        "[theme.breakpoints.down('sm')]",
        {}
      );

      expect(result).toContain('TODO: Review responsive styles');
      expect(result).toContain('Original: {  }');
    });

    it('should handle single style property', () => {
      const result = breakpointMapper.generateBreakpointComments(
        "[theme.breakpoints.between('sm', 'lg')]",
        { display: 'block' }
      );

      expect(result).toContain('display: block');
    });
  });

  describe('validateBreakpointLogic', () => {
    it('should validate clean breakpoint logic', () => {
      const breakpointStyles = {
        "[theme.breakpoints.up('sm')]": { display: 'flex' },
        "[theme.breakpoints.up('md')]": { padding: '16px' },
      };

      const result = breakpointMapper.validateBreakpointLogic(breakpointStyles);
      
      expect(result.valid).toBe(true);
      expect(result.warnings).toEqual([]);
      expect(result.suggestions).toEqual([]);
    });

    it('should warn about mixed up() and down() breakpoints', () => {
      const breakpointStyles = {
        "[theme.breakpoints.up('md')]": { display: 'flex' },
        "[theme.breakpoints.down('sm')]": { display: 'block' },
      };

      const result = breakpointMapper.validateBreakpointLogic(breakpointStyles);
      
      expect(result.valid).toBe(false);
      expect(result.warnings).toContain('Mixed up() and down() breakpoints detected');
      expect(result.suggestions).toContain('Consider using consistent breakpoint direction');
    });

    it('should warn about too many breakpoints', () => {
      const breakpointStyles = {
        "[theme.breakpoints.up('xs')]": { display: 'flex' },
        "[theme.breakpoints.up('sm')]": { padding: '8px' },
        "[theme.breakpoints.up('md')]": { padding: '16px' },
        "[theme.breakpoints.up('lg')]": { padding: '24px' },
        "[theme.breakpoints.up('xl')]": { padding: '32px' },
      };

      const result = breakpointMapper.validateBreakpointLogic(breakpointStyles);
      
      expect(result.valid).toBe(false);
      expect(result.warnings).toContain('High number of breakpoints (5)');
      expect(result.suggestions).toContain('Use fewer breakpoints for simpler responsive design');
    });

    it('should handle empty breakpoint styles', () => {
      const result = breakpointMapper.validateBreakpointLogic({});
      
      expect(result.valid).toBe(true);
      expect(result.warnings).toEqual([]);
      expect(result.suggestions).toEqual([]);
    });
  });

  describe('generateArbitraryBreakpoint', () => {
    it('should generate arbitrary up() breakpoints', () => {
      const result = breakpointMapper.generateArbitraryBreakpoint(
        'up',
        768,
        ['flex', 'p-4']
      );

      expect(result).toEqual(['min-[768px]:flex', 'min-[768px]:p-4']);
    });

    it('should generate arbitrary down() breakpoints', () => {
      const result = breakpointMapper.generateArbitraryBreakpoint(
        'down',
        1024,
        ['hidden', 'text-sm']
      );

      expect(result).toEqual(['max-[1024px]:hidden', 'max-[1024px]:text-sm']);
    });

    it('should handle empty class list', () => {
      const result = breakpointMapper.generateArbitraryBreakpoint('up', 640, []);
      expect(result).toEqual([]);
    });

    it('should handle single class', () => {
      const result = breakpointMapper.generateArbitraryBreakpoint('down', 480, ['block']);
      expect(result).toEqual(['max-[480px]:block']);
    });

    it('should handle various pixel values', () => {
      const testCases = [
        { direction: 'up' as const, pixels: 320, class: 'flex' },
        { direction: 'up' as const, pixels: 1200, class: 'grid' },
        { direction: 'down' as const, pixels: 800, class: 'hidden' },
        { direction: 'down' as const, pixels: 1440, class: 'block' },
      ];

      testCases.forEach(({ direction, pixels, class: className }) => {
        const result = breakpointMapper.generateArbitraryBreakpoint(direction, pixels, [className]);
        const prefix = direction === 'up' ? 'min' : 'max';
        expect(result).toEqual([`${prefix}-[${pixels}px]:${className}`]);
      });
    });
  });

  describe('integration and complex scenarios', () => {
    it('should handle complex responsive design workflow', () => {
      const complexStyles: CSSProperties = {
        display: 'flex',
        padding: '8px',
        "[theme.breakpoints.up('sm')]": {
          padding: '12px',
          margin: '4px',
        },
        "[theme.breakpoints.up('md')]": {
          padding: '16px',
          margin: '8px',
          display: 'grid',
        },
        "[theme.breakpoints.down('xs')]": {
          display: 'block',
        },
      };

      // Extract breakpoints
      const extracted = breakpointMapper.extractBreakpointStyles(complexStyles);
      expect(extracted.baseStyles).toEqual({
        display: 'flex',
        padding: '8px',
      });
      expect(Object.keys(extracted.breakpointStyles)).toHaveLength(3);

      // Validate logic
      const validation = breakpointMapper.validateBreakpointLogic(extracted.breakpointStyles);
      expect(validation.valid).toBe(false); // Mixed up/down
      expect(validation.warnings).toContain('Mixed up() and down() breakpoints detected');

      // Convert specific breakpoint
      const conversion = breakpointMapper.convertBreakpointStyles(
        "[theme.breakpoints.up('md')]",
        extracted.breakpointStyles["[theme.breakpoints.up('md')]"],
        ['p-4', 'm-2', 'grid']
      );
      expect(conversion.classes).toEqual(['md:p-4', 'md:m-2', 'md:grid']);
      expect(conversion.warnings).toEqual([]);
    });

    it('should handle edge cases with malformed breakpoint keys', () => {
      const malformedKeys = [
        "[theme.breakpoints.up('')]",
        "[theme.breakpoints.up(md)]", // Missing quotes
        "[theme.breakpoints.up('md'", // Missing closing bracket
        "theme.breakpoints.up('md')]", // Missing opening bracket
      ];

      malformedKeys.forEach((key) => {
        const result = breakpointMapper.convertBreakpointStyles(key, {}, ['test']);
        expect(result.classes).toEqual(['test']);
        expect(result.warnings).toHaveLength(1);
      });
    });

    it('should preserve original classes on conversion failure', () => {
      const originalClasses = ['flex', 'p-4', 'text-center'];
      
      const result = breakpointMapper.convertBreakpointStyles(
        'invalid-key',
        { display: 'flex' },
        originalClasses
      );
      
      expect(result.classes).toEqual(originalClasses);
      expect(result.warnings).toHaveLength(1);
    });
  });

  describe('custom breakpoints integration', () => {
    it('should work with custom breakpoint mapping', () => {
      const customBreakpoints: Partial<BreakpointMapping> = {
        xs: 0,
        sm: 576,
        md: 768,
        lg: 992,
        xl: 1200,
        xxl: 1400,
      };

      const customMapper = new BreakpointMapper(customBreakpoints);
      
      // Should still work with standard operations
      expect(customMapper.isBreakpoint("[theme.breakpoints.up('md')]")).toBe(true);
      
      const result = customMapper.convertBreakpointStyles(
        "[theme.breakpoints.up('xl')]",
        { display: 'flex' },
        ['flex']
      );
      
      expect(result.classes).toEqual(['xl:flex']);
      expect(result.warnings).toEqual([]);
    });
  });
});