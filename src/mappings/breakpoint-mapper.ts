import type { CSSProperties, CSSValue, BreakpointMapping } from '../types.js';

/**
 * Converts Material-UI breakpoint styles to Tailwind responsive utilities
 */
export class BreakpointMapper {
  private breakpoints: BreakpointMapping;

  constructor(customBreakpoints?: Partial<BreakpointMapping>) {
    this.breakpoints = {
      ...this.getDefaultBreakpoints(),
      ...customBreakpoints,
    };
  }

  /**
   * Check if a CSS property key is a breakpoint
   */
  public isBreakpoint(key: string): boolean {
    return key.startsWith('[theme.breakpoints.');
  }

  /**
   * Convert breakpoint styles to Tailwind responsive classes
   */
  public convertBreakpointStyles(
    breakpointKey: string,
    styles: CSSProperties,
    baseClasses: string[]
  ): { classes: string[]; warnings: string[] } {
    const warnings: string[] = [];
    
    try {
      const breakpointInfo = this.parseBreakpointKey(breakpointKey);
      if (!breakpointInfo) {
        warnings.push(`Could not parse breakpoint: ${breakpointKey}`);
        return { classes: baseClasses, warnings };
      }

      const { direction, breakpoint, endBreakpoint } = breakpointInfo;
      const responsive = this.createResponsiveClasses(
        direction,
        breakpoint,
        endBreakpoint,
        baseClasses
      );

      return { classes: responsive, warnings };

    } catch (error) {
      warnings.push(`Error converting breakpoint ${breakpointKey}: ${error}`);
      return { classes: baseClasses, warnings };
    }
  }

