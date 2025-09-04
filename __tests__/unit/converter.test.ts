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