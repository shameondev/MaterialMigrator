import type { 
  CSSProperties, 
  CSSValue, 
  ThemeReference, 
  TailwindConversion,
  ConversionWarning,
  UnconvertibleStyle 
} from './types.js';
import { CSS_TO_TAILWIND_MAP } from './mappings/css-to-tailwind.js';
import { ThemeMapper } from './mappings/theme-mapper.js';
import { BreakpointMapper } from './mappings/breakpoint-mapper.js';

export class StyleConverter {
  private themeMapper: ThemeMapper;
  private breakpointMapper: BreakpointMapper;

  constructor(
    customThemeMapping?: any,
    customBreakpoints?: any
  ) {
    this.themeMapper = new ThemeMapper(customThemeMapping);
    this.breakpointMapper = new BreakpointMapper(customBreakpoints);
  }

  /**
   * Convert CSS properties to Tailwind classes
   */
  public convertStyles(styles: CSSProperties): TailwindConversion {
    const tailwindClasses: string[] = [];
    const warnings: ConversionWarning[] = [];
    const unconvertible: UnconvertibleStyle[] = [];

    // First, separate base styles from breakpoint styles
    const { baseStyles, breakpointStyles } = this.breakpointMapper.extractBreakpointStyles(styles);

    // Convert base styles
    this.convertBaseStyles(baseStyles, tailwindClasses, warnings, unconvertible);

    // Convert breakpoint styles
    this.convertBreakpointStyles(breakpointStyles, tailwindClasses, warnings, unconvertible);

    return {
      original: styles,
      tailwindClasses: this.deduplicateClasses(tailwindClasses),
      warnings,
      unconvertible,
    };
  }

  private convertBaseStyles(
    styles: CSSProperties,
    tailwindClasses: string[],
    warnings: ConversionWarning[],
    unconvertible: UnconvertibleStyle[]
  ): void {
    for (const [property, value] of Object.entries(styles)) {
      if (this.isNestedSelector(property)) {
        this.handleNestedSelector(property, value as CSSProperties, tailwindClasses, warnings, unconvertible);
        continue;
      }

      const converted = this.convertProperty(property, value);
      if (converted.length > 0) {
        tailwindClasses.push(...converted);
      } else {
        // Check if it's a theme reference that needs special handling
        if (this.isThemeReference(value)) {
          const themeConverted = this.themeMapper.resolveThemeReference(value as ThemeReference, property);
          tailwindClasses.push(...themeConverted);
        } else if (this.isThemeSpacingValue(value)) {
          // Handle theme.spacing() calls with dynamic multipliers
          const themeSpacingValue = value as any;
          const multiplierStr = this.formatCSSValue(themeSpacingValue.multiplier);
          const displayValue = `theme.spacing(${multiplierStr})`;
          const manualAction = `Convert to Tailwind spacing class based on the multiplier value`;
          
          unconvertible.push({
            type: 'unconvertible',
            property,
            value: displayValue,
            reason: 'Dynamic theme.spacing() call',
            manualAction,
          });
        } else if (this.isDynamicValue(value)) {
          // Dynamic values need special handling
          const dynamicValue = value as any;
          let displayValue: string;
          let manualAction: string;
          
          if (dynamicValue.type === 'conditional') {
            displayValue = `conditional(${dynamicValue.consequent} | ${dynamicValue.alternate})`;
            manualAction = `Use conditional classes: cn(baseClasses, condition ? 'class-a' : 'class-b')`;
          } else if (dynamicValue.type === 'logical') {
            displayValue = `logical(${dynamicValue.left} ${dynamicValue.operator} ${dynamicValue.right})`;
            manualAction = `Use conditional classes: cn(baseClasses, condition && 'conditional-class')`;
          } else {
            displayValue = String(value);
            manualAction = 'Convert to conditional className pattern';
          }
          
          unconvertible.push({
            type: 'unconvertible',
            property,
            value: displayValue,
            reason: 'Dynamic/conditional style requires manual conversion',
            manualAction
          });
        } else {
          unconvertible.push({
            type: 'unconvertible',
            property,
            value,
            reason: 'No Tailwind equivalent found',
            manualAction: `Add custom CSS: ${property}: ${value}`
          });
        }
      }
    }
  }

