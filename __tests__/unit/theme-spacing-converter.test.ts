import { StyleConverter } from '../../src/converter.js';
import type { CSSProperties } from '../../src/types.js';

describe('Theme Spacing Converter', () => {
  let converter: StyleConverter;

  beforeEach(() => {
    converter = new StyleConverter();
  });

  describe('theme.spacing() to Tailwind conversion', () => {
    test('should convert theme.spacing(0) to p-0', () => {
      const styles: CSSProperties = {
        padding: '0px',
      };
      
      const result = converter.convertStyles(styles);
      
      expect(result.tailwindClasses).toContain('p-0');
      expect(result.warnings).toHaveLength(0);
      expect(result.unconvertible).toHaveLength(0);
    });

    test('should convert theme.spacing(1) to p-2', () => {
      const styles: CSSProperties = {
        padding: '8px',
      };
      
      const result = converter.convertStyles(styles);
      
      expect(result.tailwindClasses).toContain('p-2');
      expect(result.warnings).toHaveLength(0);
      expect(result.unconvertible).toHaveLength(0);
    });

    test('should convert theme.spacing(3) to p-6', () => {
      const styles: CSSProperties = {
        padding: '24px',
      };
      
      const result = converter.convertStyles(styles);
      
      expect(result.tailwindClasses).toContain('p-6');
      expect(result.warnings).toHaveLength(0);
      expect(result.unconvertible).toHaveLength(0);
    });

    test('should convert theme.spacing(8) to p-16', () => {
      const styles: CSSProperties = {
        padding: '64px',
      };
      
      const result = converter.convertStyles(styles);
      
      expect(result.tailwindClasses).toContain('p-16');
      expect(result.warnings).toHaveLength(0);
      expect(result.unconvertible).toHaveLength(0);
    });

    test('should convert different spacing properties correctly', () => {
      const styles: CSSProperties = {
        padding: '24px',      // theme.spacing(3) -> p-6
        margin: '16px',       // theme.spacing(2) -> m-4
        paddingTop: '8px',    // theme.spacing(1) -> pt-2
        paddingRight: '32px', // theme.spacing(4) -> pr-8
        paddingBottom: '40px', // theme.spacing(5) -> pb-10
        paddingLeft: '48px',  // theme.spacing(6) -> pl-12
        marginTop: '56px',    // theme.spacing(7) -> mt-14
        marginRight: '64px',  // theme.spacing(8) -> mr-16
        marginBottom: '72px', // theme.spacing(9) -> mb-18 (arbitrary)
        marginLeft: '80px',   // theme.spacing(10) -> ml-20
      };
      
      const result = converter.convertStyles(styles);
      
      expect(result.tailwindClasses).toContain('p-6');
      expect(result.tailwindClasses).toContain('m-4');
      expect(result.tailwindClasses).toContain('pt-2');
      expect(result.tailwindClasses).toContain('pr-8');
      expect(result.tailwindClasses).toContain('pb-10');
      expect(result.tailwindClasses).toContain('pl-12');
      expect(result.tailwindClasses).toContain('mt-14');
      expect(result.tailwindClasses).toContain('mr-16');
      expect(result.tailwindClasses).toContain('mb-[72px]'); // Arbitrary value
      expect(result.tailwindClasses).toContain('ml-20');
    });

    test('should handle theme-spacing type with dynamic multipliers', () => {
      const styles: CSSProperties = {
        padding: {
          type: 'theme-spacing',
          multiplier: {
            type: 'conditional',
            condition: '{condition}',
            consequent: 4,
            alternate: 2
          }
        } as any,
      };
      
      const result = converter.convertStyles(styles);
      
      expect(result.tailwindClasses).toHaveLength(0);
      expect(result.unconvertible).toHaveLength(1);
      expect(result.unconvertible[0].property).toBe('padding');
      expect(result.unconvertible[0].value).toBe('theme.spacing(conditional(4 | 2))');
      expect(result.unconvertible[0].reason).toBe('Dynamic theme.spacing() call');
    });

    test('should handle mixed convertible and unconvertible spacing', () => {
      const styles: CSSProperties = {
        padding: '24px', // Convertible
        margin: {
          type: 'theme-spacing',
          multiplier: 'prop(dynamicSpacing)'
        } as any, // Unconvertible
        display: 'flex', // Convertible
      };
      
      const result = converter.convertStyles(styles);
      
      expect(result.tailwindClasses).toContain('p-6');
      expect(result.tailwindClasses).toContain('flex');
      expect(result.unconvertible).toHaveLength(1);
      expect(result.unconvertible[0].property).toBe('margin');
    });
  });
});
