import type { CSSValue } from '../types.js';

/**
 * CSS property to Tailwind class mappings
 */
export const CSS_TO_TAILWIND_MAP: Record<string, (value: CSSValue) => string[]> = {
  // Display
  display: (value) => {
    const displays: Record<string, string> = {
      'block': 'block',
      'inline-block': 'inline-block', 
      'inline': 'inline',
      'flex': 'flex',
      'inline-flex': 'inline-flex',
      'grid': 'grid',
      'inline-grid': 'inline-grid',
      'table': 'table',
      'table-row': 'table-row',
      'table-cell': 'table-cell',
      'hidden': 'hidden',
      'none': 'hidden',
    };
    return displays[String(value)] ? [displays[String(value)]] : [];
  },

  // Flexbox
  flexDirection: (value) => {
    const directions: Record<string, string> = {
      'row': 'flex-row',
      'row-reverse': 'flex-row-reverse',
      'column': 'flex-col',
      'column-reverse': 'flex-col-reverse',
    };
    return directions[String(value)] ? [directions[String(value)]] : [];
  },

  alignItems: (value) => {
    const alignments: Record<string, string> = {
      'flex-start': 'items-start',
      'flex-end': 'items-end',
      'center': 'items-center',
      'baseline': 'items-baseline',
      'stretch': 'items-stretch',
    };
    return alignments[String(value)] ? [alignments[String(value)]] : [];
  },

  justifyContent: (value) => {
    const justifications: Record<string, string> = {
      'flex-start': 'justify-start',
      'flex-end': 'justify-end',
      'center': 'justify-center',
      'space-between': 'justify-between',
      'space-around': 'justify-around',
      'space-evenly': 'justify-evenly',
    };
    return justifications[String(value)] ? [justifications[String(value)]] : [];
  },

  alignContent: (value) => {
    const alignments: Record<string, string> = {
      'flex-start': 'content-start',
      'flex-end': 'content-end',
      'center': 'content-center',
      'space-between': 'content-between',
      'space-around': 'content-around',
      'space-evenly': 'content-evenly',
      'stretch': 'content-stretch',
    };
    return alignments[String(value)] ? [alignments[String(value)]] : [];
  },

  flexWrap: (value) => {
    const wraps: Record<string, string> = {
      'wrap': 'flex-wrap',
      'nowrap': 'flex-nowrap',
      'wrap-reverse': 'flex-wrap-reverse',
    };
    return wraps[String(value)] ? [wraps[String(value)]] : [];
  },

  flexGrow: (value) => {
    const val = Number(value);
    if (val === 0) return ['grow-0'];
    if (val === 1) return ['grow'];
    return [`grow-[${value}]`];
  },

  flexShrink: (value) => {
    const val = Number(value);
    if (val === 0) return ['shrink-0'];
    if (val === 1) return ['shrink'];
    return [`shrink-[${value}]`];
  },

  // Grid
  gridTemplateColumns: (value) => {
    const val = String(value);
    if (val.includes('repeat')) {
      // Extract repeat patterns: repeat(3, 1fr) -> grid-cols-3
      const repeatMatch = val.match(/repeat\((\d+),\s*[^)]+\)/);
      if (repeatMatch) {
        return [`grid-cols-${repeatMatch[1]}`];
      }
      // repeat(auto-fit, minmax(...)) -> grid-cols-[repeat(auto-fit,minmax(...))]
      return [`grid-cols-[${val}]`];
    }
    if (val === '1fr') return ['grid-cols-1'];
    if (val === '1fr 1fr') return ['grid-cols-2'];
    if (val === '1fr 1fr 1fr') return ['grid-cols-3'];
    return [`grid-cols-[${val}]`];
  },

  gridTemplateRows: (value) => {
    const val = String(value);
    if (val === 'auto') return ['grid-rows-auto'];
    if (val === '1fr') return ['grid-rows-1'];
    if (val === '1fr 1fr') return ['grid-rows-2'];
    return [`grid-rows-[${val}]`];
  },

  gridGap: (value) => convertSpacing(value, 'gap'),
  gap: (value) => convertSpacing(value, 'gap'),

  // Position
  position: (value) => {
    const positions: Record<string, string> = {
      'static': 'static',
      'fixed': 'fixed',
      'absolute': 'absolute',
      'relative': 'relative',
      'sticky': 'sticky',
    };
    return positions[String(value)] ? [positions[String(value)]] : [];
  },

  top: (value) => convertSpacing(value, 'top'),
  right: (value) => convertSpacing(value, 'right'),
  bottom: (value) => convertSpacing(value, 'bottom'),
  left: (value) => convertSpacing(value, 'left'),

  // Sizing
  width: (value) => convertSize(value, 'w'),
  height: (value) => convertSize(value, 'h'),
  minWidth: (value) => convertSize(value, 'min-w'),
  minHeight: (value) => convertSize(value, 'min-h'),
  maxWidth: (value) => convertSize(value, 'max-w'),
  maxHeight: (value) => convertSize(value, 'max-h'),

  // Spacing
  margin: (value) => convertSpacing(value, 'm'),
  marginTop: (value) => convertSpacing(value, 'mt'),
  marginRight: (value) => convertSpacing(value, 'mr'),
  marginBottom: (value) => convertSpacing(value, 'mb'),
  marginLeft: (value) => convertSpacing(value, 'ml'),
  
  padding: (value) => convertSpacing(value, 'p'),
  paddingTop: (value) => convertSpacing(value, 'pt'),
  paddingRight: (value) => convertSpacing(value, 'pr'),
  paddingBottom: (value) => convertSpacing(value, 'pb'),
  paddingLeft: (value) => convertSpacing(value, 'pl'),

  // Colors
  color: (value) => convertColor(value, 'text'),
  backgroundColor: (value) => convertColor(value, 'bg'),
  borderColor: (value) => convertColor(value, 'border'),

  // Typography
  fontSize: (value) => {
    const sizes: Record<string, string> = {
      '10': 'text-xs',
      '12': 'text-xs',
      '14': 'text-sm',
      '16': 'text-base',
      '18': 'text-lg',
      '20': 'text-xl',
      '24': 'text-2xl',
      '30': 'text-3xl',
      '36': 'text-4xl',
      '48': 'text-5xl',
      '60': 'text-6xl',
    };
    const val = String(value);
    // Strip px for lookup, but preserve for arbitrary values
    const numericValue = val.replace('px', '');
    if (sizes[numericValue]) return [sizes[numericValue]];
    // Don't add px if value already has units
    const hasUnits = val.includes('px') || val.includes('rem') || val.includes('em') || val.includes('%');
    return [`text-[${hasUnits ? val : `${val}px`}]`];
  },

  fontWeight: (value) => {
    const weights: Record<string, string> = {
      '100': 'font-thin',
      '200': 'font-extralight', 
      '300': 'font-light',
      '400': 'font-normal',
      '500': 'font-medium',
      '600': 'font-semibold',
      '700': 'font-bold',
      '800': 'font-extrabold',
      '900': 'font-black',
      'normal': 'font-normal',
      'bold': 'font-bold',
    };
    return weights[String(value)] ? [weights[String(value)]] : [`font-[${value}]`];
  },

  lineHeight: (value) => {
    const heights: Record<string, string> = {
      '1': 'leading-none',
      '1.25': 'leading-tight',
      '1.375': 'leading-snug',
      '1.5': 'leading-normal',
      '1.625': 'leading-relaxed',
      '2': 'leading-loose',
    };
    return heights[String(value)] ? [heights[String(value)]] : [`leading-[${value}]`];
  },

  textAlign: (value) => {
    const aligns: Record<string, string> = {
      'left': 'text-left',
      'center': 'text-center',
      'right': 'text-right',
      'justify': 'text-justify',
    };
    return aligns[String(value)] ? [aligns[String(value)]] : [];
  },

  textTransform: (value) => {
    const transforms: Record<string, string> = {
      'uppercase': 'uppercase',
      'lowercase': 'lowercase',
      'capitalize': 'capitalize',
      'none': 'normal-case',
    };
    return transforms[String(value)] ? [transforms[String(value)]] : [];
  },

  textDecoration: (value) => {
    const decorations: Record<string, string> = {
      'none': 'no-underline',
      'underline': 'underline',
      'line-through': 'line-through',
    };
    return decorations[String(value)] ? [decorations[String(value)]] : [];
  },

  letterSpacing: (value) => {
    const spacings: Record<string, string> = {
      '-0.05em': 'tracking-tighter',
      '-0.025em': 'tracking-tight',
      '0': 'tracking-normal',
      '0.025em': 'tracking-wide',
      '0.05em': 'tracking-wider',
      '0.1em': 'tracking-widest',
    };
    return spacings[String(value)] ? [spacings[String(value)]] : [`tracking-[${value}]`];
  },

  // Border
  border: (value) => {
    const val = String(value);
    if (val === 'none' || val === '0') return ['border-0'];
    if (val.includes('1px')) return ['border'];
    if (val.includes('2px')) return ['border-2'];
    if (val.includes('4px')) return ['border-4'];
    return ['border'];
  },

  borderWidth: (value) => {
    const widths: Record<string, string> = {
      '0': 'border-0',
      '1': 'border',
      '2': 'border-2',
      '4': 'border-4',
      '8': 'border-8',
    };
    const val = String(value);
    if (widths[val]) return [widths[val]];
    // Don't add px if value already has units
    const hasUnits = val.includes('px') || val.includes('rem') || val.includes('em') || val.includes('%');
    return [`border-[${hasUnits ? val : `${val}px`}]`];
  },

  borderRadius: (value) => {
    const radii: Record<string, string> = {
      '0': 'rounded-none',
      '2': 'rounded-sm',
      '4': 'rounded',
      '6': 'rounded-md',
      '8': 'rounded-lg',
      '10': 'rounded-lg',
      '12': 'rounded-xl',
      '16': 'rounded-2xl',
      '20': 'rounded-3xl',
      '9999': 'rounded-full',
      '50%': 'rounded-full',
    };
    const val = String(value);
    // Strip px for lookup, but preserve for arbitrary values
    const numericValue = val.replace('px', '');
    if (radii[numericValue]) return [radii[numericValue]];
    // Don't add px if value already has units
    const hasUnits = val.includes('px') || val.includes('rem') || val.includes('em') || val.includes('%');
    return [`rounded-[${hasUnits ? val : `${val}px`}]`];
  },

  // Effects
  opacity: (value) => {
    const val = Number(value);
    if (val === 0) return ['opacity-0'];
    if (val <= 0.05) return ['opacity-5'];
    if (val <= 0.1) return ['opacity-10'];
    if (val <= 0.2) return ['opacity-20'];
    if (val <= 0.25) return ['opacity-25'];
    if (val <= 0.3) return ['opacity-30'];
    if (val <= 0.4) return ['opacity-40'];
    if (val <= 0.5) return ['opacity-50'];
    if (val <= 0.6) return ['opacity-60'];
    if (val <= 0.7) return ['opacity-70'];
    if (val <= 0.75) return ['opacity-75'];
    if (val <= 0.8) return ['opacity-80'];
    if (val <= 0.9) return ['opacity-90'];
    if (val <= 0.95) return ['opacity-95'];
    return ['opacity-100'];
  },

  // Backdrop filters
  backdropFilter: (value) => {
    const val = String(value).toLowerCase();
    if (val.includes('blur(')) {
      const blurMatch = val.match(/blur\((\d+(?:\.\d+)?)px\)/);
      if (blurMatch) {
        const blurValue = Number(blurMatch[1]);
        if (blurValue <= 2) return ['backdrop-blur-none'];
        if (blurValue <= 4) return ['backdrop-blur-sm'];
        if (blurValue <= 8) return ['backdrop-blur'];
        if (blurValue <= 12) return ['backdrop-blur-md'];
        if (blurValue <= 16) return ['backdrop-blur-lg'];
        if (blurValue <= 24) return ['backdrop-blur-xl'];
        if (blurValue <= 40) return ['backdrop-blur-2xl'];
        return ['backdrop-blur-3xl'];
      }
    }
    return [`backdrop-[${value}]`];
  },

  '-webkit-backdrop-filter': (value) => {
    // Delegate to backdropFilter for consistent handling
    return CSS_TO_TAILWIND_MAP.backdropFilter(value);
  },

  // Cursor
  cursor: (value) => {
    const cursors: Record<string, string> = {
      'auto': 'cursor-auto',
      'default': 'cursor-default',
      'pointer': 'cursor-pointer',
      'wait': 'cursor-wait',
      'text': 'cursor-text',
      'move': 'cursor-move',
      'help': 'cursor-help',
      'not-allowed': 'cursor-not-allowed',
    };
    return cursors[String(value)] ? [cursors[String(value)]] : [`cursor-[${value}]`];
  },

  // Overflow
  overflow: (value) => {
    const overflows: Record<string, string> = {
      'visible': 'overflow-visible',
      'hidden': 'overflow-hidden',
      'scroll': 'overflow-scroll',
      'auto': 'overflow-auto',
    };
    return overflows[String(value)] ? [overflows[String(value)]] : [];
  },

  overflowX: (value) => {
    const overflows: Record<string, string> = {
      'visible': 'overflow-x-visible',
      'hidden': 'overflow-x-hidden',
      'scroll': 'overflow-x-scroll',
      'auto': 'overflow-x-auto',
    };
    return overflows[String(value)] ? [overflows[String(value)]] : [];
  },

  overflowY: (value) => {
    const overflows: Record<string, string> = {
      'visible': 'overflow-y-visible',
      'hidden': 'overflow-y-hidden',
      'scroll': 'overflow-y-scroll',
      'auto': 'overflow-y-auto',
    };
    return overflows[String(value)] ? [overflows[String(value)]] : [];
  },

  // Z-Index
  zIndex: (value) => {
    const indices: Record<string, string> = {
      '0': 'z-0',
      '10': 'z-10',
      '20': 'z-20',
      '30': 'z-30',
      '40': 'z-40',
      '50': 'z-50',
      'auto': 'z-auto',
    };
    return indices[String(value)] ? [indices[String(value)]] : [`z-[${value}]`];
  },

  // Transitions
  transition: (value) => {
    const val = String(value);
    if (val.includes('all')) return ['transition-all'];
    if (val.includes('colors')) return ['transition-colors'];
    if (val.includes('opacity')) return ['transition-opacity'];
    if (val.includes('transform')) return ['transition-transform'];
    return ['transition'];
  },

  transitionDuration: (value) => {
    const durations: Record<string, string> = {
      '75': 'duration-75',
      '100': 'duration-100',
      '150': 'duration-150',
      '200': 'duration-200',
      '300': 'duration-300',
      '500': 'duration-500',
      '700': 'duration-700',
      '1000': 'duration-1000',
    };
    const val = String(value).replace('ms', '');
    return durations[val] ? [durations[val]] : [`duration-[${value}]`];
  },

  transitionProperty: (value) => {
    const properties: Record<string, string> = {
      'none': 'transition-none',
      'all': 'transition-all',
      'colors': 'transition-colors',
      'opacity': 'transition-opacity',
      'shadow': 'transition-shadow',
      'transform': 'transition-transform',
      'color': 'transition-colors',
      'background-color': 'transition-colors',
      'border-color': 'transition-colors',
      'text-decoration-color': 'transition-colors',
      'fill': 'transition-colors',
      'stroke': 'transition-colors',
      'width': 'transition-all',
      'height': 'transition-all',
      'padding': 'transition-all',
      'margin': 'transition-all',
    };
    
    const val = String(value).toLowerCase().trim();
    
    // Handle multiple properties separated by commas
    if (val.includes(',')) {
      const props = val.split(',').map(p => p.trim());
      const hasColors = props.some(p => 
        ['color', 'background-color', 'border-color', 'text-decoration-color', 'fill', 'stroke'].includes(p)
      );
      const hasTransform = props.includes('transform');
      const hasOpacity = props.includes('opacity');
      
      // Return most appropriate single class for common combinations
      if (hasColors && hasTransform) return ['transition-all'];
      if (hasColors) return ['transition-colors'];
      if (hasTransform) return ['transition-transform'];
      if (hasOpacity) return ['transition-opacity'];
      return ['transition-all'];
    }
    
    // Single property
    return properties[val] ? [properties[val]] : [`transition-[${value}]`];
  },

  transitionTimingFunction: (value) => {
    const timings: Record<string, string> = {
      'linear': 'ease-linear',
      'ease': 'ease-out',
      'ease-in': 'ease-in',
      'ease-out': 'ease-out',
      'ease-in-out': 'ease-in-out',
    };
    const val = String(value).toLowerCase();
    return timings[val] ? [timings[val]] : [`ease-[${value}]`];
  },
};

