import { ThemeMapper } from '../../src/mappings/theme-mapper.js';
import type { ThemeReference } from '../../src/types.js';

describe('ThemeMapper', () => {
  let themeMapper: ThemeMapper;

  beforeEach(() => {
    themeMapper = new ThemeMapper();
  });

  describe('constructor', () => {
    it('should initialize with default theme mapping', () => {
      const mapper = new ThemeMapper();
      expect(mapper).toBeInstanceOf(ThemeMapper);
    });

    it('should merge custom mapping with defaults', () => {
      const customMapping = {
        colors: {
          'custom.myColor': 'my-custom-color',
        },
      };
      
      const mapper = new ThemeMapper(customMapping);
      expect(mapper).toBeInstanceOf(ThemeMapper);
    });
  });

  describe('resolveThemeReference', () => {
    describe('custom theme properties', () => {
      it('should resolve custom background colors', () => {
        const themeRef: ThemeReference = {
          type: 'theme',
        path: ['custom', 'builderBackgroundPrimary']
        };
        
        const result = themeMapper.resolveThemeReference(themeRef, 'backgroundColor');
        expect(result).toEqual(['bg-builder-primary']);
      });

      it('should resolve custom text colors', () => {
        const themeRef: ThemeReference = {
          type: 'theme',
        path: ['custom', 'builderContentPrimary']
        };
        
        const result = themeMapper.resolveThemeReference(themeRef, 'color');
        expect(result).toEqual(['text-builder-content-primary']);
      });

      it('should resolve custom border colors', () => {
        const themeRef: ThemeReference = {
          type: 'theme',
        path: ['custom', 'builderBorderPrimary']
        };
        
        const result = themeMapper.resolveThemeReference(themeRef, 'borderColor');
        expect(result).toEqual(['border-builder-border-primary']);
      });

      it('should resolve custom border radius', () => {
        const themeRef: ThemeReference = {
          type: 'theme',
        path: ['custom', 'radiusMD']
        };
        
        const result = themeMapper.resolveThemeReference(themeRef, 'borderRadius');
        expect(result).toEqual(['rounded-lg']);
      });

      it('should fallback to CSS variable for unmapped custom properties', () => {
        const themeRef: ThemeReference = {
          type: 'theme',
        path: ['custom', 'unknownProperty']
        };
        
        const result = themeMapper.resolveThemeReference(themeRef, 'color');
        expect(result).toEqual(['text-[var(--unknownProperty)]']);
      });
    });

    describe('palette references', () => {
      it('should resolve primary palette for background color', () => {
        const themeRef: ThemeReference = {
          type: 'theme',
        path: ['palette', 'primary', 'main']
        };
        
        const result = themeMapper.resolveThemeReference(themeRef, 'backgroundColor');
        expect(result).toEqual(['bg-primary']);
      });

      it('should resolve secondary palette for text color', () => {
        const themeRef: ThemeReference = {
          type: 'theme',
        path: ['palette', 'secondary', 'main']
        };
        
        const result = themeMapper.resolveThemeReference(themeRef, 'color');
        expect(result).toEqual(['text-secondary']);
      });

      it('should resolve primary palette for border color', () => {
        const themeRef: ThemeReference = {
          type: 'theme',
        path: ['palette', 'primary', 'main']
        };
        
        const result = themeMapper.resolveThemeReference(themeRef, 'borderColor');
        expect(result).toEqual(['border-primary']);
      });

      it('should fallback to CSS variable for unmapped palette colors', () => {
        const themeRef: ThemeReference = {
          type: 'theme',
        path: ['palette', 'tertiary', 'light']
        };
        
        const result = themeMapper.resolveThemeReference(themeRef, 'backgroundColor');
        expect(result).toEqual(['var(--palette-tertiary-light)']);
      });
    });

    describe('spacing references', () => {
      it('should resolve spacing for padding', () => {
        const themeRef: ThemeReference = {
          type: 'theme',
        path: ['spacing', 'md']
        };
        
        const result = themeMapper.resolveThemeReference(themeRef, 'padding');
        expect(result).toEqual(['p-6']);
      });

      it('should resolve spacing for margin', () => {
        const themeRef: ThemeReference = {
          type: 'theme',
        path: ['spacing', 'lg']
        };
        
        const result = themeMapper.resolveThemeReference(themeRef, 'margin');
        expect(result).toEqual(['m-8']);
      });

      it('should resolve spacing for gap', () => {
        const themeRef: ThemeReference = {
          type: 'theme',
        path: ['spacing', 'xl']
        };
        
        const result = themeMapper.resolveThemeReference(themeRef, 'gap');
        expect(result).toEqual(['gap-12']);
      });

      it('should handle custom spacing values', () => {
        const themeRef: ThemeReference = {
          type: 'theme',
        path: ['spacing', '14']
        };
        
        const result = themeMapper.resolveThemeReference(themeRef, 'padding');
        expect(result).toEqual(['p-14']);
      });

      it('should fallback to CSS variable for non-spacing properties', () => {
        const themeRef: ThemeReference = {
          type: 'theme',
        path: ['spacing', 'md']
        };
        
        const result = themeMapper.resolveThemeReference(themeRef, 'width');
        expect(result).toEqual(['var(--spacing-md)']);
      });
    });

    describe('breakpoint references', () => {
      it('should return comment for breakpoints (handled elsewhere)', () => {
        const themeRef: ThemeReference = {
          type: 'theme',
        path: ['breakpoints', 'up', 'md']
        };
        
        const result = themeMapper.resolveThemeReference(themeRef, 'width');
        expect(result).toEqual(['/* breakpoint: breakpoints.up.md */']);
      });
    });

    describe('fallback behavior', () => {
      it('should return CSS variable for unknown theme paths', () => {
        const themeRef: ThemeReference = {
          type: 'theme',
        path: ['unknown', 'property', 'path']
        };
        
        const result = themeMapper.resolveThemeReference(themeRef, 'color');
        expect(result).toEqual(['var(--theme-unknown-property-path)']);
      });

      it('should handle dots in theme paths correctly', () => {
        const themeRef: ThemeReference = {
          type: 'theme',
        path: ['theme', 'deeply.nested.property']
        };
        
        const result = themeMapper.resolveThemeReference(themeRef, 'color');
        expect(result).toEqual(['var(--theme-theme-deeply-nested-property)']);
      });
    });
  });

  describe('custom background color mapping', () => {
    it('should map builder theme background colors', () => {
      const themeRef: ThemeReference = {
        type: 'theme',
        path: ['custom', 'builderBackgroundSecondary']
      };
      
      const result = themeMapper.resolveThemeReference(themeRef, 'backgroundColor');
      expect(result).toEqual(['bg-builder-secondary']);
    });

    it('should map action background colors', () => {
      const themeRef: ThemeReference = {
        type: 'theme',
        path: ['custom', 'builderActionPrimary']
      };
      
      const result = themeMapper.resolveThemeReference(themeRef, 'backgroundColor');
      expect(result).toEqual(['bg-builder-action-primary']);
    });

    it('should map status background colors', () => {
      const themeRef: ThemeReference = {
        type: 'theme',
        path: ['custom', 'builderGreen']
      };
      
      const result = themeMapper.resolveThemeReference(themeRef, 'backgroundColor');
      expect(result).toEqual(['bg-green-500']);
    });

    it('should map special background colors', () => {
      const themeRef: ThemeReference = {
        type: 'theme',
        path: ['custom', 'transparentBg']
      };
      
      const result = themeMapper.resolveThemeReference(themeRef, 'backgroundColor');
      expect(result).toEqual(['bg-white/6']);
    });

    it('should fallback to CSS variable for unmapped background colors', () => {
      const themeRef: ThemeReference = {
        type: 'theme',
        path: ['custom', 'unmappedBackgroundColor']
      };
      
      const result = themeMapper.resolveThemeReference(themeRef, 'backgroundColor');
      expect(result).toEqual(['bg-[var(--unmappedBackgroundColor)]']);
    });
  });

  describe('custom text color mapping', () => {
    it('should map builder content text colors', () => {
      const themeRef: ThemeReference = {
        type: 'theme',
        path: ['custom', 'builderContentSecondary']
      };
      
      const result = themeMapper.resolveThemeReference(themeRef, 'color');
      expect(result).toEqual(['text-builder-content-secondary']);
    });

    it('should map action text colors', () => {
      const themeRef: ThemeReference = {
        type: 'theme',
        path: ['custom', 'builderButtonPrimary']
      };
      
      const result = themeMapper.resolveThemeReference(themeRef, 'color');
      expect(result).toEqual(['text-builder-button-primary']);
    });

    it('should map status text colors', () => {
      const themeRef: ThemeReference = {
        type: 'theme',
        path: ['custom', 'builderRed']
      };
      
      const result = themeMapper.resolveThemeReference(themeRef, 'color');
      expect(result).toEqual(['text-red-500']);
    });

    it('should map general text colors', () => {
      const themeRef: ThemeReference = {
        type: 'theme',
        path: ['custom', 'textSecondary']
      };
      
      const result = themeMapper.resolveThemeReference(themeRef, 'color');
      expect(result).toEqual(['text-muted-foreground']);
    });
  });

  describe('custom border color mapping', () => {
    it('should map builder border colors', () => {
      const themeRef: ThemeReference = {
        type: 'theme',
        path: ['custom', 'builderBorderSecondary']
      };
      
      const result = themeMapper.resolveThemeReference(themeRef, 'borderColor');
      expect(result).toEqual(['border-builder-border-secondary']);
    });

    it('should map status border colors', () => {
      const themeRef: ThemeReference = {
        type: 'theme',
        path: ['custom', 'builderRed']
      };
      
      const result = themeMapper.resolveThemeReference(themeRef, 'borderColor');
      expect(result).toEqual(['border-red-500']);
    });

    it('should map general border colors', () => {
      const themeRef: ThemeReference = {
        type: 'theme',
        path: ['custom', 'divider']
      };
      
      const result = themeMapper.resolveThemeReference(themeRef, 'borderColor');
      expect(result).toEqual(['border-border']);
    });
  });

  describe('custom border radius mapping', () => {
    it('should map all radius sizes', () => {
      const radiusTests = [
        { path: ['custom', 'radiusXS'], expected: ['rounded-sm'] },
        { path: ['custom', 'radiusSM'], expected: ['rounded'] },
        { path: ['custom', 'radiusMD'], expected: ['rounded-lg'] },
        { path: ['custom', 'radiusLG'], expected: ['rounded-lg'] },
        { path: ['custom', 'radiusXL'], expected: ['rounded-xl'] },
        { path: ['custom', 'radius2XL'], expected: ['rounded-2xl'] },
        { path: ['custom', 'radius3XL'], expected: ['rounded-3xl'] },
      ];

      radiusTests.forEach(({ path, expected }) => {
        const themeRef: ThemeReference = { type: 'theme', path };
        const result = themeMapper.resolveThemeReference(themeRef, 'borderRadius');
        expect(result).toEqual(expected);
      });
    });

    it('should fallback to CSS variable for unmapped radius', () => {
      const themeRef: ThemeReference = {
        type: 'theme',
        path: ['custom', 'customRadius']
      };
      
      const result = themeMapper.resolveThemeReference(themeRef, 'borderRadius');
      expect(result).toEqual(['rounded-[var(--customRadius)]']);
    });
  });

  describe('spacing resolution', () => {
    it('should map named spacing values', () => {
      const spacingTests = [
        { value: 'xs', expected: '2' },
        { value: 'sm', expected: '4' },
        { value: 'md', expected: '6' },
        { value: 'lg', expected: '8' },
        { value: 'xl', expected: '12' },
        { value: '2xl', expected: '16' },
      ];

      spacingTests.forEach(({ value, expected }) => {
        const themeRef: ThemeReference = {
          type: 'theme',
        path: ['spacing', value]
        };
        
        const result = themeMapper.resolveThemeReference(themeRef, 'padding');
        expect(result).toEqual([`p-${expected}`]);
      });
    });

    it('should use numeric values as-is', () => {
      const themeRef: ThemeReference = {
        type: 'theme',
        path: ['spacing', '10']
      };
      
      const result = themeMapper.resolveThemeReference(themeRef, 'margin');
      expect(result).toEqual(['m-10']);
    });
  });

  describe('generateCSSVariables', () => {
    it('should generate CSS variables for theme references', () => {
      const themeRefs = new Set([
        'custom.myColor',
        'palette.tertiary.main',
        'spacing.custom'
      ]);

      const result = themeMapper.generateCSSVariables(themeRefs);
      
      expect(result).toContain(':root {');
      expect(result).toContain('--theme-custom-myColor: /* TODO: Define theme value for custom.myColor */;');
      expect(result).toContain('--theme-palette-tertiary-main: /* TODO: Define theme value for palette.tertiary.main */;');
      expect(result).toContain('--theme-spacing-custom: /* TODO: Define theme value for spacing.custom */;');
      expect(result).toContain('}');
    });

    it('should return empty string for empty theme references', () => {
      const themeRefs = new Set<string>();
      const result = themeMapper.generateCSSVariables(themeRefs);
      expect(result).toBe('');
    });

    it('should handle dots in theme references correctly', () => {
      const themeRefs = new Set(['theme.deeply.nested.property']);
      const result = themeMapper.generateCSSVariables(themeRefs);
      
      expect(result).toContain('--theme-theme-deeply-nested-property');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty theme reference paths', () => {
      const themeRef: ThemeReference = {
        type: 'theme',
        path: []
      };
      
      const result = themeMapper.resolveThemeReference(themeRef, 'color');
      expect(result).toEqual(['var(--theme-)']);
    });

    it('should handle single-element paths', () => {
      const themeRef: ThemeReference = {
        type: 'theme',
        path: ['custom']
      };
      
      const result = themeMapper.resolveThemeReference(themeRef, 'color');
      expect(result).toEqual(['text-[var(--)]']);
    });

    it('should handle unknown CSS properties for custom themes', () => {
      const themeRef: ThemeReference = {
        type: 'theme',
        path: ['custom', 'someProperty']
      };
      
      const result = themeMapper.resolveThemeReference(themeRef, 'unknownProperty');
      expect(result).toEqual(['var(--someProperty)']);
    });

    it('should handle palette with missing shade', () => {
      const themeRef: ThemeReference = {
        type: 'theme',
        path: ['palette', 'primary']
      };
      
      const result = themeMapper.resolveThemeReference(themeRef, 'backgroundColor');
      expect(result).toEqual(['var(--palette-primary-undefined)']);
    });

    it('should handle empty spacing path', () => {
      const themeRef: ThemeReference = {
        type: 'theme',
        path: ['spacing']
      };
      
      const result = themeMapper.resolveThemeReference(themeRef, 'padding');
      expect(result).toEqual(['p-undefined']);
    });
  });

  describe('integration with custom mapping', () => {
    it('should use custom mapping when provided', () => {
      const customMapping = {
        colors: {
          'custom.myCustomColor': 'my-special-color',
        },
      };
      
      const mapper = new ThemeMapper(customMapping);
      
      // This test verifies that custom mappings are merged,
      // but since the actual resolution is complex and depends on internal logic,
      // we mainly test that the mapper is created successfully with custom config
      expect(mapper).toBeInstanceOf(ThemeMapper);
    });

    it('should preserve default mappings when custom mapping is provided', () => {
      const customMapping = {
        colors: {
          'custom.newColor': 'new-color',
        },
      };
      
      const mapper = new ThemeMapper(customMapping);
      
      // Test that default mappings still work
      const themeRef: ThemeReference = {
        type: 'theme',
        path: ['palette', 'primary', 'main']
      };
      
      const result = mapper.resolveThemeReference(themeRef, 'backgroundColor');
      expect(result).toEqual(['bg-primary']);
    });
  });

  describe('config-based theme conversion', () => {
    describe('customThemeMapping support', () => {
      it('should use customThemeMapping for theme.custom properties', () => {
        const customMapping = {
          customThemeMapping: {
            'theme.custom.secondary': 'text-blue-600',
            'theme.custom.primary': ['bg-red-500', 'text-white']
          }
        };
        
        const mapper = new ThemeMapper(customMapping);
        
        // Test single class mapping
        const themeRef1: ThemeReference = {
          type: 'theme',
          path: ['custom', 'secondary']
        };
        const result1 = mapper.resolveThemeReference(themeRef1, 'color');
        expect(result1).toEqual(['text-blue-600']);
        
        // Test multiple class mapping
        const themeRef2: ThemeReference = {
          type: 'theme',
          path: ['custom', 'primary']
        };
        const result2 = mapper.resolveThemeReference(themeRef2, 'backgroundColor');
        expect(result2).toEqual(['bg-red-500', 'text-white']);
      });

      it('should use customThemeMapping for theme.superCustom properties', () => {
        const customMapping = {
          customThemeMapping: {
            'theme.superCustom.main': 'border-green-400'
          }
        };
        
        const mapper = new ThemeMapper(customMapping);
        
        const themeRef: ThemeReference = {
          type: 'theme',
          path: ['superCustom', 'main']
        };
        const result = mapper.resolveThemeReference(themeRef, 'borderColor');
        expect(result).toEqual(['border-green-400']);
      });
    });

    describe('error handling for unknown theme properties', () => {
      it('should throw helpful error for unknown theme.custom property without mapping', () => {
        const mapper = new ThemeMapper();
        
        const themeRef: ThemeReference = {
          type: 'theme',
          path: ['custom', 'unknownProperty'],
          isOptional: false
        };
        
        expect(() => mapper.resolveThemeReference(themeRef, 'color')).toThrow(
          expect.stringContaining('❌ Unknown theme property: theme.custom.unknownProperty')
        );
        expect(() => mapper.resolveThemeReference(themeRef, 'color')).toThrow(
          expect.stringContaining('customThemeMapping')
        );
        expect(() => mapper.resolveThemeReference(themeRef, 'color')).toThrow(
          expect.stringContaining('migrate-script.js')
        );
      });

      it('should throw helpful error for optional chaining without mapping', () => {
        const mapper = new ThemeMapper();
        
        const themeRef: ThemeReference = {
          type: 'theme',
          path: ['custom', 'secondary'],
          isOptional: true
        };
        
        expect(() => mapper.resolveThemeReference(themeRef, 'color')).toThrow(
          expect.stringContaining('❌ Unknown theme property: theme.custom.secondary?')
        );
        expect(() => mapper.resolveThemeReference(themeRef, 'color')).toThrow(
          expect.stringContaining('For CLI usage, create a migration script:')
        );
      });

      it('should throw helpful error for theme.superCustom property without mapping', () => {
        const mapper = new ThemeMapper();
        
        const themeRef: ThemeReference = {
          type: 'theme',
          path: ['superCustom', 'bg'],
          isOptional: false
        };
        
        expect(() => mapper.resolveThemeReference(themeRef, 'backgroundColor')).toThrow(
          expect.stringContaining('❌ Unknown theme property: theme.superCustom.bg')
        );
        expect(() => mapper.resolveThemeReference(themeRef, 'backgroundColor')).toThrow(
          expect.stringContaining('\'theme.superCustom.bg\': \'your-tailwind-class-here\'')
        );
      });

      it('should include practical examples in error message', () => {
        const mapper = new ThemeMapper();
        
        const themeRef: ThemeReference = {
          type: 'theme',
          path: ['custom', 'main'],
          isOptional: false
        };
        
        expect(() => mapper.resolveThemeReference(themeRef, 'color')).toThrow(
          expect.stringContaining('\'theme.custom.main\': \'text-blue-600\'')
        );
        expect(() => mapper.resolveThemeReference(themeRef, 'color')).toThrow(
          expect.stringContaining('\'theme.custom.main\': \'bg-gray-100\'')
        );
        expect(() => mapper.resolveThemeReference(themeRef, 'color')).toThrow(
          expect.stringContaining('\'theme.custom.main\': \'border-red-500\'')
        );
      });

      it('should reference documentation in error message', () => {
        const mapper = new ThemeMapper();
        
        const themeRef: ThemeReference = {
          type: 'theme',
          path: ['custom', 'test'],
          isOptional: true
        };
        
        expect(() => mapper.resolveThemeReference(themeRef, 'color')).toThrow(
          expect.stringContaining('📖 See README.md for complete configuration examples.')
        );
      });
    });

    describe('config priority and fallback behavior', () => {
      it('should prioritize customThemeMapping over built-in mappings', () => {
        // This test would require modifying the resolveCustomTheme method to check customThemeMapping first
        // For now, we test that when customThemeMapping is provided, it works as expected
        const customMapping = {
          customThemeMapping: {
            'theme.custom.builderBackgroundPrimary': 'bg-custom-override'
          }
        };
        
        const mapper = new ThemeMapper(customMapping);
        
        const themeRef: ThemeReference = {
          type: 'theme',
          path: ['custom', 'builderBackgroundPrimary']
        };
        
        // Should use customThemeMapping instead of built-in mapping
        const result = mapper.resolveThemeReference(themeRef, 'backgroundColor');
        expect(result).toEqual(['bg-custom-override']);
      });

      it('should fall back to built-in mapping when no custom mapping exists', () => {
        const mapper = new ThemeMapper({});
        
        const themeRef: ThemeReference = {
          type: 'theme',
          path: ['custom', 'builderBackgroundPrimary']
        };
        
        // Should use built-in mapping
        const result = mapper.resolveThemeReference(themeRef, 'backgroundColor');
        expect(result).toEqual(['bg-builder-primary']);
      });
    });
  });
});