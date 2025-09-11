# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.7.2] - 2025-09-11

### 🔧 **IMPROVED VALIDATION**
Enhanced cross-file validation logic for safer migrations with complex style references.

### Fixed
- **Cross-File Validation**: Enhanced validation to properly handle imported styles with computed properties
- **Computed Properties**: Added ObjectProperty traversal for `[classes.xxx]: condition` patterns
- **Conservative Removal**: Fixed style removal to require both convertible classes AND no unconvertible properties
- **Safety Improvements**: More robust validation prevents incorrect style deletions

### Technical Changes
- Added comprehensive ObjectProperty AST traversal for computed member expressions
- Enhanced cross-file validation to search all style conversions systematically  
- Improved safety by being more conservative about style removal decisions
- Better handling of complex CSS patterns with pseudo-selectors and nested conditions

### Known Issues
- Some edge cases with imported styles may still be incorrectly removed in complex scenarios
- Manual review recommended for migrations involving nested pseudo-selectors

**NOTE**: This release improves migration safety but does not fully resolve all cross-file validation edge cases.

## [1.7.1] - 2025-09-11

### 🚨 **CRITICAL BUG FIX**
**BREAKING ISSUE RESOLVED**: Fixed severe bug where migration tool would remove makeStyles but leave broken class references.

### Fixed
- **Critical Migration Safety**: Fixed broken code generation where `classes.xxx` references were left dangling after makeStyles removal
- **Validation Enhancement**: Added comprehensive AST validation to ensure ALL class usages are convertible before removing makeStyles
- **"All or Nothing" Migration**: Now safely keeps makeStyles intact when any class references can't be converted
- **Object Expression Handling**: Improved conditional class object transformation to preserve complex pseudo-selectors

### Added
- **Missing CSS Properties**: 
  - `background: 'none'` → `bg-transparent`
  - `boxShadow: 'none'` → `shadow-none`
  - `whiteSpace: 'nowrap'` → `whitespace-nowrap`
  - `textOverflow: 'ellipsis'` → `text-ellipsis`
  - `transform: 'none'` → `transform-none`
- **Comprehensive Transform Support**: Full support for rotate, scale, translate functions
- **Enhanced Shadow Mapping**: Common shadow patterns to proper Tailwind shadow classes
- **Backdrop Filter Support**: Complete backdrop-filter CSS property mappings

### Changed
- **Migration Classification**: Enhanced logic to validate both style properties AND actual usage references
- **Safety-First Approach**: Prevents broken code generation by keeping unconvertible classes intact
- **Improved Error Handling**: Better detection and preservation of complex CSS patterns

### Impact
- **🔥 PRODUCTION SAFE**: No more broken runtime code from partial migrations
- **Reliability**: Components remain functional during incomplete migrations  
- **Developer Experience**: Clear feedback when manual intervention is needed
- **Comprehensive Coverage**: Handles modern CSS properties and transform functions

**UPGRADE RECOMMENDED**: This release fixes a critical issue that could break component functionality.

## [1.7.0] - 2025-09-10

### 🎯 **ENHANCED MIGRATION COVERAGE**
Significant improvements to CSS property support and component library compatibility.

### Added
- **Custom className prop support** - Now handles `popoverClassName`, `overlayClassName`, `tooltipClassName`, etc.
- **Comprehensive transition properties** - Full support for `transitionProperty`, `transitionTimingFunction`, etc.
- **Backdrop filter support** - Added `backdropFilter` and `-webkit-backdrop-filter` CSS properties
- **Flex properties** - Added `flexGrow` and `flexShrink` mappings to Tailwind classes
- **Object expression transformation** - Conditional classes like `{ [classes.unscrollable]: isDrawerVisible }`

### Fixed
- **Dynamic function placeholders** - Correctly handles `height: ({ height }) => height` without conversion
- **Unary expressions** - Negative values like `top: -22` now convert to `top-[-22px]` properly
- **CSS value parsing** - Improved parsing for various CSS expression types
- **Code formatting preservation** - Better retention of blank lines and spacing in migrated code

### Changed
- **Extended JSX attribute detection** - Supports any prop ending with "ClassName" for broader component library compatibility
- **Enhanced CSS property coverage** - More comprehensive mapping of CSS properties to Tailwind classes

