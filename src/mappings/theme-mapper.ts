import type { ThemeReference, CSSValue, ThemeMapping } from '../types.js';

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
    
    // Handle custom theme properties
    if (themeRef.path[0] === 'custom') {
      return this.resolveCustomTheme(themeRef.path.slice(1), cssProperty);
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

    // Fallback: use CSS variable
    return [`var(--theme-${path.replace(/\\./g, '-')})`];
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
      return mapper(customProperty);
    }

    // Fallback: use CSS variable
    return [`var(--${customProperty.replace(/\\./g, '-')})`];
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
      : [`bg-[var(--${customProperty.replace(/\\./g, '-')})]`];
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
      : [`text-[var(--${customProperty.replace(/\\./g, '-')})]`];
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
      : [`border-[var(--${customProperty.replace(/\\./g, '-')})]`];
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
      : [`rounded-[var(--${customProperty.replace(/\\./g, '-')})]`];
  }

  private resolvePalette(path: string[], cssProperty: string): string[] {
    // Handle Material-UI palette: theme.palette.primary.main
    const [category, shade] = path;
    
    if (category === 'primary') {
      if (cssProperty === 'backgroundColor') return ['bg-primary'];
      if (cssProperty === 'color') return ['text-primary'];
      if (cssProperty === 'borderColor') return ['border-primary'];
    }
    
    if (category === 'secondary') {
      if (cssProperty === 'backgroundColor') return ['bg-secondary'];
      if (cssProperty === 'color') return ['text-secondary'];
      if (cssProperty === 'borderColor') return ['border-secondary'];
    }

    // Fallback
    return [`var(--palette-${category}-${shade})`];
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

    return [`var(--spacing-${spacingValue})`];
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
      const varName = `--theme-${ref.replace(/\\./g, '-')}`;
      cssVars.push(`  ${varName}: /* TODO: Define theme value for ${ref} */;`);
    }

    return cssVars.length > 0 
      ? `:root {\n${cssVars.join('\n')}\n}\n`
      : '';
  }
}