import type { ThemeReference, CSSValue, ThemeMapping } from '../types.js';
import { CSS_TO_TAILWIND_MAP } from './css-to-tailwind.js';

/**
 * Maps theme references to Tailwind classes or CSS variables
 */
export class ThemeMapper {
  private themeMapping: ThemeMapping;

  constructor(customMapping?: Partial<ThemeMapping>) {
    this.themeMapping = {
      ...this.getDefaultThemeMapping(),
      ...customMapping,
    };
  }

  /**
   * Resolve theme reference to Tailwind class or CSS variable
   */
  public resolveThemeReference(themeRef: ThemeReference, cssProperty: string): string[] {
    const path = themeRef.path.join('.');
    const fullThemePath = `theme.${path}`;
    
    // FIRST: Check if we have a custom mapping for this exact theme path
    const customMapping = this.themeMapping.customThemeMapping;
    if (customMapping && customMapping[fullThemePath]) {
      const mappedValue = customMapping[fullThemePath];
      const baseValue = Array.isArray(mappedValue) ? mappedValue[0] : mappedValue;
      
      // Apply property-aware Tailwind class conversion for custom mappings
      return this.convertValueToTailwindClass(baseValue, cssProperty);
    }
    
    // Handle custom theme properties - try built-in mappings first
    if (themeRef.path[0] === 'custom') {
      try {
        return this.resolveCustomTheme(themeRef.path.slice(1), cssProperty);
      } catch (error) {
        // If built-in mapping failed and no custom mapping, throw helpful error
        const optionalIndicator = themeRef.isOptional ? '?' : '';
        throw new Error(
          `❌ Unknown theme property: ${fullThemePath}${optionalIndicator}

🔧 Create a config file to map this property:

1. Create mttwm.config.js in your project root:
// mttwm.config.js
export default {
  customThemeMapping: {
    '${fullThemePath}': 'your-tailwind-class-here'
  }
};

2. Run the migration again:
npx mttwm migrate --pattern "src/**/*.tsx" --dry-run

📝 Common mapping examples:
  - '${fullThemePath}': 'bg-blue-500' (background color)
  - '${fullThemePath}': 'text-gray-800' (text color)
  - '${fullThemePath}': 'border-red-400' (border color)
  - '${fullThemePath}': 'rounded-lg' (border radius)

📖 See README.md for more configuration examples.`
        );
      }
    }

    // Handle superCustom theme properties - these always require config
    if (themeRef.path[0] === 'superCustom') {
      const optionalIndicator = themeRef.isOptional ? '?' : '';
      throw new Error(
        `❌ Unknown theme property: ${fullThemePath}${optionalIndicator}

🔧 Create a config file to map this property:

1. Create mttwm.config.js in your project root:
// mttwm.config.js
export default {
  customThemeMapping: {
    '${fullThemePath}': 'your-tailwind-class-here'
  }
};

2. Run the migration again:
npx mttwm migrate --pattern "src/**/*.tsx" --dry-run

📝 Common mapping examples:
  - '${fullThemePath}': 'bg-blue-500' (background color)
  - '${fullThemePath}': 'text-gray-800' (text color)
  - '${fullThemePath}': 'border-red-400' (border color)
  - '${fullThemePath}': 'rounded-lg' (border radius)

📖 See README.md for more configuration examples.`
      );
    }

    // Handle palette references
    if (themeRef.path[0] === 'palette') {
      return this.resolvePalette(themeRef.path.slice(1), cssProperty);
    }

    // Handle breakpoints (handled by BreakpointConverter)
    if (themeRef.path[0] === 'breakpoints') {
      return [`/* breakpoint: ${path} */`];
    }

    // Handle spacing
    if (themeRef.path[0] === 'spacing') {
      return this.resolveSpacing(themeRef.path.slice(1), cssProperty);
    }

    // Fallback: use CSS variable with appropriate Tailwind prefix
    const cssVar = `var(--theme-${path.replace(/\./g, '-')})`;
    return this.convertValueToTailwindClass(cssVar, cssProperty);
  }

  private resolveCustomTheme(path: string[], cssProperty: string): string[] {
    const customProperty = path.join('.');
    
    // Map to specific Tailwind utilities based on CSS property
    const propertyMappings: Record<string, (customProp: string) => string[]> = {
      backgroundColor: (prop) => this.mapBackgroundColor(prop),
      color: (prop) => this.mapTextColor(prop),
      borderColor: (prop) => this.mapBorderColor(prop),
      borderRadius: (prop) => this.mapBorderRadius(prop),
    };

    const mapper = propertyMappings[cssProperty];
    if (mapper) {
      const result = mapper(customProperty);
      // Check if the mapping returned a fallback CSS variable (indicates no mapping found)
      if (result.length === 1 && result[0].startsWith(`${cssProperty === 'color' ? 'text' : cssProperty === 'backgroundColor' ? 'bg' : cssProperty === 'borderColor' ? 'border' : 'rounded'}-[var(--`)) {
        throw new Error(`No mapping found for custom property: ${customProperty}`);
      }
      return result;
    }

    // For unmapped CSS properties, throw error instead of fallback
    throw new Error(`No mapping found for custom property: ${customProperty}`);
  }

