import { StyleConverter } from '../../src/converter.js';
import type { CSSProperties } from '../../src/types.js';

describe('StyleConverter', () => {
  let converter: StyleConverter;

  beforeEach(() => {
    converter = new StyleConverter();
  });

  describe('constructor', () => {
    it('should initialize with default mappers', () => {
      const defaultConverter = new StyleConverter();
      expect(defaultConverter).toBeInstanceOf(StyleConverter);
    });

    it('should accept custom theme and breakpoint mappings', () => {
      const customConverter = new StyleConverter(
        { colors: { 'custom.primary': 'blue-500' } },
        { xxl: 1440 }
      );
      expect(customConverter).toBeInstanceOf(StyleConverter);
    });
  });

  describe('convertStyles', () => {
    it('should convert basic CSS properties', () => {
      const styles: CSSProperties = {
        display: 'flex',
        padding: '16px',
      };

      const result = converter.convertStyles(styles);

      expect(result.tailwindClasses).toEqual(expect.arrayContaining(['flex', 'p-4']));
      expect(result.warnings).toEqual([]);
      expect(result.unconvertible).toEqual([]);
    });

    // A1: Partial-Conversion Guarantee Unit Test
    it('should handle mixed convertible and unconvertible properties', () => {
      const styles: CSSProperties = {
        display: 'flex',           // convertible → flex
        padding: '16px',           // convertible → p-4
        animation: 'fadeIn 0.3s',  // unconvertible
        transform: 'rotate(45deg)', // unconvertible
        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)', // unconvertible
      };

      const result = converter.convertStyles(styles);

      // Should convert the convertible properties
      expect(result.tailwindClasses).toEqual(expect.arrayContaining(['flex', 'p-4']));
      
      // Should mark unconvertible properties as such
      expect(result.unconvertible).toHaveLength(3);
      expect(result.unconvertible.map(u => u.property)).toEqual(
        expect.arrayContaining(['animation', 'transform', 'clipPath'])
      );
      
      // Should preserve all original styles
      expect(result.original).toEqual(styles);
      
      // Unconvertible properties should have proper reasons
      const animationUnconvertible = result.unconvertible.find(u => u.property === 'animation');
      expect(animationUnconvertible).toMatchObject({
        property: 'animation',
        value: 'fadeIn 0.3s',
        reason: 'No Tailwind equivalent found',
        manualAction: expect.any(String)
      });
    });

    // A2: Vendor-Prefix Handling Tests
    it('should handle webkit vendor prefixes correctly', () => {
      const styles: CSSProperties = {
        WebkitLineClamp: '3',
        WebkitBoxOrient: 'vertical',
        WebkitOverflowScrolling: 'touch',
        display: 'flex', // regular property for comparison
      };

      const result = converter.convertStyles(styles);

      // Should convert regular properties
      expect(result.tailwindClasses).toContain('flex');
      
      // Should handle vendor prefixes by converting them to arbitrary values or preserving them
      const hasArbitraryOrUnconvertible = result.tailwindClasses.some(cls => 
        cls.includes('[-webkit-') || cls.includes('[webkit')
      ) || result.unconvertible.some(u => u.property.startsWith('Webkit'));
      expect(hasArbitraryOrUnconvertible).toBe(true);
      
      // Verify vendor prefixes are preserved in some form
      expect(result.original).toEqual(styles);
    });

    it('should handle @supports rules with vendor prefixes', () => {
      const styles: CSSProperties = {
        '@supports (-webkit-touch-callout: none)': {
          paddingBottom: 'env(safe-area-inset-bottom)',
        } as any,
        display: 'grid',
      };

      const result = converter.convertStyles(styles);

      // Should convert regular properties  
      expect(result.tailwindClasses).toContain('grid');
      
      // @supports should be marked as unconvertible
      const supportsRule = result.unconvertible.find(u => u.property.includes('@supports'));
      expect(supportsRule).toBeDefined();
      expect(supportsRule?.reason).toContain('at-rules');
    });

    // A4: CSS Variables & calc() Tests
    it('should preserve CSS variables and calc() expressions', () => {
      const styles: CSSProperties = {
        width: 'var(--sidebar-width)',
        height: 'calc(100vh - var(--header-height))',
        margin: 'calc(100% - var(--gap))',
        display: 'flex', // convertible for comparison
      };

      const result = converter.convertStyles(styles);

      // Should convert regular properties
      expect(result.tailwindClasses).toContain('flex');
      
      // CSS variables and calc() properties should be either converted to arbitrary values or unconvertible
      const cssVarHandled = result.tailwindClasses.some(cls => 
        cls.includes('var(') || cls.includes('calc(')
      ) || result.unconvertible.some(u => 
        u.value && (u.value.toString().includes('var(') || u.value.toString().includes('calc('))
      );
      
      expect(cssVarHandled).toBe(true);
      
      // Should preserve original values exactly
      expect(result.original.width).toBe('var(--sidebar-width)');
      expect(result.original.height).toBe('calc(100vh - var(--header-height))');
    });

    it('should handle complex calc() with multiple variables', () => {
      const styles: CSSProperties = {
        padding: 'calc(var(--spacing) * 2 + 1rem)',
        gridTemplateColumns: 'calc(100% - var(--sidebar)) minmax(0, 1fr)',
      };

      const result = converter.convertStyles(styles);

      // Both properties should be handled (either as arbitrary values or unconvertible)
      expect(result.original).toEqual(styles);
      
      // Should not crash or lose data
      expect(result.tailwindClasses).toEqual(expect.any(Array));
      expect(result.unconvertible).toEqual(expect.any(Array));
    });

    // A5: Dark-Mode & Arbitrary Variants Tests  
    it('should handle media queries and dark mode', () => {
      const styles: CSSProperties = {
        color: '#333',
        '@media (prefers-color-scheme: dark)': {
          color: '#fff',
          backgroundColor: '#000',
        } as any,
        display: 'block',
      };

      const result = converter.convertStyles(styles);

      // Should convert regular properties
      expect(result.tailwindClasses).toContain('block');
      
      // Media query should be marked as unconvertible with specific guidance
      const mediaQuery = result.unconvertible.find(u => u.property.includes('@media'));
      expect(mediaQuery).toBeDefined();
      expect(mediaQuery?.reason).toContain('at-rules');
    });

    it('should handle arbitrary color values', () => {
      const styles: CSSProperties = {
        backgroundColor: '#123abc',
        borderColor: 'rgb(255, 0, 128)',
        color: 'hsl(240, 100%, 50%)',
        display: 'flex',
      };

      const result = converter.convertStyles(styles);

      // Should convert regular properties
      expect(result.tailwindClasses).toContain('flex');
      
      // Arbitrary colors should be converted to Tailwind arbitrary values or preserved
      const hasArbitraryValues = result.tailwindClasses.some(cls => 
        cls.includes('[#') || cls.includes('[rgb') || cls.includes('[hsl')
      ) || result.unconvertible.some(u => 
        ['backgroundColor', 'borderColor', 'color'].includes(u.property)
      );
      
      expect(hasArbitraryValues).toBe(true);
    });

    // A3: RTL/Direction-Sensitive Tests
    it('should handle RTL-aware margin and padding properties', () => {
      const styles: CSSProperties = {
        marginLeft: '16px',     // Should convert to ml-4 (LTR) or mr-4 (RTL)
        marginRight: '8px',     // Should convert to mr-2 (LTR) or ml-2 (RTL)
        paddingLeft: '24px',    // Should convert to pl-6 (LTR) or pr-6 (RTL)
        paddingRight: '12px',   // Should convert to pr-3 (LTR) or pl-3 (RTL)
        display: 'block',       // Regular property for comparison
      };

      const result = converter.convertStyles(styles);

      // Should convert regular properties
      expect(result.tailwindClasses).toContain('block');
      
      // Should convert directional properties
      const hasDirectionalClasses = result.tailwindClasses.some(cls => 
        cls.includes('ml-') || cls.includes('mr-') || 
        cls.includes('pl-') || cls.includes('pr-')
      );
      expect(hasDirectionalClasses).toBe(true);
      
      // Should preserve original values for potential RTL handling
      expect(result.original).toEqual(styles);
    });

    it('should handle left/right positioning properties', () => {
      const styles: CSSProperties = {
        left: '20px',           // Should convert to left-5 or be marked for RTL handling
        right: '10px',          // Should convert to right-2.5 or be marked for RTL handling
        textAlign: 'left' as any, // Should be handled with RTL awareness
        position: 'absolute',   // Regular property
      };

      const result = converter.convertStyles(styles);

      // Should convert regular properties
      expect(result.tailwindClasses).toContain('absolute');
      
      // Should handle directional properties appropriately
      const hasPositionalClasses = result.tailwindClasses.some(cls => 
        cls.includes('left-') || cls.includes('right-') || cls.includes('text-left')
      ) || result.unconvertible.some(u => 
        ['left', 'right', 'textAlign'].includes(u.property)
      );
      
      expect(hasPositionalClasses).toBe(true);
    });

    it('should handle border directional properties', () => {
      const styles: CSSProperties = {
        borderLeft: '1px solid #ccc',
        borderRight: '2px solid #000',
        borderLeftWidth: '3px',
        borderRightColor: '#red',
        borderTop: '1px solid blue',  // Non-directional for comparison
      };

      const result = converter.convertStyles(styles);

      // Should handle all border properties (either convert or mark as unconvertible)
      expect(result.original).toEqual(styles);
      
      // Should not crash or lose data
      expect(result.tailwindClasses).toEqual(expect.any(Array));
      expect(result.unconvertible).toEqual(expect.any(Array));
    });

    it('should handle edge cases with null/undefined values', () => {
      const styles: CSSProperties = {
        display: null as any,
        padding: undefined as any,
        margin: '',
      };

      const result = converter.convertStyles(styles);
      expect(result).toEqual({
        original: styles,
        tailwindClasses: expect.any(Array),
        warnings: expect.any(Array),
        unconvertible: expect.any(Array),
      });
    });

    it('should handle empty styles object', () => {
      const result = converter.convertStyles({});
      
      expect(result.tailwindClasses).toEqual([]);
      expect(result.warnings).toEqual([]);
      expect(result.unconvertible).toEqual([]);
    });

    it('should preserve original styles', () => {
      const originalStyles: CSSProperties = {
        display: 'flex',
        padding: '16px',
      };

      const result = converter.convertStyles(originalStyles);
      expect(result.original).toEqual(originalStyles);
    });
  });
});