### Impact
- **Broader compatibility** - Works with more component libraries using custom className props
- **More complete migrations** - Handles additional CSS properties and expressions
- **Better code quality** - Preserves formatting and handles edge cases properly

## [1.6.0] - 2025-09-09

### 🎯 **MAJOR ENHANCEMENT - Bulletproof Migration Detection**
This is a **BREAKING CHANGE** that fundamentally improves migration reliability for incremental workflows.

### Added
- **4-Level Status System**: complete, partial, failed, skipped migration detection
- **Accurate Usage Counting**: Precise count of remaining `classes.x` usages in code
- **Enhanced CLI Output**: Detailed breakdown showing exactly what needs manual review
- **remainingClassesUsages field**: Added to MigrationResult and TransformResult types

### Fixed  
- **🚨 CRITICAL**: Fixed regex double-escaping bug causing false success reports
- **Migration Detection**: Now accurately detects partial vs complete migrations
- **Classes Counting**: Properly counts `classes.property` and `classes?.property` patterns
- **AST Generation**: Always generates transformed code for accurate analysis

### Changed
- **CLI Messages**: From vague "Successfully migrated" to precise "Partially migrated (3 classes.x remain)"
- **Migration Logic**: Enhanced determineMigrationStatus() with bulletproof detection criteria  
- **Error Reporting**: File-by-file breakdown of migration status with remaining counts

### BREAKING CHANGES
- `MigrationResult` now includes `migrationStatus: 'complete' | 'partial' | 'failed' | 'skipped'`
- CLI output format changed to provide more detailed status information

### Migration Guide
- **For API users**: Update code to handle new `migrationStatus` field instead of just `success` boolean
- **For CLI users**: No action needed - enjoy more accurate migration feedback!

### Impact
- **100% Reliable**: Never falsely claims complete success when classes remain
- **Incremental Progress**: Track exact remaining work for systematic migration  
- **Production Ready**: Safe to rely on for incremental migration workflows

## [1.5.5] - 2025-09-09

### 🎯 **CRITICAL FIX**
- **Custom Theme Mapping Direct Classes** - Fixed custom values to generate direct class names instead of arbitrary values

### Fixed
- Custom theme mapping now generates `text-main` instead of `text-[main]` for simple values
- `color: theme.custom.main` with config `'main'` → `text-main` ✅ (was `text-[main]`)
- `backgroundColor: theme.custom.primary` with config `'blue-500'` → `bg-blue-500` ✅
- CSS variables still properly wrapped: `var(--palette-background-paper)` → `bg-[var(--palette-background-paper)]`

### Changed
- `convertValueToTailwindClass` now skips CSS-to-Tailwind converter for simple custom values  
- Only applies CSS-to-Tailwind conversion for CSS functions (`var()`, `env()`, `calc()`)
- Improved property-aware prefix application for custom theme mappings

### Technical Details
- Enhanced custom value detection to avoid unnecessary arbitrary value wrapping
- Preserved CSS variable handling while fixing simple value conversion
- Updated test expectations to match correct direct class name behavior

## [1.5.4] - 2025-09-09

### 🎯 **MAJOR FIXES**
- **CSS Variable Conversion** - Fixed CSS variables to use proper Tailwind arbitrary value syntax
- **Property-Aware Custom Mapping** - Custom theme values now get appropriate CSS property prefixes

### Fixed
- CSS variables now properly wrapped: `var(--palette-background-paper)` → `bg-[var(--palette-background-paper)]`
- Custom theme mapping is property-aware: `theme.custom.main: 'main'` → `text-main` for color, `bg-main` for backgroundColor
- Enhanced ThemeMapper to leverage existing CSS-to-Tailwind conversion logic
- Fixed palette, spacing, and theme fallbacks to generate correct Tailwind classes

### Changed
- All CSS variable references now use Tailwind arbitrary value syntax
- Custom theme mappings automatically get property-specific prefixes
- Improved integration with existing CSS conversion infrastructure

### Technical Details
- Enhanced `ThemeMapper.convertValueToTailwindClass()` method
- Updated fallback generation for palette, spacing, and general theme references
- Comprehensive test suite updates to verify proper CSS variable handling