  private mapBackgroundColor(customProperty: string): string[] {
    const colorMappings: Record<string, string> = {
      // Builder theme colors
      'builderBackgroundPrimary': 'bg-builder-primary',
      'builderBackgroundSecondary': 'bg-builder-secondary',
      'builderBackgroundTertiary': 'bg-builder-tertiary',
      'builderSurfaceSecondary': 'bg-builder-surface-secondary',
      
      // Action colors
      'builderActionPrimary': 'bg-builder-action-primary',
      'builderActionSecondary': 'bg-builder-action-secondary',
      'builderActionPrimaryHover': 'bg-builder-action-primary-hover',
      
      // Status colors
      'builderGreen': 'bg-green-500',
      'builderRed': 'bg-red-500',
      'builderBlue': 'bg-blue-500',
      'builderYellow': 'bg-yellow-500',
      'builderGrey': 'bg-gray-500',
      
      // General colors
      'card': 'bg-card',
      'transparentBg': 'bg-white/6',
      'labelBackground': 'bg-white/6',
    };

    return colorMappings[customProperty] 
      ? [colorMappings[customProperty]]
      : [`bg-[var(--${customProperty.replace(/\./g, '-')})]`];
  }

  private mapTextColor(customProperty: string): string[] {
    const colorMappings: Record<string, string> = {
      // Content colors
      'builderContentPrimary': 'text-builder-content-primary',
      'builderContentSecondary': 'text-builder-content-secondary',
      'builderContentTertiary': 'text-builder-content-tertiary',
      'builderContentQuaternary': 'text-builder-content-quaternary',
      
      // Action text colors
      'builderActionText': 'text-builder-action-text',
      'builderButtonPrimary': 'text-builder-button-primary',
      
      // Status colors
      'builderGreen': 'text-green-500',
      'builderRed': 'text-red-500',
      'builderBlue': 'text-blue-500',
      
      // General
      'text': 'text-foreground',
      'textSecondary': 'text-muted-foreground',
    };

    return colorMappings[customProperty]
      ? [colorMappings[customProperty]]
      : [`text-[var(--${customProperty.replace(/\./g, '-')})]`];
  }

  private mapBorderColor(customProperty: string): string[] {
    const colorMappings: Record<string, string> = {
      'builderBorderPrimary': 'border-builder-border-primary',
      'builderBorderSecondary': 'border-builder-border-secondary',
      'builderRed': 'border-red-500',
      'divider': 'border-border',
      'headerBorder': 'border-border',
    };

    return colorMappings[customProperty]
      ? [colorMappings[customProperty]]
      : [`border-[var(--${customProperty.replace(/\./g, '-')})]`];
  }

  private mapBorderRadius(customProperty: string): string[] {
    const radiusMappings: Record<string, string> = {
      'radiusXS': 'rounded-sm', // 2px
      'radiusSM': 'rounded', // 4px  
      'radiusMD': 'rounded-lg', // 8px
      'radiusLG': 'rounded-lg', // 10px
      'radiusXL': 'rounded-xl', // 12px
      'radius2XL': 'rounded-2xl', // 16px
      'radius3XL': 'rounded-3xl', // 20px
    };

    return radiusMappings[customProperty]
      ? [radiusMappings[customProperty]]
      : [`rounded-[var(--${customProperty.replace(/\./g, '-')})]`];
  }

  private resolvePalette(path: string[], cssProperty: string): string[] {
    // Handle Material-UI palette: theme.palette.primary.main
    const [category, shade] = path;
    
    // Only use direct mappings when shade is provided
    if (shade && category === 'primary') {
      if (cssProperty === 'backgroundColor') return ['bg-primary'];
      if (cssProperty === 'color') return ['text-primary'];
      if (cssProperty === 'borderColor') return ['border-primary'];
    }
    
    if (shade && category === 'secondary') {
      if (cssProperty === 'backgroundColor') return ['bg-secondary'];
      if (cssProperty === 'color') return ['text-secondary'];
      if (cssProperty === 'borderColor') return ['border-secondary'];
    }

    // Fallback - use CSS variable with appropriate Tailwind prefix
    const cssVar = `var(--palette-${category}-${shade})`;
    return this.convertValueToTailwindClass(cssVar, cssProperty);
  }

  private resolveSpacing(path: string[], cssProperty: string): string[] {
    const spacingValue = path[0];
    
    // Common spacing values
    const spacingMap: Record<string, string> = {
      'xs': '2',
      'sm': '4', 
      'md': '6',
      'lg': '8',
      'xl': '12',
      '2xl': '16',
    };

    const tailwindValue = spacingMap[spacingValue] || spacingValue;

    // Map to appropriate CSS property
    if (cssProperty === 'padding') return [`p-${tailwindValue}`];
    if (cssProperty === 'margin') return [`m-${tailwindValue}`];
    if (cssProperty === 'gap') return [`gap-${tailwindValue}`];

    // Fallback - use CSS variable with appropriate Tailwind prefix  
    const cssVar = `var(--spacing-${spacingValue})`;
    return this.convertValueToTailwindClass(cssVar, cssProperty);
  }