/**
 * Convert spacing values (padding, margin, gap, etc.)
 */
function convertSpacing(value: CSSValue, prefix: string): string[] {
  const val = String(value);
  
  // Handle multi-value (e.g., "8px 16px")
  if (val.includes(' ')) {
    const values = val.split(' ');
    if (values.length === 2) {
      const [vertical, horizontal] = values.map(v => convertSingleSpacing(v, prefix));
      return [`${prefix}y-${vertical}`, `${prefix}x-${horizontal}`];
    }
    if (values.length === 4) {
      const [top, right, bottom, left] = values.map(v => convertSingleSpacing(v, prefix));
      return [`${prefix}t-${top}`, `${prefix}r-${right}`, `${prefix}b-${bottom}`, `${prefix}l-${left}`];
    }
  }

  return [`${prefix}-${convertSingleSpacing(val, '')}`];
}

/**
 * Convert single spacing value to Tailwind spacing scale
 */
function convertSingleSpacing(value: string, prefix: string): string {
  // Handle special keywords
  if (value === 'auto') return 'auto';
  if (value === '100%') return 'full';
  
  const numValue = parseFloat(value.replace(/px|rem|em/, ''));
  
  // Tailwind spacing scale (4px = 1 unit)
  const spacingScale: Record<number, string> = {
    0: '0',
    2: '0.5',
    4: '1',
    6: '1.5',
    8: '2',
    10: '2.5',
    12: '3',
    14: '3.5',
    16: '4',
    20: '5',
    24: '6',
    28: '7',
    32: '8',
    36: '9',
    40: '10',
    44: '11',
    48: '12',
    56: '14',
    64: '16',
    80: '20',
    96: '24',
  };

  const fallbackValue = value || '';
  const hasPx = fallbackValue.includes('px') || fallbackValue.includes('rem') || fallbackValue.includes('em') || fallbackValue.includes('%');
  return spacingScale[numValue] || `[${hasPx ? fallbackValue : `${fallbackValue}px`}]`;
}