## [1.5.3] - 2025-09-09

### Changed
- Updated Claude Code assistant instructions for improved development workflow
- Enhanced project documentation and development guidelines

## [1.5.0] - 2025-09-09

### 🎯 **MAJOR FEATURES**
- **Config-based theme mapping with mttwm.config.js support** - Now supports automatic config file loading from project root
- **Enhanced optional chaining handling** - Both `theme.custom?.X` and `theme.custom.X` now work seamlessly with config mappings
- **User-friendly error messages** - Clear guidance on creating config files with practical examples
- **Streamlined npx workflow** - Zero-setup configuration for npx users with helpful error recovery

### Added
- **mttwm.config.js automatic loading** - CLI automatically loads config from project root
- **customThemeMapping support** - Map any theme property to specific Tailwind classes
- **Enhanced error messages** - Step-by-step guidance with real-world examples
- **Both syntaxes supported** - Optional chaining and regular member expressions work identically

### Changed
- **Config-first approach** - Unknown theme properties now require explicit config mapping
- **Improved user experience** - Error messages focus on practical solutions over programmatic API
- **Better documentation** - Updated README with comprehensive config file examples

### Technical Details
- Enhanced ThemeMapper to prioritize customThemeMapping over built-in fallbacks
- Updated CLI to pass config structure correctly to StyleConverter
- Improved parser to handle OptionalMemberExpression and MemberExpression uniformly
- Added comprehensive test coverage for config-based workflows

### Migration Guide
- **For existing users**: No breaking changes to built-in theme properties (`theme.palette.*`, `theme.spacing.*`)
- **For custom properties**: Create `mttwm.config.js` in project root with `customThemeMapping`
- **Error handling**: Follow new error messages for step-by-step config setup

## [1.4.0] - 2025-09-08

### BREAKING CHANGES
- Removed `test` command in favor of simplified `migrate --dry-run` approach
- All testing functionality now uses `mttwm migrate [files...] --dry-run`

### Changed  
- Simplified CLI interface with single `migrate` command for all operations
- Improved user experience with more intuitive command structure
- Updated documentation to reflect streamlined CLI design

### Fixed
- Resolved CLI execution issues with ES modules
- Fixed version display to match package.json version

## [1.3.1] - 2025-09-08

### Fixed
- Fixed CLI not executing due to ES module issues
- Updated CLI version to match package.json
- Improved CLI to accept direct file paths as arguments
- Enhanced error handling and user feedback

## [1.3.0] - 2025-09-08

### Added
- Comprehensive theme spacing conversion support
- Theme.spacing() parser with unit and multiplier support
- StyleConverter integration for theme spacing values
- Dynamic theme spacing expression handling
- Edge case support for mixed spacing with other properties
- Proper Tailwind class generation (p-2, m-4) from theme values

### Fixed
- Resolved 'pxpx' issue in CSS to Tailwind conversion where px units were duplicated
- Enhanced fontSize, borderRadius, and borderWidth mappings to prevent unit duplication
- Fixed empty style removal logic in transformer
- Updated integration test expectations to match corrected behavior
- Fixed vendor prefix handling in CSS conversions

### Changed
- Improved CSS-to-Tailwind mapping functions for better unit handling
- Enhanced test runner with detailed failure reporting
- Updated migration tool behavior for better theme spacing support

## [1.1.0] - 2025-09-04

### Added
- Open source development standards in CLAUDE.md
- Git commit guidelines and conventions
- Semantic versioning documentation
- GitHub changelog maintenance requirements
- Comprehensive testing restructure with integration and unit test suites
- New import resolver functionality

### Changed
- Reorganized test structure from legacy test files to proper Jest test suites
- Enhanced project documentation for open source collaboration
- Updated transformer and migration core functionality

### Removed
- Legacy test files in favor of proper Jest test structure

## [1.0.0] - 2025-09-04

### Added
- Initial release of mttwm (Material To Tailwind Migrator)
- CLI binary for command-line usage
- Comprehensive Jest testing suite
- MIT license
- Core migration functionality for CSS-in-JS to Tailwind CSS
- Support for Material-UI makeStyles migration
- React application migration tools