  private convertBreakpointStyles(
    breakpointStyles: Record<string, CSSProperties>,
    tailwindClasses: string[],
    warnings: ConversionWarning[],
    unconvertible: UnconvertibleStyle[]
  ): void {
    for (const [breakpointKey, breakpointCSS] of Object.entries(breakpointStyles)) {
      // Convert the CSS properties within the breakpoint
      const breakpointClasses: string[] = [];
      const breakpointWarnings: ConversionWarning[] = [];
      const breakpointUnconvertible: UnconvertibleStyle[] = [];

      this.convertBaseStyles(breakpointCSS, breakpointClasses, breakpointWarnings, breakpointUnconvertible);

      // Apply responsive prefixes
      const { classes: responsiveClasses, warnings: responsiveWarnings } = 
        this.breakpointMapper.convertBreakpointStyles(breakpointKey, breakpointCSS, breakpointClasses);

      tailwindClasses.push(...responsiveClasses);
      warnings.push(...breakpointWarnings);
      warnings.push(...responsiveWarnings.map(msg => ({ type: 'warning' as const, message: msg })));
      unconvertible.push(...breakpointUnconvertible);
    }
  }

  private convertProperty(property: string, value: CSSValue): string[] {
    // Handle theme references
    if (this.isThemeReference(value)) {
      return this.themeMapper.resolveThemeReference(value as ThemeReference, property);
    }

    // Handle theme-spacing values (already converted to px in parser)
    if (this.isThemeSpacingValue(value)) {
      // This should not happen as theme.spacing() with numeric literals 
      // should be converted to px strings in the parser
      return [];
    }

    // Handle dynamic functions that can't be converted statically
    if (typeof value === 'string' && value.startsWith('{') && value.includes('function')) {
      // These are placeholders for dynamic values that can't be converted
      return [];
    }

    // Handle dynamic values (conditional, logical)
    if (this.isDynamicValue(value)) {
      return this.handleDynamicValue(property, value);
    }

    // Handle CSS functions (calc, rgb, etc.)
    if (this.isCSSFunction(value)) {
      return this.handleCSSFunction(property, value);
    }

    // Handle arrays (multiple values)
    if (Array.isArray(value)) {
      return this.handleArrayValue(property, value);
    }

    // Use the CSS to Tailwind mapping
    const converter = CSS_TO_TAILWIND_MAP[property];
    if (converter) {
      return converter(value);
    }

    // Handle vendor prefixes
    if (property.startsWith('Webkit') || property.startsWith('Moz')) {
      return this.handleVendorPrefix(property, value);
    }

    return [];
  }

  private isNestedSelector(property: string): boolean {
    return property.startsWith('&') || 
           property.startsWith('@') ||
           property.includes('::') ||
           property.includes(':');
  }