  /**
   * Convert a custom mapped value to the appropriate Tailwind class based on CSS property
   */
  private convertValueToTailwindClass(value: string, cssProperty: string): string[] {
    // If the value already contains a Tailwind prefix, return as-is
    if (this.hasTailwindPrefix(value)) {
      return [value];
    }
    
    // For CSS variables, use existing CSS-to-Tailwind conversion logic
    if (value.startsWith('var(') || value.startsWith('env(') || value.startsWith('calc(')) {
      const converter = CSS_TO_TAILWIND_MAP[cssProperty];
      if (converter) {
        const result = converter(value);
        if (result.length > 0) {
          return result;
        }
      }
    }
    
    // For simple custom values (like 'main', 'primary', etc.), apply property-specific prefix directly
    const propertyPrefixes: Record<string, string> = {
      'color': 'text',
      'backgroundColor': 'bg',
      'borderColor': 'border',
      'borderTopColor': 'border-t',
      'borderRightColor': 'border-r',
      'borderBottomColor': 'border-b',
      'borderLeftColor': 'border-l',
      'fill': 'fill',
      'stroke': 'stroke',
    };
    
    const prefix = propertyPrefixes[cssProperty];
    if (prefix) {
      return [`${prefix}-${value}`];
    }
    
    // For unmapped properties, return the value as-is
    return [value];
  }
  
  /**
   * Check if a value already has a Tailwind prefix
   */
  private hasTailwindPrefix(value: string): boolean {
    const tailwindPrefixes = [
      'text-', 'bg-', 'border-', 'border-t-', 'border-r-', 'border-b-', 'border-l-',
      'fill-', 'stroke-', 'p-', 'm-', 'px-', 'py-', 'pt-', 'pr-', 'pb-', 'pl-',
      'mx-', 'my-', 'mt-', 'mr-', 'mb-', 'ml-', 'w-', 'h-', 'rounded-', 'shadow-',
      'font-', 'leading-', 'tracking-', 'opacity-', 'z-', 'gap-'
    ];
    
    return tailwindPrefixes.some(prefix => value.startsWith(prefix));
  }

  /**
   * Get default theme mapping configuration
   */
  private getDefaultThemeMapping(): ThemeMapping {
    return {
      colors: {
        // Material-UI defaults
        'palette.primary.main': 'primary',
        'palette.secondary.main': 'secondary',
        'palette.error.main': 'destructive',
        'palette.warning.main': 'warning',
        'palette.info.main': 'info',
        'palette.success.main': 'success',
        
        // Custom theme colors (will be mapped above)
        'custom.builderBackgroundPrimary': 'builder-primary',
        'custom.builderActionPrimary': 'builder-action-primary',
        'custom.card': 'card',
        'custom.text': 'foreground',
      },
      
      spacing: {
        'spacing.xs': '2',
        'spacing.sm': '4',
        'spacing.md': '6', 
        'spacing.lg': '8',
        'spacing.xl': '12',
        'spacing.2xl': '16',
      },
      
      borderRadius: {
        'custom.radiusXS': 'sm',
        'custom.radiusSM': '',
        'custom.radiusMD': 'lg',
        'custom.radiusLG': 'lg', 
        'custom.radiusXL': 'xl',
        'custom.radius2XL': '2xl',
        'custom.radius3XL': '3xl',
      },
      
      fontSize: {
        'typography.body1.fontSize': 'base',
        'typography.body2.fontSize': 'sm',
        'typography.h1.fontSize': '4xl',
        'typography.h2.fontSize': '3xl',
        'typography.h3.fontSize': '2xl',
        'typography.h4.fontSize': 'xl',
        'typography.h5.fontSize': 'lg',
        'typography.h6.fontSize': 'base',
      },
      
      fontWeight: {
        'typography.fontWeightLight': '300',
        'typography.fontWeightRegular': '400',
        'typography.fontWeightMedium': '500',
        'typography.fontWeightBold': '700',
      },
      
      lineHeight: {
        'typography.body1.lineHeight': 'normal',
        'typography.body2.lineHeight': 'normal',
      },
      
      boxShadow: {
        'shadows.1': 'sm',
        'shadows.2': '',
        'shadows.3': 'md', 
        'shadows.4': 'lg',
        'shadows.8': 'xl',
        'shadows.12': '2xl',
      },
      
      zIndex: {
        'zIndex.drawer': '40',
        'zIndex.modal': '50',
        'zIndex.snackbar': '50',
        'zIndex.tooltip': '50',
      },
    };
  }

  /**
   * Generate CSS variables for unconvertible theme references
   */
  public generateCSSVariables(themeRefs: Set<string>): string {
    const cssVars: string[] = [];
    
    for (const ref of themeRefs) {
      const varName = `--theme-${ref.replace(/\./g, '-')}`;
      cssVars.push(`  ${varName}: /* TODO: Define theme value for ${ref} */;`);
    }

    return cssVars.length > 0 
      ? `:root {\n${cssVars.join('\n')}\n}\n`
      : '';
  }
}