  /**
   * Parse breakpoint key like "[theme.breakpoints.up('md')]"
   */
  private parseBreakpointKey(key: string): {
    direction: 'up' | 'down' | 'between';
    breakpoint: string;
    endBreakpoint?: string;
  } | null {
    // Match patterns like [theme.breakpoints.up('md')]
    const upMatch = key.match(/\[theme\.breakpoints\.up\(['"](\w+)['"]\)\]/);
    if (upMatch) {
      return { direction: 'up', breakpoint: upMatch[1] };
    }

    // Match patterns like [theme.breakpoints.down('md')]  
    const downMatch = key.match(/\[theme\.breakpoints\.down\(['"](\w+)['"]\)\]/);
    if (downMatch) {
      return { direction: 'down', breakpoint: downMatch[1] };
    }

    // Match patterns like [theme.breakpoints.between('sm', 'lg')]
    const betweenMatch = key.match(/\[theme\.breakpoints\.between\(['"](\w+)['"],\s*['"](\w+)['"]\)\]/);
    if (betweenMatch) {
      return { 
        direction: 'between', 
        breakpoint: betweenMatch[1],
        endBreakpoint: betweenMatch[2]
      };
    }

    return null;
  }

  /**
   * Create responsive Tailwind classes based on breakpoint direction
   */
  private createResponsiveClasses(
    direction: 'up' | 'down' | 'between',
    startBreakpoint: string,
    endBreakpoint?: string,
    baseClasses: string[] = []
  ): string[] {
    const responsiveClasses: string[] = [];

    for (const baseClass of baseClasses) {
      if (direction === 'up') {
        // theme.breakpoints.up('md') -> md:class
        const tailwindBreakpoint = this.mapBreakpointToTailwind(startBreakpoint);
        responsiveClasses.push(`${tailwindBreakpoint}:${baseClass}`);
        
      } else if (direction === 'down') {
        // theme.breakpoints.down('md') -> max-md:class (Tailwind v3.2+)
        const tailwindBreakpoint = this.mapBreakpointToTailwind(startBreakpoint);
        responsiveClasses.push(`max-${tailwindBreakpoint}:${baseClass}`);
        
      } else if (direction === 'between' && endBreakpoint) {
        // theme.breakpoints.between('sm', 'lg') -> sm:max-lg:class
        const startTw = this.mapBreakpointToTailwind(startBreakpoint);
        const endTw = this.mapBreakpointToTailwind(endBreakpoint);
        responsiveClasses.push(`${startTw}:max-${endTw}:${baseClass}`);
      }
    }

    return responsiveClasses;
  }

  /**
   * Map Material-UI breakpoint names to Tailwind breakpoint names
   */
  private mapBreakpointToTailwind(muiBreakpoint: string): string {
    const mapping: Record<string, string> = {
      'xs': 'sm',    // 0px+ -> 640px+ (closest Tailwind equivalent)
      'sm': 'sm',    // 600px+ -> 640px+
      'md': 'md',    // 960px+ -> 768px+
      'lg': 'lg',    // 1280px+ -> 1024px+ 
      'xl': 'xl',    // 1920px+ -> 1280px+
    };

    return mapping[muiBreakpoint] || muiBreakpoint;
  }

  /**
   * Extract nested breakpoint styles from style objects
   */
  public extractBreakpointStyles(styles: CSSProperties): {
    baseStyles: CSSProperties;
    breakpointStyles: Record<string, CSSProperties>;
  } {
    const baseStyles: CSSProperties = {};
    const breakpointStyles: Record<string, CSSProperties> = {};

    for (const [key, value] of Object.entries(styles)) {
      if (this.isBreakpoint(key)) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          breakpointStyles[key] = value as CSSProperties;
        }
      } else {
        baseStyles[key] = value;
      }
    }

    return { baseStyles, breakpointStyles };
  }

  /**
   * Check if styles contain nested breakpoints
   */
  public hasNestedBreakpoints(styles: CSSProperties): boolean {
    return Object.keys(styles).some(key => this.isBreakpoint(key));
  }

  /**
   * Generate breakpoint-specific CSS comments for manual review
   */
  public generateBreakpointComments(
    breakpointKey: string,
    originalStyles: CSSProperties
  ): string {
    const styleEntries = Object.entries(originalStyles)
      .map(([prop, val]) => `${prop}: ${val}`)
      .join('; ');
    
    return `/* TODO: Review responsive styles for ${breakpointKey} */\n/* Original: { ${styleEntries} } */`;
  }

  /**
   * Get default Material-UI breakpoint values
   */
  private getDefaultBreakpoints(): BreakpointMapping {
    return {
      xs: 0,      // Extra small devices
      sm: 600,    // Small devices  
      md: 960,    // Medium devices
      lg: 1280,   // Large devices
      xl: 1920,   // Extra large devices
    };
  }

  /**
   * Validate breakpoint combinations for complex responsive styles
   */
  public validateBreakpointLogic(breakpointStyles: Record<string, CSSProperties>): {
    valid: boolean;
    warnings: string[];
    suggestions: string[];
  } {
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Check for conflicting breakpoint directions
    const hasUp = Object.keys(breakpointStyles).some(key => key.includes('.up('));
    const hasDown = Object.keys(breakpointStyles).some(key => key.includes('.down('));
    
    if (hasUp && hasDown) {
      warnings.push('Mixed up() and down() breakpoints detected - ensure logic is correct');
      suggestions.push('Consider using consistent breakpoint direction or between() for ranges');
    }

    // Check for potentially redundant breakpoints
    const breakpointCount = Object.keys(breakpointStyles).length;
    if (breakpointCount > 4) {
      warnings.push(`High number of breakpoints (${breakpointCount}) - consider consolidating`);
      suggestions.push('Use fewer breakpoints for simpler responsive design');
    }

    return {
      valid: warnings.length === 0,
      warnings,
      suggestions,
    };
  }

  /**
   * Generate Tailwind CSS arbitrary value for complex breakpoints
   */
  public generateArbitraryBreakpoint(
    direction: 'up' | 'down',
    pixelValue: number,
    classes: string[]
  ): string[] {
    const responsiveClasses: string[] = [];
    
    for (const baseClass of classes) {
      if (direction === 'up') {
        // Custom min-width
        responsiveClasses.push(`min-[${pixelValue}px]:${baseClass}`);
      } else {
        // Custom max-width  
        responsiveClasses.push(`max-[${pixelValue}px]:${baseClass}`);
      }
    }

    return responsiveClasses;
  }
}