  private handleNestedSelector(
    selector: string,
    value: CSSProperties,
    tailwindClasses: string[],
    warnings: ConversionWarning[],
    unconvertible: UnconvertibleStyle[]
  ): void {
    // Handle pseudo-selectors like &:hover
    if (selector.startsWith('&:')) {
      const pseudoClass = selector.substring(2);
      const pseudoMapping = this.getPseudoClassMapping(pseudoClass);
      
      if (pseudoMapping) {
        const nestedStyles = value;
        const nestedClasses: string[] = [];
        
        for (const [prop, val] of Object.entries(nestedStyles)) {
          const converted = this.convertProperty(prop, val);
          nestedClasses.push(...converted.map(cls => `${pseudoMapping}:${cls}`));
        }
        
        tailwindClasses.push(...nestedClasses);
      } else {
        unconvertible.push({
          type: 'unconvertible',
          property: selector,
          value,
          reason: 'Complex pseudo-selector not supported',
          manualAction: 'Convert to Tailwind pseudo-class modifiers manually'
        });
      }
      return;
    }

    // Handle keyframes and other complex selectors
    if (selector.startsWith('@keyframes') || selector.includes('@')) {
      unconvertible.push({
        type: 'unconvertible',
        property: selector,
        value,
        reason: 'CSS animations and at-rules require manual conversion',
        manualAction: 'Move to separate CSS file or use Tailwind animations'
      });
      return;
    }

    // Handle complex nested selectors
    warnings.push({
      type: 'warning',
      message: `Complex selector "${selector}" may need manual review`,
      property: selector,
      suggestion: 'Consider simplifying selector structure for Tailwind'
    });

    unconvertible.push({
      type: 'unconvertible', 
      property: selector,
      value,
      reason: 'Complex nested selector',
      manualAction: 'Restructure DOM or use CSS-in-JS for complex selectors'
    });
  }

  private getPseudoClassMapping(pseudoClass: string): string | null {
    const mapping: Record<string, string> = {
      'hover': 'hover',
      'focus': 'focus',
      'active': 'active',
      'disabled': 'disabled',
      'visited': 'visited',
      'first-child': 'first',
      'last-child': 'last',
      'nth-child(even)': 'even',
      'nth-child(odd)': 'odd',
      'before': 'before',
      'after': 'after',
      'placeholder': 'placeholder',
      'invalid': 'invalid',
      'checked': 'checked',
    };

    return mapping[pseudoClass] || null;
  }

  private handleCSSFunction(property: string, value: any): string[] {
    if (typeof value === 'object' && value.type === 'function') {
      const { name, args } = value;
      
      // Handle calc() functions
      if (name === 'calc') {
        return [`[${property}:calc(${args.join('')})]`];
      }
      
      // Handle color functions
      if (name === 'rgb' || name === 'rgba') {
        const colorValue = `${name}(${args.join(',')})`;
        const prefix = this.getColorPrefix(property);
        return prefix ? [`${prefix}-[${colorValue}]`] : [];
      }
      
      // Handle other functions
      return [`[${property}:${name}(${args.join(',')})]`];
    }
    
    return [];
  }

  private handleArrayValue(property: string, values: CSSValue[]): string[] {
    // Handle multiple values like padding: [8, 16]
    if (property === 'padding' || property === 'margin') {
      if (values.length === 2) {
        const [vertical, horizontal] = values;
        const prefix = property === 'padding' ? 'p' : 'm';
        return [
          `${prefix}y-${this.convertSingleSpacingValue(vertical)}`,
          `${prefix}x-${this.convertSingleSpacingValue(horizontal)}`
        ];
      }
      
      if (values.length === 4) {
        const [top, right, bottom, left] = values;
        const prefix = property === 'padding' ? 'p' : 'm';
        return [
          `${prefix}t-${this.convertSingleSpacingValue(top)}`,
          `${prefix}r-${this.convertSingleSpacingValue(right)}`,
          `${prefix}b-${this.convertSingleSpacingValue(bottom)}`,
          `${prefix}l-${this.convertSingleSpacingValue(left)}`
        ];
      }
    }

    // Handle background arrays (multiple backgrounds)
    if (property === 'background' || property === 'backgroundImage') {
      return [`bg-[${values.join(',')}]`];
    }

    // Fallback: arbitrary value
    return [`[${property}:${values.join(',')}]`];
  }

  private handleVendorPrefix(property: string, value: CSSValue): string[] {
    // Remove vendor prefix and try to convert
    const cleanProperty = property.replace(/^(Webkit|Moz|Ms|O)/, '').toLowerCase();
    const converter = CSS_TO_TAILWIND_MAP[cleanProperty];
    
    if (converter) {
      return converter(value);
    }
    
    // Return arbitrary value for vendor-specific properties
    return [`[${property.replace(/([A-Z])/g, '-$1').toLowerCase()}:${value}]`];
  }

