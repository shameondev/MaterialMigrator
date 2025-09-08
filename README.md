# Material To TailWind Migrator

[![npm version](https://badge.fury.io/js/mttwm.svg)](https://badge.fury.io/js/mttwm)
[![npm downloads](https://img.shields.io/npm/dm/mttwm.svg)](https://www.npmjs.com/package/mttwm)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Changelog](https://img.shields.io/badge/changelog-Keep%20a%20Changelog-orange.svg)](CHANGELOG.md)

🚀 **Automated CSS-in-JS to Tailwind CSS Migration Tool**

Transform your React applications from Material-UI `makeStyles`/`useStyles` to Tailwind CSS automatically. Built for large-scale migrations with intelligent handling of complex scenarios.

## ✨ Features

- **🔄 Automatic Conversion**: Converts CSS-in-JS styles to equivalent Tailwind classes
- **🧠 Smart Preservation**: Keeps unmigrated styles intact when full conversion isn't possible  
- **📱 Responsive Support**: Handles Material-UI breakpoints and responsive styles
- **🎨 Theme Mapping**: Maps Material-UI theme values to Tailwind equivalents
- **🔧 Import Cleanup**: Removes unused imports when migration is complete
- **📊 Detailed Reports**: Comprehensive migration reports with statistics and warnings
- **🧪 Test Mode**: Preview changes before applying them

## 🚀 Quick Start

### Installation

#### Quick Start (Recommended)
```bash
# Use directly without installation
npx mttwm migrate --pattern "src/**/*.tsx" --dry-run
```

#### Global Installation
```bash
# Install globally for repeated use
npm install -g mttwm
mttwm migrate --pattern "src/**/*.tsx" --dry-run
```

#### Development Setup
```bash
# Clone the repository
git clone https://github.com/shameondev/MaterialMigrator.git
cd MaterialMigrator

# Install dependencies and build
npm install
npm run build
npm link

# In your project directory:
npm link mttwm
```

### Usage

```bash
# Test migration on specific files (dry run)
mttwm migrate path/to/component.tsx --dry-run

# Test migration with patterns (dry run)
mttwm migrate --pattern "src/**/*.tsx" --dry-run

# Apply migration to specific files
mttwm migrate path/to/component.tsx

# Apply migration with patterns
mttwm migrate --pattern "src/**/*.tsx"

# Generate detailed report
mttwm migrate --pattern "src/**/*.tsx" --generate-report
```

📋 **For detailed integration instructions, see [INTEGRATION.md](./INTEGRATION.md)**

## 📦 Package Information

- **📊 npm package**: [mttwm](https://www.npmjs.com/package/mttwm) - Install with `npm install -g mttwm`
- **📋 Changelog**: [CHANGELOG.md](./CHANGELOG.md) - See all release notes and version history
- **🏷️ Releases**: [GitHub Releases](https://github.com/shameondev/MaterialMigrator/releases) - Download specific versions

## 📖 Documentation

### CLI Commands

#### Migrate Command
The single command for all migration operations:

```bash
# Preview migration (dry run) - specific files
mttwm migrate src/component.tsx --dry-run

# Preview migration (dry run) - using patterns
mttwm migrate --pattern "src/**/*.tsx" --dry-run

# Apply migration - specific files  
mttwm migrate src/component.tsx

# Apply migration - using patterns with options
mttwm migrate --pattern "src/components/**/*.tsx" --pattern "src/views/**/*.tsx"

# Exclude patterns and preserve originals
mttwm migrate --pattern "src/**/*.tsx" --exclude "**/*.test.tsx" --preserve-original

# Generate detailed report
mttwm migrate --pattern "src/**/*.tsx" --generate-report --verbose
```

### What Gets Migrated

#### ✅ **Fully Supported**
- Basic CSS properties (padding, margin, colors, etc.)
- Flexbox and Grid layouts
- Typography styles
- Border and border-radius
- Background colors and basic backgrounds
- Material-UI theme references
- Responsive breakpoints
- Pseudo-selectors (hover, focus, etc.)

#### ⚠️ **Partially Supported** 
- Complex calc() expressions
- CSS custom properties/variables
- Advanced transforms and filters
- Complex background images

#### ❌ **Preserved as CSS-in-JS**
- Keyframe animations
- Complex nested selectors
- CSS masks and clip-path
- Multiple background layers
- Advanced CSS functions

### Migration Behavior

The tool uses **intelligent preservation logic**:

1. **Full Migration**: When ALL styles in a `useStyles` hook can be converted
   - Removes `makeStyles` import and call
   - Removes `const classes = useStyles();` 
   - Replaces all `className={classes.styleName}` with Tailwind classes
   - Cleans up unused imports

2. **Partial Preservation**: When some styles cannot be converted
   - Keeps original `makeStyles` and `useStyles` intact
   - Preserves all `className={classes.styleName}` usages
   - No modifications to ensure code continues working

## 🧪 Test Files

The project includes comprehensive test files covering various scenarios:

- `1-simple-styles.test.tsx` - Basic CSS properties
- `2-theme-references.test.tsx` - Material-UI theme usage
- `3-responsive-styles.test.tsx` - Breakpoint handling
- `4-dynamic-styles.test.tsx` - Dynamic/conditional styles  
- `5-pseudo-selectors.test.tsx` - Hover, focus states
- `6-complex-styles.test.tsx` - Complex CSS that requires manual review

## 🔧 Configuration

### Current CLI Usage

The CLI currently has built-in theme mappings for common Material-UI patterns. For custom theme properties, you have these options:

### Option 1: Use Built-in Mappings (Recommended)
The tool automatically handles:
```bash
npx mttwm migrate src/**/*.tsx --dry-run
```

**Built-in conversions:**
- `theme.palette.primary.main` → CSS variables
- `theme.spacing(n)` → Tailwind spacing classes
- `theme.breakpoints.up("md")` → responsive prefixes
- `theme.custom.*` → CSS variables

### Option 2: Programmatic Usage with Custom Config

For advanced customization, use the tool programmatically:

```javascript
// migrate-script.js
import { MigrationTool } from 'mttwm';

const config = {
  projectRoot: process.cwd(),
  writeFiles: false, // dry run
  include: ['src/**/*.tsx'],
  exclude: ['node_modules/**'],
  customThemeMapping: {
    'theme.custom.primaryColor': 'text-blue-600',
    'theme.custom.main': 'text-primary',
    'theme.custom.spacing.large': 'p-8',
    'theme.palette.primary.main': 'text-blue-500',
  },
  customPropertyMapping: {
    'boxShadow': (value) => `shadow-custom-${value}`,
  }
};

const tool = new MigrationTool(config);
const files = ['src/components/Button.tsx'];
await tool.test(files); // or tool.migrate(files)
```

```bash
node migrate-script.js
```

### Handling Theme Issues

#### Optional Chaining Errors
If you get errors like:
```
❌ Optional chaining in theme reference: theme.custom?.main
```

**Quick Fix:** Remove the optional chaining from your code:
```tsx
// ❌ Change this:
color: theme.custom?.main

// ✅ To this:
color: theme.custom.main
```

**Advanced Fix:** Use programmatic API with custom mapping (see Option 2 above)

#### Custom Theme Properties
For `theme.custom.*` or `theme.yourCustom.*` properties:

1. **Built-in behavior**: Converts to CSS variables
   - `theme.custom.main` → `text-[var(--main)]`
   - `theme.superCustom.bg` → `var(--theme-superCustom-bg)`

2. **For specific Tailwind classes**: Use programmatic API with `customThemeMapping`

## 📊 Migration Reports

Generate detailed JSON reports with:

```bash
mttwm migrate --pattern "src/**/*.tsx" --generate-report
```

The report includes:
- Conversion statistics per file
- List of warnings and unconvertible styles
- Before/after code samples
- Migration success rates

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests (`npm test`)
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for large-scale React application migrations
- Inspired by the need for automated CSS-in-JS to Tailwind transitions
- Designed with safety and reliability in mind for production codebases