/**
 * Convert size values (width, height, etc.)
 */
function convertSize(value: CSSValue, prefix: string): string[] {
  const val = String(value);
  
  // Handle common keywords first
  if (val === 'auto') return [`${prefix}-auto`];
  if (val === '100%') return [`${prefix}-full`];
  if (val === '100vw') return [`${prefix}-screen`];
  if (val === '100vh') return [`${prefix}-screen`];
  
  // Handle CSS sizing keywords
  if (val === 'fit-content') return [`${prefix}-fit`];
  if (val === 'max-content') return [`${prefix}-max`];
  if (val === 'min-content') return [`${prefix}-min`];
  if (val.includes('%')) {
    const percent = parseFloat(val);
    const fractions: Record<number, string> = {
      25: '1/4',
      33.333333: '1/3',
      50: '1/2',
      66.666667: '2/3',
      75: '3/4',
    };
    return fractions[percent] ? [`${prefix}-${fractions[percent]}`] : [`${prefix}-[${val}]`];
  }
  
  // Handle pure numbers as pixel values in arbitrary format (except 0)
  if (/^[1-9]\d*$/.test(val)) {
    return [`${prefix}-[${val}px]`];
  }
  
  // Handle pixel values
  const numValue = parseFloat(val.replace('px', ''));
  const sizeScale: Record<number, string> = {
    0: '0',
    1: 'px',
    16: '4',
    24: '6',
    32: '8',
    40: '10',
    48: '12',
    64: '16',
    80: '20',
    96: '24',
    112: '28',
    128: '32',
    144: '36',
    160: '40',
    176: '44',
    192: '48',
    208: '52',
    224: '56',
    240: '60',
    256: '64',
    288: '72',
    320: '80',
    384: '96',
  };

  if (sizeScale[numValue]) {
    return [`${prefix}-${sizeScale[numValue]}`];
  }
  
  // For numeric values not in scale, add px units if not already present
  // But don't add px to CSS keywords
  const cssKeywords = ['fit-content', 'max-content', 'min-content', 'initial', 'inherit', 'unset', 'revert'];
  const hasUnits = val.includes('px') || val.includes('%') || val.includes('rem') || val.includes('em') || val.includes('vw') || val.includes('vh');
  const isKeyword = cssKeywords.some(keyword => val.includes(keyword));
  
  const arbitraryValue = hasUnits || isKeyword ? val : `${val}px`;
  
  return [`${prefix}-[${arbitraryValue}]`];
}

/**
 * Convert color values
 */
function convertColor(value: CSSValue, prefix: string): string[] {
  const val = String(value);
  
  // Common colors
  const commonColors: Record<string, string> = {
    '#ffffff': 'white',
    '#fff': 'white',
    '#000000': 'black',
    '#000': 'black',
    'white': 'white',
    'black': 'black',
    'transparent': 'transparent',
    'currentColor': 'current',
  };

  if (commonColors[val]) {
    return [`${prefix}-${commonColors[val]}`];
  }

  // Hex colors
  if (val.startsWith('#')) {
    return [`${prefix}-[${val}]`];
  }

  // RGB/RGBA
  if (val.startsWith('rgb')) {
    return [`${prefix}-[${val}]`];
  }

  // Theme references will be handled by theme mapper
  return [`${prefix}-[${val}]`];
}