  private convertSingleSpacingValue(value: CSSValue): string {
    const numValue = parseFloat(String(value));
    const spacingScale: Record<number, string> = {
      0: '0', 2: '0.5', 4: '1', 6: '1.5', 8: '2', 10: '2.5',
      12: '3', 14: '3.5', 16: '4', 20: '5', 24: '6', 32: '8',
      40: '10', 48: '12', 64: '16', 80: '20', 96: '24'
    };
    
    return spacingScale[numValue] || `[${value}]`;
  }

  private getColorPrefix(property: string): string | null {
    const colorProperties: Record<string, string> = {
      'color': 'text',
      'backgroundColor': 'bg',
      'borderColor': 'border',
      'borderTopColor': 'border-t',
      'borderRightColor': 'border-r',
      'borderBottomColor': 'border-b',
      'borderLeftColor': 'border-l',
    };
    
    return colorProperties[property] || null;
  }

  private isThemeReference(value: CSSValue): boolean {
    return typeof value === 'object' && 
           value !== null && 
           !Array.isArray(value) &&
           'type' in value &&
           value.type === 'theme';
  }

  private isThemeSpacingValue(value: CSSValue): boolean {
    return typeof value === 'object' && 
           value !== null && 
           !Array.isArray(value) &&
           'type' in value &&
           value.type === 'theme-spacing';
  }

  private isCSSFunction(value: CSSValue): boolean {
    return typeof value === 'object' &&
           value !== null &&
           !Array.isArray(value) &&
           'type' in value &&
           value.type === 'function';
  }

  private formatCSSValue(value: CSSValue): string {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      if ('type' in value) {
        switch (value.type) {
          case 'conditional':
            return `conditional(${this.formatCSSValue((value as any).consequent)} | ${this.formatCSSValue((value as any).alternate)})`;
          case 'logical':
            return `logical(${this.formatCSSValue((value as any).left)} ${(value as any).operator} ${this.formatCSSValue((value as any).right)})`;
          case 'function':
            return `${(value as any).name}(${(value as any).args.map((arg: CSSValue) => this.formatCSSValue(arg)).join(', ')})`;
          default:
            return `[${value.type}]`;
        }
      }
    }
    
    return String(value);
  }

  private isDynamicValue(value: CSSValue): boolean {
    return typeof value === 'object' &&
           value !== null &&
           !Array.isArray(value) &&
           'type' in value &&
           (value.type === 'conditional' || value.type === 'logical');
  }

  private handleDynamicValue(property: string, value: any): string[] {
    // For dynamic values, we can't generate static classes
    // Instead, return empty array and let the unconvertible handler catch it
    // This will be caught later and added to unconvertible with a specific message
    return [];
  }

  private deduplicateClasses(classes: string[]): string[] {
    return [...new Set(classes)];
  }

  /**
   * Analyze conversion statistics
   */
  public analyzeConversion(conversion: TailwindConversion): {
    conversionRate: number;
    totalProperties: number;
    convertedProperties: number;
    warningCount: number;
    unconvertibleCount: number;
  } {
    const totalProperties = this.countCSSProperties(conversion.original);
    const unconvertibleCount = conversion.unconvertible.length;
    const convertedProperties = totalProperties - unconvertibleCount;
    
    return {
      conversionRate: totalProperties > 0 ? (convertedProperties / totalProperties) * 100 : 0,
      totalProperties,
      convertedProperties,
      warningCount: conversion.warnings.length,
      unconvertibleCount,
    };
  }

  private countCSSProperties(styles: CSSProperties): number {
    let count = 0;
    
    for (const [key, value] of Object.entries(styles)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value) && !('type' in value)) {
        // Nested object (breakpoint or pseudo-selector)
        count += this.countCSSProperties(value as CSSProperties);
      } else {
        count++;
      }
    }
    
    return count;
  }
}