// Main exports for library usage and testing
// This file avoids CLI dependencies to prevent Jest compatibility issues

export { MigrationTool } from './migrate.js';
export { ASTParser } from './parser.js';
export { StyleConverter } from './converter.js';
export { CodeTransformer } from './transformer.js';
export { ImportResolver } from './import-resolver.js';

// Export types
export type * from './types.js';

// Export mappings
export { ThemeMapper } from './mappings/theme-mapper.js';
export { BreakpointMapper } from './mappings/breakpoint-mapper.js';
export { CSS_TO_TAILWIND_MAP } from './mappings/css-to-tailwind.js';