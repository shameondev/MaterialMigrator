import type { Node, ObjectExpression, CallExpression } from '@babel/types';

// Core interfaces for the migration tool
export interface StyleDefinition {
  name: string;
  properties: CSSProperties;
  sourceLocation: {
    start: number;
    end: number;
    line: number;
    column: number;
  };
}

export interface CSSProperties {
  [key: string]: CSSValue;
}

export type CSSValue = 
  | string
  | number
  | boolean
  | CSSValue[]
  | CSSFunction
  | ThemeReference
  | ThemeSpacingValue
  | ConditionalValue
  | LogicalValue
  | CSSProperties; // Allow nested objects

export interface CSSFunction {
  type: 'function';
  name: string;
  args: CSSValue[];
}

export interface ThemeReference {
  type: 'theme';
  path: string[];
  fallback?: CSSValue;
  isOptional?: boolean;
}

export interface ThemeSpacingValue {
  type: 'theme-spacing';
  multiplier: CSSValue;
}

export interface ConditionalValue {
  type: 'conditional';
  condition: string;
  consequent: CSSValue;
  alternate: CSSValue;
}

export interface LogicalValue {
  type: 'logical';
  operator: '&&' | '||' | '??';
  left: CSSValue;
  right: CSSValue;
}

export interface MakeStylesExtraction {
  importName: string;
  hookName: string;
  styles: StyleDefinition[];
  themeParam?: string;
  propsType?: string;
  sourceFile: string;
}

export interface ClassNameUsage {
  property: string;
  location: {
    start: number;
    end: number;
    line: number;
    column: number;
  };
  expression: Node;
}

export interface TailwindConversion {
  original: CSSProperties;
  tailwindClasses: string[];
  warnings: ConversionWarning[];
  unconvertible: UnconvertibleStyle[];
}

export interface ConversionWarning {
  type: 'warning';
  message: string;
  property?: string;
  suggestion?: string;
}

export interface UnconvertibleStyle {
  type: 'unconvertible';
  property: string;
  value: CSSValue;
  reason: string;
  manualAction: string;
}

export interface MigrationResult {
  filePath: string;
  success: boolean;
  migrationStatus: 'complete' | 'partial' | 'failed' | 'skipped';
  error?: string;
  originalCode: string;
  migratedCode: string;
  conversions: TailwindConversion[];
  classNameReplacements: Map<string, string>;
  removedImports: string[];
  errors?: MigrationError[];
  warnings?: ConversionWarning[];
  stats: {
    totalStyles: number;
    convertedStyles: number;
    unconvertibleStyles: number;
    classNameReplacements: number;
    remainingClassesUsages: number;
  };
}

export interface MigrationError {
  type: 'error';
  message: string;
  location?: {
    line: number;
    column: number;
  };
  stack?: string;
}

// Configuration for the migration tool
export interface MigrationConfig {
  // Project settings
  projectRoot: string;
  writeFiles: boolean;
  
  // File patterns to include/exclude
  include: string[];
  exclude: string[];
  
  // Output options
  dryRun: boolean;
  verbose: boolean;
  preserveOriginal: boolean;
  
  // Conversion options
  useCn: boolean;
  customThemeMapping: Record<string, string>;
  customPropertyMapping: Record<string, string>;
  
  // Quality settings
  maxWarningsPerFile: number;
  failOnErrors: boolean;
  generateReport: boolean;
}

// Breakpoint mapping
export interface BreakpointMapping {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl?: number; // Optional for extended breakpoints
}

// Theme mapping configuration
export interface ThemeMapping {
  colors: Record<string, string>;
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  fontSize: Record<string, string>;
  fontWeight: Record<string, string>;
  lineHeight: Record<string, string>;
  boxShadow: Record<string, string>;
  zIndex: Record<string, string>;
  customThemeMapping?: Record<string, string | string[]>;
}

// AST node types for makeStyles detection
export interface MakeStylesCall extends CallExpression {
  callee: {
    type: 'Identifier';
    name: 'makeStyles';
  };
}

// Cross-file import types
export interface StyleImport {
  hookName: string;
  importPath: string;
  resolvedPath: string;
  sourceFile: string;
  importedName: string;
}

export interface FileStyleMapping {
  files: Map<string, MakeStylesExtraction[]>;
  imports: Map<string, StyleImport[]>;
  exports: Map<string, MakeStylesExtraction[]>;
}

export interface TransformResult {
  originalCode: string;
  migratedCode: string;
  conversions: TailwindConversion[];
  classNameReplacements: Map<string, string>;
  removedImports: string[];
  errors?: MigrationError[];
  warnings?: ConversionWarning[];
  stats: {
    totalStyles: number;
    convertedStyles: number;
    unconvertibleStyles: number;
    classNameReplacements: number;
    remainingClassesUsages: number;
  };
}

export interface CrossFileTransformOptions {
  resolveImports?: boolean;
  styleFilePattern?: string;
  preserveImports?: boolean;
  updateImportPaths?: boolean;
}